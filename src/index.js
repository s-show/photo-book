document.getElementById("addFileBtn").addEventListener("click", (e) => {
  document.getElementById("fileSelector").click();
});
document.getElementById("fileSelector").addEventListener("change", (e) => {
  if (e.target.files.length == 0) {
    console.log("file not selected.");
    return;
  }
  const imageFiles = [];
  let fileCount = 0;

  toggleLoadingAnimation(true);

  Array.from(e.target.files).forEach((file, index, array) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("error", () => {
      console.error("read error: " + file.name);
      fileCount++;
      if (fileCount == array.length) {
        imageListDom(imageFiles);
      }
    });
    fileReader.addEventListener("load", (e) => {
      fileCount++;
      const imageFile = { name: "", image: "" };
      imageFile.name = file.name;
      imageFile.image = e.target.result;
      imageFiles.push(imageFile);
      if (fileCount == array.length) {
        imageListDom(imageFiles);
        toggleLoadingAnimation(false);
      }
    });
    fileReader.readAsDataURL(file);
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
  const underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    event.preventDefault();
    const rect = underImage.getBoundingClientRect();
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
  const underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    underImage.style.borderTop = "";
    underImage.style.borderBottom = "";
  }
});
elm.addEventListener("drop", (event) => {
  const underImage = document.getElementById(event.target.id);
  if (event.target.classList.contains("imageDiv")) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const elm_drag = document.getElementById(id);

    const rect = underImage.getBoundingClientRect();
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
    const result = prompt("変更後のファイル名を入力してください");
    if (result != null) {
      document.getElementById(e.target.id).innerText = result;
    }
  } else if (e.target.classList.contains("thumb")) {
    elm.removeChild(e.target.parentNode);
  }
});

// ヘッダーとして表示する文字列の設定
document.getElementById("headerText").addEventListener("input", (e) => {
  document.getElementById("header").innerText = e.target.value;
});

// 画像の幅を動的に変更する設定（表示と印刷両方を同時に変更）
document.getElementById("imageWidth").addEventListener("input", (e) => {
  const thumbClass = document.querySelectorAll(".thumb");
  thumbClass.forEach((elem) => {
    elem.style.setProperty("width", e.target.value + "px");
    console.log(elem.clientWidth);
    console.log(elem.clientHeight);
  });
});

// 画像の全削除処理
document.getElementById("deleteFileBtn").addEventListener("click", () => {
  const divImageList = document.getElementById("imageList");
  while (divImageList.firstChild) {
    divImageList.removeChild(divImageList.firstChild);
  }
  document.getElementById("fileSelector").value = "";
});

// ファイル読み込み中のローディング表示切り替え関数
function toggleLoadingAnimation(signal) {
  const loadingMessageDiv = document.getElementById("loadingMessage");
  const loadingWrapperDiv = document.getElementById("content");
  const loadingDiv = document.getElementById("loading");
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
    const imageDiv = document.createElement("div");
    imageDiv.className = "imageDiv";
    imageDiv.setAttribute("id", imageFile.name + "_Div");
    imageDiv.setAttribute("draggable", true);

    const image = document.createElement("img");
    image.className = "thumb";
    image.src = imageFile.image;

    const imageCaption = document.createElement("span");
    imageCaption.innerText = imageFile.name.split(".")[0];
    imageCaption.className = "imageCaption";
    imageCaption.setAttribute("id", imageFile.name + "_Span");

    imageDiv.insertBefore(image, null);
    imageDiv.insertBefore(imageCaption, null);
    document.getElementById("imageList").insertBefore(imageDiv, null);
  });
}

function resizeImage(image) {
    const canvas = document.createElement("canvas");
  // 表示サイズで縮小すると画像が荒くなりすぎるので、表示サイズの2倍に縮小している。
    canvas.width = image.clientWidth * 2.0;
    canvas.height = image.clientHeight * 2.0;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
}

document.getElementById('reduceImage').addEventListener('click', () => {
  const imageElements = document.querySelectorAll(".thumb");
  imageElements.forEach((imageElement) => {
    imageElement.src = resizeImage(imageElement);
  });
  globalThis.alert('画像を縮小しました')
})
