/** The info pages: /about, /policies, /faq. Owned by the copy agent. */

/** One block of a policy section: a sub-heading, a paragraph, a list, a two-column table, or the delivery areas. */
export interface PolicyBlock {
  heading?: string
  text?: string
  items?: string[]
  table?: { head: [string, string]; rows: [string, string][] }
  /** Renders the shop's delivery areas from `src/lib/shop.ts`. */
  areas?: boolean
}

export type PolicyId = 'delivery' | 'payment' | 'changes' | 'damage' | 'storage' | 'allergens' | 'privacy'

export interface PolicySection {
  title: string
  summary: string
  blocks: PolicyBlock[]
}

export interface FaqItem {
  q: string
  a: string
  /** Optional link under the answer, written without a language prefix. */
  link?: { href: string; label: string }
}

const policySections: Record<PolicyId, PolicySection> = {
  delivery: {
    title: 'Giao và nhận bánh',
    summary: 'Nhận tại tiệm, hoặc để tiệm gọi xe giao tận nơi.',
    blocks: [
      {
        heading: 'Nhận tại tiệm',
        text: 'Tiệm ở khu Thủ Đức, mở 6:30–22:45 mỗi ngày. Tới giờ hẹn là bánh chờ sẵn trong tủ mát.',
      },
      {
        heading: 'Giao tận nơi',
        items: [
          'Giao 8:00–21:30, bạn chọn khung giờ 30 phút lúc đặt.',
          'Tiệm gọi Grab, Be hoặc Ahamove theo địa chỉ bạn cho. Phí ship tính theo app lúc gọi xe; tiệm báo phí trước, bạn trả cho tài xế hoặc chuyển khoản cùng tiền bánh.',
          'Bánh 20 cm và bánh 2 tầng đi ô tô cho an toàn (phí cao hơn), hoặc bạn ghé tiệm lấy.',
        ],
      },
      {
        heading: 'Khu vực giao',
        text: 'Khu vực nội thành TP.HCM cũ, ghi theo tên quận quen thuộc (trước đợt sáp nhập tháng 7/2025):',
        areas: true,
      },
      {
        heading: 'Đặt trước bao lâu',
        table: {
          head: ['Loại đơn', 'Đặt trước ít nhất'],
          rows: [
            ['Mẫu trong menu, 10–20 cm', '4 giờ. Muốn nhận trong ngày thì đặt trước 18:00'],
            ['Bánh tự thiết kế trên web', '24 giờ'],
            ['Bánh theo ảnh mẫu bạn gửi, tạo hình phức tạp', '48 giờ, nhắn Zalo kèm ảnh'],
            ['Bánh 2 tầng', '48 giờ'],
            ['Ngày lễ (14/2, 8/3, 20/10, 20/11, 24/12, 7 ngày cận Tết)', '48 giờ cho mọi đơn'],
          ],
        },
        text: 'Giờ tính theo giờ Việt Nam, kể cả khi bạn đặt từ nước ngoài cho người nhà.',
      },
    ],
  },
  payment: {
    title: 'Thanh toán và đặt cọc',
    summary: 'Trả khi nhận, chuyển khoản hoặc MoMo. Đơn lớn thì cọc 50%.',
    blocks: [
      {
        items: [
          'Trả tiền khi nhận (COD), chuyển khoản (VietQR) hoặc MoMo, chọn lúc đặt.',
          'Mẫu trong menu và bánh tự thiết kế đến 20 cm: không cần cọc, trừ các trường hợp bên dưới. Tiệm nhắn hoặc gọi xác nhận trước khi làm.',
        ],
      },
      {
        heading: 'Khi nào cần cọc 50%',
        items: ['Bánh theo ảnh mẫu bạn gửi', 'Bánh 2 tầng', 'Đơn từ 1.000.000đ', 'Đơn ngày lễ'],
        text: 'Cọc qua chuyển khoản hoặc MoMo, phần còn lại trả khi nhận. Có cọc thì tiệm mới dám chuẩn bị nguyên liệu cho đơn lớn, và không phải lo đơn ảo.',
      },
    ],
  },
  changes: {
    title: 'Hủy hoặc đổi đơn',
    summary: 'Báo trước 24 giờ là hủy hay đổi đều free.',
    blocks: [
      {
        heading: 'Báo trước 24 giờ so với giờ nhận',
        items: [
          'Hủy miễn phí, hoàn 100% cọc (hoặc giữ cọc cho lần sau nếu bạn muốn).',
          'Đổi ngày, giờ, vị hay chữ trên bánh: miễn phí.',
        ],
      },
      {
        heading: 'Báo trong vòng 24 giờ',
        items: [
          'Mẫu trong menu chưa làm: vẫn hủy miễn phí.',
          'Bánh đã bắt đầu làm (bánh theo mẫu, 2 tầng, đơn ngày lễ): tiệm giữ cọc để bù nguyên liệu.',
          'Đổi giờ nhận trong cùng ngày: tiệm cố hết sức nếu kịp.',
        ],
      },
    ],
  },
  damage: {
    title: 'Bánh lỗi hoặc hỏng khi nhận',
    summary: 'Chụp ảnh, nhắn tiệm trong 2 giờ. Lỗi do tiệm thì làm lại hoặc hoàn tiền.',
    blocks: [
      {
        text: 'Mở hộp kiểm tra ngay khi nhận, trước mặt tài xế nếu được. Có vấn đề thì chụp ảnh hoặc quay video, nhắn Zalo cho tiệm trong vòng 2 giờ.',
      },
      {
        items: [
          'Lỗi của tiệm (sai mẫu, sai chữ, sai vị, bánh không đạt): làm lại miễn phí nếu còn kịp, hoặc hoàn 100% tiền bánh.',
          'Hỏng do vận chuyển khi tiệm gọi xe (móp, đổ): sửa hoặc làm lại miễn phí nếu kịp giờ, không kịp thì hoàn tiền bánh. Tiệm tự làm việc với app giao hàng, bạn khỏi lo.',
          'Bạn tự mang, tự gọi xe, hoặc bảo quản sai (để ngoài nắng, quá giờ): tiệm không đổi trả, nhưng sẽ chỉ bạn cách cứu bánh nếu được.',
          'Ngon hay không là cảm nhận riêng nên không thuộc diện đổi trả. Nhưng tiệm rất muốn nghe góp ý, thật đó.',
        ],
      },
    ],
  },
  storage: {
    title: 'Bảo quản',
    summary: 'Ngăn mát 2–6°C, ngon nhất trong 24 giờ.',
    blocks: [
      {
        items: [
          'Nhận bánh xong cho vào ngăn mát tủ lạnh (2–6°C) liền. Không để ngăn đá.',
          'Lấy ra 15–20 phút trước khi cắt cho kem mềm và thơm. Đừng để ngoài quá 1 giờ, trời nóng thì càng ngắn hơn.',
          'Ngon nhất trong 24 giờ, dùng hết trong 48 giờ, đậy kín trong hộp. Bánh có trái cây tươi nên ăn trong ngày.',
          'Tự mang về: giữ hộp nằm phẳng, tránh nắng. Bánh 20 cm và 2 tầng nên đi ô tô.',
        ],
      },
    ],
  },
  allergens: {
    title: 'Nguyên liệu và dị ứng',
    summary: 'Mọi bánh có trứng, sữa, bột mì. Một số lựa chọn có đậu nành hoặc các loại hạt.',
    blocks: [
      {
        text: 'Kem phủ là kem tươi động vật (whipping cream) đánh cùng cream cheese, gọi là kem tươi phô mai. Tiệm không dùng kem thực vật. Màu kem lấy từ nguyên liệu như bột dâu sấy, cacao, khoai môn.',
      },
      { heading: 'Có trong mọi bánh', text: 'Trứng, sữa, bột mì (gluten).' },
      {
        heading: 'Tùy lựa chọn',
        items: [
          'Cốt socola, ganache, kem socola sữa, sốt socola, socola miếng: thêm đậu nành (lecithin).',
          'Macaron (làm từ bột hạnh nhân) và kem hạt dẻ cười: các loại hạt.',
        ],
      },
      {
        text: 'Bếp dùng chung dụng cụ với các loại hạt, nên tiệm không dám hứa bánh sạch 100% dấu vết dị ứng. Dị ứng nặng thì nhắn Kai trước khi đặt nha.',
      },
    ],
  },
  privacy: {
    title: 'Dữ liệu cá nhân',
    summary: 'Web không gửi thông tin của bạn đi đâu cả.',
    blocks: [
      {
        items: [
          'Web không có tài khoản, không cookie, không công cụ đo lường hay quảng cáo.',
          'Giỏ hàng và chiếc bánh bạn đang thiết kế chỉ lưu trong trình duyệt này (localStorage), để lần sau mở lại còn nguyên. Không gửi đi đâu.',
          'Tên, số điện thoại, địa chỉ ở bước thanh toán không được gửi hay lưu ở máy chủ nào. Vì tiệm không có thật, đơn chỉ là đơn thử.',
          'Link "Gửi thiết kế cho tiệm" chứa nguyên chiếc bánh, kể cả chữ trên bánh, ở phần sau dấu # của link. Trình duyệt không gửi phần đó lên máy chủ, nhưng ai có link cũng xem được bánh của bạn.',
          'Khi bạn gọi điện, nhắn Zalo, Facebook, Instagram hay TikTok, cuộc trò chuyện do các dịch vụ đó xử lý theo chính sách của họ.',
          'Muốn xóa sạch? Xóa từng bánh trong giỏ, hoặc xóa dữ liệu trang web trong cài đặt trình duyệt.',
        ],
      },
      {
        text: 'Nếu sau này tiệm bán thật, phần này sẽ được viết lại theo Luật Bảo vệ dữ liệu cá nhân (có hiệu lực từ 1/1/2026) và các văn bản hướng dẫn.',
      },
    ],
  },
}

const faqItems: FaqItem[] = [
  {
    q: 'Tiệm có thật không?',
    a: "Hông nha. Kai's Bakery là dự án web của Kai, làm ra để khoe đồ họa 3D và cách làm một trang bán bánh cho chuẩn. Bánh, giá và đơn đều để minh họa, không ai bị trừ tiền.",
    link: { href: '/about#project', label: 'Đọc về dự án' },
  },
  {
    q: 'Đặt gấp trong ngày được không?',
    a: 'Được với mẫu trong menu (10–20 cm): đặt trước ít nhất 4 giờ, và đặt trước 18:00 nếu muốn nhận trong ngày. Bánh tự thiết kế cần 24 giờ, bánh 2 tầng cần 48 giờ.',
  },
  {
    q: 'Phí ship bao nhiêu?',
    a: 'Tùy quãng đường. Tiệm gọi Grab, Be hoặc Ahamove, báo phí theo app trước khi gọi xe; bạn trả cho tài xế hoặc chuyển khoản cùng tiền bánh. Giao 8:00–21:30 khắp nội thành TP.HCM cũ.',
  },
  {
    q: '"Ít ngọt" là ngọt cỡ nào?',
    a: 'Ngọt vừa đủ để ăn miếng thứ hai vẫn thấy ngon, không ngấy. Hội hảo ngọt cứ chọn "Ngọt vừa" lúc thiết kế, không tính thêm tiền.',
  },
  {
    q: 'Kem của tiệm là kem gì?',
    a: 'Kem tươi phô mai: whipping cream đánh cùng cream cheese. Thơm sữa, đứng kem tốt giữa trời nóng, và tiệm không dùng kem thực vật.',
  },
  {
    q: 'Mình bị dị ứng thì sao?',
    a: 'Mọi bánh có trứng, sữa, bột mì. Socola có đậu nành; macaron và hạt dẻ cười có các loại hạt. Trang thiết kế ghi rõ "Có chứa: …" cho từng bánh. Bếp dùng chung dụng cụ với hạt, nên dị ứng nặng thì nhắn Kai trước nha.',
    link: { href: '/policies#allergens', label: 'Xem nguyên liệu và dị ứng' },
  },
  {
    q: 'Bánh để được bao lâu?',
    a: 'Ngon nhất trong 24 giờ, dùng hết trong 48 giờ, để ngăn mát 2–6°C. Lấy ra 15–20 phút trước khi cắt, và đừng để ngoài quá 1 giờ.',
  },
  {
    q: 'Viết chữ lên bánh có tốn tiền không?',
    a: 'Free nha, tối đa 22 ký tự, tiếng Việt có dấu đầy đủ. Nến, dao, đĩa cũng tặng kèm luôn.',
  },
  {
    q: 'Làm bánh theo ảnh mẫu được không?',
    a: 'Được. Nhắn Zalo kèm ảnh, đặt trước ít nhất 48 giờ, cọc 50%. Tiệm báo giá và nói thật mẫu nào làm được, mẫu nào hơi khó.',
  },
  {
    q: 'Khi nào phải đặt cọc?',
    a: 'Bánh theo ảnh mẫu, bánh 2 tầng, đơn từ 1.000.000đ và đơn ngày lễ: cọc 50% qua chuyển khoản hoặc MoMo, phần còn lại trả khi nhận.',
  },
  {
    q: 'Muốn hủy đơn thì sao?',
    a: 'Báo trước 24 giờ: hủy miễn phí, hoàn 100% cọc. Trễ hơn mà bánh đã bắt đầu làm thì tiệm giữ cọc để bù nguyên liệu.',
    link: { href: '/policies#changes', label: 'Xem chính sách hủy, đổi đơn' },
  },
  {
    q: 'Có xuất hóa đơn không?',
    a: 'Chưa nha. Tiệm không có thật nên không có mã số thuế hay hóa đơn. Nếu sau này bán thật, tiệm sẽ đăng ký hộ kinh doanh và xuất hóa đơn đàng hoàng.',
  },
  {
    q: 'Gửi chiếc bánh mình thiết kế cho tiệm kiểu gì?',
    a: 'Ở trang Tự thiết kế có nút gửi thiết kế: bấm là có một link chứa đúng chiếc bánh của bạn. Dán link vào Zalo cho tiệm là xong, khỏi tả lại từng lớp.',
    link: { href: '/design', label: 'Tự thiết kế bánh' },
  },
]

export const pages = {
  about: {
    meta: {
      title: 'Về tiệm',
      description: "Kai's Bakery là ai, bánh làm thế nào, mở cửa lúc mấy giờ và nhắn tiệm ở đâu.",
    },
    eyebrow: 'Về tiệm',
    title: 'Chào nha, ',
    accent: 'mình là Kai.',
    lead: 'Một tiệm bánh nhỏ (trong tưởng tượng) ở khu Thủ Đức, mê kem tươi, mê bánh xinh, và mê làm web.',
    story: {
      title: 'Chuyện của tiệm',
      paragraphs: [
        'Kai bắt đầu nướng bánh từ hồi sinh viên, vì sinh nhật bạn bè mà bánh ngoài tiệm thì ngọt muốn xỉu. Từ đó ra luật của tiệm: ít ngọt là mặc định, kem tươi phô mai, chữ trên bánh viết free.',
        'Tiệm làm cho hội sinh viên Làng Đại học, dân văn phòng khu Đông và các bố mẹ đặt bánh cho bé. Bento cầm tay cho bestie, bánh 16 cm quốc dân cho cả phòng ban, bánh 2 tầng cho những ngày cần làm main character.',
        "Điểm khác của Kai's: bạn thấy trước chiếc bánh bằng 3D, chọn gì bánh đổi nấy, giá hiện liền tay. Khỏi nhắn qua nhắn lại cả buổi chỉ để hỏi giá.",
      ],
    },
    rules: {
      title: 'Luật nhà Kai',
      items: [
        { icon: '🍰', text: 'Ít ngọt là mặc định' },
        { icon: '🥛', text: 'Kem tươi phô mai, không kem thực vật' },
        { icon: '✍️', text: 'Chữ, nến, dao, đĩa: free hết' },
      ],
    },
    project: {
      title: 'Nói thật nè: ',
      accent: 'tiệm không có thật đâu.',
      body: "Kai's Bakery là một dự án web của Kai. Không có tiệm, không có bếp, không ai nhận đơn. Bánh, giá và chính sách đều viết như một tiệm thật để trang web được thử thách đúng nghĩa, nhưng không đơn nào được gửi đi và không ai bị trừ tiền.",
      showsTitle: 'Dự án này khoe gì',
      shows: [
        'Bánh 3D dựng hoàn toàn bằng code, đổi theo từng lựa chọn, cắt ra xem từng lớp.',
        'Ảnh studio (nút "Chụp ảnh studio") dựng bằng path tracing ngay trong trình duyệt.',
        'Song ngữ Việt – Anh, tiếng Việt là mặc định, mỗi ngôn ngữ có địa chỉ trang riêng.',
        'Dùng được bằng bàn phím và trình đọc màn hình, có chế độ giảm chuyển động và hình 2D khi máy không có WebGL.',
        'Chạy mượt cả trên máy yếu: chất lượng tự hạ khi khung hình tụt.',
      ],
      maker: 'Xem các dự án khác của Kai',
      source: 'Xem mã nguồn trên GitHub',
    },
    hours: {
      title: 'Giờ mở cửa',
      shop: 'Tại tiệm',
      delivery: 'Giao tận nơi',
      everyDay: 'mỗi ngày',
      area: 'Địa chỉ',
    },
    areas: {
      title: 'Khu vực giao',
      lead: 'Giao khắp nội thành TP.HCM cũ bằng Grab, Be hoặc Ahamove. Phí ship tính theo app, bạn trả.',
      merger:
        'Từ 1/7/2025, TP.HCM bỏ cấp quận và sáp nhập với Bình Dương, Bà Rịa – Vũng Tàu. Tiệm vẫn ghi tên quận cũ cho dễ hình dung, và chưa giao ra các tỉnh mới sáp nhập.',
    },
    contact: {
      title: 'Nhắn Kai',
      note: 'Tiệm chưa mở thật, nhưng Kai vẫn đọc tin nhắn nha. Hỏi về dự án hay rủ làm web đều được.',
      hotline: 'Hotline & Zalo',
    },
  },
  policies: {
    meta: {
      title: 'Chính sách',
      description:
        'Giao và nhận bánh, thanh toán và đặt cọc, hủy hay đổi đơn, bánh hỏng khi giao, bảo quản và dị ứng, dữ liệu cá nhân.',
    },
    eyebrow: 'Chính sách',
    title: 'Mấy điều ',
    accent: 'nên biết trước khi đặt.',
    lead: 'Viết ngắn, nói thẳng: giờ giấc, tiền nong, hủy đơn, bánh hỏng thì sao. Đọc xong là yên tâm chốt đơn.',
    demoNote:
      'Đây là chính sách mẫu của một tiệm không có thật, viết y như tiệm thật sẽ viết. Bạn không đặt được bánh thật ở đây đâu nha.',
    tocLabel: 'Trong trang này',
    allergenHint: 'Trang thiết kế và giỏ hàng luôn ghi "Có chứa: …" cho từng chiếc bánh.',
    sections: policySections,
  },
  faq: {
    meta: {
      title: 'Hỏi đáp',
      description:
        'Đặt gấp được không, ship bao nhiêu, ít ngọt cỡ nào… Mọi câu bạn hay hỏi tiệm, gom hết ở đây.',
    },
    eyebrow: 'Hỏi đáp',
    title: 'Hỏi gì ',
    accent: 'tiệm cũng trả lời.',
    lead: 'Mấy câu cả nhà hay hỏi nhất, trả lời ngắn gọn, không vòng vo.',
    items: faqItems,
    more: {
      title: 'Chưa thấy câu bạn cần?',
      body: 'Nhắn Kai một câu, Kai trả lời liền (trong giờ thức nha).',
      hotline: 'Hotline & Zalo',
    },
  },
}

export type PagesDict = typeof pages
