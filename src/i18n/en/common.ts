import type { CommonDict } from '../vi/common'

export const common: CommonDict = {
  langName: 'English',
  otherLang: { short: 'VI', name: 'Tiếng Việt', label: 'Xem trang bằng tiếng Việt' },
  skip: 'Skip to content',
  newTab: '(opens in a new tab)',
  nav: {
    label: 'Main',
    home: "Kai's Bakery, home",
    design: 'Design a cake',
    menu: 'Menu',
    about: 'About',
    cart: 'Cart',
    all: 'All pages',
    cartCount: (n: number) => `${n} ${n === 1 ? 'cake' : 'cakes'} in the cart`,
  },
  palette: {
    label: 'Shop colours',
    current: (name: string) => `Shop colours, now ${name}`,
    hint: 'Pick the look you love; the shop remembers it next visit.',
    nudge: 'This dot recolours the whole shop. Try it!',
    sets: {
      g1: { name: 'Matcha Strawberry', note: 'Matcha latte with strawberries, cuteness overload' },
      b: { name: 'Butter Mint', note: 'Butter cream and mint, Saturday-morning chill' },
      g2: { name: 'Pandan Coconut', note: 'Fresh pandan green, bright all day long' },
      g3: { name: 'Forest Cream', note: 'Deep forest green and rich cream, classy but cute' },
    },
  },
  notice: {
    badge: 'Not a real shop',
    text: "Kai's Bakery is a web project by Kai, and the shop isn't real. Cakes, prices and orders are all for show: no order is sent anywhere and nobody gets charged.",
    short: "This shop isn't real, it's one of Kai's web projects.",
    more: 'Read more',
  },
  footer: {
    label: 'Footer',
    blurb:
      'Handmade cakes, less sweet, with cream-cheese whipped cream. Design yours in 3D right here and see the price instantly, no back-and-forth DMs.',
    explore: 'Explore',
    help: 'Good to know',
    contact: 'Text Kai',
    links: {
      design: 'Design a cake',
      menu: 'Cake menu',
      story: 'How a cake is made',
      about: 'About the shop',
      policies: 'Policies',
      faq: 'FAQ',
    },
    hours: 'Open 6:30–22:45, every single day',
    delivery: 'Delivery 8:00–21:30 across the old inner districts of Ho Chi Minh City',
    hotline: 'Hotline & Zalo',
    contactNote: "The shop isn't open for real, but Kai still reads every message.",
    madeBy: 'Website by Kai',
    source: 'Source code on GitHub',
    credits:
      'Fonts: Baloo 2, Be Vietnam Pro, Pacifico (SIL OFL). 3D lighting: “Comfy Café” by Sergej Majboroda, Poly Haven (CC0).',
    rights: (year: number) => `© ${year} Kai's Bakery · a showcase project, not a real shop`,
  },
  allergens: {
    egg: 'egg',
    milk: 'milk',
    gluten: 'wheat (gluten)',
    soy: 'soy',
    nuts: 'tree nuts',
  },
  contains: 'Contains',
  allergyNote:
    "Our kitchen shares tools with nuts, so we can't promise zero traces of allergens. If your allergy is serious, text Kai before you order.",
  units: {
    serves: ([from, to]: readonly [number, number]) => `serves ${from}–${to}`,
    cm: (cm: readonly number[]) => `${cm.join(' + ')} cm`,
  },
  free: 'Free',
  illustration: '3D illustration',
  notFound: {
    title: 'Oops, this page went poof',
    body: 'The link might have a typo, or the page moved somewhere else. Head back to the shop and grab some cake instead.',
    home: 'Back to home',
    menu: 'See the menu',
  },
  meta: {
    siteTitle: "Kai's Bakery – Handmade Cakes",
    titleTemplate: "%s · Kai's Bakery",
    description:
      "Handmade, less-sweet cakes with cream-cheese whipped cream from the Thủ Đức area. Design your cake in 3D, see the price instantly, pick it up or get it delivered across Ho Chi Minh City. A showcase project; the shop isn't real.",
    ogImageAlt: "Kai's Bakery – Handmade Cakes: a pink strawberry cake in 3D, resting on a cloud",
    ogDescription:
      'Design a cake in real-time 3D, slice it to see every layer, then watch it boxed up. A web project by Kai.',
  },
}
