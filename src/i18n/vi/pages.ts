/** The info pages: /about, /policies, /faq. Owned by the copy agent. */
export const pages = {
  about: {
    meta: {
      title: 'Về tiệm',
      description: "Kai's Bakery là ai, bánh làm thế nào, mở cửa lúc mấy giờ và nhắn tiệm ở đâu.",
    },
  },
  policies: {
    meta: {
      title: 'Chính sách',
      description:
        'Giao và nhận bánh, thanh toán và đặt cọc, hủy hay đổi đơn, bánh hỏng khi giao, bảo quản và dị ứng, dữ liệu cá nhân.',
    },
  },
  faq: {
    meta: {
      title: 'Hỏi đáp',
      description:
        'Đặt gấp được không, ship bao nhiêu, ít ngọt cỡ nào… Mọi câu bạn hay hỏi tiệm, gom hết ở đây.',
    },
  },
}

export type PagesDict = typeof pages
