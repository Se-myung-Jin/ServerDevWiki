// headless Chrome 으로 화면을 찍는다. 결과는 tools/.out/ 에 PNG 로 남는다(git 에 올리지 않는다).
//
// node tools/shot.js figures <토픽 id...>      문서들의 <figure> 만 모아 한 장으로 찍는다(그림 겹침·잘림 확인용)
// node tools/shot.js page <토픽 id|경로...>     문서를 통째로 찍는다
// 옵션: --width=375  --height=2400  --theme=sepia|light|dark|terminal  --name=파일이름
//
// 토픽 id 는 "network/tcp-connection" 꼴이다. headless Chrome 은 창 폭을 500px 아래로 줄이지 못해서,
// --width 가 그보다 작으면 iframe 에 넣어 모바일 폭을 흉내 낸다.
// Chrome 위치는 CHROME 환경 변수로 바꿀 수 있다.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.join(__dirname, "..");
const outDir = path.join(__dirname, ".out");

const args = process.argv.slice(2);
const opt = {};
const rest = args.filter((a) => {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) opt[m[1]] = m[2];
  return !m;
});
const [mode, ...ids] = rest;
if (!["figures", "page"].includes(mode) || !ids.length) {
  console.log("사용: node tools/shot.js figures|page <토픽 id...> [--width=N] [--height=N] [--theme=T] [--name=N]");
  process.exit(1);
}
const theme = opt.theme || "sepia";
const width = parseInt(opt.width || (mode === "figures" ? "940" : "1280"), 10);
const height = parseInt(opt.height || "2400", 10);
const name = opt.name || mode + "-" + ids[0].replace(/[\\/]/g, "_") + (ids.length > 1 ? "-" + ids.length : "") + "-" + width;

const chrome = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => fs.existsSync(p));
if (!chrome) throw new Error("Chrome 을 찾지 못했다. CHROME 환경 변수에 경로를 넣는다");

fs.mkdirSync(outDir, { recursive: true });
const fileUrl = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const pagePath = (id) => path.join(root, id.endsWith(".html") ? id : id + ".html");

let target;
if (mode === "figures") {
  let body = "";
  for (const id of ids) {
    const s = fs.readFileSync(pagePath(id), "utf8");
    body += "<h4>" + id + "</h4>" + [...s.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => m[0]).join("");
  }
  target = path.join(outDir, name + ".html");
  fs.writeFileSync(
    target,
    '<!doctype html><html data-theme="' + theme + '"><head><meta charset="utf-8">' +
      '<link rel="stylesheet" href="' + fileUrl(path.join(root, "assets/style.css")) + '"></head>' +
      '<body style="padding:20px;max-width:900px">' + body + "</body></html>"
  );
} else {
  // 저장된 테마 대신 지정한 테마로 보이게, 페이지를 iframe 에 넣고 data-theme 을 덮어쓴다.
  const frames = ids.map((id) =>
    '<iframe src="' + fileUrl(pagePath(id)) + '" style="width:' + width + "px;height:" + height + 'px;border:0;display:block;margin-bottom:12px"></iframe>'
  ).join("");
  target = path.join(outDir, name + ".html");
  fs.writeFileSync(
    target,
    '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888">' + frames +
      '<script>document.querySelectorAll("iframe").forEach(function(f){f.addEventListener("load",function(){' +
      'try{f.contentDocument.documentElement.setAttribute("data-theme",' + JSON.stringify(theme) + ")}catch(e){}})})</script>"
  );
}

const png = path.join(outDir, name + ".png");
const winW = mode === "page" ? width : width;
const winH = mode === "page" ? (height + 12) * ids.length : height;
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--allow-file-access-from-files",
  "--virtual-time-budget=5000",
  "--user-data-dir=" + path.join(outDir, "chrome-profile"),
  "--window-size=" + Math.max(winW, 500) + "," + winH,
  "--screenshot=" + png,
  fileUrl(target),
], { stdio: "ignore" });
console.log(png);
