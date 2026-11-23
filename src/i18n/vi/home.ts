import type { IconName } from '@/lib/icons'

/** Home page: the welcome screen, the scroll story and the sections under it. Owned by the copy agent. */

export interface StoryChapterWords {
  /** Label in the side index. */
  nav: string
  eyebrow: string
  lead: string
  /** The highlighted words of the heading. */
  accent: string
  tail: string
  /** How the effect on screen is made, for the curious. */
  note: string
}

interface Card {
  /** A small decorative drawing, read by nobody (aria-hidden). */
  icon: IconName
  title: string
  body: string
}

export const home = {
  meta: {
    title: "Kai's Bakery – Tiệm Bánh Thủ Công",
    description:
      'Bánh kem làm tay, ít ngọt, kem tươi phô mai ở khu Thủ Đức. Tự thiết kế bánh 3D, xem giá liền, nhận tại tiệm hoặc ship khắp nội thành TP.HCM. Dự án web minh họa, tiệm không có thật.',
  },
  intro: {
    welcome: 'Chào mừng tới',
    tagline: 'Bánh kem làm tay, ít ngọt, dựng bằng 3D ngay trên web.',
    loading: 'Đang nướng cảnh 3D',
    ready: 'Cảnh 3D ra lò rồi nè',
    start: 'Vào tiệm thôi',
    notice: 'Psst: tiệm không có thật đâu, đây là dự án web của Kai.',
  },
  stage: {
    script: "Kai's",
    word: 'Bakery',
    subtitle: 'Tiệm Bánh Thủ Công',
    baking: 'Bánh 3D sắp ra lò',
  },
  story: {
    label: 'Câu chuyện chiếc bánh',
    introLine: 'Bánh kem làm tay, dựng bằng 3D.',
    introHint: 'Lướt xuống xem từng lớp bánh nha.',
    introLabel: 'Mở đầu',
    scrollDown: 'Xuống chương đầu tiên',
    indexLabel: 'Các chương',
    introNav: 'Mở đầu',
    chapters: {
      sponge: {
        nav: 'Cốt bánh',
        eyebrow: '01 · Cốt bánh',
        lead: 'Cốt bánh nướng mỗi sáng, cắt thành ',
        accent: 'ba lớp mỏng tang',
        tail: ', miếng nào cũng đủ kem, không ai thiệt.',
        note: 'Miếng bánh cắt ra là một khối riêng, khớp khít với ổ bánh. Mặt cắt được vẽ trực tiếp trên canvas theo đúng vị bạn chọn.',
      },
      filling: {
        nav: 'Nhân bánh',
        eyebrow: '02 · Nhân bánh',
        lead: 'Giữa các lớp là mứt dâu nấu tay, ganache socola thật. ',
        accent: 'Không có gì bóp ra từ tuýp hết.',
        tail: '',
        note: 'Vụn bánh, nhân và kem được vẽ riêng cho từng chiếc, rồi dùng lại làm bump map để mặt cắt bắt sáng như thật.',
      },
      finish: {
        nav: 'Kem phủ',
        eyebrow: '03 · Kem phủ',
        lead: 'Phủ một lớp kem tươi phô mai ',
        accent: 'ít ngọt, mịn như mây',
        tail: ', rồi để sốt chảy tràn qua mép, tự nhiên hết nấc.',
        note: 'Mỗi giọt sốt là một bản sao của cùng một mesh: trăm giọt chỉ tốn hai lệnh vẽ. Ambient occlusion giúp sốt bám vào kem.',
      },
      crown: {
        nav: 'Trang trí',
        eyebrow: '04 · Trang trí',
        lead: 'Dâu Đà Lạt, macaron, chút lá vàng cho flex nhẹ. ',
        accent: 'Trên bánh có gì là do bạn chốt.',
        tail: '',
        note: 'Topping được xếp theo bố cục ngẫu nhiên có seed: cùng một thiết kế thì luôn trông y chang, chụp bao nhiêu lần cũng vậy.',
      },
    } satisfies Record<'sponge' | 'filling' | 'finish' | 'crown', StoryChapterWords>,
    build: {
      nav: 'Tới lượt bạn',
      eyebrow: '05 · Tới lượt bạn',
      title: 'Giờ thì, ',
      accent: 'tự thiết kế bánh của bạn nha.',
      design: 'Tự thiết kế bánh',
      menu: 'Xem menu bánh',
    },
  },
  why: {
    eyebrow: "Vì sao là Kai's",
    title: 'Bánh xinh xỉu, ',
    accent: 'ngọt vừa đủ.',
    items: [
      {
        icon: 'cake',
        title: 'Ít ngọt là mặc định',
        body: 'Ngọt vừa đủ để ăn miếng thứ hai vẫn thấy ngon. Hội hảo ngọt thì chọn "ngọt vừa", không tính thêm đồng nào.',
      },
      {
        icon: 'cream',
        title: 'Kem tươi phô mai',
        body: 'Whipping cream đánh cùng cream cheese: thơm sữa, đứng kem giữa trời Sài Gòn. Không dùng kem thực vật.',
      },
      {
        icon: 'pen',
        title: 'Viết chữ miễn phí',
        body: 'Tối đa 22 ký tự, tiếng Việt có dấu đầy đủ. Nến, dao, đĩa cũng tặng kèm luôn.',
      },
      {
        icon: 'turn',
        title: 'Thấy trước bánh 3D',
        body: 'Chọn gì bánh đổi nấy, cắt ra xem từng lớp, giá hiện liền tay. Khỏi đoán mò, khỏi nhắn qua nhắn lại.',
      },
      {
        icon: 'clock',
        title: 'Đặt trước từ 4 giờ',
        body: 'Mẫu trong menu: 4 giờ. Bánh tự thiết kế: 24 giờ. Bánh 2 tầng và đơn ngày lễ: 48 giờ.',
      },
      {
        icon: 'scooter',
        title: 'Nhận tại tiệm hoặc ship',
        body: 'Ghé tiệm 6:30–22:45, hoặc tiệm gọi Grab, Be, Ahamove giao khắp nội thành TP.HCM cũ. Phí ship theo app, bạn trả.',
      },
    ] satisfies Card[],
  },
  cakes: {
    eyebrow: 'Menu nhà Kai',
    title: '6 mẫu bánh, ',
    accent: 'đổi gì cũng được.',
    all: 'Xem tủ kính 3D',
    cta: 'Đổi theo ý bạn',
    lead: (hours: number) => `Đặt trước ${hours} giờ`,
  },
  steps: {
    eyebrow: 'Đặt bánh trong 3 bước',
    title: 'Dễ như ',
    accent: 'ăn bánh.',
    items: [
      {
        title: 'Chọn bánh',
        body: 'Lấy một mẫu trong menu, hoặc tự thiết kế 3D từ cỡ bánh tới dòng chữ trên mặt.',
      },
      {
        title: 'Chốt giờ nhận',
        body: 'Nhận tại tiệm hoặc ship tận nơi. Đặt trước 4, 24 hay 48 giờ tùy loại bánh, trang tự tính giùm bạn.',
      },
      {
        title: 'Thanh toán',
        body: 'COD, chuyển khoản hoặc MoMo. Bánh 2 tầng, đơn ngày lễ hay đơn từ 1.000.000đ thì cọc trước 50%.',
      },
    ],
  },
  notice: {
    title: 'Khoan, đọc cái này đã',
    more: 'Đọc về dự án',
  },
  final: {
    title: 'Deadline dí? ',
    accent: 'Có bánh rồi lo gì.',
    body: 'Tự thiết kế một chiếc thật xinh, hoặc chốt liền mẫu best seller nhà Kai.',
    design: 'Tự thiết kế bánh',
    menu: 'Xem menu bánh',
  },
}

export type HomeDict = typeof home
