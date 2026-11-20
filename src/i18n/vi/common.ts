import type { Allergen } from '@/lib/cake'

/** Words shared by every page: header, footer, the "not a real shop" notice, units, allergens. */
export const common = {
  langName: 'Tiếng Việt',
  /** The switch is labelled in the language it switches to (the link carries that `lang`). */
  otherLang: { short: 'EN', name: 'English', label: 'Switch to English' },
  skip: 'Vào nội dung chính',
  nav: {
    label: 'Điều hướng chính',
    home: "Kai's Bakery, về trang chủ",
    design: 'Tự thiết kế',
    menu: 'Menu',
    about: 'Về tiệm',
    cart: 'Giỏ',
    cartCount: (n: number) => `${n} bánh trong giỏ`,
  },
  notice: {
    badge: 'Tiệm "ảo"',
    text: "Kai's Bakery là một dự án web của Kai, tiệm không có thật đâu nha. Bánh, giá và đơn hàng đều để minh họa: không đơn nào được gửi đi, không ai bị trừ tiền.",
    short: 'Tiệm không có thật, chỉ là dự án web của Kai thôi nha.',
    more: 'Tìm hiểu thêm',
  },
  footer: {
    label: 'Chân trang',
    blurb:
      'Bánh kem làm tay, ít ngọt, kem tươi phô mai. Tự thiết kế bánh 3D ngay trên web, giá hiện liền tay, khỏi hỏi han lòng vòng.',
    explore: 'Dạo tiệm',
    help: 'Cần biết',
    contact: 'Nhắn Kai',
    links: {
      design: 'Tự thiết kế bánh',
      menu: 'Menu bánh',
      story: 'Bánh được làm ra sao',
      about: 'Về tiệm',
      policies: 'Chính sách',
      faq: 'Hỏi đáp',
    },
    hours: 'Mở cửa 6:30–22:45, ngày nào cũng mở',
    delivery: 'Ship 8:00–21:30 khắp nội thành TP.HCM cũ',
    hotline: 'Hotline & Zalo',
    contactNote: 'Tiệm chưa mở thật, nhưng Kai vẫn đọc tin nhắn nha.',
    madeBy: 'Web làm bởi Kai',
    source: 'Mã nguồn trên GitHub',
    credits:
      'Phông chữ: Baloo 2, Be Vietnam Pro, Pacifico (SIL OFL). Ánh sáng 3D: “Comfy Café” của Sergej Majboroda, Poly Haven (CC0).',
    rights: (year: number) => `© ${year} Kai's Bakery · dự án minh họa, không phải cửa hàng thật`,
  },
  allergens: {
    egg: 'trứng',
    milk: 'sữa',
    gluten: 'bột mì (gluten)',
    soy: 'đậu nành',
    nuts: 'các loại hạt',
  } satisfies Record<Allergen, string>,
  contains: 'Có chứa',
  allergyNote:
    'Bếp dùng chung dụng cụ với các loại hạt, nên tiệm không dám hứa bánh sạch 100% dấu vết dị ứng. Dị ứng nặng thì nhắn Kai trước khi đặt nha.',
  units: {
    serves: ([from, to]: readonly [number, number]) => `${from}–${to} người`,
    cm: (cm: readonly number[]) => `${cm.join(' + ')} cm`,
  },
  free: 'Miễn phí',
  illustration: 'Hình minh họa 3D',
  notFound: {
    title: 'Ơ, trang này bay màu rồi',
    body: 'Link có thể bị gõ sai, hoặc trang đã dời đi chỗ khác. Quay về tiệm kiếm bánh ăn cho đỡ buồn nha.',
    home: 'Về trang chủ',
    menu: 'Xem menu',
  },
  meta: {
    siteTitle: "Kai's Bakery – Tiệm Bánh Thủ Công",
    titleTemplate: "%s · Kai's Bakery",
    description:
      'Bánh kem làm tay, ít ngọt, kem tươi phô mai ở khu Thủ Đức. Tự thiết kế bánh 3D, xem giá liền, nhận tại tiệm hoặc ship khắp nội thành TP.HCM. Dự án web minh họa, tiệm không có thật.',
    ogDescription:
      'Tự thiết kế bánh kem 3D, cắt ra xem từng lớp, rồi xem bánh được đóng hộp. Một dự án web của Kai.',
  },
}

export type CommonDict = typeof common
