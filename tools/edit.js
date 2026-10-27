// 여러 문서를 한 번에 고친다. 고칠 자리를 문자열로 정확히 집어서, 셸의 sed 치환(& 같은 특수 문자)이 내용을 망가뜨리는 일을 막는다.
// node tools/edit.js <edits.json>
//
// edits.json 은 배열이고, 항목마다 고치는 방식 하나를 고른다. file 은 저장소 기준 경로다.
//   {file, find, replace}   find 를 replace 로 바꾼다. find 는 파일 안에 정확히 한 번 있어야 한다.
//   {file, after, insert}   after 가 든 <li> 의 끝(</li> 바로 앞)에 insert 를 넣는다.
//   {file, afterLi, insert} after 가 든 <li> 다음(</li> 바로 뒤)에 insert 를 넣는다.
//   {file, beforeP, insert} beforeP 가 든 문단의 끝(</p> 바로 앞)에 insert 를 넣는다.
// 하나라도 못 찾으면 그 자리에서 멈춘다. 그 앞 항목은 이미 쓰였으니 git diff 로 확인한다.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const edits = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let n = 0;
for (const e of edits) {
  const f = path.join(root, e.file);
  let s = fs.readFileSync(f, "utf8");
  if (e.find !== undefined) {
    const count = s.split(e.find).length - 1;
    if (count !== 1) throw new Error(e.file + ": find 가 " + count + "번 나온다 :: " + e.find.slice(0, 60));
    s = s.split(e.find).join(e.replace);
  } else {
    const key = e.after !== undefined ? e.after : e.afterLi !== undefined ? e.afterLi : e.beforeP;
    const at = s.indexOf(key);
    if (at < 0) throw new Error(e.file + ": 기준 문자열을 못 찾았다 :: " + String(key).slice(0, 60));
    if (e.beforeP !== undefined) {
      const p = s.indexOf("</p>", at);
      s = s.slice(0, p) + e.insert + s.slice(p);
    } else {
      const li = s.indexOf("</li>", at);
      const cut = e.afterLi !== undefined ? li + 5 : li;
      s = s.slice(0, cut) + e.insert + s.slice(cut);
    }
  }
  fs.writeFileSync(f, s);
  n++;
}
console.log(n + "건 고침");
