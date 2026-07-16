#!/usr/bin/env python3
"""
HAVEN local network viewer.

Usage:
    python haven_viewer_v3.py <Local IP of iPhone>

This viewer connects to the iPhone over the local network on port 8080 and
renders a top-down view of the streamed mesh anchors plus the phone position.
It relies only on Python's standard library.
"""

from __future__ import annotations

import argparse
import socket
import struct
import threading
import time
import tkinter as tk

MESH_HEADER = b"MESH--------------------------------"
CAMERA_HEADER = b"CAMERA------------------------------"
HEADER_SIZE = len(MESH_HEADER)


class SharedState:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.anchors: dict[str, list[tuple[float, float, int]]] = {}
        self.camera = (0.0, 0.0, 0.0)
        self.status = "Connecting..."
        self.last_packet = "No packets yet"
        self.last_update = 0.0
        self.packet_count = 0


class HavenClient(threading.Thread):
    def __init__(self, host: str, port: int, state: SharedState) -> None:
        super().__init__(daemon=True)
        self.host = host
        self.port = port
        self.state = state
        self.stop_event = threading.Event()

    def run(self) -> None:
        while not self.stop_event.is_set():
            try:
                self._set_status(f"Connecting to {self.host}:{self.port}...")
                with socket.create_connection((self.host, self.port), timeout=5) as sock:
                    sock.settimeout(1.0)
                    self._set_status(f"Connected to {self.host}:{self.port}")
                    buffer = bytearray()

                    while not self.stop_event.is_set():
                        try:
                            chunk = sock.recv(65536)
                        except socket.timeout:
                            continue

                        if not chunk:
                            break

                        buffer.extend(chunk)
                        self._parse_buffer(buffer)
            except OSError as exc:
                self._set_status(f"Waiting to reconnect: {exc}")
                time.sleep(2.0)

    def stop(self) -> None:
        self.stop_event.set()

    def _set_status(self, message: str) -> None:
        with self.state.lock:
            self.state.status = message

    def _parse_buffer(self, buffer: bytearray) -> None:
        while True:
            starts = [idx for idx in (buffer.find(MESH_HEADER), buffer.find(CAMERA_HEADER)) if idx != -1]
            if not starts:
                if len(buffer) > HEADER_SIZE:
                    del buffer[:-HEADER_SIZE]
                return

            start = min(starts)
            if start > 0:
                del buffer[:start]

            if buffer.startswith(MESH_HEADER):
                if len(buffer) < HEADER_SIZE + 36 + 4:
                    return

                uuid_start = HEADER_SIZE
                uuid_end = uuid_start + 36
                count_offset = uuid_end
                float_count = struct.unpack_from("<i", buffer, count_offset)[0]
                if float_count < 0 or float_count % 4 != 0 or float_count > 4_000_000:
                    del buffer[:HEADER_SIZE]
                    continue

                payload_offset = count_offset + 4
                payload_size = float_count * 4
                packet_end = payload_offset + payload_size
                if len(buffer) < packet_end:
                    return

                uuid_text = bytes(buffer[uuid_start:uuid_end]).decode("ascii", "ignore")
                floats = struct.unpack_from(f"<{float_count}f", buffer, payload_offset)

                points: list[tuple[float, float, int]] = []
                for index in range(0, float_count, 4):
                    x = floats[index]
                    z = floats[index + 2]
                    cls = int(round(floats[index + 3]))
                    points.append((x, z, cls))

                with self.state.lock:
                    self.state.anchors[uuid_text] = points
                    self.state.last_packet = f"MESH {uuid_text[:8]}... ({len(points)} verts)"
                    self.state.last_update = time.time()
                    self.state.packet_count += 1

                del buffer[:packet_end]
                continue

            if buffer.startswith(CAMERA_HEADER):
                if len(buffer) < HEADER_SIZE + 4:
                    return

                count_offset = HEADER_SIZE
                float_count = struct.unpack_from("<i", buffer, count_offset)[0]
                if float_count < 0 or float_count > 128:
                    del buffer[:HEADER_SIZE]
                    continue

                payload_offset = count_offset + 4
                payload_size = float_count * 4
                packet_end = payload_offset + payload_size
                if len(buffer) < packet_end:
                    return

                floats = struct.unpack_from(f"<{float_count}f", buffer, payload_offset)
                if float_count >= 12:
                    camera = (floats[3], floats[7], floats[11])
                else:
                    camera = (0.0, 0.0, 0.0)

                with self.state.lock:
                    self.state.camera = camera
                    self.state.last_packet = "CAMERA update"
                    self.state.last_update = time.time()
                    self.state.packet_count += 1

                del buffer[:packet_end]
                continue

            del buffer[:1]


class HavenViewerApp:
    def __init__(self, host: str, port: int) -> None:
        self.state = SharedState()
        self.client = HavenClient(host, port, self.state)

        self.root = tk.Tk()
        self.root.title("HAVEN Viewer v3")
        self.root.configure(bg="#0b0b0c")
        self.root.geometry("1120x780")
        self.root.minsize(900, 620)
        self.root.protocol("WM_DELETE_WINDOW", self.close)

        self.status_var = tk.StringVar(value="Starting...")
        self.meta_var = tk.StringVar(value="")

        top_bar = tk.Frame(self.root, bg="#0b0b0c")
        top_bar.pack(fill="x", padx=18, pady=(18, 8))

        tk.Label(
            top_bar,
            text="HAVEN Local Viewer",
            fg="#f5f5f7",
            bg="#0b0b0c",
            font=("Helvetica", 20, "bold"),
        ).pack(anchor="w")

        tk.Label(
            top_bar,
            textvariable=self.status_var,
            fg="#b7c0cc",
            bg="#0b0b0c",
            font=("Helvetica", 11),
        ).pack(anchor="w", pady=(6, 0))

        tk.Label(
            top_bar,
            textvariable=self.meta_var,
            fg="#8d97a6",
            bg="#0b0b0c",
            font=("Helvetica", 10),
        ).pack(anchor="w", pady=(4, 0))

        self.canvas = tk.Canvas(
            self.root,
            bg="#101114",
            highlightthickness=1,
            highlightbackground="#2a2d33",
        )
        self.canvas.pack(fill="both", expand=True, padx=18, pady=(0, 18))

        self.client.start()
        self.root.after(50, self.redraw)

    def close(self) -> None:
        self.client.stop()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()

    def redraw(self) -> None:
        with self.state.lock:
            anchors = {key: value[:] for key, value in self.state.anchors.items()}
            camera = self.state.camera
            status = self.state.status
            last_packet = self.state.last_packet
            packet_count = self.state.packet_count
            last_update = self.state.last_update

        all_points: list[tuple[float, float, int]] = []
        for points in anchors.values():
            all_points.extend(points)

        width = max(self.canvas.winfo_width(), 1)
        height = max(self.canvas.winfo_height(), 1)
        margin = 56
        usable_w = max(width - margin * 2, 1)
        usable_h = max(height - margin * 2, 1)

        xs = [camera[0]]
        zs = [camera[2]]
        xs.extend(point[0] for point in all_points)
        zs.extend(point[1] for point in all_points)

        min_x = min(xs) if xs else -3.0
        max_x = max(xs) if xs else 3.0
        min_z = min(zs) if zs else -3.0
        max_z = max(zs) if zs else 3.0

        span_x = max(max_x - min_x, 6.0)
        span_z = max(max_z - min_z, 6.0)
        pad_x = span_x * 0.12
        pad_z = span_z * 0.12

        min_x -= pad_x
        max_x += pad_x
        min_z -= pad_z
        max_z += pad_z

        span_x = max(max_x - min_x, 1.0)
        span_z = max(max_z - min_z, 1.0)

        def project(x_value: float, z_value: float) -> tuple[float, float]:
            px = margin + ((x_value - min_x) / span_x) * usable_w
            py = height - margin - ((z_value - min_z) / span_z) * usable_h
            return px, py

        self.canvas.delete("all")

        self.canvas.create_rectangle(
            0,
            0,
            width,
            height,
            fill="#101114",
            outline="",
        )

        for step in range(6):
            x = margin + (usable_w / 5.0) * step
            y = margin + (usable_h / 5.0) * step
            self.canvas.create_line(x, margin, x, height - margin, fill="#1d2128")
            self.canvas.create_line(margin, y, width - margin, y, fill="#1d2128")

        sample_step = max(1, len(all_points) // 4500)
        for x_value, z_value, cls in all_points[::sample_step]:
            px, py = project(x_value, z_value)
            if cls == 2:
                color = "#37c56b"
            elif cls == 7:
                color = "#ffb35c"
            else:
                color = "#ff6d6d"

            self.canvas.create_rectangle(px - 1, py - 1, px + 1, py + 1, fill=color, outline=color)

        camera_x, _, camera_z = camera
        cam_px, cam_py = project(camera_x, camera_z)
        self.canvas.create_oval(
            cam_px - 6,
            cam_py - 6,
            cam_px + 6,
            cam_py + 6,
            fill="#53c5ff",
            outline="#d9f3ff",
            width=2,
        )
        self.canvas.create_text(
            cam_px + 14,
            cam_py - 14,
            text="iPhone",
            fill="#d9f3ff",
            font=("Helvetica", 10, "bold"),
            anchor="w",
        )

        self.canvas.create_text(
            margin,
            height - 24,
            text="Green: open floor  Orange: doors  Red: obstacles / non-floor",
            fill="#8d97a6",
            font=("Helvetica", 10),
            anchor="w",
        )

        age_text = "No packets received yet"
        if last_update:
            age_text = f"Last update: {time.time() - last_update:0.2f}s ago"

        self.status_var.set(status)
        self.meta_var.set(
            f"{len(anchors)} mesh anchors | {len(all_points)} points | {packet_count} packets | {last_packet} | {age_text}"
        )

        self.root.after(50, self.redraw)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local HAVEN mesh and camera viewer")
    parser.add_argument("host", help="Local IP address of the iPhone running HAVEN")
    parser.add_argument("--port", type=int, default=8080, help="TCP port exposed by the iPhone app")
    args = parser.parse_args()

    app = HavenViewerApp(args.host, args.port)
    app.run()


if __name__ == "__main__":
    main()
