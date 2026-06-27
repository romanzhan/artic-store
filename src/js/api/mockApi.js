const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const FAVORITES_KEY = 'artic:favorites';

function readFavorites() {
  try {
    const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUP_IDS = ['clothes', 'shoes', 'bags', 'accessories'];
const GROUP_PLURAL = { clothes: false, shoes: false, bags: true, accessories: true };
const GENDER_LABELS = { women: 'Женское', men: 'Мужское' };
const GENDER_ADJECTIVES = {
  women: { singular: 'Женская', plural: 'Женские', catalog: 'Женский' },
  men: { singular: 'Мужская', plural: 'Мужские', catalog: 'Мужской' },
};

function catalogPath({ gender, group, category, sale } = {}) {
  if (sale) return '/catalog/sale';
  const segments = ['catalog'];
  if (gender) {
    segments.push(gender);
    if (group) {
      segments.push(group);
      if (category) segments.push(category);
    }
  }
  return `/${segments.join('/')}`;
}

const sub = (slug, label, noun, empty = false) => ({ slug, label, noun, empty });

const TREE = {
  women: {
    label: 'Женское',
    groups: {
      clothes: {
        label: 'Одежда',
        subs: [
          sub('outerwear', 'Верхняя одежда', 'Куртка'),
          sub('jackets', 'Куртки', 'Куртка'),
          sub('puffers', 'Пуховики', 'Пуховик'),
          sub('dresses', 'Платья', 'Платье', true),
          sub('knitwear', 'Джемперы и водолазки', 'Джемпер', true),
        ],
      },
      shoes: {
        label: 'Обувь',
        subs: [
          sub('sneakers', 'Кроссовки и кеды', 'Кроссовки'),
          sub('boots', 'Ботинки', 'Ботинки'),
          sub('flats', 'Балетки', 'Балетки', true),
          sub('loafers', 'Лоферы', 'Лоферы', true),
        ],
      },
      bags: {
        label: 'Сумки',
        subs: [sub('bags', 'Сумки', 'Сумка', true), sub('backpacks', 'Рюкзаки', 'Рюкзак', true), sub('suitcases', 'Чемоданы', 'Чемодан', true)],
      },
      accessories: {
        label: 'Аксессуары',
        subs: [sub('hats', 'Головные уборы', 'Шапка', true), sub('gloves', 'Перчатки', 'Перчатки', true), sub('scarves', 'Шарфы', 'Шарф', true)],
      },
    },
  },
  men: {
    label: 'Мужское',
    groups: {
      clothes: {
        label: 'Одежда',
        subs: [
          sub('outerwear', 'Верхняя одежда', 'Куртка'),
          sub('jackets', 'Куртки', 'Куртка'),
          sub('parkas', 'Парки', 'Парка'),
          sub('knitwear', 'Джемперы и водолазки', 'Джемпер', true),
          sub('shirts', 'Рубашки', 'Рубашка', true),
        ],
      },
      shoes: {
        label: 'Обувь',
        subs: [
          sub('sneakers', 'Кроссовки и кеды', 'Кроссовки'),
          sub('boots', 'Ботинки', 'Ботинки'),
          sub('sandals', 'Сандалии', 'Сандалии', true),
        ],
      },
      bags: {
        label: 'Сумки',
        subs: [sub('bags', 'Сумки', 'Сумка', true), sub('backpacks', 'Рюкзаки', 'Рюкзак', true), sub('suitcases', 'Чемоданы', 'Чемодан', true)],
      },
      accessories: {
        label: 'Аксессуары',
        subs: [sub('hats', 'Головные уборы', 'Шапка', true), sub('gloves', 'Перчатки', 'Перчатки', true), sub('scarves', 'Шарфы', 'Шарф', true)],
      },
    },
  },
};

const PRODUCT_IMAGES = {
  women: {
    clothes: ['jacket-women-1', 'jacket-women-2', 'jacket-women-sport', 'jacket-men-winter'],
    shoes: ['sneakers-1', 'sneakers-2', 'sneakers-3', 'sneakers-men'],
  },
  men: {
    clothes: ['jacket-men-winter', 'jacket-women-sport', 'jacket-women-1', 'jacket-women-2'],
    shoes: ['sneakers-men', 'sneakers-3', 'sneakers-1', 'sneakers-2'],
  },
};

const BRANDS_POOL = ['Premiata', 'PJS', 'Boss', 'Parajumpers', 'Fabi', 'Moncler', 'Herno', 'Woolrich'];
const LOGO_BRANDS = new Set(['Premiata', 'PJS']);
const MEGA_BRANDS = [
  'Premiata', 'PJS', 'Boss', 'Parajumpers', 'Fabi',
  'Moncler', 'Herno', 'Woolrich', 'Stone Island', 'Hugo Boss',
  'Iceberg', 'Kiton', 'Canali', 'Zegna', 'Santoni',
];
const MODELS = [
  'Stellar', 'Conny', 'Trail', 'Lander', 'Aspen', 'Gobi', 'Arctic', 'Urban', 'Vela',
  'Nord', 'Frost', 'Ridge', 'Apex', 'Luna', 'Solis', 'Dune', 'Cliff', 'Aero',
];
const COLORS = ['Белый', 'Бежевый', 'Голубой', 'Синий', 'Чёрный', 'Серый', 'Зелёный', 'Коричневый'];
const SIZE_POOL = { shoes: [39, 40, 41, 42, 43, 44, 45, 46], clothes: [42, 44, 46, 48, 50, 52] };
const MATERIALS = ['текстиль', 'натуральная кожа', 'замша', 'нубук', 'комбинированный'];
const GENDER_NOUN = { women: 'женский', men: 'мужской' };

function buildProducts() {
  const rng = mulberry32(20260623);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const list = [];
  let id = 1;

  for (const gender of ['women', 'men']) {
    for (const group of ['clothes', 'shoes']) {
      const imgs = PRODUCT_IMAGES[gender][group];
      const sizePool = SIZE_POOL[group];
      for (const s of TREE[gender].groups[group].subs) {
        if (s.empty) continue;
        const count = 5 + Math.floor(rng() * 16);
        for (let k = 0; k < count; k += 1) {
          const brand = pick(BRANDS_POOL);
          const base = Math.round((20000 + rng() * 80000) / 1000) * 1000;
          const sale = rng() < 0.3;
          const oldPrice = sale ? base : null;
          const price = sale ? Math.round((base * 0.6) / 100) * 100 : base;
          let label = null;
          if (!sale && rng() < 0.25) label = rng() < 0.5 ? 'trend' : 'new';
          const sizes = sizePool.filter(() => rng() < 0.55);
          if (!sizes.length) sizes.push(pick(sizePool));
          list.push({
            id,
            brand,
            brandMode: LOGO_BRANDS.has(brand) ? 'logo' : 'text',
            title: `${s.noun} ${pick(MODELS)}`,
            image: imgs[k % imgs.length],
            price,
            oldPrice,
            label,
            gender,
            group,
            category: s.slug,
            color: pick(COLORS),
            sizes: sizes.sort((a, b) => a - b),
            popularity: Math.floor(rng() * 1000),
          });
          id += 1;
        }
      }
    }
  }
  return list;
}

const PRODUCTS = buildProducts();

function findSub(gender, slug) {
  const tree = TREE[gender];
  for (const groupId of GROUP_IDS) {
    const found = tree.groups[groupId].subs.find((s) => s.slug === slug);
    if (found) return { group: groupId, sub: found };
  }
  return null;
}

function buildTree(activeGender, activeGroup, activeCategory) {
  return ['women', 'men'].map((gid) => ({
    id: gid,
    label: GENDER_LABELS[gid],
    href: catalogPath({ gender: gid }),
    active: gid === activeGender,
    groups: GROUP_IDS.map((grpId) => {
      const grp = TREE[gid].groups[grpId];
      return {
        id: grpId,
        label: grp.label,
        href: catalogPath({ gender: gid, group: grpId }),
        active: gid === activeGender && grpId === activeGroup,
        subs: grp.subs.map((s) => ({
          slug: s.slug,
          label: s.label,
          href: catalogPath({ gender: gid, group: grpId, category: s.slug }),
          active: gid === activeGender && grpId === activeGroup && s.slug === activeCategory,
        })),
      };
    }),
  }));
}

const brandHref = (gender, brand) => `${catalogPath({ gender })}?brand=${encodeURIComponent(brand)}`;
const allLabelFor = (group) => `${GROUP_PLURAL[group] ? 'Все' : 'Вся'} ${TREE.women.groups[group].label.toLowerCase()}`;

function brandColumns(gender) {
  const chunks = [MEGA_BRANDS.slice(0, 5), MEGA_BRANDS.slice(5, 10), MEGA_BRANDS.slice(10, 15)];
  return chunks.map((chunk) => chunk.map((b) => ({ label: b, href: brandHref(gender, b) })));
}

function buildGenderMenu(gender) {
  const tree = TREE[gender];
  const groupTabs = GROUP_IDS.map((id) => ({
    id,
    label: tree.groups[id].label,
    type: 'category',
    allLabel: allLabelFor(id),
    allHref: catalogPath({ gender, group: id }),
    word: tree.groups[id].label.toUpperCase(),
    image: `${gender}-${id}`,
    items: tree.groups[id].subs.map((s) => ({ label: s.label, href: catalogPath({ gender, group: id, category: s.slug }) })),
    brands: MEGA_BRANDS.slice(0, 5).map((b) => ({ label: b, href: brandHref(gender, b) })),
  }));

  return {
    id: gender,
    label: GENDER_LABELS[gender],
    mobileTab: true,
    tabs: [
      {
        id: 'new',
        label: 'Новинки',
        type: 'category',
        allLabel: 'Все новинки',
        allHref: catalogPath({ gender }),
        word: 'НОВИНКИ',
        image: null,
        items: GROUP_IDS.map((id) => ({ label: tree.groups[id].label, href: catalogPath({ gender, group: id }) })),
        brands: MEGA_BRANDS.slice(0, 5).map((b) => ({ label: b, href: brandHref(gender, b) })),
      },
      { id: 'brands', label: 'Бренды', type: 'brands', allLabel: 'Все бренды', allHref: catalogPath({ gender }), columns: brandColumns(gender) },
      ...groupTabs,
    ],
  };
}

const MENU = {
  categories: [
    buildGenderMenu('women'),
    buildGenderMenu('men'),
    {
      id: 'sale',
      label: 'Акции',
      mobileTab: true,
      tabs: [
        {
          id: 'all',
          label: 'Все акции',
          type: 'category',
          allLabel: 'Все акции',
          allHref: catalogPath({ sale: true }),
          word: 'АКЦИИ',
          image: null,
          items: GROUP_IDS.map((id) => ({ label: TREE.women.groups[id].label, href: `${catalogPath({ sale: true })}?group=${id}` })),
          brands: MEGA_BRANDS.slice(0, 5).map((b) => ({ label: b, href: `${catalogPath({ sale: true })}?brand=${encodeURIComponent(b)}` })),
        },
      ],
    },
    {
      id: 'gift',
      label: 'Подарочные карты',
      mobileTab: false,
      tabs: [
        {
          id: 'all',
          label: 'Все карты',
          type: 'category',
          allLabel: 'Все карты',
          allHref: '#',
          word: 'ПОДАРОЧНЫЕ КАРТЫ',
          image: null,
          items: [
            { label: 'Номинал 1000 ₽', href: '#' },
            { label: 'Номинал 3000 ₽', href: '#' },
            { label: 'Номинал 5000 ₽', href: '#' },
          ],
          brands: [],
        },
      ],
    },
  ],

  mobileChips: [
    { id: 'women', label: 'Женское' },
    { id: 'men', label: 'Мужское' },
    { label: 'Акции', href: catalogPath({ sale: true }) },
  ],

  pages: [
    { label: 'Подарочные сертификаты', href: '#' },
    { label: 'Контакты', href: '#' },
    { label: 'Доставка и возврат', href: '#' },
    { label: 'Оплата', href: '#' },
  ],
};

const SLIDES = [
  {
    id: 1,
    title: 'Верхняя одежда',
    subtitle: 'Со скидкой по промокоду <strong>ARTIC15</strong>',
    button: { text: 'К покупкам', href: `${catalogPath({ sale: true })}` },
    tag: 'Акция',
    bg: 'bg-1',
    image: 'slide-1',
  },
  {
    id: 2,
    title: 'Большой ассортимент',
    subtitle: 'Курток Parajumpers в нашем магазине',
    button: { text: 'Подобрать', href: `${catalogPath({ gender: 'women', group: 'clothes' })}?brand=Parajumpers` },
    tag: 'Качество на высоте',
    bg: 'bg-2',
    image: 'slide-2',
  },
  {
    id: 3,
    title: 'Обувь премиум',
    subtitle: 'Выбери лучшие кроссовки Premiata',
    button: { text: 'Подобрать', href: `${catalogPath({ gender: 'women', group: 'shoes' })}?brand=Premiata` },
    tag: 'Комфорт и движение',
    bg: 'bg-3',
    image: 'slide-3',
  },
  {
    id: 4,
    title: 'Комфорт и стиль',
    subtitle: 'Премиальные материалы и идеальная посадка',
    button: { text: 'Выбрать', href: catalogPath({ gender: 'women', group: 'shoes' }) },
    tag: 'Совершенство в деталях',
    bg: 'bg-4',
    image: 'slide-4',
  },
  {
    id: 5,
    title: 'Памятка по уходу',
    subtitle: 'Чтобы вещи радовали долгое время, мы подготовили для Вас чеклист',
    button: { text: 'К покупкам', href: catalogPath() },
    tag: 'Забота и уход',
    bg: 'bg-5',
    image: 'slide-5',
  },
];

const PROMO = {
  title: 'Порадуй себя',
  subtitle: 'Одежда, обувь и аксессуары, которые будут радовать тебя долго',
  button: { text: 'Подобрать', href: catalogPath() },
  tiles: [
    { label: 'Кроссовки', image: 'sneakers', href: catalogPath({ gender: 'women', group: 'shoes', category: 'sneakers' }) },
    { label: 'Мужская одежда', image: 'men', href: catalogPath({ gender: 'men', group: 'clothes' }) },
    { label: 'Женская одежда', image: 'women', href: catalogPath({ gender: 'women', group: 'clothes' }) },
    { label: 'Аксессуары', image: 'accessories', href: catalogPath({ gender: 'women', group: 'accessories' }) },
  ],
};

const BLOG = [
  { title: 'Модные цветовые решения в одежде', image: 'article-1', href: '#' },
  { title: 'С чем сочетать кроссовки в этом сезоне', image: 'article-2', href: '#' },
];

const suggestion = (label, sub, gender, group, category) => ({
  label,
  sub,
  gender,
  category,
  href: catalogPath({ gender, group, category }),
});

const SEARCH_SUGGESTIONS = [
  suggestion('Кроссовки', 'Женская обувь', 'women', 'shoes', 'sneakers'),
  suggestion('Кроссовки', 'Мужская обувь', 'men', 'shoes', 'sneakers'),
  suggestion('Ботинки', 'Женская обувь', 'women', 'shoes', 'boots'),
  suggestion('Куртки', 'Женская одежда', 'women', 'clothes', 'jackets'),
  suggestion('Куртки', 'Мужская одежда', 'men', 'clothes', 'jackets'),
  suggestion('Пуховики', 'Женская одежда', 'women', 'clothes', 'puffers'),
  suggestion('Парки', 'Мужская одежда', 'men', 'clothes', 'parkas'),
];

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value == null || value === '') return [];
  return String(value).split(',').filter(Boolean);
};

const SORTS = ['popular', 'price-asc', 'price-desc'];
const PAGE_SIZE = 12;

export const mockApi = {
  async getProducts(options = {}) {
    await delay();
    let list = PRODUCTS;
    if (options.sale) list = list.filter((p) => p.oldPrice);
    if (options.gender) list = list.filter((p) => p.gender === options.gender);
    if (options.group) list = list.filter((p) => p.group === options.group);
    if (options.category) list = list.filter((p) => p.category === options.category);
    if (options.limit) list = list.slice(0, options.limit);
    return structuredClone(list);
  },

  async getCatalog(params = {}) {
    await delay();
    const sale = Boolean(params.sale);
    const brandLink = params.brand || null;
    const gender = TREE[params.gender] ? params.gender : null;

    let group = GROUP_IDS.includes(params.group) ? params.group : null;
    let category = gender && group ? params.category || null : null;
    if (category) {
      const resolved = findSub(gender, category);
      if (resolved) group = resolved.group;
      else category = null;
    }

    const base = PRODUCTS.filter((p) => {
      if (sale && !p.oldPrice) return false;
      if (gender && p.gender !== gender) return false;
      if (brandLink && p.brand !== brandLink) return false;
      if (category) return p.category === category;
      if (group) return p.group === group;
      return true;
    });

    const allBrands = [...new Set(base.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'ru'));
    const allSizes = [...new Set(base.flatMap((p) => p.sizes))].sort((a, b) => a - b);
    const allColors = [...new Set(base.map((p) => p.color))].sort((a, b) => a.localeCompare(b, 'ru'));
    const prices = base.map((p) => p.price);
    const priceMin = prices.length ? Math.min(...prices) : 0;
    const priceMax = prices.length ? Math.max(...prices) : 0;

    const selBrands = toArray(params.brands);
    const selSizes = toArray(params.sizes).map(Number);
    const selColors = toArray(params.colors);
    const fMin = params.priceMin != null && params.priceMin !== '' ? Number(params.priceMin) : null;
    const fMax = params.priceMax != null && params.priceMax !== '' ? Number(params.priceMax) : null;
    const sort = SORTS.includes(params.sort) ? params.sort : 'popular';

    let filtered = base.filter((p) => {
      if (selBrands.length && !selBrands.includes(p.brand)) return false;
      if (selSizes.length && !p.sizes.some((s) => selSizes.includes(s))) return false;
      if (selColors.length && !selColors.includes(p.color)) return false;
      if (fMin != null && p.price < fMin) return false;
      if (fMax != null && p.price > fMax) return false;
      return true;
    });

    if (sort === 'price-asc') filtered = filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered = filtered.sort((a, b) => b.price - a.price);
    else filtered = filtered.sort((a, b) => b.popularity - a.popularity);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
    const products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const adj = gender ? GENDER_ADJECTIVES[gender] : null;
    const groupLabel = gender && group ? TREE[gender].groups[group].label : null;
    const subLabel = gender && category ? findSub(gender, category).sub.label : null;

    let title = 'Каталог';
    if (gender && !group) title = `${adj.catalog} каталог`;
    if (gender && group) title = `${GROUP_PLURAL[group] ? adj.plural : adj.singular} ${groupLabel.toLowerCase()}`;
    if (category) title = subLabel;
    if (sale) title = 'Скидки';
    if (brandLink) title = brandLink;

    const breadcrumbs = [{ label: 'Главная', href: '/' }];
    if (sale) {
      breadcrumbs.push({ label: 'Скидки', href: catalogPath({ sale: true }) });
      if (brandLink) breadcrumbs.push({ label: brandLink });
    } else {
      breadcrumbs.push({ label: 'Каталог', href: catalogPath() });
      if (gender) {
        breadcrumbs.push({ label: GENDER_LABELS[gender], href: catalogPath({ gender }) });
        if (brandLink) breadcrumbs.push({ label: brandLink });
        else {
          if (group) breadcrumbs.push({ label: groupLabel, href: catalogPath({ gender, group }) });
          if (category) breadcrumbs.push({ label: subLabel, href: catalogPath({ gender, group, category }) });
        }
      } else if (brandLink) {
        breadcrumbs.push({ label: brandLink });
      }
    }

    return structuredClone({
      gender,
      group: group || null,
      category,
      sale,
      brand: brandLink,
      title,
      breadcrumbs,
      tree: buildTree(gender, group, category),
      products,
      total,
      page,
      totalPages,
      pageSize: PAGE_SIZE,
      filters: {
        brands: allBrands,
        sizes: allSizes,
        colors: allColors,
        price: { min: priceMin, max: priceMax },
        applied: { brands: selBrands, sizes: selSizes, colors: selColors, priceMin: fMin, priceMax: fMax, sort },
      },
    });
  },

  getFavoriteIds() {
    return readFavorites();
  },

  addFavorite(id) {
    const ids = readFavorites();
    if (!ids.includes(id)) ids.push(id);
    writeFavorites(ids);
    return ids;
  },

  removeFavorite(id) {
    const ids = readFavorites().filter((item) => item !== id);
    writeFavorites(ids);
    return ids;
  },

  async getFavorites() {
    await delay();
    const ids = new Set(readFavorites());
    return structuredClone(PRODUCTS.filter((product) => ids.has(product.id)));
  },

  async getProductById(id) {
    await delay();
    const product = PRODUCTS.find((item) => item.id === id);
    return product ? structuredClone(product) : null;
  },

  async getProduct(id) {
    await delay();
    const product = PRODUCTS.find((item) => item.id === Number(id));
    if (!product) return null;

    const material = MATERIALS[product.id % MATERIALS.length];
    const article = 2580000 + product.id * 7;
    const gallery = PRODUCT_IMAGES[product.gender]?.[product.group] || [product.image];

    const variants = [{ id: product.id, image: product.image, color: product.color }];
    const seenColors = new Set([product.color]);
    for (const p of PRODUCTS) {
      if (variants.length >= 4) break;
      if (p.gender === product.gender && p.category === product.category && !seenColors.has(p.color)) {
        seenColors.add(p.color);
        variants.push({ id: p.id, image: p.image, color: p.color });
      }
    }

    const groupInfo = TREE[product.gender].groups[product.group];
    const subLabel = groupInfo.subs.find((s) => s.slug === product.category)?.label || groupInfo.label;

    const related = PRODUCTS.filter(
      (p) => p.id !== product.id && p.gender === product.gender && p.group === product.group,
    ).slice(0, 12);

    return structuredClone({
      ...product,
      material,
      article,
      gallery,
      variants,
      related,
      description: `${product.title} от ${product.brand} выполнены из материала «${material}» с продуманной посадкой. Качественные материалы, аккуратные швы и фирменный дизайн обеспечивают комфорт и аккуратный вид на каждый день.`,
      delivery: [
        'Доставка по г. Красноярску бесплатно от 20 000 ₽.',
        'До 20 000 ₽ по тарифам:',
        'Вы можете вернуть неподошедший товар в течение 7 дней с даты получения. Действует ограничение на возврат средств личной гигиены, нижнего белья, чулок, носков, парфюмерии, косметики, а также ювелирных и технически сложных изделий.',
      ],
      specs: [
        { label: 'Артикул', value: String(article) },
        { label: 'Пол', value: GENDER_NOUN[product.gender] },
        { label: 'Материал верха', value: material },
        { label: 'Основной цвет', value: product.color.toLowerCase() },
      ],
      breadcrumbs: [
        { label: 'Главная', href: '/' },
        { label: GENDER_LABELS[product.gender], href: catalogPath({ gender: product.gender }) },
        { label: groupInfo.label, href: catalogPath({ gender: product.gender, group: product.group }) },
        { label: subLabel, href: catalogPath({ gender: product.gender, group: product.group, category: product.category }) },
      ],
    });
  },

  async getSlides() {
    await delay();
    return structuredClone(SLIDES);
  },

  async getPromo() {
    await delay();
    return structuredClone(PROMO);
  },

  async getBlog() {
    await delay();
    return structuredClone(BLOG);
  },

  async getMenu() {
    await delay();
    return structuredClone(MENU);
  },

  async search(query) {
    await delay(150);
    const q = query.trim().toLowerCase();
    if (!q) return { suggestions: [], products: [] };
    const suggestions = SEARCH_SUGGESTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q),
    );
    const products = PRODUCTS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
    return { suggestions: structuredClone(suggestions), products: structuredClone(products) };
  },
};

export default mockApi;
