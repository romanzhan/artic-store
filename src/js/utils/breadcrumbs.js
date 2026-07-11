export function renderBreadcrumbs(items) {
  return items
    .map((item, i) => {
      const last = i === items.length - 1;
      return last || !item.href
        ? `<span class="breadcrumbs__current" aria-current="page">${item.label}</span>`
        : `<a class="breadcrumbs__link" href="${item.href}">${item.label}</a>`;
    })
    .join('<span class="breadcrumbs__sep" aria-hidden="true">/</span>');
}
