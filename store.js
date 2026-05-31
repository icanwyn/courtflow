import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { fetchBundle } from "./api";

/* Loads a gym bundle (gym + courts + members) and keeps it live via
   Supabase Realtime. Any change to courts/members/gyms for this gym
   triggers a debounced reload. */
export function useGymData(gymId) {
  const [data, setData] = useState({ gym: null, courts: [], members: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const reload = useCallback(async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const bundle = await fetchBundle(gymId);
      setData(bundle); setError(null);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [gymId]);

  useEffect(() => {
    setLoading(true);
    reload();
    if (!supabase || !gymId) return;
    const debounced = () => { clearTimeout(timer.current); timer.current = setTimeout(reload, 120); };
    const ch = supabase.channel(`gym:${gymId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "courts", filter: `gym_id=eq.${gymId}` }, debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `gym_id=eq.${gymId}` }, debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "gyms", filter: `id=eq.${gymId}` }, debounced)
      .subscribe();
    return () => { clearTimeout(timer.current); supabase.removeChannel(ch); };
  }, [gymId, reload]);

  return { ...data, loading, error, reload };
}

/* 1-second clock for live countdowns. */
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
