import type { MenuDict } from '../vi/menu'

export const menu: MenuDict = {
  meta: {
    title: 'Cake menu',
    description:
      "Kai's six house cakes on a turning 3D vitrine. Lift the glass, slice one open, add it to your cart or make it yours.",
  },
  loading: 'Polishing the glass…',
  eyebrow: "Kai's vitrine",
  titleLead: 'Six house cakes,',
  titleMark: 'cute behind glass',
  intro:
    'Pick one and the table turns it to the front and lifts the glass. Love it? Grab it. Want a tiny change? Open it in the cake designer.',
  listLabel: 'Choose a cake',
  houseCake: 'House cake',
  counter: (current: number, total: number) => `${current} / ${total}`,
  prev: 'Previous cake',
  next: 'Next cake',
  peek: 'Peek inside',
  close: 'Close it up',
  makeItYours: 'Make it yours',
  add: 'Add to cart',
  viewCart: 'View cart →',
  lead: (hours: number) => `Order ${hours} hours ahead`,
  status: {
    chosen: (name: string, price: string) => `${name}, ${price}.`,
    added: (name: string) => `${name} is in your cart!`,
  },
}
