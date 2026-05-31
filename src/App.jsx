import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthProvider";
import { GymProvider, useGym } from "./GymProvider";
import { isConfigured } from "./supabaseClient";
import { S, GOLD, CREAM, MUTED, SERIF, StyleInjector, Texture, Spinner } from "./theme.jsx";
import { TopBar } from "./components.jsx";
import { ShieldAlert } from "lucide-react";

import Overview from "./pages/Overview.jsx";
import Login from "./pages/Login.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import FrontOffice from "./pages/FrontOffice.jsx";
import Kiosk from "./pages/Kiosk.jsx";
import SignUp from "./pages/SignUp.jsx";
import Admin from "./pages/Admin.jsx";
import Redeem from "./pages/Redeem.jsx";

function NotConfigured() {
  return (
    <div style={S.page}>
      <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 620, margin: "30px auto" }}>
        <div style={S.eyebrow}><span style={S.dotGold} /> SETUP REQUIRED</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, color: CREAM, margin: "12px 0 0" }}>Connect Supabase to continue</h1>
        <p style={{ color: MUTED, lineHeight: 1.7, marginTop: 14 }}>
          The app needs two environment variables before it can talk to your database. Create a
          Supabase project, then add <code style={{ color: GOLD }}>VITE_SUPABASE_URL</code> and
          <code style={{ color: GOLD }}> VITE_SUPABASE_ANON_KEY</code> to a <code style={{ color: GOLD }}>.env</code> file
          (local) or your Vercel project settings (production). The full walkthrough is in the README.
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ need, children }) {
  const { user, loading, roleFor, myGyms, isAdmin } = useAuth();
  const { gymId } = useGym();
  const loc = useLocation();
  if (loading) return <Spinner label="Checking access…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  const role = roleFor(gymId);
  const ownsAny = myGyms.some((g) => g.role === "owner");
  const allowed =
    need === "admin" ? isAdmin :
    need === "owner" ? (role === "owner" || ownsAny || myGyms.length === 0) :
    need === "staff" ? (role === "owner" || role === "front_office" || role === "member") : true;
  if (!allowed) {
    return (
      <div style={S.page}>
        <div className="cf-rise" style={{ ...S.signupCard, maxWidth: 560, margin: "30px auto", textAlign: "center" }}>
          <div style={{ ...S.pulseRing, borderColor: "#d9824f", boxShadow: "0 0 0 8px rgba(217,130,79,.08)" }}><ShieldAlert size={30} color="#d9824f" /></div>
          <h1 style={{ fontFamily: SERIF, fontSize: 26, color: CREAM, marginTop: 18 }}>No access to this gym</h1>
          <p style={{ color: MUTED, lineHeight: 1.7, marginTop: 10 }}>
            Your account isn't assigned the right role for this area. Ask the gym owner to grant you
            access, or switch to a gym you manage.
          </p>
          <Link to="/" className="cf-btn-gold" style={{ ...S.btnGold, marginTop: 18, textDecoration: "none" }}>Back to overview</Link>
        </div>
      </div>
    );
  }
  return children;
}

function Shell() {
  return (
    <div style={S.app}>
      <StyleInjector />
      <Texture />
      <div style={{ position: "relative", zIndex: 2 }}>
        <TopBar />
        {!isConfigured ? <NotConfigured /> : (
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute need="owner"><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/front-office" element={<ProtectedRoute need="staff"><FrontOffice /></ProtectedRoute>} />
            <Route path="/kiosk" element={<Kiosk />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/redeem" element={<ProtectedRoute need="auth"><Redeem /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute need="admin"><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
        <footer style={S.footer}>
          <div style={{ fontFamily: SERIF, fontSize: 17, color: CREAM }}>Court<span style={{ color: GOLD }}>Flow</span></div>
          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, letterSpacing: ".1em" }}>QUEUE MANAGEMENT FOR COURT SPORTS</div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GymProvider>
          <Shell />
        </GymProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
