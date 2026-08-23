#!/usr/bin/env bash
#
# Pithagoras / 開発者 / GitHub Actions が共用する検証コマンド。
# 成功で終了コード 0、失敗で非 0 を返す。対話入力は要求しない。
#
# 使い方:
#   ./scripts/check.sh
#   env -u GH_TOKEN -u GITHUB_TOKEN ./scripts/check.sh   # GitHub認証を渡さない場合

set -euo pipefail

cd "$(dirname "$0")/.."

# 対話プロンプトを抑止する
export CI="${CI:-1}"

echo "==> pnpm install --frozen-lockfile"
# pnpm-lock.yaml と package.json / pnpm-workspace.yaml の整合性確認を兼ねる。
# lockファイルは pnpm で更新し、手編集しない。
pnpm install --frozen-lockfile

# lint / format check は本リポジトリに未導入。導入したらここへ追加する。

echo "==> pnpm run test"
pnpm run test

echo "==> pnpm run build"
# 本番成果物（単一HTML）が実際に生成できることまで確認する。
pnpm run build

test -s dist/index.html || {
  echo "check.sh: dist/index.html が生成されていません" >&2
  exit 1
}

echo "==> check.sh: OK"
