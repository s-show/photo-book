/**
 * ピクセルを Excel の行の高さのポイントに変換する（小数点以下切上げ）
 * @param {number} pixel - image height.
 * @returns {number}
 */
export function pxToPt(pixel) {
  return Number(Math.ceil(pixel * 72 / 96))
}

/**
 * Excel の行の高さのポイントをピクセルに変換する（小数点以下切上げ）
 * @param {number} point - image height.
 * @returns {number}
 */
export function ptToPx(point) {
  return Number(Math.ceil(point * 96 / 72))
}

/**
 * ピクセルをmmに変換する（小数点以下切上げ）
 * @param {number} pixel - image height.
 * @returns {number}
 */
export function pxToMm(pixel) {
  return Number(Math.ceil(pixel * 265 / 1000))
}

/**
 * ポイントをmmに変換する（小数点以下切上げ）
 * @param {number} pt - point value.
 * @returns {number}
 */
export function ptToMm(pt) {
  return Number(Math.ceil(pt * 25.4 / 72))
}

/**
 * mm をピクセルに変換する（小数点以下切上げ）
 * @param {number} mm
 * @returns {number}
 */
export function mmToPx(mm) {
  return Number(Math.ceil(mm * 96 / 25.4))
}

/**
 * mm を Excel の行の高さのポイントに変換する（小数点以下切上げ）
 * @param {number} mm
 * @returns {number}
 */
export function mmToPt(mm) {
  return Number(Math.ceil(mm * 72 / 25.4))
}

/**
 * 画像をセットするために必要な行の高さを返す（ポイント単位・10未満切上げ）
 * @param {number} pixel - image height.
 * @returns {number}
 */
export function getImageHeightPt(pixel) {
  const temp = Math.ceil(pixel * 8 / 10);
  return Number(Math.ceil(temp / 10) * 10);
}

/**
 * 表示幅（CSS ピクセル・96dpi 基準）を、指定した DPI で印刷するために必要な
 * 実ピクセル幅に換算する（小数点以下切上げ）。
 * 元画像より高い解像度は作れないため、元画像の幅を上限とする（引き伸ばさない）。
 * @param {number} displayWidth - 画面上の表示幅（CSSピクセル）
 * @param {number} naturalWidth - 元画像の実ピクセル幅
 * @param {number} dpi - 目標の印刷解像度
 * @returns {number}
 */
export function getExportPixelWidth(displayWidth, naturalWidth, dpi) {
  return Number(Math.min(Math.ceil(displayWidth * dpi / 96), naturalWidth));
}

/**
 * DataURL の MIME タイプから拡張子を求める（ExcelJS の `extension` 用）
 * @param {string} dataUrl
 * @returns {string} 判別できない場合は 'png'
 */
export function getDataUrlExtension(dataUrl) {
  const match = /^data:image\/([a-z0-9.+-]+)/i.exec(String(dataUrl ?? ''));
  if (!match) return 'png';
  const type = match[1].toLowerCase();
  return type === 'jpeg' ? 'jpg' : type;
}
