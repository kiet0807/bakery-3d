const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Whole dollars, e.g. "$42". */
export const money = (dollars: number) => formatter.format(dollars)
