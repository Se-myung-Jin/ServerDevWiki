// 작업 결과 json(<slug>.json)을 모아 quiz-data.js 에 문항을 넣고, catalog.js 요약을 바꾸고,
// terms.json 에 자동 링크용 개념어를 더한다.
// node tools/merge-batch.js <결과 폴더> <분야 폴더>
const fs = require("fs");
const path = require("path");
const [outDir, dir] = process.argv.slice(2);
const root = path.join(__dirname, "..");

const catFile = path.join(root, "assets", "catalog.js");
const quizFile = path.join(root, "assets", "quiz-data.js");
const termsFile = path.join(__dirname, "terms.json");
let cat = fs.readFileSync(catFile, "utf8");
let quiz = fs.readFileSync(quizFile, "utf8");
const terms = JSON.parse(fs.readFileSync(termsFile, "utf8"));

global.window = {};
eval(cat);
const ci = window.CATALOG.findIndex((c) => c.dir === dir);
if (ci < 0) throw new Error("no category " + dir);
const category = window.CATALOG[ci];
const label = String(ci + 1).padStart(2, "0") + " " + category.title;

const js = (s) => JSON.stringify(s);
const blocks = [];
let total = 0, added = 0;
for (const t of category.topics) {
  const f = path.join(outDir, t.slug + ".json");
  if (!fs.existsSync(f)) throw new Error("missing " + f);
  if (!fs.existsSync(path.join(root, dir, t.slug + ".html"))) throw new Error("missing page " + t.slug);
  if (new RegExp('^    topic: "' + dir + "/" + t.slug + '"', "m").test(quiz)) throw new Error("already merged " + t.slug);
  const d = JSON.parse(fs.readFileSync(f, "utf8"));

  if (d.summary) {
    const at = cat.indexOf('slug: "' + t.slug + '",');
    const old = "summary: " + js(t.summary);
    const sumAt = cat.indexOf(old, at);
    if (at < 0 || sumAt < 0) throw new Error("summary not found " + t.slug);
    cat = cat.slice(0, sumAt) + "summary: " + js(d.summary) + cat.slice(sumAt + old.length);
  }

  const items = d.quiz.map((q) =>
    "  {\n    topic: " + js(dir + "/" + t.slug) + ",\n    q: " + js(q.q) + ",\n    a: " + js(q.a) + ",\n  },"
  );
  total += items.length;
  blocks.push("  // ---------- " + label + " / " + t.title + " ----------\n" + items.join("\n"));

  for (const [term, ref] of d.terms || []) {
    if (terms.some((x) => x[0] === term)) continue; // 이미 다른 문서에 묶인 말은 건드리지 않는다
    terms.push([term, ref]);
    added++;
  }
}

const end = quiz.lastIndexOf("\n];");
quiz = quiz.slice(0, end) + "\n\n" + blocks.join("\n\n") + quiz.slice(end);
fs.writeFileSync(catFile, cat);
fs.writeFileSync(quizFile, quiz);
fs.writeFileSync(termsFile, "[\n" + terms.map((x) => "  " + JSON.stringify(x)).join(",\n") + "\n]\n");
console.log("merged", category.topics.length, "topics,", total, "questions,", added, "terms");
