/** "06:30" → "6:30", the way times are written on a shop sign. */
export const signTime = (time: string) => time.replace(/^0(\d)/, '$1')
