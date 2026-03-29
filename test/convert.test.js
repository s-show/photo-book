import { getImageHeightPt, pxToMm, ptToMm, mmToPx, mmToPt } from "../src/utils";

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
