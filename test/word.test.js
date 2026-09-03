import { Packer } from 'docx'
import JSZip from 'jszip'
import { createWordDocument } from '../src/word.js'

const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test('Word文書の各ページ用ヘッダーにタイトルを出力する', async () => {
  const document = createWordDocument('写真帳 & 記録', [{
    dataUrl: onePixelPng,
    extension: 'png',
    width: 360,
    height: 270,
    caption: 'sample.png',
  }])

  const archive = await JSZip.loadAsync(await Packer.toBuffer(document))
  const headerXml = await archive.file('word/header1.xml').async('string')
  const documentXml = await archive.file('word/document.xml').async('string')
  const relationshipsXml = await archive.file('word/_rels/document.xml.rels').async('string')

  expect(headerXml).toContain('写真帳 &amp; 記録')
  expect(documentXml).toContain('<w:headerReference w:type="default"')
  expect(documentXml).not.toContain('写真帳')
  expect(relationshipsXml).toContain('relationships/header')
})

test('Word文書の各ページ用フッターに現在ページ数と総ページ数を出力する', async () => {
  const document = createWordDocument('写真帳', [{
    dataUrl: onePixelPng,
    extension: 'png',
    width: 360,
    height: 270,
    caption: 'sample.png',
  }])

  const archive = await JSZip.loadAsync(await Packer.toBuffer(document))
  const footerXml = await archive.file('word/footer1.xml').async('string')
  const documentXml = await archive.file('word/document.xml').async('string')
  const relationshipsXml = await archive.file('word/_rels/document.xml.rels').async('string')

  expect(footerXml).toContain('PAGE')
  expect(footerXml).toContain('NUMPAGES')
  expect(footerXml).toContain('<w:t xml:space="preserve">/</w:t>')
  expect(footerXml).toContain('<w:t xml:space="preserve"> ページ</w:t>')
  expect(documentXml).toContain('<w:footerReference w:type="default"')
  expect(relationshipsXml).toContain('relationships/footer')
})

test('画像とキャプションを本文の同じ段落に出力する', async () => {
  const document = createWordDocument('写真帳', [{
    dataUrl: onePixelPng,
    extension: 'png',
    width: 360,
    height: 270,
    caption: 'sample.png',
  }])

  const archive = await JSZip.loadAsync(await Packer.toBuffer(document))
  const documentXml = await archive.file('word/document.xml').async('string')
  const mediaFiles = archive.file(/^word\/media\//)

  expect(documentXml).toContain('sample.png')
  expect(documentXml).toContain('cx="3429000"')
  expect(documentXml).toContain('cy="2571750"')
  expect(mediaFiles).toHaveLength(1)
})
