// 토픽 하나를 다른 분야로 옮긴다. 파일, 페이지 안의 상대 링크, 다른 문서의 링크·data-ref,
// 문항 topic, terms.json, catalog.js 항목을 함께 바꾼다.
// node tools/move-topic.js <원래 분야>/<slug> <새 분야> [중요도: 핵심|참고|보통] [태그]
const fs = require("fs");
const path = require("path");
const [fromRef, toDir, importance, tag] = process.argv.slice(2);
const root = path.join(__dirname, "..");
const [fromDir, slug] = fromRef.split("/");
const toRef = toDir + "/" + slug;

const src = path.join(root, fromDir, slug + ".html");
const dst = path.join(root, toDir, slug + ".html");
if (!fs.existsSync(src)) throw new Error("no page " + src);
if (fs.existsSync(dst)) throw new Error("already exists " + dst);
if (!fs.existsSync(path.join(root, toDir))) throw new Error("no category folder " + toDir);

// 1) 옮기는 페이지: data-topic 과, 원래 분야 기준이던 상대 링크
let page = fs.readFileSync(src, "utf8");
page = page.replace('data-topic="' + fromRef + '"', 'data-topic="' + toRef + '"');
page = page.replace(/href="([^"#?:]+\.html)([#?][^"]*)?"/g, (m, href, rest = "") => {
  if (href.startsWith("../")) {
    const fixed = href.replace("../" + toDir + "/", ""); // 새 분야 문서는 같은 폴더가 된다
    return 'href="' + fixed + rest + '"';
  }
  return 'href="../' + fromDir + "/" + href + rest + '"'; // 원래 같은 폴더였던 문서
});
fs.writeFileSync(dst, page);
fs.unlinkSync(src);

// 2) 다른 페이지에서 이 페이지를 가리키는 링크와 data-ref
let pages = 0;
for (const d of fs.readdirSync(root, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith(".") || ["assets", "tools", "templates"].includes(d.name)) continue;
  for (const f of fs.readdirSync(path.join(root, d.name))) {
    if (!f.endsWith(".html")) continue;
    const file = path.join(root, d.name, f);
    let s = fs.readFileSync(file, "utf8"), before = s;
    const target = d.name === toDir ? slug + ".html" : "../" + toDir + "/" + slug + ".html";
    if (d.name === fromDir) s = s.split('href="' + slug + ".html").join('href="' + target);
    s = s.split('href="../' + fromDir + "/" + slug + ".html").join('href="' + target);
    s = s.split('data-ref="' + fromRef + '"').join('data-ref="' + toRef + '"');
    if (s !== before) { fs.writeFileSync(file, s); pages++; }
  }
}

// 3) 문항, 자동 링크 개념어
for (const f of ["assets/quiz-data.js", "tools/terms.json"]) {
  const p = path.join(root, f);
  const s = fs.readFileSync(p, "utf8");
  fs.writeFileSync(p, s.split('"' + fromRef + '"').join('"' + toRef + '"'));
}

// 4) catalog: 원래 분야에서 블록을 빼서 새 분야 topics 끝에 넣는다
const catFile = path.join(root, "assets", "catalog.js");
let cat = fs.readFileSync(catFile, "utf8");
const at = cat.indexOf('        slug: "' + slug + '",');
const bStart = cat.lastIndexOf("\n      {\n", at) + 1;
const bEnd = cat.indexOf("\n      },", at) + "\n      },".length;
let block = cat.slice(bStart, bEnd);
cat = cat.slice(0, bStart) + cat.slice(bEnd + 1);

if (importance) {
  block = block.replace(/        importance: "[^"]*",\n/, "");
  if (importance !== "보통") block = block.replace(/(        title: "[^"]*",\n)/, '$1        importance: "' + importance + '",\n');
}
if (tag) block = block.replace(/        tags: \[[^\]]*\],/, '        tags: ["' + tag + '"],');

const dirAt = cat.indexOf('    dir: "' + toDir + '",');
const topicsAt = cat.indexOf("    topics: [", dirAt);
if (cat.startsWith("    topics: [],", topicsAt)) {
  cat = cat.slice(0, topicsAt) + "    topics: [\n" + block + "\n    ]," + cat.slice(topicsAt + "    topics: [],".length);
} else {
  const close = cat.indexOf("\n    ],", topicsAt);
  cat = cat.slice(0, close) + "\n" + block + cat.slice(close);
}

// 새 분야 tags 목록에 태그가 없으면 더한다
const usedTags = (block.match(/tags: \[([^\]]*)\]/) || [, ""])[1].match(/"[^"]+"/g) || [];
for (const t of usedTags) {
  const dAt = cat.indexOf('    dir: "' + toDir + '",');
  const tAt = cat.indexOf("    tags: [", dAt);
  const tpAt = cat.indexOf("    topics: [", dAt);
  if (tAt < 0 || tAt > tpAt) {
    cat = cat.slice(0, tpAt) + "    tags: [" + t + "],\n" + cat.slice(tpAt);
  } else {
    const line = cat.slice(tAt, cat.indexOf("\n", tAt));
    if (!line.includes(t)) cat = cat.slice(0, tAt) + line.replace("],", ", " + t + "],") + cat.slice(tAt + line.length);
  }
}
fs.writeFileSync(catFile, cat);
console.log("moved " + fromRef + " → " + toRef + " (다른 페이지 " + pages + "개 수정)");
