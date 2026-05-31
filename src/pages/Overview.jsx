import React from "react";
import { Link } from "react-router-dom";
import { Monitor, ScanLine, UserCheck, Settings, ArrowRight, Sparkles } from "lucide-react";
import { S, GOLD, CREAM, MUTED, SERIF } from "../theme.jsx";
import { useGym } from "../GymProvider";
import { useAuth } from "../AuthProvider";

export default function Overview() {
  const { gymId } = useGym();
  const { user, roleFor } = useAuth();
  const role = roleFor(gymId);
  const q = gymId ? `?gym=${gymId}` : "";

  const cards = [
    { to: `/kiosk${q}`, tag: "Public · Lobby", Icon: Monitor, title: "Kiosk", desc: "A lobby device where players check in. Front office approves them and a passcode is issued on-screen.", show: true },
    { to: `/signup${q}`, tag: "Public · Player", Icon: ScanLine, title: "Court Sign-Up", desc: "Players unlock with their passcode, then join a court, merge into a game, or take the next rotation.", show: true },
    { to: `/front-office${q}`, tag: "Staff", Icon: UserCheck, title: "Front Office", desc: "Approve check-ins, hand out passcodes, and watch every court live — rotate, clear, or crown winners.", show: true },
    { to: `/dashboard${q}`, tag: "Owner", Icon: Settings, title: "Owner Dashboard", desc: "Create courts in bulk, set timed or challenge formats, manage gyms, and grant staff access.", show: true },
  ];

  return (
    <main style={S.page}>
      <div className="cf-rise">
        <div style={S.eyebrow}><span style={S.dotGold} /> COURT QUEUEING, DONE RIGHT</div>
        <h1 style={S.h1}>Run every court<br />without the clipboard.</h1>
        <p style={S.lede}>
          CourtFlow turns check-in, queueing, and rotation into one calm flow — a lobby kiosk, a staff
          front office, and a player sign-up that all stay in sync in real time.
        </p>
        {!user && (
          <Link to="/login" className="cf-btn-gold" style={{ ...S.btnGold, marginTop: 24, textDecoration: "none" }}>
            <Sparkles size={16} /> Staff sign in
          </Link>
        )}
      </div>

      <div style={S.homeGrid}>
        {cards.filter((c) => c.show).map((c, i) => (
          <Link key={c.to} to={c.to} className="cf-card cf-rise" style={{ ...S.bigCard, animationDelay: `${0.05 * i}s` }}>
            <span style={S.bigCardTag}>{c.tag}</span>
            <div style={S.bigCardIcon}><c.Icon size={26} color={GOLD} /></div>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: CREAM, marginTop: 18 }}>{c.title}</div>
            <div style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.65, marginTop: 8 }}>{c.desc}</div>
            <span style={S.bigCardCta}>Open <ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
