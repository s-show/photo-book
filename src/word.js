import { AlignmentType, Document, Footer, Header, ImageRun, PageNumber, Paragraph, TextRun } from 'docx'

/**
 * 写真帳の Word 文書を作成する。
 * @param {string} headerText - 各ページのヘッダーに表示する文字列
 * @param {{dataUrl: string, extension: 'jpg' | 'png' | 'gif' | 'bmp', width: number, height: number, caption: string}[]} images
 * @returns {Document}
 */
export function createWordDocument(headerText, images) {
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: headerText,
            size: 32,
          }),
        ],
      }),
    ],
  })
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun('/'),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
          new TextRun(' ページ'),
        ],
      }),
    ],
  })

  const children = images.map(({ dataUrl, extension, width, height, caption }) => (
    new Paragraph({
      children: [
        new ImageRun({
          type: extension,
          data: dataUrl,
          transformation: { width, height },
          altText: {
            title: caption,
            description: caption,
            name: caption,
          },
        }),
        new TextRun(caption),
      ],
    })
  ))

  return new Document({
    sections: [{
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  })
}
