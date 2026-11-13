import { useEffect, useState } from "react";
import { platform } from "../api/auth";

const fallback = { beta: false, terms: [], terms_version: null, privacy_version: null };
let pending;

function load() {
  pending ??= platform().catch(() => {
    pending = undefined;
    return fallback;
  });
  return pending;
}

export function usePlatform() {
  const [state, setState] = useState(fallback);
  useEffect(() => {
    let active = true;
    load().then((data) => active && setState({ ...fallback, ...data }));
    return () => {
      active = false;
    };
  }, []);
  return state;
}
