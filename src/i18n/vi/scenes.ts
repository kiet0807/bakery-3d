/** Words inside or about the 3D scenes (labels for screen readers, the box print, photo mode). Owned by the 3D agent. */
export const scenes = {
  loading: 'Đang nướng cảnh 3D…',
  fallback: 'Máy này chưa chạy được 3D, nên tiệm vẽ tạm chiếc bánh nè. Đặt bánh vẫn chạy ngon lành nha.',
  design:
    'Chiếc bánh bạn đang thiết kế, hiện bằng 3D. Kéo để xoay quanh bánh, cuộn chuột hoặc chụm hai ngón để phóng to, thu nhỏ.',
  story:
    'Một chiếc bánh kem dâu hồng nằm chill trên đám mây trắng giữa trời sáng. Cuộn trang thì camera bay quanh bánh, rồi một miếng bánh trượt ra khoe từng lớp bên trong.',
  vitrine: (count: number, name: string) =>
    `Tủ kính xoay với ${count} chiếc bánh trên đế sứ trắng. ${name} đang ở phía trước, chuông kính đã nhấc lên cho bạn ngắm.`,
  box: "Bánh của bạn được hạ vào hộp trắng in chữ Kai's Bakery. Bốn cạnh gập lên, nắp đóng lại, rồi ruy băng thắt nơ xinh xỉu.",
  /** Printed on the lid of the box, in the script face. */
  boxName: "Kai's",
  boxLine: 'Bakery',
}

export type ScenesDict = typeof scenes
