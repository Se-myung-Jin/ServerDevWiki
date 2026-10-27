// 검토용으로 문서 본문과 그 문서의 점검 문항을 글자만 뽑아 한 파일에 모은다. 그림(SVG) 안 글자는 뺀다.
// node tools/dump.js <출력 파일> <토픽 id...>     토픽 id 대신 분야 폴더 이름을 주면 그 분야 전부를 뽑는다.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const [out, ...want] = process.argv.slice(2);
if (!out || !want.length) {
  console.log("사용: node tools/dump.js <출력 파일> <토픽 id 또는 분야 폴더...>");
  process.exit(1);
}

global.window = {};
eval(fs.readFileSync(path.join(root, "assets/catalog.js"), "utf8"));
eval(fs.readFileSync(path.join(root, "assets/quiz-data.js"), "utf8"));
const ids = [];
for (const w of want) {
  const cat = window.CATALOG.find((c) => c.dir === w);
  if (cat) cat.topics.forEach((t) => ids.push(cat.dir + "/" + t.slug));
  else ids.push(w);
}

function toText(html) {
  const art = html.match(/<article[\s\S]*?<\/article>/);
  let s = art ? art[0] : html;
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  s = s.replace(/<h([1-4])[^>]*>/g, (m, n) => "\n\n" + "#".repeat(+n) + " ").replace(/<\/h[1-4]>/g, "\n");
  s = s.replace(/<tr[^>]*>/g, "\n| ").replace(/<\/t[dh]>/g, " | ").replace(/<li[^>]*>/g, "\n- ");
  s = s.replace(/<(p|div|pre|figure|figcaption|table|ul|ol|blockquote)[^>]*>/g, "\n").replace(/<br\s*\/?>/g, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return s.replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}

let text = "";
for (const id of ids) {
  const file = path.join(root, id + ".html");
  if (!fs.existsSync(file)) { text += "=== " + id + " (파일 없음)\n\n"; continue; }
  text += "=== " + id + "\n" + toText(fs.readFileSync(file, "utf8")) + "\n";
  const qs = window.QUIZ.filter((q) => q.topic === id);
  if (qs.length) text += "\n## 점검 문항\n" + qs.map((q) => "Q " + q.q + "\nA " + q.a.replace(/<[^>]+>/g, "")).join("\n\n") + "\n";
  text += "\n";
}
fs.writeFileSync(out, text);
console.log(ids.length + "개 문서, " + text.length + "자 → " + out);
