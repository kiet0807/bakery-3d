import type { DripId, FillingId, FrostingId, SizeId, SpongeId, Sweetness, ToppingId } from '@/lib/cake'
import type { PresetId } from '@/lib/presets'

interface Words {
  name: string
  note: string
}

/** Names and one-line notes for every choice in `src/lib/cake.ts`, and the house cakes in `presets.ts`. */
export const cake = {
  kinds: {
    size: 'Cỡ bánh',
    sponge: 'Cốt bánh',
    filling: 'Nhân',
    frosting: 'Kem phủ',
    drip: 'Sốt chảy',
    topping: 'Trang trí',
    sweetness: 'Độ ngọt',
    candles: 'Nến',
    message: 'Chữ trên bánh',
  },
  sizes: {
    bento: { name: 'Bento 10 cm', note: 'Hộp xinh cầm tay, đủ cho bạn và bestie' },
    s14: { name: '14 cm', note: 'Hẹn hò hay nhóm nhỏ là vừa đẹp' },
    s16: { name: '16 cm', note: 'Size quốc dân, ai cũng chọn' },
    s18: { name: '18 cm', note: 'Đủ cho cả phòng ban quẩy' },
    s20: { name: '20 cm', note: 'Tiệc to, đông vui hết nấc' },
    tier2: { name: '2 tầng', note: 'Main character của mọi bữa tiệc' },
  } satisfies Record<SizeId, Words>,
  sponges: {
    vanilla: { name: 'Vani', note: 'Mềm xốp, thơm bơ, chuẩn vị tuổi thơ' },
    chocolate: { name: 'Socola', note: 'Đậm đà, ẩm mịn, ăn là dính' },
    'red-velvet': { name: 'Red velvet', note: 'Đỏ quyến rũ, chua nhẹ kiểu sang chảnh' },
    matcha: { name: 'Trà xanh matcha', note: 'Thơm trà, đắng nhẹ, ngọt hậu' },
    taro: { name: 'Khoai môn', note: 'Tím mộng mơ, bùi bùi béo béo' },
  } satisfies Record<SpongeId, Words>,
  fillings: {
    'vanilla-cream': { name: 'Kem tươi vani', note: 'Nhẹ tênh, ít ngọt' },
    'strawberry-jam': { name: 'Mứt dâu', note: 'Dâu Đà Lạt nấu tay, chua chua ngọt ngọt' },
    'chocolate-ganache': { name: 'Ganache socola', note: 'Socola đen 70%, mượt như nhung' },
    'salted-caramel': { name: 'Caramel muối', note: 'Mặn ngọt cân bằng, ghiền xỉu' },
    'fresh-mango': { name: 'Xoài tươi', note: 'Xoài cát chín cây, mọng nước' },
  } satisfies Record<FillingId, Words>,
  frostings: {
    'cloud-white': { name: 'Trắng sữa', note: 'Trắng tinh như mây' },
    'strawberry-milk': { name: 'Hồng dâu', note: 'Màu từ bột dâu sấy' },
    pistachio: { name: 'Hạt dẻ cười', note: 'Bùi béo, xanh xinh' },
    cocoa: { name: 'Socola sữa', note: 'Ngọt dịu, nâu ấm' },
    'taro-purple': { name: 'Tím khoai môn', note: 'Tím pastel chuẩn aesthetic' },
    'butter-yellow': { name: 'Vàng chanh', note: 'Thơm vỏ chanh, tươi tỉnh' },
  } satisfies Record<FrostingId, Words>,
  drips: {
    none: { name: 'Không sốt', note: 'Gọn gàng, tối giản' },
    'dark-chocolate': { name: 'Socola đen', note: 'Bóng loáng, chảy tràn' },
    caramel: { name: 'Caramel', note: 'Nấu chậm, thơm lừng' },
    strawberry: { name: 'Sốt dâu', note: 'Hồng đậm, chua ngọt' },
    'white-chocolate': { name: 'Socola trắng', note: 'Mượt mà, ngọt nhẹ' },
  } satisfies Record<DripId, Words>,
  toppings: {
    strawberries: { name: 'Dâu tây Đà Lạt', note: 'Tươi rói, đỏ mọng' },
    blueberries: { name: 'Việt quất', note: 'Từng chùm tím xanh' },
    macarons: { name: 'Macaron', note: '4 chiếc pastel' },
    cherries: { name: 'Cherry', note: 'Còn nguyên cuống' },
    'cream-kisses': { name: 'Bông kem', note: 'Bắt quanh bánh, miễn phí' },
    'chocolate-shards': { name: 'Socola miếng', note: 'Bẻ tay, giòn tan' },
    sprinkles: { name: 'Cốm cầu vồng', note: 'Rắc cho đời thêm màu' },
    'gold-leaf': { name: 'Lá vàng ăn được', note: 'Flex nhẹ một chút' },
  } satisfies Record<ToppingId, Words>,
  sweetness: {
    less: { name: 'Ít ngọt', note: 'Mặc định của tiệm' },
    regular: { name: 'Ngọt vừa', note: 'Cho hội hảo ngọt' },
  } satisfies Record<Sweetness, Words>,
  presets: {
    'strawberry-cloud': {
      name: 'Dâu Tây Mây Hồng',
      tagline: 'Best seller nhà Kai: cốt vani, mứt dâu, kem hồng và dâu tươi rói.',
    },
    'choco-crush': {
      name: 'Socola Crush',
      tagline: 'Socola chồng socola, thêm cherry. Hội mê socola khó mà thoát.',
    },
    'bestie-bento': {
      name: 'Bento Bestie',
      tagline: 'Hộp nhỏ xinh cho bestie, viết sẵn "HPBD bestie", muốn đổi chữ thì cứ đổi.',
    },
    'taro-dream': {
      name: 'Khoai Môn Mộng Mơ',
      tagline: 'Cốt khoai môn tím, macaron pastel, rắc thêm cốm cho vui.',
    },
    'caramel-crown': {
      name: 'Vương Miện Caramel',
      tagline: 'Hai tầng caramel muối và lá vàng. Tiệc lớn thì bánh cũng phải lên đồ.',
    },
    'rainbow-birthday': {
      name: 'Sinh Nhật Cầu Vồng',
      tagline: 'Sốt dâu, cốm cầu vồng, 5 cây nến và lời chúc ngay trên bánh.',
    },
  } satisfies Record<PresetId, { name: string; tagline: string }>,
  /** Shown for a cart line or a design that is not one of the house cakes. */
  yourDesign: 'Bánh bạn tự thiết kế',
  candles: (n: number) => `${n} nến`,
  quoted: (message: string) => `“${message}”`,
}

export type CakeDict = typeof cake
