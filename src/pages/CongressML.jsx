import { useNavigate } from "react-router-dom";
import { T, Eyebrow, Rule, Btn, Tag } from "../theme";

function H({ index, label, children }) {
  return (
    <div style={{ marginTop: 56, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Eyebrow n={index}>{label}</Eyebrow>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
      </div>
      <h2 style={{ fontFamily: T.display, fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

function P({ children }) {
  return (
    <p style={{ fontFamily: T.body, fontSize: 16, lineHeight: 1.72, color: T.dim, maxWidth: 720, margin: "0 0 16px" }}>
      {children}
    </p>
  );
}

const STATS = [
  { label: "Task", value: "Yea / nay prediction" },
  { label: "Text model", value: "DistilBERT embeddings" },
  { label: "Architecture", value: "535 neural nets" },
  { label: "Mean accuracy", value: "86.4%" },
];

const RESULTS = [
  ["", "Precision", "Recall", "F1"],
  ["Yea", "0.90", "0.91", "0.90"],
  ["Nay", "0.71", "0.64", "0.66"],
  ["Accuracy", "—", "—", "0.864"],
];

export default function CongressML() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 110px" }}>
        <button
          onClick={() => navigate("/portfolio")}
          style={{ border: "none", background: "transparent", color: T.dim, fontFamily: T.mono, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 30 }}
        >
          ← Work
        </button>

        <Eyebrow n="◦" style={{ marginBottom: 18 }}>
          Machine Learning · UCSD CSE 151A
        </Eyebrow>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(36px,6vw,66px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 22px" }}>
          Congressional Vote Prediction
        </h1>
        <P>
          There are 535 members of Congress, and they decide federal law by
          voting yea or nay. This project asks a simple question. From a
          bill&apos;s text and metadata, can you predict how each member will
          vote, and so whether the bill passes?
        </P>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 26px" }}>
          {["DistilBERT", "PyTorch", "NLP embeddings", "One-hot encoding", "Flask + SocketIO", "TF-IDF baseline"].map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          <Btn href="https://github.com/therab6it/UCSD_CSE151A-SS1/tree/Milestone-4" target="_blank" variant="solid">
            GitHub ↗
          </Btn>
          <Btn onClick={() => navigate("/portfolio")}>All work</Btn>
        </div>

        {/* stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 18px", borderLeft: i === 0 ? "none" : `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <H index="01" label="The data">Two kinds of data</H>
        <P>
          There are two data sources. The first is a per-member voting history.
          That is 535 files, one per member, and each file lists the bills that
          member voted on and how they voted. The second is a single file with
          the full content of every bill: its title, summaries, committees,
          cosponsors, subjects, and full text.
        </P>
        <P>
          The bill text is most of the size. It is about 442&nbsp;MB, against
          roughly 50&nbsp;MB for the vote records, because the summaries and full
          text are long. Instead of pre-joining all of that into 535 huge files,
          the pipeline merges each member&apos;s history with the bill data at
          training time. That costs a bit of compute but saves a lot of
          duplicate storage.
        </P>

        <H index="02" label="Preprocessing">Cleaning and encoding</H>
        <P>
          First we cleaned the data. We dropped rows with missing values, removed
          duplicate bill titles, and took the HTML tags out of the text. The
          categorical fields (category, congress, and bill type) were one-hot
          encoded so the network could tell them apart.
        </P>
        <P>
          For the text itself we tried two options: a TF-IDF word bag and dense
          word embeddings. Embeddings were much better, so the real choice was
          which pretrained encoder to use. We compared BERT and DistilBERT. BERT
          was a little more accurate but heavier. DistilBERT was almost as good
          and much cheaper to run. Since the encoder had to run across 535
          separate pipelines, DistilBERT was the practical pick.
        </P>

        <H index="03" label="The model">One network per member</H>
        <P>
          Each member gets their own binary classifier. It is a fully-connected
          network with six hidden layers (8192, 4096, 2048, 1024, 512, then 256
          units, all ReLU) and a single sigmoid output for the yea/nay
          probability. We trained with Adam and binary cross-entropy at a batch
          size of 32.
        </P>
        <P>
          We chose 535 separate models instead of one shared model. That let each
          model fit its own member&apos;s voting patterns, which helped accuracy.
          The downside was cost: it was heavy to run and took around
          200&nbsp;GB of working storage over the full training run.
        </P>

        <H index="04" label="Results">How well it did</H>
        <P>
          Across all 535 models, mean accuracy was 86.4%. The models did well on
          &quot;yea&quot; votes and worse on &quot;nay&quot; votes. That gap is
          probably down to class imbalance, since &quot;nay&quot; votes are
          rarer in the data and look different.
        </P>
        <div style={{ border: `1px solid ${T.rule}`, borderRadius: T.radius, overflow: "hidden", maxWidth: 480, margin: "8px 0 4px" }}>
          {RESULTS.map((row, r) => (
            <div key={r} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", borderTop: r === 0 ? "none" : `1px solid ${T.rule}` }}>
              {row.map((cell, c) => (
                <div
                  key={c}
                  style={{
                    padding: "11px 14px",
                    fontFamily: r === 0 || c === 0 ? T.mono : T.body,
                    fontSize: 13,
                    color: r === 0 || c === 0 ? T.dim : T.ink,
                    letterSpacing: r === 0 ? "0.04em" : "0",
                    borderLeft: c === 0 ? "none" : `1px solid ${T.rule}`,
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>

        <H index="05" label="The interface">The website</H>
        <P>
          I built a Flask app so the predictions are easy to use. You pick a
          congress number, a bill type, and a bill number. That starts a
          background job that pulls the bill, runs it through the models, and
          sends progress back live over SocketIO. The results page shows the
          overall yea/nay count and then every member, with their photo, party,
          and state. You can sort the list by name, party, state, or predicted
          vote.
        </P>

        <H index="06" label="My role">What I did</H>
        <P>
          This was a four-person project. I built the model, ran the training
          across the 535 networks, and wrote the web app that serves and shows
          the predictions.
        </P>
        <P>
          If I came back to it, the first thing I would try is one shared model
          instead of 535 separate ones, so it could learn patterns across
          members. I would also add more features about each member, like tenure
          and state, to help with the harder &quot;nay&quot; votes.
        </P>

        <div style={{ marginTop: 48 }}>
          <Rule />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginTop: 20 }}>
            Team: Yuting Peng · Logan Corrente · Vedika · Suraj Laddagiri
          </p>
        </div>
      </div>
    </div>
  );
}
