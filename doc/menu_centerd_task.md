# タスク
`#menuDiv` の位置を画面中央にするタスクです。
チェックリストを作成したりタスクが増えたら、ユーザーの指示がなくても編集してください。
チェックリストのタスクが完了したらユーザーの指示がなくても編集してください。

## やりたいこと

- `<div id="menuDiv">` を `<div id="informationDiv">` の真ん中にする。
- 画面の横幅が小さくなったら `<div id="menuDiv">` の `<input>` を縦に並べる。
- `<div id="helpIcon" class="help-icon">` の位置は画面の横幅に無関係に固定する


## チェックリスト

`A: `のようにアルファベットのラベルをつけることで、参照しやすくする

### 1. タスク分解

- [x] A: タスク分解して2以降のチェックリストを書き換える
- [x] A-1: paramsDivのinputを横並びにする新しいタスクを追加

### 2. menuDivを中央配置にする

- [x] B: #menuDivの固定幅（1000px）とmarginを削除
- [x] C: #informationDivにflexboxレイアウトを適用
- [x] D: #menuDivを#informationDivの中央に配置するCSS追加

### 3. レスポンシブ対応（小さい画面でinputを縦並び）

- [x] E: 現在の画面幅を検出するメディアクエリを追加
- [x] F: 小さい画面で#menuDivの子要素を縦並びにするCSS追加
- [x] G: inputDivクラスの要素が縦に並ぶように調整

### 4. helpIconの位置を固定

- [x] H: helpIconの現在のposition:fixedスタイルを確認
- [x] I: 画面サイズに関係なくhelpIconが右上に固定されることを確認

### 5. 動作確認とテスト

- [x] J: 大きい画面でmenuDivが中央に表示されることを確認
- [x] K: 小さい画面でinputが縦並びになることを確認  
- [x] L: helpIconが常に右上に固定されることを確認

### 6. paramsDivの横並び対応

- [x] M: paramsDivの現在のCSS構造を確認
- [x] N: inputDivクラスを横並びにするCSS追加
- [x] O: 小さい画面でparamsDivは縦並びを維持
- [x] P: 横並び時の適切な間隔とレイアウト調整
- [x] Q: 動作確認（大画面で横並び、小画面で縦並び）


