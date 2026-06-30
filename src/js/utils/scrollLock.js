let locks = 0;

export function lockScroll() {
  if (locks === 0) {
    const width = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (width > 0) document.body.style.paddingInlineEnd = `${width}px`;
  }
  locks += 1;
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
  }
}
