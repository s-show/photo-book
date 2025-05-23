import * as ExcelJS from 'exceljs';

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
      img.dataset.fileName = name.replace(/\.[^/.]+$/, "");
      img.style.width = `${this.imageWidthInput.value}px`;

      const span = document.createElement("span");
      span.className = "imageCaption";
      span.id = `${name}_Span`;
      span.innerText = name.replace(/\.[^/.]+$/, "");

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
    const images = Array.from(this.imageList.querySelectorAll(".thumb"));
    images.forEach((img) => {
      this.tempStack.push(img.src);
      img.src = this.resizeImage(img, 1.0);
    });

    const title = this.header.innerText;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body>${title}<p>&nbsp;</p>${this.imageList.innerHTML}</body>
      </html>`.trim();

    const blob = new Blob([html], { type: "application/vnd.ms-word;charset=utf-8" });
    let filename = prompt("ファイル名を入力してください", "photobook.doc") || "photobook.doc";
    const url = URL.createObjectURL(blob);
    this.createDownloadLink(blob, filename);

    images.forEach((img) => {
      img.src = this.tempStack.shift();
    });
  }

  async handleExportExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('sheet1');
    const title = this.header.innerText;
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

    const images = Array.from(this.imageList.querySelectorAll(".thumb"));
    images.forEach((img) => {
      const imageId = workbook.addImage({
        base64: this.resizeImage(img, 1.0),
        extension: 'png',
      })
      worksheet.addImage(imageId, {
        tl: { col: 0, row: rowIndex },
        ext: { width: img.clientWidth, height: img.clientHeight }
      })
      worksheet.getColumn('A').width = img.clientWidth / 7;
      worksheet.getRow(rowIndex + 1).height = img.clientHeight * 1.40;
      worksheet.getCell(`B${rowIndex + 1}`).value = img.dataset.fileName;
      worksheet.getCell(`B${rowIndex + 1}`).alignment = {
        vertical: 'top',
        wrapText: true,
      };
      rowIndex += 2;
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
    this.imageList.querySelectorAll(".thumb").forEach((img) => {
      this.tempStack.push(img.src);
      img.src = this.resizeImage(img, 2.0);
    });
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
}

new PhotoBookApp();


