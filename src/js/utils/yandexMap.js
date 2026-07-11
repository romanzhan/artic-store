let promise = null;

export function loadYandexMaps() {
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_YANDEX_MAPS_KEY;
    if (!key) {
      reject(new Error('VITE_YANDEX_MAPS_KEY is not set'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=ru_RU`;
    script.async = true;
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    script.onerror = () => reject(new Error('Yandex Maps failed to load'));
    document.head.appendChild(script);
  });

  promise.catch(() => {
    promise = null;
  });

  return promise;
}
