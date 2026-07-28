/**
 * Room — the authoritative playback clock for one movie.
 *
 * The hard part of a watch party isn't broadcasting "play". It's that two
 * browsers drift apart: different decode speeds, different buffer states,
 * clocks that disagree by a second or two. So this object never broadcasts
 * "play now" — it broadcasts *an anchor*: "position P was true at server time
 * T, and we are playing". Every client derives where it should be from that
 * and corrects itself continuously. Nobody has to be the leader, and a client
 * that misses a message re-syncs on the next one.
 *
 * Uses the WebSocket Hibernation API. Without it the object is billed for
 * duration the entire time a socket is open, which for a two-hour film would
 * quietly eat the free tier. With it, an idle room costs nothing.
 */

const READY_TIMEOUT_MS = 20000; // don't let one stalled buffer hold the film hostage

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;

    this.st = {
      playing: false,
      pos: 0, // seconds, true as of `at`
      at: Date.now(), // server ms
      rev: 0, // bumped on every authoritative change
      waiting: false, // gated on someone still buffering
      intent: false, // should we be playing once everyone is ready?
    };

    // In-memory state does not survive hibernation, so it's rehydrated here
    // before any message can be handled.
    ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get("st");
      if (saved) this.st = saved;
    });
  }

  async save() {
    await this.ctx.storage.put("st", this.st);
  }

  /* ------------------------------------------------------------ plumbing */

  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // acceptWebSocket, not server.accept() — this is what enables hibernation.
    this.ctx.acceptWebSocket(server);

    const name = new URL(req.url).searchParams.get("name")?.slice(0, 24) || "someone";
    server.serializeAttachment({
      id: crypto.randomUUID().slice(0, 8),
      name,
      ready: true,
      pos: 0,
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  peers() {
    return this.ctx.getWebSockets().map((ws) => ({ ws, meta: ws.deserializeAttachment() || {} }));
  }

  broadcast(msg, except = null) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try {
        ws.send(s);
      } catch {
        /* socket already gone; close handler will clean up */
      }
    }
  }

  stateMsg() {
    return { t: "state", ...this.st, now: Date.now() };
  }

  peersMsg() {
    return {
      t: "peers",
      peers: this.peers().map(({ meta }) => ({
        id: meta.id,
        name: meta.name,
        ready: meta.ready,
      })),
    };
  }

  /** Freeze the anchor at wherever playback has actually reached by now. */
  settle() {
    if (this.st.playing) {
      this.st.pos += (Date.now() - this.st.at) / 1000;
    }
    this.st.at = Date.now();
  }

  setReadyAll(ready) {
    for (const { ws, meta } of this.peers()) {
      ws.serializeAttachment({ ...meta, ready });
    }
  }

  allReady() {
    const p = this.peers();
    return p.length === 0 || p.every(({ meta }) => meta.ready);
  }

  /** Release the pause once every client reports it has buffered the new spot. */
  async maybeResume() {
    if (!this.st.waiting || !this.allReady()) return;
    this.st.waiting = false;
    this.st.playing = this.st.intent;
    this.st.at = Date.now();
    this.st.rev++;
    await this.save();
    this.broadcast(this.stateMsg());
  }

  /* ------------------------------------------------------------ messages */

  async webSocketMessage(ws, raw) {
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    const meta = ws.deserializeAttachment() || {};

    switch (m.t) {
      /* Clock sync. The client sends its own clock, we echo it back alongside
         ours; the client halves the round trip to estimate the offset. Cheap,
         and it's what lets every client agree on what "now" means. */
      case "ping":
        ws.send(JSON.stringify({ t: "pong", c: m.c, s: Date.now() }));
        return;

      case "hello":
        ws.serializeAttachment({ ...meta, name: String(m.name || meta.name).slice(0, 24) });
        ws.send(JSON.stringify(this.stateMsg()));
        this.broadcast(this.peersMsg());
        return;

      /* A client finished buffering at the gated position. */
      case "ready":
        ws.serializeAttachment({ ...meta, ready: !!m.ready, pos: m.pos ?? meta.pos });
        this.broadcast(this.peersMsg());
        await this.maybeResume();
        return;

      case "chat":
        if (typeof m.text === "string" && m.text.trim()) {
          this.broadcast({
            t: "chat",
            from: meta.name,
            id: meta.id,
            text: m.text.slice(0, 500),
            at: Date.now(),
          });
        }
        return;

      case "cmd":
        await this.command(m, meta);
        return;

      default:
        return;
    }
  }

  async command(m, meta) {
    switch (m.action) {
      case "pause":
        this.settle();
        if (typeof m.pos === "number") this.st.pos = m.pos;
        this.st.playing = false;
        this.st.intent = false;
        this.st.waiting = false;
        this.st.rev++;
        await this.save();
        this.broadcast({ ...this.stateMsg(), by: meta.name, action: "pause" });
        return;

      case "play":
        this.settle();
        this.st.intent = true;
        // Everyone re-confirms they're buffered before we actually roll. This is
        // what stops one of you starting three seconds ahead of the other.
        if (this.allReady()) {
          this.st.playing = true;
          this.st.waiting = false;
        } else {
          this.st.playing = false;
          this.st.waiting = true;
        }
        this.st.at = Date.now();
        this.st.rev++;
        await this.save();
        this.broadcast({ ...this.stateMsg(), by: meta.name, action: "play" });
        return;

      case "seek": {
        if (typeof m.pos !== "number" || !isFinite(m.pos)) return;
        const wasPlaying = this.st.playing || this.st.intent;
        this.st.pos = Math.max(0, m.pos);
        this.st.at = Date.now();
        this.st.playing = false; // hold everyone still while they re-buffer
        this.st.intent = wasPlaying;
        this.st.waiting = true;
        this.st.rev++;
        this.setReadyAll(false);
        await this.save();
        this.broadcast({ ...this.stateMsg(), by: meta.name, action: "seek" });

        // If a client goes quiet mid-seek, don't strand the other one forever.
        this.ctx.storage.setAlarm(Date.now() + READY_TIMEOUT_MS);
        return;
      }

      default:
        return;
    }
  }

  /** Fires only when a ready-gate has been stuck too long. */
  async alarm() {
    if (!this.st.waiting) return;
    this.setReadyAll(true);
    await this.maybeResume();
  }

  /* ----------------------------------------------------------- lifecycle */

  async webSocketClose(ws) {
    // If one of you drops, stop the film rather than letting the other watch on
    // alone and arrive twenty minutes ahead.
    const remaining = this.ctx.getWebSockets().filter((s) => s !== ws);
    if (remaining.length < 2 && this.st.playing) {
      this.settle();
      this.st.playing = false;
      this.st.intent = false;
      this.st.rev++;
      await this.save();
    }
    this.broadcast(this.stateMsg(), ws);
    this.broadcast(this.peersMsg(), ws);
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
}
