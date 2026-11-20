import type { DesignDict } from '../vi/design'

export const design: DesignDict = {
  meta: {
    title: 'Design your cake in 3D',
    description:
      'Pick the size, sponge, filling, frosting, drip, toppings, candles and message: the 3D cake changes with every choice and the price updates instantly.',
  },
  loading: 'Preheating the oven…',
  eyebrow: 'Your cake studio',
  titleLead: 'Design',
  titleMark: 'your own cake',
  intro:
    'Every pick redraws the cake in 3D and the price updates instantly, no DMs asking for a quote. Slice it open to check the layers before you commit.',
  hints: {
    size: 'Base price includes candles, lettering, knife and plates',
    frosting: 'Cream-cheese whipped cream, natural colours',
    toppings: (chosen: number, max: number) => `${chosen} of ${max} picked`,
    toppingsFull: "That's four. Drop one if you want to swap.",
    sweetness: "Less sweet is Kai's signature",
  },
  candles: {
    fewer: 'One candle fewer',
    more: 'One candle more',
  },
  message: {
    placeholder: 'Happy birthday, Linh',
    hint: 'Up to 22 characters, Vietnamese accents welcome',
  },
  stage: {
    slice: 'Slice it open',
    unslice: 'Put the slice back',
    save: 'Save picture',
    studio: 'Studio photo',
    developing: 'Developing the studio photo…',
    progress: 'Studio photo progress',
    cancel: 'Cancel',
    download: 'Download photo',
    back: 'Back to 3D',
    /** Shown once, the first time the cake appears: mouse, or touch screen. */
    hint: {
      mouse: 'Drag to spin the cake 360°, scroll to zoom',
      touch: 'Drag to spin it 360°, pinch to zoom',
    },
  },
  summary: {
    title: 'Quick recap',
    lead: (hours: number) => `Order ${hours} hours ahead`,
    leadWhy: {
      menu: 'A house cake from the menu, so we can be quick.',
      custom: 'A custom design needs a day for us to prep.',
      tiered: 'Two tiers need two days. Worth the wait, no cap.',
    },
    share: 'Send this design to the shop',
    shareHint: 'The shop opens the link and sees this exact cake, no long descriptions needed.',
    copied: 'Link copied! Paste it into Zalo for the shop.',
    manual: "Your device won't copy automatically, so copy this link instead:",
    linkLabel: 'Cake design link',
    breakdown: 'See the price breakdown',
    total: 'Total',
    extrasFree: 'Candles, lettering, knife and plates: free.',
    reset: 'Start over',
  },
  bar: {
    add: 'Add to cart',
    viewCart: 'View cart →',
  },
  status: {
    added: (name: string) => `${name} is in your cart!`,
    pictureFailed: "This device couldn't take the picture, sorry.",
    pictureSaved: 'Picture saved.',
    studioSaved: 'Studio photo saved. Go flex it!',
    studioStart: 'Developing a path-traced studio photo. Give it a few seconds.',
    studioUnavailable: "Studio photos don't work on this device. Try Save picture instead.",
  },
  files: {
    picture: 'kais-bakery-cake.png',
    studio: 'kais-bakery-studio-photo.png',
  },
}
