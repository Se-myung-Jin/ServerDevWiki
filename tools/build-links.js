// 문서 사이 링크를 모아 역링크 색인 assets/links.js 를 만든다.
// node tools/build-links.js [--check]   (--check 는 파일을 쓰지 않고 최신인지만 확인한다)
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const outFile = path.join(root, "assets", "links.js");

function build() {
  global.window = {};
  eval(fs.readFileSync(path.join(root, "assets", "catalog.js"), "utf8"));
  const ids = [];
  window.CATALOG.forEach((c) => c.topics.forEach((t) => ids.push(c.dir + "/" + t.slug)));
  const known = new Set(ids);
  const order = new Map(ids.map((id, i) => [id, i]));

  const back = {};
  for (const id of ids) {
    const file = path.join(root, id + ".html");
    if (!fs.existsSync(file)) continue;
    const body = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const out = new Set();
    for (const m of body.matchAll(/href="([^"#?]+)\.html(?:[#?][^"]*)?"/g)) {
      if (/^(https?:|mailto:)/.test(m[1])) continue;
      out.add(path.posix.normalize(path.posix.join(path.posix.dirname(id), m[1])));
    }
    // 아직 쓰지 않은 문서를 가리키던 data-ref 도 그 문서가 생기면 역링크가 된다
    for (const m of body.matchAll(/data-ref="([^"]+)"/g)) out.add(m[1]);
    out.delete(id);
    for (const target of out) {
      if (!known.has(target)) continue;
      (back[target] = back[target] || []).push(id);
    }
  }

  const keys = Object.keys(back).sort((a, b) => order.get(a) - order.get(b));
  const lines = keys.map((k) => {
    const src = back[k].sort((a, b) => order.get(a) - order.get(b));
    return "  " + JSON.stringify(k) + ": " + JSON.stringify(src) + ",";
  });
  return (
    "// 자동 생성: node tools/build-links.js. 직접 고치지 않는다.\n" +
    "// 문서 id → 그 문서를 본문에서 가리키는 문서 id 목록(카탈로그 순서)\n" +
    "window.BACKLINKS = {\n" + lines.join("\n") + "\n};\n"
  );
}

module.exports = { build, outFile };

if (require.main === module) {
  const text = build();
  const old = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8").replace(/\r\n/g, "\n") : "";
  if (process.argv.includes("--check")) {
    console.log(old === text ? "links.js 최신" : "links.js 가 오래됐다. node tools/build-links.js 를 실행한다");
    process.exit(old === text ? 0 : 1);
  }
  fs.writeFileSync(outFile, text);
  console.log("links.js " + (text.match(/\n  "/g) || []).length + "개 문서의 역링크");
}
