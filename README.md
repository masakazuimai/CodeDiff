# CodeDiff Checker

テキストやコードの差分を簡単に確認できるWebツールです。

🔗 https://codequest.work/generator/codediff-checker/

---

## 技術スタック

- Node.js / Express（静的ファイル配信）
- [diff.js](https://github.com/kpdecker/jsdiff)（差分アルゴリズム）
- Vanilla JS / CSS

## ローカル起動

```bash
npm install
node server.js
# → http://localhost:3000
```

## デプロイ

`main` ブランチへのpushで GitHub Actions が FTP デプロイを実行。

必要な GitHub Secrets:
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`

---

## 改善ログ

### 2026-04-10

**diff UIの刷新**
- 並列表示（左：元コード／右：自分のコード）に変更
- 行単位で差分を検出し、変更行のみ色付け
- 単語単位（`diffWords`）で差分を特定 → 削除側は文字レベルで精度を上げ、追加側は単語丸ごとハイライト
  - 例：`border` → `b` のみ赤、`boder` → 単語丸ごと緑
- 行番号を表示
- 差分サマリー（変更・追加・削除の行数）を表示
- 左右パネルのスクロール同期

**パフォーマンス改善**
- Prettier を削除（コードの整形による意図しない差分膨張を防止）
- `meta charset` をスクリプトより前に移動
- Google Fonts に `preconnect` を追加

**コード品質**
- `index.html` を `style.css` / `app.js` / `index.html` に分割
- ペースト処理を非推奨の `execCommand` から Selection API に移行

**その他**
- AdSense を削除
- フッターにリンクを追加（SEO CHECK / その他のジェネレーター）
- GitHub Actions（FTP自動デプロイ）を導入
