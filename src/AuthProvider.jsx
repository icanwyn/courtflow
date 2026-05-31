import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isConfigured } from "./supabaseClient";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myGyms, setMyGyms] = useState([]); // [{ id, name, role }]
  const [access, setAccess] = useState({ isAdmin: false, canCreateGym: false });

  const user = session?.user || null;

  const loadAccess = useCallback(async (uid) => {
    if (!supabase || !uid) { setAccess({ isAdmin: false, canCreateGym: false }); return; }
    const { data } = await supabase.rpc("my_access");
    const row = data && data.length ? data[0] : null;
    setAccess({ isAdmin: !!row?.is_admin, canCreateGym: !!row?.can_create_gym });
  }, []);

  const loadGyms = useCallback(async (uid) => {
    if (!supabase || !uid) { setMyGyms([]); return; }
    const [owned, access] = await Promise.all([
      supabase.from("gyms").select("id,name").eq("owner_id", uid),
      supabase.from("gym_access").select("role, gyms(id,name)").eq("user_id", uid),
    ]);
    const map = new Map();
    (owned.data || []).forEach((g) => map.set(g.id, { id: g.id, name: g.name, role: "owner" }));
    (access.data || []).forEach((a) => {
      if (a.gyms && !map.has(a.gyms.id)) map.set(a.gyms.id, { id: a.gyms.id, name: a.gyms.name, role: a.role });
    });
    setMyGyms([...map.values()]);
  }, []);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) { loadGyms(data.session.user.id); loadAccess(data.session.user.id); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) { loadGyms(s.user.id); loadAccess(s.user.id); } else { setMyGyms([]); setAccess({ isAdmin: false, canCreateGym: false }); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadGyms, loadAccess]);

  const roleFor = useCallback((gymId) => myGyms.find((g) => g.id === gymId)?.role || null, [myGyms]);

  const value = {
    isConfigured, loading, session, user, myGyms,
    isAdmin: access.isAdmin, canCreateGym: access.canCreateGym,
    roleFor,
    refreshGyms: () => user && loadGyms(user.id),
    refreshAccess: () => user && loadAccess(user.id),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
