import './style.css'
import './menu.css'
import './help.css'
import './loading.css'
import './print.css'
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
    this.headerText = document.getElementById("headerText");
    this.header = document.getElementById("header");
    this.imageWidthInput = document.getElementById("imageWidth");
    this.loadingMessage = document.getElementById("loadingMessage");
    this.content = document.getElementById("content");
    this.loading = document.getElementById("loading");
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
    window.addEventListener("beforeprint", () => this.handleBeforePrint());
    window.addEventListener("afterprint", () => this.handleAfterPrint());
  }

  async handleFileSelection(event) {
    const files = Array.from(event.target.files);
    if (!files.length) {
      console.log("No file selected.");
      return;
    }

    this.toggleLoading(true);
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
      this.toggleLoading(false);
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

  toggleLoading(active) {
    this.content.classList.toggle("loadingWrapper", active);
    this.loading.classList.toggle("loading", active);
    this.loadingMessage.style.display = active ? "block" : "none";
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
    let filename = prompt("ファイル名を入力してください", "photobook.xlsx");
    if (filename === null) {
      console.info('filename is null.')
      return
    } else if (filename === '') {
      console.info('filename is void.')
      filename = 'photobook.xlsx';
    }
    this.createDownloadLink(blob, filename);
    images.forEach((img) => {
      img.src = this.tempStack.shift();
    });
  }

  async handleExportExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('sheet1');
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
      printTitlesRow: '1:1',
    };
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = {
      size: 14,
    };
    let rowIndex = 2;
    let colIndex = 0;

    const images = Array.from(this.imageList.querySelectorAll(".thumb"));
    images.forEach((img) => {
      const imageId = workbook.addImage({
        base64: this.resizeImage(img, 1.0),
        extension: 'png',
      })
      if (this.columnToggleBtn.checked) {
        if (colIndex === 0) {
          worksheet.addImage(imageId, {
            tl: { col: colIndex, row: rowIndex },
            ext: {
              width: img.clientWidth,
              height: img.clientHeight
            }
          })
          worksheet.getColumn('A').width = img.clientWidth / 7;
          worksheet.getRow(rowIndex + 1).height = img.clientHeight;
          worksheet.getCell(`A${rowIndex + 2}`).value = img.dataset.fileName;
          worksheet.getCell(`A${rowIndex + 2}`).alignment = {
            vertical: 'top',
            wrapText: true,
          };
          colIndex = 2;
        } else {
          worksheet.addImage(imageId, {
            tl: { col: colIndex, row: rowIndex },
            ext: {
              width: img.clientWidth,
              height: img.clientHeight
            }
          })
          worksheet.getColumn('C').width = img.clientWidth / 7;
          const rowHeight = worksheet.getRow(rowIndex + 1).height;
          worksheet.getRow(rowIndex + 1).height = rowHeight < img.clientHeight ? img.clientHeight : rowHeight;
          worksheet.getCell(`C${rowIndex + 2}`).value = img.dataset.fileName;
          worksheet.getCell(`C${rowIndex + 2}`).alignment = {
            vertical: 'top',
            wrapText: true,
          };
          colIndex = 0;
          rowIndex += 2;
        }
      } else {
        worksheet.addImage(imageId, {
          tl: { col: 0, row: rowIndex },
          ext: { width: img.clientWidth, height: img.clientHeight }
        })
        worksheet.getColumn('A').width = img.clientWidth / 7;
        worksheet.getRow(rowIndex + 1).height = img.clientHeight;
        worksheet.getCell(`B${rowIndex + 1}`).value = img.dataset.fileName;
        worksheet.getCell(`B${rowIndex + 1}`).alignment = {
          vertical: 'top',
          wrapText: true,
        };
        rowIndex += 2;
      }
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    let filename = prompt("ファイル名を入力してください", "photobook.xlsx");
    if (filename === null) {
      console.info('filename is null.')
      return
    } else if (filename === '') {
      console.info('filename is void.')
      filename = 'photobook.xlsx';
    }
    this.createDownloadLink(blob, filename);
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

}

new PhotoBookApp();

