import type { ScenesDict } from '../vi/scenes'

export const scenes: ScenesDict = {
  loading: 'Baking the 3D scene…',
  fallback:
    "This device can't run 3D, so here's a drawing of the cake instead. Ordering still works just fine.",
  design: 'The cake you are designing, in 3D. Drag to look around it; scroll or pinch to zoom in and out.',
  story:
    'A pink strawberry layer cake chilling on a white cloud in a bright morning sky. As you scroll, the camera flies around it and a slice slides out to show off every layer.',
  vitrine: (count: number, name: string) =>
    `A turning glass vitrine with ${count} cakes on white porcelain stands. ${name} is at the front, its glass cloche lifted so you can take a look.`,
  box: "Your cake is lowered into a white Kai's Bakery box. The sides fold up, the lid closes, and a peach ribbon ties a very cute bow.",
  boxName: "Kai's",
  boxLine: 'Bakery',
}
