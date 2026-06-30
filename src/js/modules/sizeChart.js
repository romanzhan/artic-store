import { createCenteredModal } from './centeredModal.js';
import { LAYERS } from '../constants.js';

const ROWS = [
  { ru: 40, int: 'XS', chest: '78–81', waist: '60–63', hips: '86–89' },
  { ru: 42, int: 'S', chest: '82–85', waist: '64–67', hips: '90–93' },
  { ru: 44, int: 'M', chest: '86–89', waist: '68–71', hips: '94–97' },
  { ru: 46, int: 'L', chest: '90–93', waist: '72–75', hips: '98–101' },
  { ru: 48, int: 'XL', chest: '94–98', waist: '76–80', hips: '102–106' },
  { ru: 50, int: 'XXL', chest: '99–103', waist: '81–85', hips: '107–111' },
];

const TIPS = [
  ['Грудь', 'По самым выступающим точкам, лента горизонтально.'],
  ['Талия', 'По самому узкому месту, не затягивая ленту.'],
  ['Бёдра', 'По самым выступающим точкам ягодиц.'],
];

let activeSize = null;

function content() {
  const rows = ROWS.map(
    (row) => `
      <tr class="size-chart__row${row.ru === activeSize ? ' is-active' : ''}">
        <th class="size-chart__cell size-chart__cell--ru" scope="row">${row.ru}</th>
        <td class="size-chart__cell">${row.int}</td>
        <td class="size-chart__cell">${row.chest}</td>
        <td class="size-chart__cell">${row.waist}</td>
        <td class="size-chart__cell">${row.hips}</td>
      </tr>`,
  ).join('');

  const tips = TIPS.map(
    ([term, text]) => `
      <li class="size-chart__tip">
        <span class="size-chart__tip-term">${term}</span>
        <span class="size-chart__tip-text">${text}</span>
      </li>`,
  ).join('');

  return `
    <button class="modal__close" type="button" data-modal-close aria-label="Закрыть">
      <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
    </button>
    <h2 class="modal__title">Таблица размеров</h2>
    <p class="modal__text">Все значения указаны в сантиметрах. Если параметры между размерами — выбирайте больший.</p>
    <div class="size-chart">
    <div class="size-chart__scroll">
      <table class="size-chart__table">
        <thead>
          <tr>
            <th class="size-chart__head" scope="col">Размер</th>
            <th class="size-chart__head" scope="col">INT</th>
            <th class="size-chart__head" scope="col">Грудь</th>
            <th class="size-chart__head" scope="col">Талия</th>
            <th class="size-chart__head" scope="col">Бёдра</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="size-chart__guide">
      <h3 class="size-chart__guide-title">Как снять мерки</h3>
      <ul class="size-chart__tips">${tips}</ul>
    </div>
    </div>`;
}

const modal = createCenteredModal({
  label: 'Таблица размеров',
  layer: LAYERS.sizeChart,
  modifier: 'modal--wide',
  content,
});

export const initSizeChart = modal.init;

export function openSizeChart(size = null) {
  activeSize = size;
  modal.open();
}
