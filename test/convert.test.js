import { getImageHeightPt, pxToMm, ptToMm, mmToPx, mmToPt, getExportPixelWidth, getDataUrlExtension } from "../src/utils";

test('convert px to mm', () => {
  expect(pxToMm(100)).toBe(27)
  expect(pxToMm(100.3)).toBe(27)
  expect(pxToMm(300)).toBe(80)
  expect(pxToMm(300.75)).toBe(80)
  expect(pxToMm(800)).toBe(212)
  expect(pxToMm('hoge')).toBeNaN();
});

test('convert pt to mm', () => {
  expect(ptToMm(100)).toBe(36)
  expect(ptToMm(100.3)).toBe(36)
  expect(ptToMm(300)).toBe(106)
  expect(ptToMm(300.75)).toBe(107)
  expect(ptToMm(800)).toBe(283)
  expect(ptToMm('hoge')).toBeNaN();
});

test('convert mm to px', () => {
  expect(mmToPx(100)).toBe(378)
  expect(mmToPx(100.3)).toBe(380)
  expect(mmToPx(300)).toBe(1134)
  expect(mmToPx(300.75)).toBe(1137)
  expect(mmToPx(800)).toBe(3024)
  expect(mmToPx('hoge')).toBeNaN();
});

test('convert mm to pt', () => {
  expect(mmToPt(100)).toBe(284)
  expect(mmToPt(100.3)).toBe(285)
  expect(mmToPt(300)).toBe(851)
  expect(mmToPt(300.75)).toBe(853)
  expect(mmToPt(800)).toBe(2268)
  expect(mmToPt('hoge')).toBeNaN();
});

test('convert image pixel to row count', () => {
  expect(getImageHeightPt(100)).toBe(80)
  expect(getImageHeightPt(153)).toBe(130)
  expect(getImageHeightPt(654.32)).toBe(530)
  expect(getImageHeightPt('hoge')).toBeNaN(530)
});

test('convert display width to export pixel width', () => {
  // 表示幅360px = 3.75inch なので、300dpi なら 1125px 必要
  expect(getExportPixelWidth(360, 4000, 300)).toBe(1125)
  expect(getExportPixelWidth(360, 4000, 150)).toBe(563)
  expect(getExportPixelWidth(360, 4000, 600)).toBe(2250)
  expect(getExportPixelWidth(480, 4000, 300)).toBe(1500)
  // 96dpi は従来の挙動（表示サイズと同じピクセル数）と一致する
  expect(getExportPixelWidth(360, 4000, 96)).toBe(360)
  // 元画像より大きくはしない
  expect(getExportPixelWidth(360, 800, 300)).toBe(800)
  expect(getExportPixelWidth(360, 200, 300)).toBe(200)
  expect(getExportPixelWidth('hoge', 4000, 300)).toBeNaN()
});

test('get file extension from DataURL', () => {
  expect(getDataUrlExtension('data:image/jpeg;base64,AAAA')).toBe('jpg')
  expect(getDataUrlExtension('data:image/png;base64,AAAA')).toBe('png')
  expect(getDataUrlExtension('data:image/webp;base64,AAAA')).toBe('webp')
  expect(getDataUrlExtension('data:image/svg+xml;base64,AAAA')).toBe('svg+xml')
  // 判別できない場合は png にフォールバックする
  expect(getDataUrlExtension('https://example.com/a.jpg')).toBe('png')
  expect(getDataUrlExtension('')).toBe('png')
  expect(getDataUrlExtension(undefined)).toBe('png')
});
