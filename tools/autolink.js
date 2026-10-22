// 본문에 나오는 다른 토픽의 개념어를 찾아 첫 등장 한 번만 <a data-ref> 로 감싼다.
// node autolink.js <repo> [--apply]   (--apply 없으면 바꿀 곳만 출력)
const fs = require("fs");
const path = require("path");
const [root, flag] = process.argv.slice(2);
const apply = flag === "--apply";

// 개념어 → 대상 문서. 긴 말부터 검사한다. 아직 없는 문서도 미리 걸어 둘 수 있다.
const TERMS = [
  ["컨텍스트 스위칭", "operating-system/pcb-context-switch"],
  ["문맥 교환", "operating-system/pcb-context-switch"],
  ["시스템 콜", "operating-system/kernel-boundary"],
  ["스레드 풀", "operating-system/thread-pool"],
  ["가상 메모리", "operating-system/virtual-memory"],
  ["페이지 테이블", "operating-system/paging-tlb"],
  ["TLB", "operating-system/paging-tlb"],
  ["페이지 폴트", "operating-system/page-fault-thrashing"],
  ["우선순위 역전", "operating-system/starvation"],
  ["데드락", "operating-system/deadlock"],
  ["뮤텍스", "operating-system/sync-primitives"],
  ["세마포어", "operating-system/sync-primitives"],
  ["스케줄러", "operating-system/scheduling"],
  ["단편화", "operating-system/fragmentation"],
  ["공유 메모리", "operating-system/ipc"],
  ["false sharing", "computer-architecture/cache-coherence"],
  ["캐시 라인", "computer-architecture/memory-hierarchy"],
  ["메모리 배리어", "computer-architecture/atomics-memory-order"],
  ["원자적 연산", "computer-architecture/atomics-memory-order"],
  ["분기 예측", "computer-architecture/pipeline-branch-prediction"],
  ["엔디안", "computer-architecture/endianness"],
  ["참조 지역성", "computer-architecture/locality"],
  ["SMT", "computer-architecture/logical-hybrid-cores"],
  ["Interlocked", "csharp/volatile-interlocked"],
  ["async/await", "csharp/async-basics"],
  ["GC", "csharp/gc-basics"],
  ["IOCP", "server/completion-port"],
  ["epoll", "server/io-models"],
  ["ECS", "game-patterns/ecs-storage"],
];

// 이 태그 안의 글자는 건드리지 않는다.
const SKIP = ["a", "code", "pre", "svg", "h1", "h2", "h3", "h4", "th", "figcaption", "script", "style", "summary"];

function linkPage(file, selfRef) {
  const src = fs.readFileSync(file, "utf8");
  const a0 = src.indexOf('<article class="doc-body">'), a1 = src.indexOf("</article>");
  if (a0 < 0 || a1 < 0) return { out: src, hits: [] };
  let body = src.slice(a0, a1);

  const already = new Set();
  for (const m of body.matchAll(/data-ref="([^"]+)"/g)) already.add(m[1]);
  for (const m of body.matchAll(/href="([^"#?]+)\.html/g)) {
    already.add(path.posix.normalize(path.posix.join(path.posix.dirname(selfRef), m[1])));
  }
  already.add(selfRef);

  const parts = body.split(/(<[^>]+>)/);
  const depth = {};
  let inPrereq = 0;
  const hits = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("<")) {
      const m = p.match(/^<(\/?)([a-zA-Z0-9]+)/);
      if (!m) continue;
      const tag = m[2].toLowerCase(), closing = m[1] === "/";
      if (SKIP.includes(tag) && !/\/>$/.test(p)) depth[tag] = (depth[tag] || 0) + (closing ? -1 : 1);
      if (tag === "p" && !closing && /class="prereq"/.test(p)) inPrereq = 1;
      if (tag === "p" && closing) inPrereq = 0;
      continue;
    }
    if (inPrereq || SKIP.some((t) => depth[t] > 0) || !p.trim()) continue;

    let text = p;
    for (const [term, ref] of TERMS) {
      if (already.has(ref)) continue;
      // 영문 개념어는 단어 경계를 지킨다 (예: GC 가 "GCHandle" 안에서 잡히지 않게).
      const re = /^[A-Za-z]/.test(term)
        ? new RegExp("(^|[^A-Za-z])(" + term.replace(/[/]/g, "\\/") + ")(?![A-Za-z])")
        : new RegExp("()(" + term + ")");
      const m = text.match(re);
      if (!m) continue;
      const at = m.index + m[1].length;
      text = text.slice(0, at) + '<a data-ref="' + ref + '">' + term + "</a>" + text.slice(at + term.length);
      already.add(ref);
      hits.push(term + " → " + ref);
    }
    parts[i] = text;
  }
  body = parts.join("");
  return { out: src.slice(0, a0) + body + src.slice(a1), hits };
}

global.window = {};
eval(fs.readFileSync(path.join(root, "assets/catalog.js"), "utf8"));
let total = 0;
for (const c of window.CATALOG) {
  for (const t of c.topics) {
    const ref = c.dir + "/" + t.slug;
    const file = path.join(root, ref + ".html");
    const { out, hits } = linkPage(file, ref);
    if (!hits.length) continue;
    total += hits.length;
    console.log(ref + "\n  " + hits.join("\n  "));
    if (apply) fs.writeFileSync(file, out);
  }
}
console.log((apply ? "적용 " : "후보 ") + total + "건");
