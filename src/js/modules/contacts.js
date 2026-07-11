import mockApi from '../api/mockApi.js';
import IMask from 'imask';
import { createAssetResolver } from '../utils/assets.js';
import { loadYandexMaps } from '../utils/yandexMap.js';

const branchPhoto = createAssetResolver(
  import.meta.glob('../../assets/images/branches/*.webp', { eager: true, query: '?url', import: 'default' }),
);

const PIN_ACTIVE =
  '<svg width="40" height="51" viewBox="0 0 40 51" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.6225 19.4551C39.6225 21.7489 38.9671 23.8607 38.0932 25.9361C36.7461 29.2495 34.9255 32.3079 32.9594 35.2572C29.8645 39.9177 26.3691 44.3234 22.6917 48.5834C20.9804 50.5495 18.6137 50.5495 16.9024 48.5834C12.2055 43.0854 7.727 37.4054 4.08597 31.1064C2.52032 28.412 1.17314 25.6813 0.408522 22.6228C-0.319685 19.6735 -0.0284014 16.7607 0.918268 13.9207C3.5034 6.27454 8.81931 1.61401 16.7932 0.266832C27.4978 -1.51728 37.5107 5.83762 39.2948 16.5787C39.4404 17.5253 39.5132 18.472 39.5861 19.4187L39.6225 19.4551ZM12.2783 19.4187C12.2783 23.5695 15.628 26.9556 19.8152 26.992C23.9296 26.992 27.3522 23.6423 27.3522 19.4915C27.3522 15.3043 23.966 11.8817 19.8152 11.9181C15.6645 11.9181 12.3147 15.3043 12.3147 19.4187H12.2783Z" fill="#E75F00"/></svg>';

const PIN_INACTIVE =
  '<svg width="42" height="53" viewBox="0 0 42 53" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6523 0.771484C28.4012 -1.01999 38.4775 6.22198 40.5283 16.916L40.6201 17.4277C40.7685 18.3944 40.8427 19.364 40.9189 20.3555L40.9336 20.54L40.9521 20.5586C40.9149 22.7851 40.272 24.8606 39.3955 26.9424L39.3926 26.9482C38.0012 30.3701 36.1171 33.5382 34.0684 36.6113V36.6123C30.8459 41.4649 27.2028 46.0562 23.3643 50.5029C22.5448 51.4444 21.6081 51.874 20.7129 51.874C19.8177 51.8739 18.8809 51.4443 18.0615 50.5029C13.1554 44.7599 8.49395 38.8455 4.70801 32.2959L4.70703 32.2949L4.10938 31.2432C2.74337 28.7857 1.59776 26.2918 0.912109 23.5498H0.913086C0.178443 20.5745 0.468298 17.6244 1.43555 14.7227L1.43457 14.7217C4.08239 6.89302 9.49822 2.15036 17.6533 0.772461L17.6523 0.771484ZM20.7275 11.9697C16.2784 11.9722 12.6608 15.4685 12.4014 19.8174H12.3467V20.3174C12.3467 24.9355 16.0733 28.7006 20.7275 28.7412H20.7324C25.3085 28.7411 29.1181 25.0171 29.1182 20.3936C29.1182 15.7436 25.3583 11.9317 20.7324 11.9697H20.7275Z" fill="#0A1929" fill-opacity="0.7" stroke="#0A1929"/></svg>';

const pinUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const pinOptions = (active) => ({
  iconImageHref: pinUri(active ? PIN_ACTIVE : PIN_INACTIVE),
  iconImageSize: active ? [40, 51] : [42, 53],
  iconImageOffset: active ? [-20, -51] : [-21, -53],
  zIndex: active ? 10 : 1,
});

let root = null;
let branches = [];
let activeBranch = 0;
let placemarks = [];
let mapApi = null;

const branchCard = (b, i) => `
  <button class="branch-card${i === activeBranch ? ' is-active' : ''}" type="button" data-branch="${i}">
    <span class="branch-card__info">
      <span class="branch-card__name">${b.name}</span>
      <span class="branch-card__addr">${b.address}<br />${b.hours}</span>
    </span>
    <span class="branch-card__media"><img src="${branchPhoto(b.image)}" alt="${b.name}" loading="lazy" /></span>
  </button>`;

function setActive(index) {
  if (index === activeBranch) return;
  activeBranch = index;
  root.querySelectorAll('[data-branch]').forEach((el) => el.classList.toggle('is-active', Number(el.dataset.branch) === index));
  placemarks.forEach((placemark, i) => placemark.options.set(pinOptions(i === index)));
  if (mapApi && branches[index]?.coords) mapApi.panTo(branches[index].coords, { flying: true });
}

async function initMap() {
  const el = root.querySelector('[data-contacts-map]');
  if (!el || !branches.length) return;
  try {
    const ymaps = await loadYandexMaps();
    mapApi = new ymaps.Map(
      el,
      { center: branches[activeBranch].coords, zoom: 12, controls: ['zoomControl'] },
      { suppressMapOpenBlock: true },
    );
    placemarks = branches.map((b, i) => {
      const placemark = new ymaps.Placemark(b.coords, { hintContent: b.name }, { iconLayout: 'default#image', ...pinOptions(i === activeBranch) });
      placemark.events.add('click', () => setActive(i));
      mapApi.geoObjects.add(placemark);
      return placemark;
    });
  } catch {
    el.classList.add('contacts__map--fallback');
    el.innerHTML = '<p class="contacts__map-note">Карта станет доступна после подключения ключа Яндекс.Карт.</p>';
  }
}

function setFieldError(input, message) {
  const field = input.closest('.contacts__field');
  field?.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  const error = field?.querySelector('[data-error]');
  if (error) error.textContent = message;
}

function initForm() {
  const form = root.querySelector('[data-contact-form]');
  if (!form) return;
  const note = form.querySelector('[data-contact-note]');
  const phone = form.querySelector('[data-name="phone"]');
  const phoneMask = phone ? IMask(phone, { mask: '+{7} (000) 000-00-00' }) : null;

  const setNote = (message) => {
    if (!note) return;
    note.textContent = message;
    note.classList.toggle('is-visible', Boolean(message));
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setNote('');
    let valid = true;
    form.querySelectorAll('[data-required]').forEach((input) => {
      let message = '';
      if (!input.value.trim()) message = 'Заполните поле';
      else if (input === phone && phoneMask && !phoneMask.masked.isComplete) message = 'Введите номер целиком';
      setFieldError(input, message);
      if (message) valid = false;
    });
    if (!valid) return;

    mockApi.sendContact({
      name: form.querySelector('[data-name="name"]').value.trim(),
      phone: form.querySelector('[data-name="phone"]').value.trim(),
      message: form.querySelector('[data-name="message"]').value.trim(),
    });
    form.reset();
    if (phoneMask) phoneMask.value = '';
    setNote('Спасибо! Мы свяжемся с Вами в ближайшее время.');
  });

  form.addEventListener('input', (event) => {
    if (event.target.value.trim()) setFieldError(event.target, '');
    setNote('');
  });
}

export function initContacts() {
  root = document.querySelector('[data-contacts]');
  if (!root) return;

  branches = mockApi.getBranches();
  const list = root.querySelector('[data-contacts-branches]');
  if (list) {
    list.innerHTML = branches.map(branchCard).join('');
    list.addEventListener('click', (event) => {
      const card = event.target.closest('[data-branch]');
      if (card) setActive(Number(card.dataset.branch));
    });
  }

  initForm();
  initMap();
}
