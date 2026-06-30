const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function createFocusTrap(container) {
  let active = false;
  let restore = null;

  const visible = () =>
    [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length,
    );

  function onKeydown(event) {
    if (event.key !== 'Tab') return;
    const items = visible();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return {
    activate(initial) {
      if (active) return;
      active = true;
      restore = document.activeElement;
      container.addEventListener('keydown', onKeydown);
      const focusInitial = () => {
        if (!active) return;
        if (getComputedStyle(container).visibility === 'hidden') {
          requestAnimationFrame(focusInitial);
          return;
        }
        (initial || visible()[0])?.focus();
      };
      requestAnimationFrame(focusInitial);
    },
    release() {
      if (!active) return;
      active = false;
      container.removeEventListener('keydown', onKeydown);
      restore?.focus?.();
      restore = null;
    },
  };
}
