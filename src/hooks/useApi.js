import { useEffect, useState } from "react";
export function useApi(loader, params = {}, realtime = false) {
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
  useEffect(() => {
    if (!realtime) return;
    const update = (event) => {
      const params = JSON.parse(key);
      if (params.id && event.detail.order_id && Number(params.id) !== event.detail.order_id) return;
      setRevision(value => value + 1);
    };
    window.addEventListener('ea:workspace-updated', update);
    return () => window.removeEventListener('ea:workspace-updated', update);
  }, [key, realtime]);
  const loading = result.key !== key;
  return {
    data: loading ? undefined : result.data,
    error: loading ? undefined : result.error,
    loading,
    reload: () => setRevision((value) => value + 1),
  };
}
