import type { CakeDict } from '../vi/cake'

export const cake: CakeDict = {
  kinds: {
    size: 'Size',
    sponge: 'Sponge',
    filling: 'Filling',
    frosting: 'Frosting',
    drip: 'Drip',
    topping: 'Toppings',
    sweetness: 'Sweetness',
    candles: 'Candles',
    message: 'Message on top',
  },
  sizes: {
    bento: { name: 'Bento 10 cm', note: 'A pocket-sized box for you and your bestie' },
    s14: { name: '14 cm', note: 'Perfect for a date or a small squad' },
    s16: { name: '16 cm', note: 'The size everyone picks, no cap' },
    s18: { name: '18 cm', note: 'Enough for the whole office to party' },
    s20: { name: '20 cm', note: 'Big party, bigger vibes' },
    tier2: { name: 'Two tiers', note: 'Main character energy at any party' },
  },
  sponges: {
    vanilla: { name: 'Vanilla', note: 'Soft, buttery, tastes like childhood' },
    chocolate: { name: 'Chocolate', note: 'Rich and moist, dangerously so' },
    'red-velvet': { name: 'Red velvet', note: 'Gorgeous red with a classy little tang' },
    matcha: { name: 'Matcha green tea', note: 'Grassy, gently bitter, sweet finish' },
    taro: { name: 'Taro', note: 'Dreamy purple, nutty and creamy' },
  },
  fillings: {
    'vanilla-cream': { name: 'Vanilla cream', note: 'Light as air, not too sweet' },
    'strawberry-jam': { name: 'Strawberry jam', note: 'Đà Lạt berries, cooked by hand' },
    'chocolate-ganache': { name: 'Chocolate ganache', note: '70% dark, smooth as velvet' },
    'salted-caramel': { name: 'Salted caramel', note: 'Sweet, salty, seriously addictive' },
    'fresh-mango': { name: 'Fresh mango', note: 'Ripe Cát mango, super juicy' },
  },
  frostings: {
    'cloud-white': { name: 'Milk white', note: 'Clean and white like a cloud' },
    'strawberry-milk': { name: 'Strawberry pink', note: 'Coloured with freeze-dried strawberry' },
    pistachio: { name: 'Pistachio', note: 'Nutty, creamy, pretty in green' },
    cocoa: { name: 'Milk chocolate', note: 'Mellow and warm brown' },
    'taro-purple': { name: 'Taro purple', note: 'Pastel purple, very aesthetic' },
    'butter-yellow': { name: 'Lemon yellow', note: 'Lemon zest, fresh and bright' },
  },
  drips: {
    none: { name: 'No drip', note: 'Clean and minimal' },
    'dark-chocolate': { name: 'Dark chocolate', note: 'Glossy and dripping' },
    caramel: { name: 'Caramel', note: 'Slow-cooked and fragrant' },
    strawberry: { name: 'Strawberry sauce', note: 'Deep pink, sweet and tart' },
    'white-chocolate': { name: 'White chocolate', note: 'Silky and lightly sweet' },
  },
  toppings: {
    strawberries: { name: 'Đà Lạt strawberries', note: 'Fresh and juicy' },
    blueberries: { name: 'Blueberries', note: 'Little purple clusters' },
    macarons: { name: 'Macarons', note: 'Four pastel shells, eight on two tiers' },
    cherries: { name: 'Cherries', note: 'Stems and all' },
    'cream-kisses': { name: 'Cream kisses', note: 'Piped all around, free' },
    'chocolate-shards': { name: 'Chocolate shards', note: 'Snapped by hand' },
    sprinkles: { name: 'Rainbow sprinkles', note: 'Life needs more colour' },
    'gold-leaf': { name: 'Edible gold leaf', note: 'A tiny flex' },
  },
  sweetness: {
    less: { name: 'Less sweet', note: 'Our default' },
    regular: { name: 'Regular sweet', note: 'For the sweet tooth gang' },
  },
  presets: {
    'strawberry-cloud': {
      name: 'Strawberry Cloud',
      tagline: "Kai's best seller: vanilla sponge, strawberry jam, pink cream and fresh berries.",
    },
    'choco-crush': {
      name: 'Choco Crush',
      tagline: 'Chocolate on chocolate, plus cherries. Chocoholics, good luck resisting.',
    },
    'bestie-bento': {
      name: 'Bestie Bento',
      tagline: 'A tiny box for your bestie, "HPBD bestie" already on top. Change the words if you like.',
    },
    'taro-dream': {
      name: 'Taro Dream',
      tagline: 'Purple taro sponge, pastel macarons and sprinkles just for fun.',
    },
    'caramel-crown': {
      name: 'Caramel Crown',
      tagline: 'Two tiers of salted caramel and gold leaf. Big party, so the cake dresses up too.',
    },
    'rainbow-birthday': {
      name: 'Rainbow Birthday',
      tagline: 'Strawberry drip, rainbow sprinkles, five candles and your wish written on top.',
    },
  },
  yourDesign: 'Your own design',
  candles: (n: number) => `${n} ${n === 1 ? 'candle' : 'candles'}`,
  quoted: (message: string) => `“${message}”`,
}
