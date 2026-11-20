/**
 * Everything about the shop itself, in one place: change a number or a link here and it changes on every page.
 *
 * Kai's Bakery is a web project, not a shop that exists. The owner asked for the contact details below to stay
 * public as they are; the shop's address is only a neighbourhood on purpose.
 */

/**
 * The site's public address, for canonical links, the sitemap, robots.txt and social previews. Set
 * NEXT_PUBLIC_SITE_URL to change it (a preview, a fork); the fallback is the live address.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakery.kaidev.io.vn'

/** False while the shop is a showcase: checkout ends in a demo and says plainly that nothing was sent. */
export const ORDERING_OPEN = false

export const SHOP = {
  name: "Kai's Bakery",
  tagline: { vi: 'Tiệm Bánh Thủ Công', en: 'Handmade Cakes' },
  area: { vi: 'Khu Thủ Đức, TP.HCM', en: 'Thủ Đức area, Ho Chi Minh City' },
  /** The shop's own clock, used for lead times and opening hours whatever the visitor's time zone. */
  timeZone: 'Asia/Ho_Chi_Minh',
  hours: { open: '06:30', close: '22:45' },
  /** Delivery runs a little shorter than the counter: the last ride leaves at 21:30. */
  deliveryHours: { first: '08:00', last: '21:30' },
  phone: { display: '0347 551 122', tel: '+84347551122' },
  zalo: 'https://zalo.me/0347551122',
  social: {
    facebook: 'https://www.facebook.com/kietnguyen.0807',
    instagram: 'https://www.instagram.com/kiet.108/',
    tiktok: 'https://www.tiktok.com/@kiet_0807',
  },
  /** Who made the site; the shop's story uses the same short name. */
  maker: { name: 'Kai', url: 'https://kietnguyen.io.vn' },
  source: 'https://github.com/kiet0807/bakery-3d',
} as const

/** The shop's own links, in the order every page shows them. */
export const SHOP_LINKS = [
  { href: SHOP.zalo, label: 'Zalo' },
  { href: SHOP.social.facebook, label: 'Facebook' },
  { href: SHOP.social.instagram, label: 'Instagram' },
  { href: SHOP.social.tiktok, label: 'TikTok' },
] as const

/** The old inner-city districts the shop delivers to (names people still use after the 2025 merger). */
export const DELIVERY_AREAS = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Bình Thạnh',
  'Gò Vấp',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Bình Tân',
  'Thủ Đức (gồm Quận 2, Quận 9 cũ)',
] as const
