let sequence = 0;

export function attachTooltips(root = document) {
  let active;
  let timer;
  let held;
  const triggerFor = target => target instanceof Element ? target.closest("[data-tooltip]") : null;
  const hide = () => {
    if (!active) return;
    const { trigger, panel } = active;
    const descriptions = (trigger.getAttribute("aria-describedby") || "").split(/\s+/).filter(id => id && id !== panel.id);
    if (descriptions.length) trigger.setAttribute("aria-describedby", descriptions.join(" "));
    else trigger.removeAttribute("aria-describedby");
    panel.remove();
    active = null;
  };
  const position = () => {
    if (!active) return;
    const { trigger, panel } = active;
    if (!trigger.isConnected) { hide(); return; }
    const bounds = trigger.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) { hide(); return; }
    const rect = panel.getBoundingClientRect();
    const below = trigger.dataset.tooltipPlacement?.startsWith("below") || bounds.top - rect.height - 8 < 8;
    const preferredTop = below ? bounds.bottom + 8 : bounds.top - rect.height - 8;
    panel.style.top = `${Math.max(8, Math.min(preferredTop, innerHeight - rect.height - 8))}px`;
    panel.style.left = `${Math.max(8, Math.min(bounds.left + (bounds.width - rect.width) / 2, innerWidth - rect.width - 8))}px`;
  };
  const show = trigger => {
    if (!trigger?.dataset.tooltip || trigger.disabled) return;
    if (active?.trigger === trigger) { position(); return; }
    hide();
    const panel = document.createElement("div");
    panel.id = `ea-tooltip-${++sequence}`;
    panel.className = "ea-tooltip";
    panel.setAttribute("role", "tooltip");
    panel.setAttribute("popover", "manual");
    panel.textContent = trigger.dataset.tooltip;
    (trigger.closest("dialog") || document.body).append(panel);
    trigger.setAttribute("aria-describedby", [trigger.getAttribute("aria-describedby"), panel.id].filter(Boolean).join(" "));
    active = { trigger, panel };
    panel.showPopover?.();
    position();
  };
  const enter = event => {
    const trigger = triggerFor(event.target);
    if (trigger && !trigger.contains(event.relatedTarget)) show(trigger);
  };
  const leave = event => {
    if (active?.trigger === triggerFor(event.target) && !active.trigger.contains(event.relatedTarget)) hide();
  };
  const cancelPress = () => clearTimeout(timer);
  const press = event => {
    cancelPress();
    held = null;
    const trigger = triggerFor(event.target);
    if (!trigger) { hide(); return; }
    if (event.pointerType === "touch") {
      timer = setTimeout(() => { held = trigger; show(trigger); }, 450);
    }
  };
  const click = event => {
    if (held && held === triggerFor(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      held = null;
    } else hide();
  };
  const key = event => { if (event.key === "Escape") hide(); };
  const listeners = [["mouseover", enter], ["mouseout", leave], ["focusin", enter], ["focusout", leave], ["pointerdown", press], ["pointerup", cancelPress], ["pointercancel", cancelPress], ["pointermove", cancelPress], ["click", click], ["keydown", key]];
  listeners.forEach(([event, handler]) => root.addEventListener(event, handler, true));
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
  return () => {
    cancelPress(); hide();
    listeners.forEach(([event, handler]) => root.removeEventListener(event, handler, true));
    window.removeEventListener("resize", position);
    window.removeEventListener("scroll", position, true);
  };
}
