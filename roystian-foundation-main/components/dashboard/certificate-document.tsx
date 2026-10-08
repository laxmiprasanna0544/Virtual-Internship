"use client";

import * as React from "react";
import { QRCode } from "@/components/shared/qr-code";
import type { Certificate } from "@/types";

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  "ai-ml":
    "machine learning model development, data preprocessing pipelines, AI application prototyping, and algorithmic problem-solving",
  "data-analytics":
    "data analysis, interactive dashboard creation, statistical reporting, and business intelligence workflows",
  "business-analytics":
    "market research, business data interpretation, analytical reporting, and strategic insights generation",
  "full-stack-development":
    "full-stack web application development, REST API integration, frontend UI design, and deployment workflows",
  "software-testing":
    "test case design, manual and automated testing, bug tracking, and quality assurance processes",
  "python-development":
    "Python scripting, automation workflows, library integration, and application development",
  "java-development":
    "Java application development, object-oriented design, and software engineering best practices",
  "iot-electronics":
    "IoT sensor integration, embedded systems prototyping, and connected device programming",
  sustainability:
    "sustainability research, environmental impact analysis, and green initiative planning",
  "sales-marketing":
    "marketing campaigns, sponsorship engagement, sales outreach, and brand awareness programs",
  "mechanical-engineering":
    "engineering design, CAD modelling, and mechanical systems analysis",
  "software-development":
    "software design, application development, code review, and technical documentation",
};

function getDateRange(
  issueDate: string,
  duration: string,
): { start: string; end: string } {
  const end = new Date(issueDate);
  const weeks = parseInt(duration) || 4;
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7);
  return { start: fmtOrdinal(start), end: fmtOrdinal(end) };
}

function fmtOrdinal(d: Date): string {
  const day = d.getDate();
  const ord =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  return `${day}${ord} ${d.toLocaleString("en-IN", { month: "long" })} ${d.getFullYear()}`;
}

function KRCircularLogo() {
  const pts = [0, 60, 120, 180, 240, 300].map((deg) => {
    const r = ((deg - 90) * Math.PI) / 180;
    return { x: 40 + 33 * Math.cos(r), y: 40 + 33 * Math.sin(r) };
  });
  return (
    <svg viewBox="0 0 80 80" width="70" height="70" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="none" stroke="#0c2d6b" strokeWidth="1.8" />
      <circle cx="40" cy="40" r="29" fill="none" stroke="#0c2d6b" strokeWidth="1" />
      {pts.map((pt, i) => (
        <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#0c2d6b">★</text>
      ))}
      <text x="40" y="34" textAnchor="middle" dominantBaseline="middle" fontSize="17" fontWeight="bold" fill="#0c2d6b" fontFamily="Georgia, serif">KR</text>
      <text x="40" y="49" textAnchor="middle" fontSize="4.5" fill="#0c2d6b" fontFamily="Arial, sans-serif" letterSpacing="1">ROYSTIAN</text>
    </svg>
  );
}

function NgoArpanBranding() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <svg viewBox="0 0 38 38" width="34" height="34" aria-hidden="true">
        <circle cx="19" cy="19" r="17" fill="none" stroke="#1a56db" strokeWidth="2" />
        <circle cx="19" cy="19" r="11" fill="none" stroke="#1a56db" strokeWidth="1" />
        <text x="19" y="17" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#1a56db" fontFamily="Arial, sans-serif">NGO</text>
        <text x="19" y="24" textAnchor="middle" fontSize="4" fill="#1a56db" fontFamily="Arial, sans-serif">DARPAN</text>
      </svg>
      <svg viewBox="0 0 38 38" width="34" height="34" aria-hidden="true">
        <circle cx="19" cy="19" r="17" fill="#f97316" />
        <text x="19" y="26" textAnchor="middle" fontSize="22" fontWeight="bold" fill="white" fontFamily="Georgia, serif">D</text>
      </svg>
      <div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#0f172a", fontFamily: "Arial, sans-serif", letterSpacing: "1px", lineHeight: "1", margin: 0 }}>ARPAN</p>
      </div>
    </div>
  );
}

function TejasreeSignature() {
  return (
    <svg viewBox="0 0 130 40" width="120" height="36" aria-hidden="true">
      <path d="M6,30 L12,8 L22,28 L28,8" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6,36 L36,36" fill="none" stroke="#0f172a" strokeWidth="0.6" />
      <path d="M42,24 Q46,8 56,20 Q62,28 68,18 Q74,8 80,20 L88,30" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M88,30 Q96,10 104,22 L112,30" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function KiranSignature() {
  return (
    <svg viewBox="0 0 130 40" width="120" height="36" aria-hidden="true">
      <path d="M8,30 L14,8 M12,20 L24,8 M12,20 L26,30" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34,30 Q36,8 44,22" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52,6 L54,30" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60,22 Q66,8 74,22 Q80,30 88,20 L98,12" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M104,18 Q110,6 118,18 L124,26" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CertificateDocument({
  certificate,
  verificationUrl,
}: {
  certificate: Certificate;
  verificationUrl: string;
}) {
  const { start, end } = getDateRange(certificate.issueDate, certificate.duration);
  const description =
    DOMAIN_DESCRIPTIONS[certificate.domainId] ??
    "technical projects, skill development activities, and professional assignments";

  return (
    <div
      id="certificate-document"
      className="relative mx-auto w-full max-w-[1000px] bg-white"
      style={{ aspectRatio: "1.414 / 1", overflow: "hidden" }}
      role="img"
      aria-label={`Certificate of Internship for ${certificate.studentName}, ${certificate.domainName}, ID ${certificate.id}`}
    >
      {/* ── Blue diagonal corner strips ──
          Using SVG with explicit width/height attrs so it reliably fills the
          container even when CSS h-full/w-full is overridden by print styles. ── */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 707"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 0, display: "block" }}
        aria-hidden="true"
      >
        {/* Top-left: outer dark strip */}
        <polygon points="0,0 215,0 0,707" fill="#0c2d6b" />
        {/* Top-left: inner lighter strip */}
        <polygon points="0,0 160,0 0,540" fill="#1246a8" />
        {/* Bottom-right: outer dark strip */}
        <polygon points="1000,707 785,707 1000,360" fill="#0c2d6b" />
        {/* Bottom-right: inner lighter strip */}
        <polygon points="1000,707 840,707 1000,460" fill="#1246a8" />
      </svg>

      {/* ── KR watermark ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: "270px",
            fontWeight: "900",
            color: "#0c2d6b",
            opacity: 0.045,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          KR
        </span>
      </div>

      {/* ── Main content — absolute inset so height is always the certificate height ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          padding: "3% 22% 2.5% 23%",
        }}
      >
        {/* Top-right: KR logo + QR */}
        <div
          style={{
            position: "absolute",
            top: "4%",
            right: "3%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <KRCircularLogo />
          <QRCode value={verificationUrl} size={66} alt="Certificate verification QR code" />
          <p style={{ fontSize: "0.42rem", letterSpacing: "0.2em", color: "#475569", textTransform: "uppercase", fontFamily: "Arial, sans-serif", margin: 0 }}>
            SCAN TO VERIFY
          </p>
        </div>

        {/* Title */}
        <header style={{ textAlign: "center", marginBottom: "2%" }}>
          <h1
            style={{
              fontSize: "clamp(0.85rem, 2vw, 1.55rem)",
              fontWeight: "800",
              letterSpacing: "0.22em",
              color: "#0f172a",
              textTransform: "uppercase",
              fontFamily: "Arial, sans-serif",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            CERTIFICATE OF INTERNSHIP
          </h1>
          <p
            style={{
              fontSize: "clamp(0.5rem, 0.75vw, 0.65rem)",
              letterSpacing: "0.14em",
              color: "#475569",
              marginTop: "4px",
              fontFamily: "Arial, sans-serif",
              fontWeight: "600",
            }}
          >
            This is to certify that
          </p>
        </header>

        {/* Student name */}
        <div style={{ textAlign: "center", marginBottom: "3%" }}>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3.8vw, 3rem)",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "0.04em",
              lineHeight: 1,
              fontFamily: "'Arial Black', Arial, sans-serif",
              margin: 0,
            }}
          >
            {certificate.studentName.toUpperCase()}
          </h2>
          <div
            style={{
              height: "2px",
              background: "linear-gradient(to right, transparent, #0c2d6b 15%, #0c2d6b 85%, transparent)",
              margin: "6px auto 0",
              width: "88%",
            }}
          />
        </div>

        {/* Body — flex-1 pushes footer down proportionally */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", gap: "3%" }}>
          <p
            style={{
              fontSize: "clamp(0.55rem, 0.95vw, 0.78rem)",
              fontWeight: "700",
              lineHeight: 1.9,
              color: "#1e293b",
              fontFamily: "Arial, sans-serif",
              margin: 0,
            }}
          >
            has successfully completed their internship at{" "}
            <strong>Roystian Foundation</strong>
            <br />
            as a{" "}
            <strong>
              {certificate.domainName} Intern ({certificate.programName})
            </strong>
            <br />
            from <strong>{start}</strong> to <strong>{end}</strong>.
          </p>

          <p
            style={{
              fontSize: "clamp(0.5rem, 0.88vw, 0.72rem)",
              fontWeight: "700",
              lineHeight: 1.9,
              color: "#334155",
              fontFamily: "Arial, sans-serif",
              margin: 0,
            }}
          >
            During this period, they contributed to {description}.
          </p>
        </div>

        {/* Footer: 3-column — aligned to bottom */}
        <footer
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "1.5%",
          }}
        >
          {/* Left: Development Director */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "26%" }}>
            <TejasreeSignature />
            <div style={{ height: "1px", background: "#0f172a", width: "100%", margin: "3px 0 4px" }} />
            <p style={{ fontSize: "clamp(0.42rem, 0.65vw, 0.55rem)", fontWeight: "700", color: "#0f172a", fontFamily: "Arial, sans-serif", margin: 0 }}>
              Development Director
            </p>
            <p style={{ fontSize: "clamp(0.38rem, 0.6vw, 0.52rem)", color: "#475569", fontFamily: "Arial, sans-serif", margin: 0 }}>
              TejasreeAkula
            </p>
          </div>

          {/* Center: NGO ARPAN + Foundation + Unique ID */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <NgoArpanBranding />
            <p style={{ fontSize: "clamp(0.46rem, 0.72vw, 0.6rem)", fontWeight: "800", letterSpacing: "0.14em", color: "#0f172a", fontFamily: "Arial, sans-serif", margin: 0 }}>
              ROYSTIAN FOUNDATION
            </p>
            <p style={{ fontSize: "clamp(0.38rem, 0.6vw, 0.52rem)", color: "#475569", fontFamily: "Arial, sans-serif", margin: 0 }}>
              UNIQUE ID - {certificate.id}
            </p>
          </div>

          {/* Right: CEO & Founder */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "26%" }}>
            <KiranSignature />
            <div style={{ height: "1px", background: "#0f172a", width: "100%", margin: "3px 0 4px" }} />
            <p style={{ fontSize: "clamp(0.42rem, 0.65vw, 0.55rem)", fontWeight: "700", color: "#0f172a", fontFamily: "Arial, sans-serif", margin: 0 }}>
              Ceo &amp; Founder
            </p>
            <p style={{ fontSize: "clamp(0.38rem, 0.6vw, 0.52rem)", color: "#475569", fontFamily: "Arial, sans-serif", margin: 0 }}>
              Kiran Bavikatti
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
