import type { LeadKind } from '@/lib/leadTime'
import type { DepositReason, Method, Payment } from '@/lib/order'

/** The cart and checkout at /cart. Owned by the cart agent. */
export const cart = {
  meta: {
    title: 'Giỏ hàng',
    description:
      'Xem lại bánh, chọn giờ nhận và xem bánh được đóng hộp 3D. Đơn thử thôi nha: không gửi đi đâu, không trừ tiền ai.',
  },
  loading: 'Đang mở giỏ bánh của bạn…',
  eyebrow: 'Giỏ bánh của bạn',
  title: (n: number) => `${n} chiếc bánh,`,
  titleMark: 'chờ vô hộp nè',
  linesLabel: 'Bánh bạn đã chọn',
  addAnother: 'Thêm bánh nữa cho vui',
  empty: {
    eyebrow: 'Giỏ bánh',
    title: 'Giỏ còn',
    titleMark: 'trống trơn nè',
    body: 'Kiếm một chiếc bánh xinh xỉu đi bạn ơi: tự thiết kế từng lớp, hoặc chọn một trong 6 mẫu ruột của tiệm.',
    design: 'Tự thiết kế bánh',
    menu: 'Xem menu bánh',
  },
  line: {
    quantity: (name: string) => `Số lượng ${name}`,
    fewer: (name: string) => `Bớt một ${name}`,
    more: (name: string) => `Thêm một ${name}`,
    each: (price: string) => `${price} một bánh`,
    remove: 'Xóa',
    lead: {
      menu: 'Đặt trước 4 giờ',
      custom: 'Đặt trước 24 giờ',
      tiered: 'Đặt trước 48 giờ',
    } satisfies Record<LeadKind, string>,
  },
  summary: {
    label: 'Đơn hàng',
    subtotal: 'Tiền bánh',
    shipping: 'Phí ship',
    shippingValue: 'Theo app',
    total: 'Tổng tiền bánh',
    shipNote:
      'Phí ship tính theo app (Grab, Be, Ahamove) lúc gọi xe, bạn trả khi nhận. Nhận tại tiệm thì khỏi tốn đồng nào.',
  },
  checkout: {
    title: 'Chốt đơn thôi',
    lead: {
      menu: 'Đơn này cần đặt trước 4 giờ',
      custom: 'Đơn này cần đặt trước 24 giờ vì có bánh tự thiết kế',
      tiered: 'Đơn này cần đặt trước 48 giờ vì có bánh 2 tầng',
    } satisfies Record<LeadKind, string>,
    holidayLead: 'Ngày lễ đông đơn lắm, nên ngày này cần đặt trước 48 giờ nha',
    sameDay: 'Bánh trong menu: muốn nhận trong ngày thì đặt trước 18:00 nha.',
    name: { label: 'Tên người nhận', hint: 'Tiệm ghi tên này lên hộp bánh.', placeholder: 'Ví dụ: Linh' },
    phone: {
      label: 'Số điện thoại',
      hint: 'Tiệm gọi hoặc nhắn Zalo để xác nhận đơn.',
      placeholder: '09xx xxx xxx',
    },
    method: {
      legend: 'Nhận bánh kiểu nào?',
      pickup: 'Nhận tại tiệm',
      delivery: 'Giao tận nơi',
      notes: {
        pickup: 'Khu Thủ Đức, mở cửa 6:30–22:45',
        delivery: 'Tiệm gọi Grab, Be hoặc Ahamove cho bạn',
      } satisfies Record<Method, string>,
    },
    address: {
      label: 'Địa chỉ giao',
      hint: 'Số nhà, đường, phường. Ghi thêm tên quận cũ cho shipper dễ tìm nha.',
      placeholder: 'Ví dụ: 12 Võ Văn Ngân, phường Thủ Đức',
    },
    delivery: {
      title: 'Ship khắp nội thành TP.HCM cũ',
      areas: 'Tiệm giao tới',
      fee: 'Phí ship tính theo app lúc gọi xe. Tiệm báo phí trước, bạn trả cho tài xế khi nhận.',
      car: 'Bánh 20 cm và bánh 2 tầng đi ô tô cho chắc, phí cao hơn xíu.',
    },
    date: {
      label: 'Ngày nhận',
      earliest: (day: string) => `Sớm nhất: ${day}`,
      none: 'Trong 30 ngày tới hết chỗ rồi, nhắn Kai nha.',
    },
    time: {
      label: 'Giờ nhận',
      choose: 'Chọn giờ',
      pickDate: 'Chọn ngày trước',
      none: 'Ngày này hết giờ trống, chọn ngày khác nha',
    },
    payment: {
      legend: 'Thanh toán',
      cod: 'Tiền mặt khi nhận (COD)',
      transfer: 'Chuyển khoản',
      momo: 'Ví MoMo',
      notes: {
        cod: 'Trả tiền mặt cho tiệm hoặc tài xế',
        transfer: 'Quét VietQR khi tiệm xác nhận đơn',
        momo: 'Tiệm gửi mã MoMo khi xác nhận đơn',
      } satisfies Record<Payment, string>,
      codWithDeposit: 'Đơn có cọc thì cọc qua chuyển khoản hoặc MoMo, phần còn lại trả khi nhận.',
    },
    deposit: {
      title: 'Cọc 50%',
      reasons: {
        tiered: 'có bánh 2 tầng',
        total: 'đơn từ 1.000.000đ',
        holiday: 'nhận vào ngày lễ',
      } satisfies Record<DepositReason, string>,
      because: (reasons: string) => `Đơn này cần cọc vì ${reasons}.`,
      now: 'Cọc trước',
      later: 'Trả khi nhận',
      none: 'Đơn này không cần cọc, trả khi nhận hoặc chuyển khoản đều được.',
    },
    note: {
      label: 'Nhắn tiệm (không bắt buộc)',
      placeholder: 'Ví dụ: ít ngọt thêm xíu nha tiệm',
    },
    errors: {
      name: {
        required: 'Cho tiệm xin tên người nhận nha.',
        tooShort: 'Tên cần ít nhất 2 ký tự.',
        tooLong: 'Tên tối đa 60 ký tự thôi.',
      },
      phone: {
        required: 'Cho tiệm xin số điện thoại để gọi xác nhận nha.',
        invalid: 'Số này chưa đúng: số di động Việt Nam có 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
      },
      method: { required: 'Chọn nhận tại tiệm hay giao tận nơi nha.' },
      address: {
        required: 'Giao tận nơi thì cần địa chỉ nha.',
        tooLong: 'Địa chỉ tối đa 200 ký tự.',
      },
      date: {
        required: 'Chọn ngày nhận bánh nha.',
        invalid: 'Ngày chưa đúng dạng, ví dụ 2026-12-24.',
        tooSoon: 'Ngày này gấp quá, tiệm làm không kịp. Chọn từ ngày sớm nhất ghi bên dưới nha.',
        tooFar: 'Tiệm chỉ nhận đơn trong 30 ngày tới thôi.',
      },
      time: {
        required: 'Chọn giờ nhận nha.',
        unavailable: 'Giờ này không kịp rồi, chọn giờ khác trong danh sách nha.',
      },
      payment: {
        required: 'Chọn cách thanh toán nha.',
        depositNeedsTransfer: 'Đơn có cọc thì cọc qua chuyển khoản hoặc MoMo nha.',
      },
      note: { tooLong: 'Lời nhắn tối đa 200 ký tự.' },
      summary: (n: number) => (n === 1 ? 'Còn 1 ô cần sửa ở trên nha.' : `Còn ${n} ô cần sửa ở trên nha.`),
    },
    demo: 'Tiệm không có thật nha: đây là đơn thử, không gửi đi đâu và không trừ tiền ai. Trang không hỏi thẻ ngân hàng, cũng không lưu tên, số điện thoại hay địa chỉ bạn nhập.',
    submitDemo: 'Chốt đơn thử',
    submitZalo: 'Gửi đơn qua Zalo',
    zaloManual: 'Trình duyệt không cho chép tự động. Bạn chép đoạn này rồi gửi Zalo cho tiệm nha.',
    zaloOpen: 'Mở Zalo của tiệm',
    zaloText: 'Nội dung đơn',
  },
  orderText: {
    title: (number: string) => `Kai's Bakery · Đơn ${number}`,
    name: 'Tên',
    phone: 'SĐT',
    pickup: 'Nhận tại tiệm',
    delivery: 'Giao tới',
    when: 'Nhận lúc',
    link: 'Xem bánh',
    total: 'Tổng tiền bánh',
    deposit: 'Cọc 50%',
    rest: 'còn lại',
    payment: 'Thanh toán',
    note: 'Ghi chú',
  },
  done: {
    eyebrow: (number: string) => `Đơn ${number}`,
    title: 'Đóng hộp xong,',
    titleMark: { pickup: 'chờ bạn tới lấy!', delivery: 'chờ ship tới nè!' } satisfies Record<Method, string>,
    waiting: (count: number, name: string) =>
      count === 1
        ? `Chiếc bánh của ${name} sẽ sẵn sàng lúc`
        : `${count} chiếc bánh của ${name} sẽ sẵn sàng lúc`,
    pickupWhere: 'Nhận tại tiệm, khu Thủ Đức.',
    deliveryWhere: (address: string) => `Giao tới: ${address}.`,
    receipt: 'Hóa đơn',
    total: 'Tổng tiền bánh',
    deposit: 'Cọc trước',
    rest: 'Trả khi nhận',
    shipping: 'Phí ship trả cho tài xế theo app.',
    payment: 'Thanh toán',
    phone: 'Số điện thoại',
    note: 'Lời nhắn',
    demo: 'Đơn thử thôi nha: không gửi đi đâu, không ai bị trừ tiền.',
    sent: 'Đơn đã được chép. Mở Zalo của tiệm, dán vào và gửi là tiệm gọi xác nhận liền.',
    design: 'Thiết kế thêm bánh',
    menu: 'Quay lại menu',
    boxLoading: 'Đang gấp hộp…',
  },
}

export type CartDict = typeof cart
