# デスクトップ版 Excel で行の高さが 2/3 になる問題の調査記録

## 問題の概要

`photobook.xlsx` をアプリケーションから出力し、各アプリで開いたときの挙動の違い：

| アプリ | 行1の高さ | 行2以降の高さ |
|--------|-----------|---------------|
| オンライン版 Excel | 15 | 10 |
| LibreOffice Calc | 15 | 10 |
| デスクトップ版 Excel | **10** | **約6.67** |

XML に格納された `ht` 値（行1=15, 行2以降=10）に対して、デスクトップ版 Excel は全行で **ちょうど 2/3 倍** の値を表示している。デスクトップ版 Excel での表示モードは「標準表示」、印刷スケールは 100%。

---

## XML の実態（調査済み）

`photobook.xlsx` を展開して `xl/worksheets/sheet1.xml` を確認した結果：

```xml
<sheetFormatPr defaultRowHeight="15" outlineLevelRow="0" outlineLevelCol="0" x14ac:dyDescent="55"/>
```

```xml
<!-- 行1 -->
<row r="1" ht="15" customHeight="1" ...>

<!-- 行2以降（370行すべて） -->
<row r="2" ht="10" customHeight="1" ...>
<row r="3" ht="10" customHeight="1" ...>
...
```

- 全371行すべてに `customHeight="1"` と明示的な `ht` 値が設定されている
- `sheetViews` 要素が**存在しない**（ズームや表示モードが未指定）
- `pageSetup`: `fitToWidth="1" fitToHeight="0"`、`sheetPr` に `fitToPage="1"`

---

## `dyDescent` とは

フォントには「ベースライン」と呼ばれる基準線があり、`g` `y` `p` などの文字はその下方向に「ディセンダー（descender）」と呼ばれる部分がはみ出す。

```
|  Hello  |  ← セルの上端
| H e l l o |
|___________|  ← ベースライン
|   g y p   |  ← ディセンダー部分（ベースライン下）
|           |  ← セルの下端
```

`x14ac:dyDescent` はこのディセンダー部分の高さ（単位: ポイント）を Excel に事前に伝えることで、**行の高さの再計算を省略**するためのレンダリングヒント。行の高さそのものを変える設定ではない。

### ExcelJS の値が `55` になった経緯

ExcelJS のソース内でこの値の由来は文書化されていないが、単位の混同が原因と推測される。実際の Excel ファイルでは `x14ac:dyDescent` をポイント単位の小数値（例: `0.25`）で記述する。ExcelJS の開発者が別の単位系（1/100 ポイントや twips など）で値を計算して `55` を設定したまま、単位の誤りに気付かずハードコードされたと考えられる。

---

## 根本原因

### 原因1（主因）: `x14ac:dyDescent="55"` の異常値

ExcelJS (`^4.4.0`) のソースコードに以下のハードコードがある：

```javascript
// node_modules/exceljs/lib/doc/worksheet.js
// node_modules/exceljs/lib/stream/xlsx/worksheet-writer.js
this.properties = Object.assign({}, {
  defaultRowHeight: 15,
  dyDescent: 55,  // ← ハードコードされた異常値
  ...
});
```

この値が `sheetFormatPr` の `x14ac:dyDescent` 属性としてそのまま XML に出力される：

```javascript
// node_modules/exceljs/lib/xlsx/xform/sheet/sheet-format-properties-xform.js
'x14ac:dyDescent': model.dyDescent,  // → "55" が出力される
```

**実際の Excel ファイルでの標準値は `0.25`**（ExcelJS の値は標準の 220 倍）。

`x14ac:dyDescent` は `mc:Ignorable="x14ac"` で宣言されているため：
- **オンライン版 Excel / LibreOffice**: 無視または別処理 → 正常値を表示
- **デスクトップ版 Excel**: `x14ac` 名前空間を完全サポートするため読み込む

デスクトップ版 Excel が `x14ac:dyDescent="55"` という極端に大きい値（標準 `0.25` の 220 倍）を読み込んだ際、**DPI 補正を全行の高さに適用**していると考えられる。

```
2/3 = 96 / 144 = 96 DPI / 144 DPI（Windows 150% スケーリング時の実効 DPI）
```

これが恰も `ht` 値に `× 2/3` が適用された結果と一致する。Windows のディスプレイスケーリングが 150%（= 144 DPI）の環境でデスクトップ版 Excel を使用しているときにのみ発生する可能性がある。

### 原因2（副因）: `sheetViews` 要素が存在しない

ExcelJS は `worksheet.views` プロパティが未設定の場合、`sheetViews` 要素を出力しない。その結果、ズームレベルや表示モードが明示されない不完全なファイルになっている。

```javascript
// node_modules/exceljs/lib/xlsx/xform/sheet/worksheet-xform.js
this.map.sheetViews.render(xmlStream, model.views);
// model.views が空なので sheetViews タグは出力されない
```

---

## 修正方法

`src/main.js` の `handleExportExcel` 関数内、`workbook.addWorksheet('sheet1')` の直後（約278行目）に以下の2行を追加する：

```javascript
const worksheet = workbook.addWorksheet('sheet1');

// 修正1: dyDescent を標準値に設定（主因の修正）
worksheet.properties.dyDescent = 0.25;

// 修正2: sheetViews を明示的に設定（副因の修正）
worksheet.views = [{ state: 'normal', zoomScale: 100, zoomScaleNormal: 100 }];
```

### 修正1の効果

`sheetFormatPr` の `x14ac:dyDescent` が `"55"` から `"0.25"` に変わる：

```xml
<!-- 修正前 -->
<sheetFormatPr defaultRowHeight="15" ... x14ac:dyDescent="55"/>

<!-- 修正後 -->
<sheetFormatPr defaultRowHeight="15" ... x14ac:dyDescent="0.25"/>
```

### 修正2の効果

`sheetViews` 要素が生成され、ズーム 100%・標準表示が明示される：

```xml
<sheetViews>
  <sheetView state="normal" zoomScale="100" zoomScaleNormal="100" workbookViewId="0"/>
</sheetViews>
```

---

## 検証手順

1. `npm run dev` でアプリを起動
2. 画像を複数枚アップロードして Excel エクスポートを実行
3. 生成した xlsx をデスクトップ版 Excel で開く
4. 行を右クリック →「行の高さ」で数値を確認：
   - 行1 → **15** になること
   - 行2以降 → **10** になること
5. オンライン版 Excel / LibreOffice でも同じ値になることを確認

---

## 調査で使用したコマンド

```bash
# xlsx を展開して XML を直接確認
unzip photobook.xlsx -d xlsx_contents

# sheetFormatPr の確認
node -e "const fs=require('fs'); const s=fs.readFileSync('xl/worksheets/sheet1.xml','utf8'); console.log(s.match(/<sheetFormatPr[^>]+>/)[0])"

# ExcelJS の dyDescent デフォルト値を確認
grep -r "dyDescent: 55" node_modules/exceljs/lib/
```
