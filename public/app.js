(function () {
  const $ = {
    code1: document.getElementById("code1"),
    code2: document.getElementById("code2"),
    result: document.getElementById("result"),
    checkBtn: document.getElementById("checkDiffBtn"),
    clearBtn: document.getElementById("clearBtn"),
    ignoreWs: document.getElementById("ignoreWhitespace"),
  };

  // 全角スペースをdiff用センチネル文字に変換（空白と区別するため）
  const FW = "\uE000";

  const normalizeCode = (text, ignoreWhitespace) => {
    let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\u3000/g, FW);
    if (!ignoreWhitespace) return normalized;
    return normalized.split("\n").map((l) => l.trimEnd()).join("\n");
  };

  const escapeHTML = (str) =>
    str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\uE000/g, '<span class="fullwidth-marker">□</span>');

  const splitLines = (text) => text.replace(/\n$/, "").split("\n");

  const makeLine = (num, content, cls) =>
    `<div class="split-line ${cls}">` +
    `<span class="ln">${num}</span>` +
    `<span class="split-content">${content}</span>` +
    `</div>`;

  const makePlaceholder = () =>
    `<div class="split-line line-placeholder">` +
    `<span class="ln"></span>` +
    `<span class="split-content"></span>` +
    `</div>`;

  // 並列diff描画
  const renderSplitDiff = (code1, code2) => {
    const parts = Diff.diffLines(code1, code2);
    let html1 = "";
    let html2 = "";
    let lineNum1 = 1;
    let lineNum2 = 1;
    let addedCount = 0;
    let removedCount = 0;
    let changedCount = 0;

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      const next = parts[i + 1];

      if (!part.added && !part.removed) {
        // 変更なし
        splitLines(part.value).forEach((line) => {
          const esc = escapeHTML(line);
          html1 += makeLine(lineNum1++, esc, "line-unchanged");
          html2 += makeLine(lineNum2++, esc, "line-unchanged");
        });
        i++;
      } else if (part.removed && next && next.added) {
        // 変更あり：単語単位で検出 → 削除側は文字精度、追加側は単語丸ごと
        const removedLines = splitLines(part.value);
        const addedLines = splitLines(next.value);
        const pairLen = Math.min(removedLines.length, addedLines.length);
        changedCount += pairLen;
        removedCount += removedLines.length - pairLen;
        addedCount += addedLines.length - pairLen;

        for (let j = 0; j < pairLen; j++) {
          const words = Diff.diffWords(removedLines[j], addedLines[j]);
          let h1 = "";
          let h2 = "";
          let wi = 0;
          while (wi < words.length) {
            const w = words[wi];
            const wn = words[wi + 1];
            if (!w.added && !w.removed) {
              h1 += escapeHTML(w.value);
              h2 += escapeHTML(w.value);
              wi++;
            } else if (w.removed && wn && wn.added) {
              // 削除側：文字レベルで正確に（消えた文字だけ赤）
              Diff.diffChars(w.value, wn.value).forEach(({ added, removed, value }) => {
                const esc = escapeHTML(value);
                if (removed)     h1 += `<span class="char-removed">${esc}</span>`;
                else if (!added) h1 += esc;
              });
              // 追加側：単語丸ごと緑
              h2 += `<span class="char-added">${escapeHTML(wn.value)}</span>`;
              wi += 2;
            } else if (w.removed) {
              h1 += `<span class="char-removed">${escapeHTML(w.value)}</span>`;
              wi++;
            } else if (w.added) {
              h2 += `<span class="char-added">${escapeHTML(w.value)}</span>`;
              wi++;
            } else {
              wi++;
            }
          }
          html1 += makeLine(lineNum1++, h1, "line-changed-old");
          html2 += makeLine(lineNum2++, h2, "line-changed-new");
        }
        for (let j = pairLen; j < removedLines.length; j++) {
          html1 += makeLine(lineNum1++, escapeHTML(removedLines[j]), "line-removed");
          html2 += makePlaceholder();
        }
        for (let j = pairLen; j < addedLines.length; j++) {
          html1 += makePlaceholder();
          html2 += makeLine(lineNum2++, escapeHTML(addedLines[j]), "line-added");
        }
        i += 2;
      } else if (part.removed) {
        splitLines(part.value).forEach((line) => {
          removedCount++;
          html1 += makeLine(lineNum1++, escapeHTML(line), "line-removed");
          html2 += makePlaceholder();
        });
        i++;
      } else if (part.added) {
        splitLines(part.value).forEach((line) => {
          addedCount++;
          html1 += makePlaceholder();
          html2 += makeLine(lineNum2++, escapeHTML(line), "line-added");
        });
        i++;
      } else {
        i++;
      }
    }

    return { html1, html2, addedCount, removedCount, changedCount };
  };

  // ペースト処理（Selection API）
  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const tpl = document.createElement("template");
    tpl.innerHTML = escapeHTML(text);
    range.insertNode(tpl.content);
    range.collapse(false);
  };

  // 差分チェック
  $.checkBtn.addEventListener("click", () => {
    const ignoreWhitespace = $.ignoreWs.checked;
    const code1 = normalizeCode($.code1.innerText.trim(), ignoreWhitespace);
    const code2 = normalizeCode($.code2.innerText.trim(), ignoreWhitespace);

    if (!code1 || !code2) {
      alert("両方のコードを入力してください");
      return;
    }

    $.checkBtn.disabled = true;

    try {
      // 全角スペース検出（センチネルに変換済みの code1/code2 で判定）
      const fw1 = code1.includes(FW);
      const fw2 = code2.includes(FW);

      if (code1 === code2) {
        $.result.innerHTML =
          (fw1 || fw2 ? `<div class="fullwidth-warning">⚠ 全角スペースが検出されました：${[fw1 && "sample code", fw2 && "my code"].filter(Boolean).join(" / ")}</div>` : "") +
          '<div class="match-message">✓ コードは完全に一致しています</div>';
        $.result.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const { html1, html2, addedCount, removedCount, changedCount } = renderSplitDiff(code1, code2);

      const summaryParts = [];
      if (changedCount > 0) summaryParts.push(`<span class="summary-changed">〜${changedCount}行 変更</span>`);
      if (addedCount > 0)   summaryParts.push(`<span class="summary-added">＋${addedCount}行 追加</span>`);
      if (removedCount > 0) summaryParts.push(`<span class="summary-removed">－${removedCount}行 削除</span>`);

      $.result.innerHTML =
        (fw1 || fw2 ? `<div class="fullwidth-warning">⚠ 全角スペースが検出されました：${[fw1 && "sample code", fw2 && "my code"].filter(Boolean).join(" / ")}</div>` : "") +
        `<div class="diff-summary">${summaryParts.join("")}</div>` +
        `<div class="split-diff">` +
          `<div class="split-panel">` +
            `<div class="split-panel-header">sample code（元のコード）</div>` +
            `<div class="split-panel-body" id="diffBody1">${html1}</div>` +
          `</div>` +
          `<div class="split-panel">` +
            `<div class="split-panel-header">my code（自分のコード）</div>` +
            `<div class="split-panel-body" id="diffBody2">${html2}</div>` +
          `</div>` +
        `</div>`;

      // 結果パネルのスクロール同期
      const body1 = document.getElementById("diffBody1");
      const body2 = document.getElementById("diffBody2");
      let syncing = false;
      const sync = (src, dst) => {
        if (syncing) return;
        syncing = true;
        dst.scrollTop = src.scrollTop;
        syncing = false;
      };
      body1.addEventListener("scroll", () => sync(body1, body2));
      body2.addEventListener("scroll", () => sync(body2, body1));

      $.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      $.checkBtn.disabled = false;
    }
  });

  // クリア
  $.clearBtn.addEventListener("click", () => {
    $.code1.innerHTML = "";
    $.code2.innerHTML = "";
    $.result.innerHTML = "";
  });

  // ファイルD&D
  const handleDrop = (target) => (e) => {
    e.preventDefault();
    target.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      target.innerHTML = escapeHTML(ev.target.result);
    };
    reader.readAsText(file);
  };

  [$.code1, $.code2].forEach((el) => {
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.classList.add("drag-over");
    });
    el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
    el.addEventListener("drop", handleDrop(el));
  });

  $.code1.addEventListener("paste", handlePaste);
  $.code2.addEventListener("paste", handlePaste);
})();
