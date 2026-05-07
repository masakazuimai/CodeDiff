# CodeDiff Checker

テキストやコードの差分を簡単に確認できるWebツールです。

https://codequest.work/generator/diff-checker/

---

## 技術スタック

- [diff.js](https://github.com/kpdecker/jsdiff)（CDN読み込み・差分アルゴリズム）
- Vanilla HTML / CSS / JS

## ローカル起動

`public/` ディレクトリを任意のHTTPサーバーで配信するだけで動作します。

```bash
npx serve public
```

## デプロイ

`main` ブランチへのpushで GitHub Actions が FTP デプロイを実行。

必要な GitHub Secrets:
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`
