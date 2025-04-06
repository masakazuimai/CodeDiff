const express = require("express");
const bodyParser = require("body-parser");
const diff = require("diff");
const app = express();
const port = 3000;

// 静的ファイルを提供
app.use(express.static("public"));

// リクエストのボディをJSON形式で解析
app.use(bodyParser.json());

// 差分を計算するエンドポイント
app.post("/check-diff", (req, res) => {
  const { code1, code2 } = req.body;

  // 差分を計算
  const diffResult = diff.diffChars(code1, code2);

  // 計算した差分を返す
  res.json({ diff: diffResult });
});

// サーバーを起動
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
