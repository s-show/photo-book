import './style.scss'
import * as ExcelJS from 'exceljs';
import TurndownService from 'turndown'
import markdownDocx, { Packer, styles } from 'markdown-docx';

// ファイルを DataURL として読み込むヘルパー
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
  });
}

// 画像ソースを一時退避するスタック
class TempImageStack {
  constructor() {
    this.images = [];
  }
  push(src) {
    this.images.push(src);
  }
  shift() {
    return this.images.shift();
  }
  clear() {
    this.images = [];
  }
}

class PhotoBookApp {
  constructor() {
    // DOM 要素取得
    this.addFileBtn = document.getElementById("addFileBtn");
    this.fileSelector = document.getElementById("fileSelector");
    this.imageList = document.getElementById("imageList");
    this.deleteFileBtn = document.getElementById("deleteFileBtn");
    this.exportWordBtn = document.getElementById("exportWordBtn");
    this.exportExcelBtn = document.getElementById("exportExcelBtn");
    this.printBtn = document.getElementById("printBtn");
    this.headerText = document.getElementById("headerTextInput");
    this.header = document.getElementById("header");
    this.imageWidthInput = document.getElementById("imageWidthInput");
    this.content = document.getElementById("content");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.openHelpBtn = document.getElementById('helpIcon');
    this.closeHelpBtn = document.getElementById('closeSidebar');
    this.helpSidebar = document.getElementById('helpSidebar');
    this.columnToggleBtn = document.getElementById('columnToggleBtn')

    this.tempStack = new TempImageStack();
    this.bindEvents();
  }

  bindEvents() {
    this.addFileBtn.addEventListener("click", () => this.fileSelector.click());
    this.fileSelector.addEventListener("change", (e) => this.handleFileSelection(e));
    this.imageList.addEventListener("dragstart", (e) => this.onDragStart(e));
    this.imageList.addEventListener("dragover", (e) => this.onDragOver(e));
    this.imageList.addEventListener("dragleave", (e) => this.onDragLeave(e));
    this.imageList.addEventListener("drop", (e) => this.onDrop(e));
    this.imageList.addEventListener("dblclick", (e) => this.onImageListDblClick(e));
    this.headerText.addEventListener("input", (e) => (this.header.innerText = e.target.value));
    this.imageWidthInput.addEventListener("input", (e) => this.onImageWidthChange(e));
    this.imageWidthInput.addEventListener("change", (e) => this.onImageWidthChange(e));
    this.deleteFileBtn.addEventListener("click", () => this.clearImages());
    this.printBtn.addEventListener("click", () => window.print());
    this.exportWordBtn.addEventListener("click", () => this.handleExportWord());
    this.exportExcelBtn.addEventListener("click", () => this.handleExportExcel());
    this.openHelpBtn.addEventListener('click', () => this.openHelp());
    this.closeHelpBtn.addEventListener('click', () => this.closeHelp());
    this.columnToggleBtn.addEventListener('change', (e) => this.changeColumnNuber(e));
    document.addEventListener('click', (e) => this.clickPage(e));
    window.addEventListener("load", () => this.finishLoading())
    window.addEventListener("beforeprint", () => this.handleBeforePrint());
    window.addEventListener("afterprint", () => this.handleAfterPrint());
  }

  async handleFileSelection(event) {
    const files = Array.from(event.target.files);
    if (!files.length) {
      console.log("No file selected.");
      return;
    }

    this.startLoading('画像読み込み中');
    try {
      const imageFiles = await Promise.all(files.map(readFileAsDataURL));
      imageFiles.sort((a, b) => a.name.localeCompare(b.name));
      this.createImageList(imageFiles);
      this.deleteFileBtn.classList.remove('disabled');
      this.exportWordBtn.classList.remove('disabled');
      this.exportExcelBtn.classList.remove('disabled');
      this.printBtn.classList.remove('disabled');
    } catch (err) {
      console.error(err);
    } finally {
      this.finishLoading();
    }
  }

  createImageList(imageFiles) {
    const fragment = document.createDocumentFragment();

    imageFiles.forEach(({ name, dataUrl }) => {
      const div = document.createElement("div");
      div.className = "imageDiv";
      div.id = `${name}_Div`;
      div.draggable = true;

      const img = document.createElement("img");
      img.className = "thumb";
      img.src = dataUrl;
      img.dataset.fileName = name;
      img.style.width = `${this.imageWidthInput.value}px`;

      const span = document.createElement("span");
      span.className = "imageCaption";
      span.id = `${name}_Span`;
      span.innerText = name;

      div.appendChild(img);
      div.appendChild(span);
      fragment.appendChild(div);
    });

    this.imageList.appendChild(fragment);
    this.deleteFileBtn.disabled = false;
    this.exportWordBtn.disabled = false;
    this.exportExcelBtn.disabled = false;
    this.printBtn.disabled = false;
  }

  startLoading(message = 'loading') {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('loadingMessage').classList.remove('hidden');
    document.getElementById('loadingMessage').innerText = message;
  }

  finishLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.getElementById('loadingMessage').classList.add('hidden');
  }

  onDragStart(event) {
    if (event.target.classList.contains("imageDiv")) {
      event.dataTransfer.setData("text/plain", event.target.id);
    }
  }

  onDragOver(event) {
    const target = event.target.closest(".imageDiv");
    if (!target) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    const isUpper = (event.clientY - rect.top) < (target.clientHeight / 2);
    target.style.borderTop = isUpper ? "20px solid blue" : "";
    target.style.borderBottom = !isUpper ? "20px solid blue" : "";
  }

  onDragLeave(event) {
    const target = event.target.closest(".imageDiv");
    if (!target) return;
    target.style.borderTop = "";
    target.style.borderBottom = "";
  }

  onDrop(event) {
    const target = event.target.closest(".imageDiv");
    if (!target) return;
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const dragged = document.getElementById(id);
    const rect = target.getBoundingClientRect();
    const isUpper = (event.clientY - rect.top) < (target.clientHeight / 2);

    target.parentNode.insertBefore(dragged, isUpper ? target : target.nextSibling);
    target.style.borderTop = "";
    target.style.borderBottom = "";
  }

  onImageListDblClick(event) {
    if (event.target.classList.contains("imageCaption")) {
      const newName = prompt("変更後のファイル名を入力してください", event.target.innerText);
      if (newName != null) event.target.innerText = newName;
      event.target.previousElementSibling.dataset.fileName = newName;
    } else if (event.target.classList.contains("thumb")) {
      event.target.parentNode.remove();
      if (!this.imageList.querySelector(".thumb")) {
        this.clearImages();
      }
    }
  }

  onImageWidthChange(event) {
    let width = `${event.target.value}px`;
    if (event.target.value >= 100) {
      this.imageList.querySelectorAll(".thumb").forEach((img) => {
        img.style.width = width;
      });
    } else if (event.target.value === '' && event.type === 'change') {
      width = '360px'
      this.imageList.querySelectorAll(".thumb").forEach((img) => {
        img.style.width = width;
      });
      this.imageWidthInput.value = '360';
    }
  }

  clearImages() {
    this.imageList.innerHTML = "";
    this.fileSelector.value = "";
    this.deleteFileBtn.classList.add('disabled');
    this.exportWordBtn.classList.add('disabled');
    this.exportExcelBtn.classList.add('disabled');
    this.printBtn.classList.add('disabled');
    this.tempStack.clear();
  }

  async handleExportWord() {
    this.startLoading('Wordファイル作成中');

    // ローディング画面を表示させるために少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (this.columnToggleBtn.checked) {
        window.alert('Word形式で出力する際、段組みは反映されません。');
      }
      this.header.innerText = this.headerText.value;
      const images = Array.from(this.imageList.querySelectorAll(".thumb"));
      images.forEach((img) => {
        this.tempStack.push(img.src);
        img.src = this.resizeImage(img, 1.0);
      });
      const htmlStr = new XMLSerializer().serializeToString(document.getElementById('imageList'));
      styles.markdown.heading1.paragraph = {
        keepNext: false,
        spacing: {
          before: 0,
          after: 0
        }
      }
      const markdown = this.convertHtmlToMarkdown(htmlStr);
      const docx = await markdownDocx(markdown);
      const blob = await Packer.toBlob(docx);
      let filename = prompt("ファイル名を入力してください", "photobook.docx");
      if (filename === null) {
        console.info('filename is null.')
        return
      } else if (filename === '') {
        console.info('filename is void.')
        filename = 'photobook.docx';
      }
      this.createDownloadLink(blob, filename);
      images.forEach((img) => {
        img.src = this.tempStack.shift();
      });
    } catch (error) {
      console.error('Word export failed:', error);
      alert('Wordファイルの作成に失敗しました。');
    } finally {
      this.finishLoading();
    }
  }

  async handleExportExcel() {
    this.startLoading('Excelファイル作成中');

    // ローディング画面を表示させるために少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('sheet1');
      const printAreaHeightMm = 241;
      let rowIndex = 1;
      let colIndex = 1;
      let printArea = printAreaHeightMm;
      let leftSideRowCount = 1;
      let leftSideImgHeight = 1;
      const title = this.headerText.value;
      worksheet.pageSetup = {
        // 上下左右の余白とヘッダー・フッターの位置を全て指定しないとExcelファイルが壊れる
        margins: {
          left: 1.0, right: 1.0,
          top: 1.0, bottom: 1.0,
          header: 0.3, footer: 0.3
        },
        orientation: 'portrait',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, // 0を指定すると「自動」になる
        printTitlesRow: '1:2',
      };
      worksheet.getCell(rowIndex, colIndex).value = title;
      worksheet.getCell(rowIndex, colIndex).font = {
        size: 14,
      };
      rowIndex += 2;
      // 奇数ページと偶数ページの両方に同じ設定をしないとフッターが表示されない
      worksheet.headerFooter.oddFooter = "&P / &N ページ";
      worksheet.headerFooter.evenFooter = "&P / &N ページ";
      worksheet.properties.defaultRowHeight = 15;

      const images = Array.from(this.imageList.querySelectorAll(".thumb"));
      const filterdImages = images.filter(img => {
        return printAreaHeightMm - this.pxToMm(img.clientHeight) - this.ptToMm(15) > 0
      });
      const removedImages = images.filter(img => {
        return printAreaHeightMm - this.pxToMm(img.clientHeight) - this.ptToMm(15) < 0
      });
      removedImages.forEach(img => window.alert(`${img.dataset.fileName} は Excel の1ページの印刷可能範囲を超えていますので出力しません。`))
      filterdImages.forEach((img, index, array) => {
        // 現在の画像が単独で印刷可能範囲に収まらない場合
        // if (this.getImageRowHeightMm(img.clientHeight) > printAreaHeightMm) {
        //   window.alert(`${img.dataset.fileName} は Excel の1ページの印刷可能範囲を超えていますので出力しません。`)
        //   return
        // } else {
        const imgWidth = img.clientWidth;
        const imgHeight = img.clientHeight;
        const imgFileName = img.dataset.fileName;
        const nextImgHeight = index < array.length - 1 ? array[index + 1].clientHeight : 0;

        const imageId = workbook.addImage({
          base64: this.resizeImage(img, 1.0),
          extension: 'png',
        })
        worksheet.addImage(imageId, {
          tl: {
            col: colIndex - 1 + 0.1,
            row: rowIndex + 0.1,
          },
          ext: {
            width: imgWidth,
            height: imgHeight
          },
          editAs: 'undefined',
        })

        // 2列表示の場合の処理
        if (this.columnToggleBtn.checked) {
          const needRowCount = Math.ceil(imgHeight / 16);
          console.table({
            'filename': img.dataset.fileName,
            'imgHeight': imgHeight,
            'imgHeightMm': this.pxToMm(imgHeight),
            'printArea': printArea,
            'needRowCount': needRowCount,
          });

          const fileNameCell = worksheet.getCell(rowIndex, colIndex);
          fileNameCell.value = imgFileName;
          fileNameCell.alignment = { shrinkToFit: true };
          fileNameCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
          worksheet.getColumn(colIndex).width = imgWidth / 6.5;
          worksheet.mergeCells(
            rowIndex + 1,
            colIndex,
            rowIndex + needRowCount,
            colIndex
          )
          worksheet.getCell(rowIndex + 1, colIndex).border = {
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          if (colIndex === 1) {
            leftSideRowCount = needRowCount;
            leftSideImgHeight = imgHeight;
            // 次の画像の高さに応じて改ページを挿入する処理
            // 最後の画像では不要な処理なので、最後の画像の1つ手前で処理を分岐している。
            if (index < array.length - 1) {
              // 次の画像は単独だと印刷可能範囲に収まる（空行とファイル名の行の高さを考慮する）
              if (printAreaHeightMm - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) > 0) {
                // 次の画像が残りの印刷可能範囲に収まらない（空行とファイル名の行の高さを考慮する）
                if (printArea - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) < 0) {
                  worksheet.getRow(rowIndex + needRowCount).addPageBreak();
                  // 空行を追加するために `+1` している
                  rowIndex += needRowCount + 1;
                  colIndex = 1;
                  printArea = printAreaHeightMm;
                } else {
                  colIndex = 3;
                }
              }
            }
          } else {
            // 右側の列の処理
            if (imgHeight > leftSideImgHeight) {
              printArea -= this.pxToMm(imgHeight);
            } else {
              printArea -= this.pxToMm(leftSideImgHeight);
            }
            // 次の画像の高さに応じて改ページを挿入する処理
            // 最後の画像では不要な処理なので、最後の画像の1つ手前で処理を分岐している。
            if (index < array.length - 1) {
              // 次の画像は単独だと印刷可能範囲に収まる（空行とファイル名の行の高さを考慮する）
              if (printAreaHeightMm - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) > 0) {
                // 次の画像が残りの印刷可能範囲に収まらない（空行とファイル名の行の高さを考慮する）
                if (printArea - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) < 0) {
                  if (needRowCount > leftSideRowCount) {
                    worksheet.getRow(rowIndex + needRowCount).addPageBreak();
                    rowIndex += needRowCount + 2;
                  } else {
                    worksheet.getRow(rowIndex + leftSideRowCount).addPageBreak();
                    rowIndex += leftSideRowCount + 2;
                  }
                  printArea = printAreaHeightMm;
                } else {
                  if (needRowCount > leftSideRowCount) {
                    rowIndex += needRowCount + 2;
                  } else {
                    rowIndex += leftSideRowCount + 2;
                  }
                }
                colIndex = 1;
              }
            }
          }
        } else {
          // 1列表示の場合の処理
          const needRowCount = Math.ceil(imgHeight / 16);
          // printArea -= (this.pxToMm(imgHeight) + this.ptToMm(15 * 1));
          printArea -= this.ptToMm(Math.ceil(imgHeight / 16) * 15);
          console.table({
            'filename': img.dataset.fileName,
            'imgHeight': imgHeight,
            'nextImgHeight': nextImgHeight,
            'pxToMm': this.pxToMm(imgHeight) + this.ptToMm(15),
            'ptToMm': this.ptToMm(Math.ceil(imgHeight) / 16 * 15),
            'printArea': printArea,
            'needRowCount': needRowCount,
          });

          // 次の画像の高さに応じて改ページを挿入する処理
          // 最後の画像では不要な処理なので、最後の画像の1つ手前で処理を分岐している。
          if (index < array.length - 1) {
            // 次の画像は単独だと印刷可能範囲に収まる（空行とファイル名の行の高さを考慮する）
            if (printAreaHeightMm - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) > 0) {
              // 次の画像が残りの印刷可能範囲に収まらない場合（空行とファイル名の行の高さを考慮する）
              if (printArea - this.ptToMm(Math.ceil(nextImgHeight / 16) * 15) < 0) {
                worksheet.getRow(rowIndex + needRowCount).addPageBreak();
                printArea = printAreaHeightMm;
              }
            }
          }
          worksheet.getColumn(colIndex).width = imgWidth / 6.5;
          worksheet.mergeCells(
            rowIndex,
            colIndex,
            rowIndex + needRowCount,
            colIndex
          )
          worksheet.getCell(rowIndex, colIndex).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          worksheet.getCell(rowIndex, colIndex + 1).value = imgFileName;
          worksheet.getCell(rowIndex, colIndex + 1).alignment = {
            vertical: 'top',
            wrapText: true,
          };
          worksheet.getColumn(colIndex + 1).width = 15;
          worksheet.mergeCells(
            rowIndex,
            colIndex + 1,
            rowIndex + (this.pxToPt(imgHeight) / 15) - 1,
            colIndex + 1
          )
          rowIndex += needRowCount + 2;
        }
        // }
      });

      const uint8Array = await workbook.xlsx.writeBuffer();
      const blob = new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      let filename = prompt("ファイル名を入力してください", "photobook.xlsx");
      if (filename === null) {
        console.error('filename is null.')
        return
      } else if (filename === '') {
        console.error('filename is void.')
        filename = 'photobook.xlsx';
      }
      this.createDownloadLink(blob, filename);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excelファイルの作成に失敗しました。');
    } finally {
      this.finishLoading();
    }
  }

  handleBeforePrint() {
    this.header.innerText = this.headerText.value;
    this.imageList.querySelectorAll(".thumb").forEach((img) => {
      this.tempStack.push(img.src);
      img.src = this.resizeImage(img, 1.0);
    });
    document.documentElement.style.setProperty('--headerText', `"${this.headerText.value}"`)
  }

  handleAfterPrint() {
    this.imageList.querySelectorAll(".thumb").forEach((img) => {
      img.src = this.tempStack.shift();
    });
  }

  resizeImage(image, ratio) {
    const canvas = document.createElement("canvas");
    canvas.width = image.clientWidth * ratio;
    canvas.height = image.clientHeight * ratio;
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  changeColumnNuber(event) {
    const imageList = document.getElementById('imageList');
    if (event.target.checked) {
      imageList.classList.add('twoColumn');
    } else {
      imageList.classList.remove('twoColumn');
    }
  }

  createDownloadLink(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  openHelp() {
    document.getElementById('helpSidebar').classList.toggle('active');
  }

  closeHelp() {
    document.getElementById('helpSidebar').classList.remove('active');
  }

  clickPage(event) {
    if (!this.helpSidebar.contains(event.target) &&
      !this.openHelpBtn.contains(event.target) &&
      this.helpSidebar.classList.contains('active')) {
      this.helpSidebar.classList.remove('active')
    }
  }

  convertHtmlToMarkdown(htmlString) {
    try {
      // Initialize Turndown with custom options
      const turndownService = new TurndownService({
        headingStyle: 'setext',
        codeBlockStyle: 'fenced',
        emDelimiter: '_',
        hr: '---',
        bulletListMarker: '-',
        strongDelimiter: '**',
      });
      // Remove scripts, styles, and other unwanted elements
      turndownService.remove(['script', 'style', 'noscript', 'iframe']);
      // Convert the HTML to Markdown
      const markdown = turndownService.turndown(htmlString);
      return markdown;
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error);
      return '';
    }
  }

  /**
   * ピクセルを Excel の行の高さのポイントに変換する
   * @param {number} pixel - image height.
   * @returns {number}
   */
  pxToPt(pixel) {
    return Number(pixel * 0.75)
  }

  /**
   * ピクセルをmmに変換する
   * @param {number} pixel - image height.
   * @returns {number}
   */
  pxToMm(pixel) {
    return Number(pixel * 0.265)
  }

  /**
   * ポイントをmmに変換する
   * @param {number} pixel - image height.
   * @returns {number}
   */
  ptToMm(pixel) {
    return Number(pixel * 0.35)
  }

  /**
   * 画像をセットするために必要な行の高さを返す（ミリ単位）
   * @param {number} height - image height.
   * @returns {number}
   */
  getImageRowHeightMm(height) {
    return Number(
      // this.pxToMm(height) + this.ptToMm(15 * 2.5)
      this.ptToMm(Math.ceil(height / 16) * 15)
    )
  }

}

new PhotoBookApp();
