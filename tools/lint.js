// 사이트 전체 점검: 깨진 상대 링크, "먼저 읽을 것" 순서, 남은 자리표시, 그림 자리, marker id 중복.
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
global.window = {};
eval(fs.readFileSync(path.join(root, "assets/catalog.js"), "utf8"));

const pos = {};
window.CATALOG.forEach((c, ci) => c.topics.forEach((t, ti) => (pos[c.dir + "/" + t.slug] = ci * 1000 + ti)));

let problems = 0;
const pending = new Set();
const report = (f, msg) => { problems++; console.log(f + ": " + msg); };

for (const c of window.CATALOG) {
  for (const t of c.topics) {
    const rel = c.dir + "/" + t.slug;
    const file = path.join(root, rel + ".html");
    if (!fs.existsSync(file)) { report(rel, "페이지 파일 없음"); continue; }
    const s = fs.readFileSync(file, "utf8");
    const body = s.replace(/<!--[\s\S]*?-->/g, "");

    for (const m of body.matchAll(/href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
      const href = m[1];
      if (/^(https?:|mailto:)/.test(href) || href.startsWith("../assets/")) continue;
      const target = path.normalize(path.join(path.dirname(file), href));
      if (!fs.existsSync(target)) report(rel, "깨진 링크 " + href);
    }

    const pre = body.match(/<p class="prereq">([\s\S]*?)<\/p>/);
    if (pre) {
      for (const m of pre[1].matchAll(/href="([^"]+)\.html"/g)) {
        const id = path.posix.normalize(path.posix.join(c.dir, m[1]));
        if (pos[id] === undefined) report(rel, "먼저 읽을 것이 목록에 없는 문서 " + id);
        else if (pos[id] >= pos[rel]) report(rel, "먼저 읽을 것이 뒤 순서 문서 " + id);
      }
    }

    for (const m of body.matchAll(/data-ref="([^"]+)"/g)) {
      const dir = m[1].split("/")[0];
      if (!window.CATALOG.some((x) => x.dir === dir)) report(rel, "data-ref 분야 오타 " + m[1]);
      else if (pos[m[1]] === undefined) pending.add(m[1]);
    }
    if (/측정 필요|TODO|FIG\d/.test(body)) report(rel, "자리표시가 남음");
    const ids = [...body.matchAll(/<marker id="([^"]+)"/g)].map((m) => m[1]);
    if (new Set(ids).size !== ids.length) report(rel, "marker id 중복");
    if (!/<svg/.test(body)) report(rel, "(정보) 그림 없음");
    if (/<h2>출처<\/h2>/.test(body)) report(rel, "출처 섹션이 있음");
    // &lt; 의 & 가 빠지는 식으로 깨진 엔티티. sed 치환에 & 를 쓰면 생긴다
    const broken = body.match(/[^&#a-z;](lt|gt|amp);/);
    if (broken) report(rel, "깨진 엔티티 " + JSON.stringify(broken[0]));
  }
}
// 역링크 색인이 지금 문서들과 맞는지 본다
const links = require("./build-links.js");
if (!fs.existsSync(links.outFile) || fs.readFileSync(links.outFile, "utf8").replace(/\r\n/g, "\n") !== links.build())
  report("assets/links.js", "역링크 색인이 오래됐다. node tools/build-links.js 를 실행한다");

console.log(problems ? problems + "건" : "문제 없음");
if (pending.size) console.log("작성 예정 참조: " + [...pending].sort().join(", "));
