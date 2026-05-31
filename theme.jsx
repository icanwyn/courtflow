import React, { useMemo } from "react";

/* ------------------------------- Tokens ----------------------------------- */
export const DARK = "#0c1a13";
export const GREEN_800 = "#10241a";
export const GOLD = "#c9a24a";
export const GOLD_BRIGHT = "#e6cd86";
export const CREAM = "#efe9d8";
export const MUTED = "#8b9a82";
export const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
export const SANS = "'Jost', system-ui, -apple-system, sans-serif";
export const MONO = "'Jost', ui-monospace, monospace";
const BORDER = "1px solid rgba(201,162,74,.18)";
const CARD_BG = "linear-gradient(160deg, rgba(29,59,41,.55), rgba(12,26,19,.65))";

/* ---------------------------- Deterministic QR ---------------------------- */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function buildMatrix(text, size = 25) {
  let seed = hashStr(text) || 1;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const m = Array.from({ length: size }, () => Array(size).fill(false));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) m[y][x] = rnd() > 0.52;
  const finder = (ox, oy) => { for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) { const yy = oy + y, xx = ox + x; if (yy < 0 || xx < 0 || yy >= size || xx >= size) continue; if (y < 0 || x < 0 || y > 6 || x > 6) { m[yy][xx] = false; continue; } const b = x === 0 || x === 6 || y === 0 || y === 6; const c = x >= 2 && x <= 4 && y >= 2 && y <= 4; m[yy][xx] = b || c; } };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
  return m;
}
export function QRCode({ text, px = 168 }) {
  const size = 25;
  const m = useMemo(() => buildMatrix(text, size), [text]);
  const cell = px / size;
  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} style={{ display: "block", borderRadius: 10 }}>
      <rect x="0" y="0" width={px} height={px} fill="#efe9d8" />
      {m.map((row, y) => row.map((on, x) => on ? (
        <rect key={`${x}-${y}`} x={x * cell + 0.5} y={y * cell + 0.5} width={cell - 1} height={cell - 1} rx={cell * 0.22} fill="#10241a" />
      ) : null))}
    </svg>
  );
}

/* ------------------------- Texture + Style layer -------------------------- */
export function Texture() { return <div style={S.texture} aria-hidden />; }
export function StyleInjector() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Jost:wght@300;400;500;600&display=swap');
      *{box-sizing:border-box;} body{margin:0;}
      ::selection{background:${GOLD};color:${DARK};}
      input,button,select{font-family:${SANS};}
      input::placeholder{color:#6f7d68;}
      a{text-decoration:none;}
      .cf-rise{animation:cfRise .6s cubic-bezier(.2,.7,.2,1) both;}
      @keyframes cfRise{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
      .cf-pop{animation:cfPop .45s cubic-bezier(.2,.8,.2,1) both;}
      @keyframes cfPop{from{opacity:0;transform:scale(.96) translateY(10px);}to{opacity:1;transform:none;}}
      .cf-card{transition:transform .35s cubic-bezier(.2,.7,.2,1),border-color .35s,box-shadow .35s;}
      .cf-card:hover{transform:translateY(-4px);border-color:rgba(201,162,74,.55)!important;box-shadow:0 24px 60px rgba(0,0,0,.45)!important;}
      .cf-btn-gold{transition:transform .2s,filter .25s,box-shadow .25s;}
      .cf-btn-gold:hover{filter:brightness(1.08);box-shadow:0 8px 28px rgba(201,162,74,.35);}
      .cf-btn-gold:active{transform:translateY(1px);}
      .cf-btn-gold:disabled{opacity:.4;cursor:not-allowed;filter:none;box-shadow:none;}
      .cf-btn-ghost{transition:border-color .25s,color .25s,background .25s;}
      .cf-btn-ghost:hover{border-color:${GOLD}!important;color:${CREAM}!important;background:rgba(201,162,74,.08)!important;}
      .cf-tab{transition:color .25s,background .25s;}
      .cf-tab:hover{color:${CREAM}!important;}
      .cf-x{transition:color .2s,border-color .2s,background .2s;}
      .cf-x:hover{color:#e0966b!important;border-color:rgba(217,130,79,.6)!important;background:rgba(217,130,79,.12)!important;}
      .cf-shimmer{background:linear-gradient(100deg,${GOLD} 20%,#f4e4b8 45%,${GOLD} 70%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:cfShine 3s linear infinite;}
      @keyframes cfShine{to{background-position:-200% center;}}
      .cf-dots{animation:cfBlink 1.4s ease-in-out infinite;}
      @keyframes cfBlink{0%,100%{opacity:.3;}50%{opacity:1;}}
      .cf-spin{animation:cfSpin 1s linear infinite;}
      @keyframes cfSpin{to{transform:rotate(360deg);}}
      input[type=range]{-webkit-appearance:none;height:4px;border-radius:4px;background:rgba(201,162,74,.25);}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${GOLD};cursor:pointer;box-shadow:0 0 0 4px rgba(201,162,74,.18);}
      @media(max-width:760px){.cf-tab-label{display:none;}}
    `}</style>
  );
}

/* ----------------------------- Shared bits -------------------------------- */
export function SectionHead({ kicker, title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
      <div>
        <div style={S.eyebrow}><span style={S.dotGold} /> {String(kicker).toUpperCase()}</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 34, color: CREAM, margin: "8px 0 0", lineHeight: 1.05 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}
export function Field({ label, children }) {
  return <div style={{ marginTop: 18 }}><div style={S.fieldLabel}>{label}</div>{children}</div>;
}
export function Spinner({ label = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 16 }}>
      <div className="cf-spin" style={{ width: 30, height: 30, borderRadius: 50, border: `2px solid rgba(201,162,74,.25)`, borderTopColor: GOLD }} />
      <div style={{ color: MUTED, fontSize: 12.5, letterSpacing: ".12em" }}>{label}</div>
    </div>
  );
}

/* ------------------------------- Styles ----------------------------------- */
export const S = {
  app: { minHeight: "100vh", background: DARK, color: CREAM, fontFamily: SANS, position: "relative", overflowX: "hidden" },
  texture: { position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(1200px 700px at 78% -8%, rgba(201,162,74,.10), transparent 60%),radial-gradient(900px 600px at 8% 110%, rgba(29,59,41,.6), transparent 55%),linear-gradient(160deg, ${GREEN_800} 0%, ${DARK} 55%, #081610 100%)` },
  topbar: { position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(14px)", background: "rgba(10,22,16,.72)", borderBottom: BORDER },
  topbarInner: { maxWidth: 1240, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  logo: { width: 42, height: 42, borderRadius: 11, background: "linear-gradient(150deg,#1d3b29,#0c1a13)", border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 17, color: GOLD, boxShadow: "inset 0 0 18px rgba(201,162,74,.18)", cursor: "pointer", textDecoration: "none" },
  nav: { display: "flex", gap: 4, background: "rgba(0,0,0,.2)", padding: 4, borderRadius: 12, border: BORDER, flexWrap: "wrap" },
  tab: { display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 8, border: "none", background: "transparent", color: MUTED, fontSize: 12.5, letterSpacing: ".04em", cursor: "pointer" },
  tabActive: { background: "linear-gradient(150deg,rgba(201,162,74,.16),rgba(201,162,74,.06))", color: CREAM, boxShadow: "inset 0 0 0 1px rgba(201,162,74,.4)" },
  gymSwitch: { display: "flex", alignItems: "center", gap: 7, padding: "4px 8px", borderRadius: 9, border: "none", background: "transparent", cursor: "pointer" },
  menuScrim: { position: "fixed", inset: 0, zIndex: 60 },
  gymMenu: { position: "absolute", top: "calc(100% + 10px)", left: 0, zIndex: 70, width: 280, padding: 10, borderRadius: 14, border: `1px solid rgba(201,162,74,.3)`, background: "linear-gradient(165deg,#163021,#0c1a13)", boxShadow: "0 30px 70px rgba(0,0,0,.6)" },
  gymMenuLabel: { fontSize: 10, letterSpacing: ".2em", color: MUTED, padding: "4px 8px 8px" },
  gymMenuItem: { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 10px", borderRadius: 10, border: "none", background: "transparent", color: CREAM, fontSize: 13, cursor: "pointer" },
  gymMenuItemOn: { background: "rgba(201,162,74,.1)", boxShadow: "inset 0 0 0 1px rgba(201,162,74,.4)" },
  footer: { padding: "26px 22px", textAlign: "center", borderTop: BORDER, marginTop: 30 },

  page: { maxWidth: 1240, margin: "0 auto", padding: "40px 22px 30px" },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: 9, fontSize: 11, letterSpacing: ".24em", color: GOLD, textTransform: "uppercase" },
  dotGold: { width: 6, height: 6, borderRadius: 6, background: GOLD, boxShadow: `0 0 8px ${GOLD}` },
  h1: { fontFamily: SERIF, fontSize: "clamp(34px,5vw,56px)", lineHeight: 1.04, color: CREAM, margin: "16px 0 0", fontWeight: 500 },
  lede: { color: MUTED, fontSize: 16, lineHeight: 1.7, maxWidth: 620, marginTop: 18 },

  statRow: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 },
  stat: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 13, border: BORDER, background: CARD_BG, minWidth: 150 },
  statHot: { border: `1px solid ${GOLD}`, boxShadow: "0 0 24px rgba(201,162,74,.18)" },
  homeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 40 },
  bigCard: { textAlign: "left", position: "relative", padding: "26px 24px 22px", borderRadius: 18, border: BORDER, background: CARD_BG, cursor: "pointer", color: CREAM, overflow: "hidden", display: "block" },
  bigCardTag: { position: "absolute", top: 18, right: 18, fontSize: 10, letterSpacing: ".18em", color: MUTED, textTransform: "uppercase", border: BORDER, padding: "4px 9px", borderRadius: 20 },
  bigCardIcon: { width: 56, height: 56, borderRadius: 14, border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,162,74,.07)" },
  bigCardCta: { display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20, color: GOLD, fontSize: 13, letterSpacing: ".06em" },

  panel: { borderRadius: 16, border: BORDER, background: CARD_BG, overflow: "hidden" },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: BORDER, background: "rgba(0,0,0,.18)" },
  panelTitle: { fontSize: 13, letterSpacing: ".1em", color: CREAM, textTransform: "uppercase" },
  countPill: { fontSize: 11.5, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 20, padding: "3px 11px", letterSpacing: ".06em" },
  countPillHot: { color: DARK, background: GOLD, fontWeight: 600 },
  fdStats: { display: "flex", gap: 8, flexWrap: "wrap" },
  empty: { padding: "26px 20px", color: MUTED, fontSize: 13.5, fontStyle: "italic" },
  deskGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, padding: 16 },
  deskRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: BORDER, background: "rgba(0,0,0,.15)" },
  codeWrap: { display: "flex", flexWrap: "wrap", gap: 9, padding: 16 },
  codeChip: { display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 13px", borderRadius: 10, border: BORDER, background: "rgba(0,0,0,.2)" },
  locTag: { fontSize: 10, color: DARK, background: GOLD, borderRadius: 6, padding: "2px 7px", letterSpacing: ".04em" },
  locTagQueue: { background: "rgba(201,162,74,.22)", color: GOLD },
  locTagIdle: { fontSize: 10, color: MUTED, border: BORDER, borderRadius: 6, padding: "2px 7px", letterSpacing: ".04em" },

  sectionLabel: { fontSize: 11.5, letterSpacing: ".26em", color: GOLD, textTransform: "uppercase", margin: "0 0 16px" },
  courtGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 },
  court: { padding: "20px 20px 18px", borderRadius: 16, border: BORDER, background: CARD_BG },
  courtConfirm: { border: "1px solid rgba(217,130,79,.5)" },
  xBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, border: BORDER, background: "rgba(0,0,0,.2)", color: MUTED, cursor: "pointer", padding: 0 },
  confirmBox: { marginTop: 16, padding: "12px 14px", borderRadius: 11, border: "1px solid rgba(217,130,79,.35)", background: "rgba(217,130,79,.07)" },
  configRows: { marginTop: 16, borderTop: BORDER },
  configRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: BORDER },
  addCourtCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "30px 20px", borderRadius: 16, border: "1px dashed rgba(201,162,74,.4)", background: "rgba(201,162,74,.04)", cursor: "pointer", color: CREAM, minHeight: 200 },
  addCircle: { width: 54, height: 54, borderRadius: 50, border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,162,74,.08)" },
  statusDot: { width: 8, height: 8, borderRadius: 8 },
  miniLabel: { fontSize: 10, letterSpacing: ".2em", color: MUTED, marginBottom: 8 },
  playerWrap: { display: "flex", flexWrap: "wrap", gap: 7 },
  playerPill: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, border: BORDER, background: "rgba(0,0,0,.2)", color: CREAM, fontSize: 12.5, fontFamily: MONO },
  playerPillMe: { border: `1px solid ${GOLD}`, color: GOLD_BRIGHT, background: "rgba(201,162,74,.1)" },
  playerPillChamp: { background: GOLD, color: DARK, border: `1px solid ${GOLD}`, fontWeight: 600 },
  winBtn: { marginLeft: 4, border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex" },
  bar: { height: 5, borderRadius: 6, background: "rgba(255,255,255,.07)", marginTop: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6, transition: "width 1s linear" },
  queueRow: { display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 9, background: "rgba(0,0,0,.2)" },
  queueRowSm: { display: "flex", alignItems: "center", gap: 9, padding: "6px 9px", borderRadius: 8, background: "rgba(0,0,0,.2)" },
  queueRowMine: { background: "rgba(201,162,74,.12)", boxShadow: `inset 0 0 0 1px ${GOLD}` },
  queueNum: { width: 20, height: 20, borderRadius: 6, background: "rgba(201,162,74,.15)", color: GOLD, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" },
  queueNumNext: { background: GOLD, color: DARK, fontWeight: 600 },
  nextPill: { fontSize: 9, letterSpacing: ".1em", color: DARK, background: GOLD, borderRadius: 5, padding: "2px 6px", fontWeight: 600 },
  youAreNext: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "9px 12px", borderRadius: 10, border: `1px solid ${GOLD}`, background: "rgba(201,162,74,.08)", color: GOLD, fontSize: 12.5 },
  youAreNextHot: { background: `linear-gradient(150deg, ${GOLD_BRIGHT}, ${GOLD})`, color: DARK, fontWeight: 600, border: "none" },
  intentTag: { fontSize: 9.5, letterSpacing: ".1em", color: MUTED, border: BORDER, borderRadius: 6, padding: "2px 7px", textTransform: "uppercase" },
  intentMerge: { color: GOLD, borderColor: GOLD },

  btnGold: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 11, border: "none", background: `linear-gradient(150deg, ${GOLD_BRIGHT}, ${GOLD})`, color: DARK, fontSize: 13.5, fontWeight: 600, letterSpacing: ".02em", cursor: "pointer" },
  btnGoldSm: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 9, border: "none", background: `linear-gradient(150deg, ${GOLD_BRIGHT}, ${GOLD})`, color: DARK, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  btnGhostSm: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 9, border: BORDER, background: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" },
  btnDanger: { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(217,130,79,.4)", background: "transparent", color: "#d9824f", fontSize: 13, cursor: "pointer" },
  btnDangerSm: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: "1px solid rgba(217,130,79,.4)", background: "transparent", color: "#d9824f", fontSize: 12, cursor: "pointer" },
  iconBtn: { border: BORDER, background: "transparent", borderRadius: 9, padding: 8, cursor: "pointer", display: "flex" },
  iconBtnSm: { border: "none", background: "rgba(0,0,0,.2)", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex" },

  overlay: { position: "fixed", inset: 0, zIndex: 100, background: "rgba(6,14,10,.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 18px", overflowY: "auto" },
  modal: { width: "100%", maxWidth: 540, background: "linear-gradient(165deg,#163021,#0c1a13)", border: `1px solid rgba(201,162,74,.3)`, borderRadius: 20, padding: 26, boxShadow: "0 40px 100px rgba(0,0,0,.6)" },
  goldRule: { height: 1, background: "linear-gradient(90deg,transparent,rgba(201,162,74,.5),transparent)", margin: "16px 0 4px" },
  fieldLabel: { fontSize: 11, letterSpacing: ".16em", color: MUTED, textTransform: "uppercase", marginBottom: 9 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 11, border: BORDER, background: "rgba(0,0,0,.25)", color: CREAM, fontSize: 14, outline: "none" },
  titleInput: { fontFamily: SERIF, fontSize: 30, color: CREAM, background: "rgba(0,0,0,.2)", border: BORDER, borderRadius: 10, padding: "4px 12px", outline: "none" },
  numInput: { width: 74, padding: "8px 10px", borderRadius: 9, border: BORDER, background: "rgba(0,0,0,.25)", color: CREAM, fontSize: 14, outline: "none", textAlign: "center" },
  previewBox: { marginTop: 14, padding: "12px 14px", borderRadius: 11, border: `1px solid rgba(201,162,74,.25)`, background: "rgba(201,162,74,.06)" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  selChip: { padding: "9px 15px", borderRadius: 10, border: BORDER, background: "rgba(0,0,0,.2)", color: MUTED, fontSize: 13, cursor: "pointer" },
  selChipOn: { border: `1px solid ${GOLD}`, color: DARK, background: GOLD, fontWeight: 600 },
  modeCard: { textAlign: "left", padding: "14px 15px", borderRadius: 13, border: BORDER, background: "rgba(0,0,0,.2)", cursor: "pointer" },
  modeCardOn: { border: `1px solid ${GOLD}`, background: "rgba(201,162,74,.1)" },
  range: { width: "100%", marginTop: 10 },

  gymBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 13, border: BORDER, background: "rgba(0,0,0,.18)", marginBottom: 16 },
  gymChip: { padding: "7px 13px", borderRadius: 20, border: BORDER, background: "rgba(0,0,0,.2)", color: MUTED, fontSize: 12.5, cursor: "pointer" },
  gymChipOn: { border: `1px solid ${GOLD}`, color: DARK, background: GOLD, fontWeight: 600 },
  gymChipAdd: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 20, border: "1px dashed rgba(201,162,74,.45)", background: "transparent", color: GOLD, fontSize: 12.5, cursor: "pointer" },

  kioskWrap: { minHeight: "calc(100vh - 150px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 18px" },
  kioskScreen: { width: "100%", maxWidth: 560 },
  kioskBezel: { borderRadius: 26, border: `1px solid rgba(201,162,74,.35)`, background: "linear-gradient(165deg, rgba(29,59,41,.6), rgba(8,18,12,.85))", padding: "44px 34px", boxShadow: "0 40px 120px rgba(0,0,0,.55), inset 0 0 60px rgba(201,162,74,.05)" },
  kioskKicker: { fontSize: 11, letterSpacing: ".28em", color: GOLD, textTransform: "uppercase" },
  kioskTitle: { fontFamily: SERIF, fontSize: 34, color: CREAM, margin: "8px 0 0", fontWeight: 500 },
  kioskInput: { width: "100%", maxWidth: 340, padding: "14px 16px", borderRadius: 13, border: BORDER, background: "rgba(0,0,0,.3)", color: CREAM, fontSize: 16, outline: "none", margin: "22px auto 16px", display: "block", textAlign: "center" },
  kioskBtn: { display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 30px", borderRadius: 13, border: "none", background: `linear-gradient(150deg, ${GOLD_BRIGHT}, ${GOLD})`, color: DARK, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  pulseRing: { width: 84, height: 84, borderRadius: 50, border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 0 0 8px rgba(201,162,74,.08), 0 0 30px rgba(201,162,74,.25)" },
  passcode: { fontFamily: SERIF, fontSize: 64, fontWeight: 600, letterSpacing: ".02em", margin: "14px 0 6px", lineHeight: 1 },

  signupCard: { padding: "32px 28px", borderRadius: 20, border: `1px solid rgba(201,162,74,.3)`, background: "linear-gradient(165deg, rgba(29,59,41,.6), rgba(8,18,12,.85))", boxShadow: "0 30px 80px rgba(0,0,0,.5)" },
  invalid: { marginTop: 14, padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(217,130,79,.4)", color: "#e0966b", fontSize: 12.5, background: "rgba(217,130,79,.08)" },
  idCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "20px 24px", borderRadius: 16, border: BORDER, background: CARD_BG },
  locBadge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 20, border: `1px solid ${GOLD}`, color: GOLD, fontSize: 13 },
  noteBar: { display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 16px", borderRadius: 12, border: BORDER, background: "rgba(201,162,74,.06)", color: MUTED, fontSize: 12.5 },
};
