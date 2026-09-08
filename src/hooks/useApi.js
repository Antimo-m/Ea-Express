import { useEffect, useState } from "react";
export function useApi(loader, params = {}) {
  const key = JSON.stringify(params);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({});
  useEffect(() => {
    let active = true;
    loader(JSON.parse(key))
      .then((data) => {
        if (active) setResult({ data, key, revision });
      })
      .catch((error) => {
        if (active) setResult({ error, key, revision });
      });
    return () => {
      active = false;
    };
  }, [loader, key, revision]);
  const loading = result.key !== key || result.revision !== revision;
  return {
    data: loading ? undefined : result.data,
    error: loading ? undefined : result.error,
    loading,
    reload: () => setRevision((value) => value + 1),
  };
}
