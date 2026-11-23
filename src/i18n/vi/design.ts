/** The cake builder at /design. Owned by the design and menu agent. */
export const design = {
  meta: {
    title: 'Tự thiết kế bánh 3D',
    description:
      'Chọn cỡ, cốt, nhân, kem, sốt, topping, nến và lời chúc: bánh 3D đổi theo từng lựa chọn, giá hiện liền tay.',
  },
  loading: 'Đang làm nóng lò…',
  eyebrow: 'Xưởng bánh của bạn',
  sectionsLabel: 'Nhảy tới phần',
  titleLead: 'Tự thiết kế',
  titleMark: 'bánh của bạn',
  intro:
    'Chọn gì là bánh 3D đổi liền, giá cũng nhảy theo, khỏi inbox hỏi giá. Cắt bánh ra xem ruột trước khi chốt nha.',
  /** The house cakes to start from. */
  picks: {
    title: 'Bắt đầu từ mẫu',
    hint: 'Chọn một mẫu rồi đổi tùy thích',
    back: 'Lấy lại bánh bạn đang thiết kế',
  },
  hints: {
    size: 'Giá gốc đã gồm nến, chữ, dao và đĩa',
    frosting: 'Kem tươi phô mai, màu tự nhiên',
    toppings: (chosen: number, max: number) => `Đã chọn ${chosen}/${max}`,
    toppingsFull: 'Đủ 4 món rồi nè. Muốn đổi thì bỏ bớt một món nha.',
    sweetness: 'Ít ngọt là chuẩn nhà Kai',
  },
  candles: {
    fewer: 'Bớt một cây nến',
    more: 'Thêm một cây nến',
  },
  message: {
    placeholder: 'Sinh nhật vui vẻ, Linh',
    hint: 'Tối đa 22 ký tự, có dấu thoải mái',
  },
  stage: {
    slice: 'Cắt bánh xem ruột',
    unslice: 'Ghép miếng bánh lại',
    save: 'Lưu ảnh',
    studio: 'Chụp ảnh studio',
    developing: 'Đang rửa ảnh studio…',
    progress: 'Tiến độ ảnh studio',
    cancel: 'Hủy',
    download: 'Tải ảnh về',
    back: 'Quay lại 3D',
    /** Hiện một lần, lúc bánh vừa hiện: chuột, hoặc màn hình cảm ứng. */
    hint: {
      mouse: 'Kéo để xoay bánh 360°, lăn chuột để zoom nha',
      touch: 'Kéo để xoay 360°, chụm 2 ngón để zoom nha',
    },
  },
  summary: {
    title: 'Chốt lại xíu',
    lead: (hours: number) => `Đặt trước ${hours} giờ`,
    leadWhy: {
      menu: 'Mẫu có sẵn của tiệm, làm nhanh được.',
      custom: 'Bánh tự thiết kế, tiệm cần một ngày để chuẩn bị.',
      tiered: 'Bánh 2 tầng cần hai ngày, đáng chờ lắm á.',
    },
    share: 'Gửi thiết kế cho tiệm',
    shareHint: 'Tiệm mở link là thấy y chang chiếc bánh này, khỏi tả lòng vòng.',
    copied: 'Đã chép link, dán vào Zalo cho tiệm nha!',
    manual: 'Máy chưa cho chép tự động, bạn chép link này giúp tiệm nha:',
    linkLabel: 'Link thiết kế bánh',
    breakdown: 'Xem giá chi tiết',
    total: 'Tổng cộng',
    extrasFree: 'Nến, chữ trên bánh, dao và đĩa: miễn phí.',
    reset: 'Làm lại từ đầu',
  },
  bar: {
    add: 'Thêm vào giỏ',
    update: 'Cập nhật giỏ',
    viewCart: 'Xem giỏ →',
    lead: (hours: number) => `${hours} giờ`,
  },
  status: {
    added: (name: string) => `${name} đã vào giỏ rồi nè!`,
    updated: (name: string) => `${name} trong giỏ đã đổi theo thiết kế mới rồi nha.`,
    pictureFailed: 'Máy này chưa chụp được ảnh bánh, tiếc ghê.',
    pictureSaved: 'Lưu ảnh xong rồi nha.',
    studioSaved: 'Ảnh studio đã về máy, đem flex liền!',
    studioStart: 'Đang rửa ảnh studio, chờ vài giây nha.',
    studioUnavailable: 'Máy này chưa chụp ảnh studio được, dùng nút Lưu ảnh nha.',
  },
  files: {
    picture: 'kais-bakery-banh.png',
    studio: 'kais-bakery-anh-studio.png',
  },
}

export type DesignDict = typeof design
