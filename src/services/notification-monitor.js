export function createNotificationMonitor({
  scope,
  load,
  onChange = () => {},
  initialEnabled,
  saveEnabled,
}) {
  const key = `ea:notification-sound:${scope}`;
  const seenKey = `ea:notification-seen:${scope}`;
  const read = (name, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(name)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      /* Le preferenze restano disponibili nella scheda corrente. */
    }
  };
  let enabled = initialEnabled ?? read(key, false),
    baseline = true,
    stopped = false,
    running = false,
    timer,
    context;
  const readSeen = () => {
    const cache = read(seenKey, {});
    return cache.expires > Date.now() && Array.isArray(cache.items) ? cache.items : [];
  };
  let seen = readSeen();
  function tone() {
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.setValueAtTime(980, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.075, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.26);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.27);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  async function unlock() {
    if (!enabled || stopped) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context ||= new Audio();
      if (context.state === "suspended") await context.resume();
    } catch {
      /* Il browser può richiedere una nuova interazione esplicita. */
    }
  }
  async function consume(result) {
    if (stopped) return;
    const stored = new Set([...seen, ...readSeen()]);
    const fresh = result.items.some(
      (item) => !item.read && !stored.has(item.id),
    );
    seen = [
      ...new Set([...stored, ...result.items.map((item) => item.id)]),
    ].slice(-1000);
    write(seenKey, {items: seen, expires: Date.now() + 7 * 24 * 60 * 60 * 1000});
    if (!baseline && fresh && enabled) tone();
    baseline = false;
    onChange({ enabled, unread: result.unread, available: true });
  }
  async function poll() {
    if (stopped || running) return;
    clearTimeout(timer);
    running = true;
    try {
      const result = await load();
      if (navigator.locks)
        await navigator.locks.request(seenKey, () => consume(result));
      else await consume(result);
    } catch {
      if (!stopped) onChange({ enabled, available: false });
    } finally {
      running = false;
      if (!stopped) timer = setTimeout(poll, document.hidden ? 45000 : 20000);
    }
  }
  function visible() {
    if (!document.hidden) poll();
  }
  function storage(event) {
    if (!saveEnabled && event.key === key) {
      enabled = read(key, false);
      onChange({ enabled });
    }
  }
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  window.addEventListener("storage", storage);
  document.addEventListener("visibilitychange", visible);
  poll();
  return {
    get enabled() {
      return enabled;
    },
    async toggle() {
      const next = !enabled;
      if (saveEnabled) await saveEnabled(next);
      else write(key, next);
      enabled = next;
      await unlock();
      onChange({ enabled });
      return enabled;
    },
    setEnabled(value) {
      enabled = Boolean(value);
      onChange({enabled});
    },
    refresh: poll,
    dispose() {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visible);
      context?.close().catch(() => {});
    },
  };
}
