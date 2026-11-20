/** The vitrine at /menu. Owned by the design and menu agent. */
export const menu = {
  meta: {
    title: 'Menu bánh',
    description:
      '6 mẫu bánh nhà Kai trên tủ kính 3D xoay vòng. Nhấc chuông kính, cắt bánh xem bên trong, thêm vào giỏ hoặc đổi theo ý bạn.',
  },
  loading: 'Đang lau kính tủ bánh…',
  eyebrow: 'Tủ kính nhà Kai',
  titleLead: '6 mẫu bánh,',
  titleMark: 'xinh xỉu sau lớp kính',
  intro:
    'Chọn một mẫu là bàn xoay đưa bánh ra trước, chuông kính nhấc lên liền. Ưng thì chốt luôn, muốn đổi chút xíu thì mở trang tự thiết kế nha.',
  listLabel: 'Chọn bánh',
  houseCake: 'Mẫu nhà Kai',
  counter: (current: number, total: number) => `${current} / ${total}`,
  prev: 'Bánh trước',
  next: 'Bánh tiếp theo',
  peek: 'Xem ruột bánh',
  close: 'Đóng lại',
  makeItYours: 'Đổi theo ý bạn',
  add: 'Thêm vào giỏ',
  viewCart: 'Xem giỏ →',
  lead: (hours: number) => `Đặt trước ${hours} giờ`,
  status: {
    chosen: (name: string, price: string) => `${name}, ${price}.`,
    added: (name: string) => `${name} đã vào giỏ rồi nè!`,
  },
}

export type MenuDict = typeof menu
