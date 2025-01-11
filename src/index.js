document.getElementById("addFileBtn").addEventListener("click", (e) => {
  document.getElementById("fileSelector").click();
});
document.getElementById("fileSelector").addEventListener("change", (ev) => {
  if (ev.target.files.length == 0) {
    return;
  }
  let readErrorCount = 0;
  let readSuccessCount = 0;
  let readNotImageCount = 0;
  let readFileCount = 0;
  let imageFiles = [];
  const imageCountSpan = document.getElementById("imageCount");
  const readSuccessCountSpan = document.getElementById("readSuccessCount");
  const readErrorCountSpan = document.getElementById("readErrorCount");
  const readNotImageCountSpan = document.getElementById("readNotImageCount");
  // 読み込むファイルの拡張子を指定
  const fileTypes = ["jpg", "jpeg", "png", "bmp", "gif", "heic"];

  imageCountSpan.innerText = 0;
  readSuccessCountSpan.innerText = 0;
  readErrorCountSpan.innerText = 0;
  readNotImageCountSpan.innerText = 0;

  toggleLoadingAnimation(true);
  imageCountSpan.innerText = ev.target.files.length;

  Array.from(ev.target.files).forEach((file) => {
    // まず拡張子で画像ファイルか判断し、読み込み後にマジックナンバーを確認して
    // img.src に読み込ませるか判断する。
    let extension = file.name.split(".").pop().toLowerCase();
    let isImageExtension = fileTypes.indexOf(extension) > -1;
    if (!isImageExtension) {
      ++readNotImageCount;
      console.log("not image file: " + readNotImageCount);
      readNotImageCountSpan.innerText = readNotImageCount;
      return;
    }

    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.addEventListener(
      "loadstart",
      (() => {
        console.log("loading: " + file.name);
      })(file),
    );
    fileReader.addEventListener("error", () => {
      ++readErrorCount;
      console.error("read error: " + readErrorCount);
      readFileCount = readSuccessCount + readErrorCount;
      readErrorCountSpan.innerText = readErrorCount;
      if (readFileCount == ev.target.files.length) {
        imageListDom(imageFiles);
      }
    });
    fileReader.addEventListener(
      "load",
      (() => {
        return (e) => {
          if (!getImageFormat(e.target.result)) {
            ++readNotImageCount;
            console.warn(file.name + " is not image file.");
            console.warn("not image file: " + readNotImageCount);
            readNotImageCountSpan.innerText = readNotImageCount;
          } else {
            let imageFile = { name: "", image: "" };
            ++readSuccessCount;
            readSuccessCountSpan.innerText = readSuccessCount;
            imageFile.name = file.name;
            imageFile.image = e.target.result;
            imageFiles.push(imageFile);
          }
          readFileCount = readSuccessCount + readErrorCount + readNotImageCount;
          if (readFileCount == ev.target.files.length) {
            imageListDom(imageFiles);
            toggleLoadingAnimation(false);
          }
        };
      })(file),
    );
  });
});

// ドラッグで順番を入れ替える処理
const elm = document.getElementById("imageList");
elm.addEventListener("dragstart", (event) => {
  if (event.target.classList.contains("imageDiv")) {
    // console.info('dragstart start.');
    event.dataTransfer.setData("text/plain", event.target.id);
  }
});
elm.addEventListener("dragover", (event) => {
  let underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    event.preventDefault();
    let rect = underImage.getBoundingClientRect();
    if ((event.clientY - rect.top) < (underImage.clientHeight / 2)) {
      // console.info(rect.top);
      //マウスカーソルの位置が要素の半分より上
      underImage.style.borderTop = "20px solid blue";
      underImage.style.borderBottom = "";
    } else {
      //マウスカーソルの位置が要素の半分より下
      underImage.style.borderTop = "";
      underImage.style.borderBottom = "20px solid blue";
    }
  }
});
elm.addEventListener("dragleave", (event) => {
  let underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    underImage.style.borderTop = "";
    underImage.style.borderBottom = "";
  }
});
elm.addEventListener("drop", (event) => {
  let underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    event.preventDefault();
    let id = event.dataTransfer.getData("text/plain");
    let elm_drag = document.getElementById(id);

    let rect = underImage.getBoundingClientRect();
    if ((event.clientY - rect.top) < (underImage.clientHeight / 2)) {
      //マウスカーソルの位置が要素の半分より上
      underImage.parentNode.insertBefore(elm_drag, underImage);
    } else {
      //マウスカーソルの位置が要素の半分より下
      underImage.parentNode.insertBefore(elm_drag, underImage.nextSibling);
    }
    underImage.style.borderTop = "";
    underImage.style.borderBottom = "";
  }
});
 
// 写真横のファイル名を変更する処理と写真の個別削除
elm.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("imageCaption")) {
    let result = prompt("変更後のファイル名を入力してください");
    if (result != null) {
      document.getElementById(e.target.id).innerText = result;
    }
  } else if (e.target.classList.contains("thumb")) {
    elm.removeChild(e.target.parentNode);
    let imageCount = document.getElementById("imageCount").innerText;
    let readSuccessCount =
      document.getElementById("readSuccessCount").innerText;
    --imageCount;
    --readSuccessCount;
    document.getElementById("imageCount").innerText = imageCount;
    document.getElementById("readSuccessCount").innerText = readSuccessCount;
  }
});

// ヘッダーとして表示する文字列の設定
document.getElementById("headerText").addEventListener("input", (e) => {
  document.getElementById("header").innerText = e.target.value;
});

// 画像の幅を動的に変更する設定（表示と印刷両方を同時に変更）
document.getElementById("imageWidth").addEventListener("input", (e) => {
  const thumbClass = document.querySelectorAll('.thumb');
  thumbClass.forEach((elem) => {
    elem.style.setProperty('width', e.target.value + 'px');
    console.log(elem.clientWidth);
    console.log(elem.clientHeight);
  })
});

// 画像の全削除処理
document.getElementById("deleteFileBtn").addEventListener("click", () => {
  let divImageList = document.getElementById("imageList");
  while (divImageList.firstChild) {
    divImageList.removeChild(divImageList.firstChild);
  }
  document.getElementById("imageCount").innerText = 0;
  document.getElementById("readSuccessCount").innerText = 0;
  document.getElementById("readErrorCount").innerText = 0;
  document.getElementById("readNotImageCount").innerText = 0;
  document.getElementById("fileSelector").value = "";
});

// ファイル読み込み中のローディング表示切り替え関数
function toggleLoadingAnimation(signal) {
  let loadingMessageDiv = document.getElementById("loadingMessage");
  let loadingWrapperDiv = document.getElementById("content");
  let loadingDiv = document.getElementById("loading");
  if (signal) {
    loadingWrapperDiv.classList.add("loadingWrapper");
    loadingDiv.classList.add("loading");
    loadingMessageDiv.style.display = "block";
  } else {
    loadingWrapperDiv.classList.remove("loadingWrapper");
    loadingDiv.classList.remove("loading");
    loadingMessageDiv.style.display = "none";
  }
}

// 読み込んだファイルが画像ファイルならファイルタイプを返し、
// 画像ファイル以外なら false を返す関数
// https://qiita.com/hal9188/items/a1378f5b101e991609a8
function getImageFormat(arrayBuffer) {
  let arr = new Uint8Array(arrayBuffer).subarray(0, 6);
  let header = "";

  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16);
  }

  switch (true) {
    case /^89504e47d/.test(header):
      return "image/png";
    case /^ffd8ff/.test(header):
      return "image/jpeg";
    case /^000206674/.test(header):
      return "image/heic";
    case /^4749463839/.test(header):
      return "image/gif";
    case /^424d/.test(header):
      return "image/bmp";
    default:
      return false;
  }
}

// 読み込んだ画像データを基にDOMを生成する
function imageListDom(imageFiles) {
  // imageFiles の画像ファイルをファイル名で並べ替える
  // （ファイル読み込みが非同期なので順番がランダム）
  imageFiles.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
  imageFiles.forEach((imageFile) => {
    let imageDiv = document.createElement("div");
    imageDiv.className = "imageDiv";
    imageDiv.setAttribute("id", imageFile.name + "_Div");
    imageDiv.setAttribute("draggable", true);

    let image = document.createElement("img");
    image.className = "thumb";
    image.src = arrayBufferToDataURL(imageFile.image);

    let imageCaption = document.createElement("span");
    imageCaption.innerText = imageFile.name.split(".")[0];
    imageCaption.className = "imageCaption";
    imageCaption.setAttribute("id", imageFile.name + "_Span");

    imageDiv.insertBefore(image, null);
    imageDiv.insertBefore(imageCaption, null);
    document.getElementById("imageList").insertBefore(imageDiv, null);
  });
}

// arrayBuffer 型の画像データを DataURL に変換する
// (getImageFormat 関数のために arrayBuffer 型で読み込んでいる)
function arrayBufferToDataURL(arrayBuffer) {
  let binary = "";
  let bytes = new Uint8Array(arrayBuffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:${getImageFormat(arrayBuffer)};base64,${window.btoa(binary)}`;
}

// function resizeImage(image) {
//
// }
