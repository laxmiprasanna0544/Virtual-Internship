"use client";

import * as React from "react";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import { QRCode } from "@/components/shared/qr-code";
import type { Certificate } from "@/types";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--cert-display",
});
const body = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--cert-body",
});

const NAVY = "#14275e";
const GOLD = "#c49a45";

/*
 * Every size below is in container-width units (cqw) taken from the 1280px
 * reference template — 1cqw = 12.8px there — so the certificate scales as a
 * single picture on screen and when printed.
 */

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Shrinks long names so they stay on one line inside the ornament rule. */
function nameSize(name: string): string {
  return `${Math.min(4.5, 60 / (0.8 * Math.max(name.length, 1)))}cqw`;
}

function GoldRule({ width }: { width: string }) {
  return <span style={{ display: "block", height: "0.12cqw", width, background: GOLD }} />;
}

function Corners() {
  return (
    <svg
      viewBox="0 0 1280 853"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cert-band-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d2a6e" />
          <stop offset="1" stopColor="#1c4fb0" />
        </linearGradient>
        <linearGradient id="cert-band-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f78d6" />
          <stop offset="1" stopColor="#7fb6ef" />
        </linearGradient>
        <radialGradient id="cert-paper" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f5f9fe" />
          <stop offset="1" stopColor="#e6f0fb" />
        </radialGradient>
      </defs>

      <rect width="1280" height="853" fill="url(#cert-paper)" />

      {/* Soft light streaks behind the content */}
      <polygon points="1040,0 1280,0 1280,120 880,853 700,853" fill="#dcebfa" opacity="0.45" />
      <polygon points="0,560 0,853 140,853 420,330" fill="#dcebfa" opacity="0.35" />

      {/* Top-left bands */}
      <polygon points="0,0 275,0 0,250" fill="url(#cert-band-light)" />
      <polygon points="0,0 230,0 0,200" fill="url(#cert-band-dark)" />
      <polygon points="0,215 120,110 140,118 0,245" fill="#4d93e3" />
      <polygon points="150,0 300,0 0,272 0,250 255,22 150,22" fill="#9cc6f2" opacity="0.6" />

      {/* Bottom-right bands */}
      <polygon points="1280,853 1000,853 1280,590" fill="url(#cert-band-light)" />
      <polygon points="1280,853 1060,853 1280,650" fill="url(#cert-band-dark)" />
      <polygon points="1280,620 1150,740 1162,748 1280,640" fill="#4d93e3" />
      <polygon points="960,853 990,853 1280,585 1280,560" fill="#9cc6f2" opacity="0.6" />

      {/* Frame: navy outer line, gold inner line */}
      <rect x="16" y="16" width="1248" height="821" fill="none" stroke={NAVY} strokeWidth="2" />
      <rect x="23" y="23" width="1234" height="807" fill="none" stroke={GOLD} strokeWidth="1.5" />
    </svg>
  );
}

/** Faint foundation seal behind the body text. */
function Seal() {
  return (
    <svg
      viewBox="-220 -220 440 440"
      style={{
        position: "absolute",
        left: "50%",
        top: "52%",
        width: "34cqw",
        transform: "translate(-50%, -50%)",
        opacity: 0.07,
      }}
      aria-hidden="true"
    >
      <defs>
        <path id="cert-seal-ring" d="M -165,0 A 165,165 0 1 1 165,0 A 165,165 0 1 1 -165,0" />
      </defs>
      <circle r="212" fill="none" stroke={NAVY} strokeWidth="6" />
      <circle r="196" fill="none" stroke={NAVY} strokeWidth="2" />
      <circle r="132" fill="none" stroke={NAVY} strokeWidth="3" />
      <text
        fill={NAVY}
        fontSize="38"
        fontWeight="700"
        letterSpacing="6"
        fontFamily="var(--cert-display), Georgia, serif"
      >
        <textPath href="#cert-seal-ring" startOffset="0">
          ROYSTIAN FOUNDATION ★ VIRTUAL INTERNSHIP ★
        </textPath>
      </text>
      {/* Globe */}
      <circle r="105" fill={NAVY} opacity="0.35" />
      <ellipse rx="45" ry="105" fill="none" stroke="#fff" strokeWidth="4" />
      <ellipse rx="85" ry="105" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="-105" x2="105" stroke="#fff" strokeWidth="4" />
      <line x1="-92" x2="92" y1="-50" y2="-50" stroke="#fff" strokeWidth="3" />
      <line x1="-92" x2="92" y1="50" y2="50" stroke="#fff" strokeWidth="3" />
      <line y1="-105" y2="105" stroke="#fff" strokeWidth="4" />
    </svg>
  );
}

function Signatory({ src, role, name }: { src: string; role: string; name: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "19.7cqw" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- printed certificate; a plain img prints reliably */}
      <img src={src} alt="" style={{ height: "7.2cqw", width: "auto", display: "block" }} />
      <GoldRule width="100%" />
      <p style={{ margin: "0.9cqw 0 0", fontSize: "1.25cqw", color: NAVY, lineHeight: 1.2 }}>{role}</p>
      <p style={{ margin: "0.4cqw 0 0", fontSize: "1.45cqw", fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>
        {name}
      </p>
    </div>
  );
}

function VerticalRule() {
  return (
    <span
      style={{ display: "block", width: "0.12cqw", height: "5.2cqw", background: GOLD, alignSelf: "center" }}
    />
  );
}

export function CertificateDocument({
  certificate,
  verificationUrl,
}: {
  certificate: Certificate;
  verificationUrl: string;
}) {
  const name = certificate.studentName.toUpperCase();

  return (
    <div
      id="certificate-document"
      className={`${display.variable} ${body.variable} relative mx-auto w-full max-w-[1100px] bg-white`}
      style={{
        aspectRatio: "3 / 2",
        overflow: "hidden",
        containerType: "inline-size",
        color: NAVY,
        fontFamily: "var(--cert-body), Georgia, serif",
      }}
      role="img"
      aria-label={`Certificate of Internship Completion for ${certificate.studentName}, ${certificate.domainName} Intern, ID ${certificate.id}`}
    >
      <Corners />
      <Seal />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Masthead */}
        <h1
          style={{
            margin: "4.1cqw 0 0",
            fontFamily: "var(--cert-display), Georgia, serif",
            fontWeight: 800,
            fontSize: "4.3cqw",
            lineHeight: 1,
            letterSpacing: "0.01em",
          }}
        >
          ROYSTIAN FOUNDATION
        </h1>
        <p style={{ margin: "1cqw 0 0", fontSize: "1.25cqw", letterSpacing: "0.2em", lineHeight: 1 }}>
          VIRTUAL INTERNSHIP &amp; SKILL DEVELOPMENT PLATFORM
        </p>
        <p style={{ margin: "0.75cqw 0 0", fontSize: "1.02cqw", letterSpacing: "0.2em", lineHeight: 1 }}>
          SECTION 8 NON-PROFIT ORGANIZATION
        </p>

        {/* Title */}
        <p
          style={{
            margin: "2.1cqw 0 0",
            fontFamily: "var(--cert-display), Georgia, serif",
            fontWeight: 900,
            fontSize: "6.75cqw",
            lineHeight: 1,
            letterSpacing: "0.005em",
          }}
        >
          CERTIFICATE
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1.4cqw", marginTop: "1cqw" }}>
          <GoldRule width="8.2cqw" />
          <span style={{ fontSize: "1.95cqw", letterSpacing: "0.16em", lineHeight: 1 }}>
            OF INTERNSHIP COMPLETION
          </span>
          <GoldRule width="8.2cqw" />
        </div>

        <p style={{ margin: "2.7cqw 0 0", fontSize: "1.72cqw", lineHeight: 1 }}>This is to certify that</p>

        {/* Recipient */}
        <p
          style={{
            margin: "2.2cqw 0 0",
            fontFamily: "var(--cert-display), Georgia, serif",
            fontWeight: 800,
            fontSize: nameSize(name),
            lineHeight: 1,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9cqw", marginTop: "0.9cqw" }}>
          <GoldRule width="26.6cqw" />
          <span
            style={{
              display: "block",
              width: "0.85cqw",
              height: "0.85cqw",
              background: GOLD,
              transform: "rotate(45deg)",
            }}
          />
          <GoldRule width="26.6cqw" />
        </div>

        {/* Statement */}
        <p style={{ margin: "1.4cqw 0 0", fontSize: "1.72cqw", lineHeight: 1.45 }}>
          has successfully completed their internship at Roystian Foundation
          <br />
          as a <strong style={{ fontWeight: 700 }}>{certificate.domainName} Intern</strong>,
          <br />
          demonstrating practical learning, project work, and
          <br />
          valuable contributions to the organization.
        </p>

        {/* Signatures and recognitions */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "5.3cqw",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "1.6cqw",
          }}
        >
          <Signatory
            src="/images/certificate/signature-ceo.png"
            role="CEO & Founder"
            name="Kiran Bavikatti"
          />
          <VerticalRule />
          {/* eslint-disable-next-line @next/next/no-img-element -- printed certificate; a plain img prints reliably */}
          <img
            src="/images/certificate/partner-logos.png"
            alt="NITI Aayog and NGO Darpan"
            style={{ width: "27cqw", height: "auto", display: "block", marginBottom: "-0.6cqw" }}
          />
          <VerticalRule />
          <Signatory
            src="/images/certificate/signature-director.png"
            role="Development Director"
            name="Tejasree Akula"
          />
        </div>
      </div>

      {/* Verification — the template has no slot for this, so it sits in the
          empty top-right corner inside the frame. */}
      <div
        style={{
          position: "absolute",
          top: "3.4cqw",
          right: "3.4cqw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5cqw",
          fontSize: "0.72cqw",
          lineHeight: 1.35,
          color: "#334a80",
        }}
      >
        <QRCode value={verificationUrl} size={96} className="!h-[6cqw] !w-[6cqw] !rounded-none" alt="Certificate verification QR code" />
        <p style={{ margin: 0, letterSpacing: "0.14em", fontWeight: 700 }}>SCAN TO VERIFY</p>
        <p style={{ margin: 0 }}>{certificate.id}</p>
        <p style={{ margin: 0 }}>Issued {fmtDate(certificate.issueDate)}</p>
      </div>
    </div>
  );
}
