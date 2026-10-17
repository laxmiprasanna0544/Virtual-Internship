import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "Roystian Foundation — Virtual Internship & Skill Development Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const png = await readFile(join(process.cwd(), "public/images/brand/roystian-logo.png"));
  const logo = `data:image/png;base64,${png.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img src={logo} width={88} height={88} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#0f172a",
              }}
            >
              ROYSTIAN
            </div>
            <div
              style={{
                fontSize: 15,
                letterSpacing: "0.22em",
                color: "#64748b",
                marginTop: 4,
              }}
            >
              FOUNDATION
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.16em",
              color: "#3B46C4",
              fontWeight: 600,
            }}
          >
            VIRTUAL INTERNSHIP &amp; SKILL DEVELOPMENT
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: "#0f172a",
              marginTop: 22,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            Start Your Virtual Internship From Anywhere.
          </div>
          <div style={{ fontSize: 28, color: "#475569", marginTop: 24 }}>
            Learn. Build. Get Certified. Move Forward.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "40px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "28px",
            fontSize: 22,
            color: "#475569",
          }}
        >
          <div style={{ display: "flex" }}>12 domains</div>
          <div style={{ display: "flex" }}>10 modules per track</div>
          <div style={{ display: "flex" }}>Verifiable certificates</div>
        </div>
      </div>
    ),
    size,
  );
}
