import { createFocusTrap } from '../utils/focusTrap.js';
import { lockScroll, unlockScroll } from '../utils/scrollLock.js';
import { showOverlay, hideOverlay, setOverlayFront } from './overlay.js';
import { EVENTS } from '../constants.js';

export function createCenteredModal({ label, layer, content, onAction, modifier = '' }) {
  let panel = null;
  let trap = null;
  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.innerHTML = content();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    lockScroll();
    showOverlay();
    setOverlayFront(true);
    document.dispatchEvent(new CustomEvent(EVENTS.layerOpen, { detail: layer }));
    trap.activate();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    unlockScroll();
    setOverlayFront(false);
    hideOverlay();
    trap.release();
  }

  function init() {
    panel = document.createElement('div');
    panel.className = modifier ? `modal ${modifier}` : 'modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', label);
    panel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);

    trap = createFocusTrap(panel);

    document.addEventListener('click', (event) => {
      if (!isOpen) return;
      if (event.target.closest('[data-modal-close]')) return close();
      onAction?.(event, close);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) close();
    });
    document.addEventListener(EVENTS.overlayClick, close);
    document.addEventListener(EVENTS.layerOpen, (event) => {
      if (event.detail !== layer) close();
    });
  }

  return { init, open, close, isOpen: () => isOpen };
}
