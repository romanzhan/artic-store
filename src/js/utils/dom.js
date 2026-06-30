export function setSlot(root, name, html) {
  const el = root.querySelector(`[data-${name}]`);
  if (el) el.innerHTML = html;
}
