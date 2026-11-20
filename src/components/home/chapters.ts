export interface Chapter {
  id: string
  /** Label in the side index. */
  nav: string
  eyebrow?: string
  lead?: string
  accent?: string
  tail?: string
  /** How the effect on screen is made, for the curious. */
  note?: string
}

/** The scroll story, top to bottom. The 3D camera has one shot per chapter (StoryScene SHOTS). */
export const CHAPTERS: Chapter[] = [
  { id: 'intro', nav: 'Intro' },
  {
    id: 'sponge',
    nav: 'The sponge',
    eyebrow: '01 — The sponge',
    lead: 'Every sponge is baked at dawn, in ',
    accent: 'three thin layers',
    tail: ', so each bite gets its share of cream.',
    note: 'The slice is a separate wedge that fits the cake exactly. Its cut face is painted live on a canvas from the flavours you pick.',
  },
  {
    id: 'filling',
    nav: 'The filling',
    eyebrow: '02 — The filling',
    lead: 'Between the layers goes real fruit and real chocolate. ',
    accent: 'Nothing comes from a tube.',
    note: 'Crumbs, filling and frosting are drawn per cake, then reused as a bump map so the cut catches the light.',
  },
  {
    id: 'finish',
    nav: 'The finish',
    eyebrow: '03 — The finish',
    lead: 'A cloud of buttercream, then a glaze that ',
    accent: 'rolls over the edge',
    tail: ' all on its own.',
    note: 'Each drip is one instance of the same mesh: a hundred drips cost two draw calls. Ambient occlusion seats them in the cream.',
  },
  {
    id: 'crown',
    nav: 'The crown',
    eyebrow: '04 — The crown',
    lead: 'Fruit, macarons, a little gold. ',
    accent: 'You choose what goes on top.',
    note: 'Toppings are placed by a seeded random layout: the same design always looks the same, in every screenshot.',
  },
  { id: 'build', nav: 'Build yours' },
]
