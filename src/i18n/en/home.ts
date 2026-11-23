import type { HomeDict } from '../vi/home'

export const home: HomeDict = {
  meta: {
    title: "Kai's Bakery – Handmade Cakes",
    description:
      "Handmade, less-sweet cakes with cream-cheese whipped cream from the Thủ Đức area. Design your cake in 3D, see the price instantly, pick it up or get it delivered across Ho Chi Minh City. A showcase project; the shop isn't real.",
  },
  intro: {
    welcome: 'Welcome to',
    tagline: 'Handmade, less-sweet cakes, built in 3D right in your browser.',
    loading: 'Baking the 3D scene',
    ready: 'The 3D scene is fresh out of the oven',
    start: 'Come on in',
  },
  stage: {
    script: "Kai's",
    word: 'Bakery',
    subtitle: 'Handmade Cakes',
    baking: 'Cake almost out of the oven',
  },
  story: {
    label: 'The story of a cake',
    introLine: 'Handmade cakes, built in 3D.',
    introHint: 'Scroll down to see every layer.',
    introLabel: 'Introduction',
    scrollDown: 'Scroll to the first chapter',
    indexLabel: 'Chapters',
    introNav: 'Intro',
    chapters: {
      sponge: {
        nav: 'The sponge',
        eyebrow: '01 · The sponge',
        lead: 'Our sponge is baked every morning and cut into ',
        accent: 'three thin layers',
        tail: ', so every bite gets its fair share of cream.',
        note: 'The slice is its own wedge that fits the cake exactly. Its cut face is painted live on a canvas from the flavors you pick.',
      },
      filling: {
        nav: 'The filling',
        eyebrow: '02 · The filling',
        lead: 'Between the layers: hand-cooked strawberry jam and real chocolate ganache. ',
        accent: 'Nothing squeezed from a tube.',
        tail: '',
        note: 'Crumbs, filling and frosting are drawn for each cake, then reused as a bump map so the cut catches the light.',
      },
      finish: {
        nav: 'The frosting',
        eyebrow: '03 · The frosting',
        lead: 'Then a coat of cream-cheese whipped cream, ',
        accent: 'less sweet and cloud-soft',
        tail: ', and a drip that rolls over the edge all on its own.',
        note: 'Every drip is one copy of the same mesh: a hundred drips cost two draw calls. Ambient occlusion seats them in the cream.',
      },
      crown: {
        nav: 'The toppings',
        eyebrow: '04 · The toppings',
        lead: 'Đà Lạt strawberries, macarons, a little gold leaf for a tiny flex. ',
        accent: 'What goes on top is your call.',
        tail: '',
        note: 'Toppings follow a seeded random layout: the same design always looks exactly the same, in every screenshot.',
      },
    },
    build: {
      nav: 'Your turn',
      eyebrow: '05 · Your turn',
      title: 'Now, ',
      accent: 'design yours.',
      design: 'Design your cake',
      menu: 'See the menu',
    },
  },
  why: {
    eyebrow: "Why Kai's",
    title: 'Cute cakes, ',
    accent: 'just sweet enough.',
    items: [
      {
        icon: 'cake',
        title: 'Less sweet by default',
        body: 'Sweet enough that the second slice still slaps. Sweet tooth? Pick "regular sweet", it costs nothing extra.',
      },
      {
        icon: 'cream',
        title: 'Cream-cheese whipped cream',
        body: 'Whipping cream beaten with cream cheese: milky, light, and it holds up in Saigon heat. No vegetable cream, ever.',
      },
      {
        icon: 'pen',
        title: 'Free lettering',
        body: 'Up to 22 characters, Vietnamese accents and all. Candles, knife and plates come free too.',
      },
      {
        icon: 'turn',
        title: 'See it in 3D first',
        body: 'Every choice changes the cake, slice it to check the layers, and the price updates instantly. No guessing.',
      },
      {
        icon: 'clock',
        title: 'Order from 4 hours ahead',
        body: 'Menu cakes: 4 hours. Your own design: 24 hours. Two tiers and holiday orders: 48 hours.',
      },
      {
        icon: 'scooter',
        title: 'Pick up or delivery',
        body: 'Drop by 6:30–22:45, or we book Grab, Be or Ahamove to bring it across the old inner districts of Ho Chi Minh City. You pay the app fee.',
      },
    ],
  },
  cakes: {
    eyebrow: "Kai's menu",
    title: 'Six house cakes, ',
    accent: 'remix any of them.',
    all: 'See the 3D vitrine',
    cta: 'Make it yours',
    lead: (hours: number) => `Order ${hours} hrs ahead`,
  },
  steps: {
    eyebrow: 'Order in 3 steps',
    title: 'Easy as ',
    accent: 'cake, literally.',
    items: [
      {
        title: 'Pick a cake',
        body: 'Take a house cake from the menu, or design your own in 3D, from the size to the words on top.',
      },
      {
        title: 'Set a time',
        body: 'Pick it up or get it delivered. Order 4, 24 or 48 hours ahead depending on the cake; the page works it out for you.',
      },
      {
        title: 'Pay',
        body: 'Cash on delivery, bank transfer or MoMo. Two tiers, holiday orders or orders from 1,000,000 VND need a 50% deposit.',
      },
    ],
  },
  final: {
    title: 'Deadline stress? ',
    accent: 'Cake fixes that.',
    body: "Design a cute one yourself, or grab Kai's best seller right now.",
    design: 'Design your cake',
    menu: 'See the menu',
  },
}
