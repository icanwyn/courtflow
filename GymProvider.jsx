import React, { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const GymCtx = createContext(null);
export const useGym = () => useContext(GymCtx);

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export function GymProvider({ children }) {
  const [params] = useSearchParams();
  const { myGyms } = useAuth();
  const urlGym = params.get("gym");
  const [gymId, setGymIdState] = useState(urlGym || ls.get("cf_gym") || null);
  const [gymName, setGymName] = useState("");

  useEffect(() => { if (urlGym && urlGym !== gymId) setGymIdState(urlGym); }, [urlGym]); // eslint-disable-line
  useEffect(() => { if (!gymId && myGyms.length) setGymIdState(myGyms[0].id); }, [myGyms, gymId]);

  const setGymId = (id) => { setGymIdState(id); ls.set("cf_gym", id); };
  const setGym = (id, name) => { if (id) { setGymIdState(id); ls.set("cf_gym", id); } if (name) setGymName(name); };

  const gyms = myGyms.length ? myGyms : (gymId ? [{ id: gymId, name: gymName || "This gym" }] : []);

  return <GymCtx.Provider value={{ gymId, gymName, setGymId, setGym, gyms }}>{children}</GymCtx.Provider>;
}
