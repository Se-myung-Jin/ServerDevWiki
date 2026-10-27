// ServerDevWiki 공통 스크립트
// 페이지는 <body data-page="home|category|topic|quiz"> 로 종류를 선언하고,
// 이 스크립트가 사이드바 · 제목 · 목차 · 점검 문항 · 이전/다음 링크를 채운다.
(function () {
  "use strict";

  var SITE = "ServerDevWiki";
  var SUBTITLE = "게임 서버 프로그래머를 위한 기초와 심화";
  var THEMES = [
    ["auto", "자동 (시스템)"],
    ["light", "라이트"],
    ["dark", "다크"],
    ["sepia", "세피아"],
    ["terminal", "터미널"],
  ];
  var HLJS = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/";

  var CATALOG = window.CATALOG || [];
  var QUIZ = window.QUIZ || [];

  // 이 스크립트 위치로 사이트 루트를 구한다(file:// 과 GitHub Pages 하위 경로 모두 대응).
  var ROOT = (function () {
    var src = document.currentScript && document.currentScript.src;
    return src ? src.replace(/assets\/app\.js(\?.*)?$/, "") : "./";
  })();

  // ---------- utils ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem("sdw." + key);
      localStorage.setItem("sdw." + key, value);
    } catch (e) {
      return null;
    }
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  // 분야 번호는 폴더 이름이 아니라 catalog.js 에 적힌 순서로 매긴다.
  function catNo(cat) {
    var n = CATALOG.indexOf(cat) + 1;
    return (n < 10 ? "0" : "") + n;
  }

  function topicId(cat, t) {
    return cat.dir + "/" + t.slug;
  }

  function topicHref(cat, t) {
    return ROOT + cat.dir + "/" + t.slug + ".html";
  }

  function catHref(cat) {
    return ROOT + cat.dir + "/index.html";
  }

  function findCategory(dir) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].dir === dir) return CATALOG[i];
    return null;
  }

  function findTopic(id) {
    var parts = String(id).split("/");
    var cat = findCategory(parts[0]);
    if (!cat) return null;
    for (var i = 0; i < cat.topics.length; i++) {
      if (cat.topics[i].slug === parts[1]) return { cat: cat, topic: cat.topics[i], index: i };
    }
    return null;
  }

  function questionsOf(id) {
    return QUIZ.filter(function (q) { return q.topic === id; });
  }

  function questionCount(cat) {
    var prefix = cat.dir + "/";
    return QUIZ.filter(function (q) { return q.topic.indexOf(prefix) === 0; }).length;
  }

  // importance: "핵심" | "참고" | 생략(보통, 표시 없음)
  function badge(importance) {
    if (importance === "핵심") return '<span class="badge badge--core">★ 핵심</span>';
    if (importance === "참고") return '<span class="badge badge--ref">참고</span>';
    return "";
  }

  function totals() {
    var topics = 0;
    CATALOG.forEach(function (c) { topics += c.topics.length; });
    return { topics: topics, questions: QUIZ.length };
  }

  // ---------- shell (sidebar + main) ----------

  function buildShell(currentCat, currentTopicId) {
    var body = document.body;
    var content = document.createDocumentFragment();
    while (body.firstChild) {
      if (body.firstChild.tagName === "SCRIPT") body.removeChild(body.firstChild);
      else content.appendChild(body.firstChild);
    }

    var nav = CATALOG.map(function (cat) {
      var isCur = currentCat && currentCat.dir === cat.dir;
      var topics = "";
      if (isCur) {
        topics = cat.topics.length
          ? '<ul class="nav__topics">' + cat.topics.map(function (t) {
              var cur = topicId(cat, t) === currentTopicId ? ' class="is-current"' : "";
              return '<li><a href="' + topicHref(cat, t) + '"' + cur + ">" + esc(t.title) + "</a></li>";
            }).join("") + "</ul>"
          : '<ul class="nav__topics"><li class="nav__empty">아직 문서가 없습니다</li></ul>';
      }
      return (
        '<li class="nav__cat' + (isCur ? " is-current" : "") + '" data-search="' +
        esc((cat.title + " " + cat.topics.map(function (t) { return t.title; }).join(" ")).toLowerCase()) + '">' +
        '<a href="' + catHref(cat) + '"><span>' + esc(cat.title) + '</span><span class="n">' + cat.topics.length + "</span></a>" +
        topics + "</li>"
      );
    }).join("");

    var themeOptions = THEMES.map(function (t) {
      return '<option value="' + t[0] + '">' + t[1] + "</option>";
    }).join("");

    // 위쪽 바: 메뉴 버튼, 사이트 이름, 지금 분야, 검색과 점검 문항 바로가기.
    // 메뉴(분야 목록과 설정)는 평소 숨겨 두고 버튼이나 단축키로 왼쪽에서 꺼낸다.
    var here = currentCat
      ? '<span class="topbar__sep">/</span><a class="topbar__here" href="' + catHref(currentCat) + '">' + esc(currentCat.title) + "</a>"
      : "";
    var shell = el(
      '<div class="layout">' +
        '<header class="topbar">' +
          '<button type="button" class="menu-btn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="side">' +
            '<span class="menu-btn__bars" aria-hidden="true"><i></i><i></i><i></i></span>' +
          "</button>" +
          '<a class="topbar__brand" href="' + ROOT + 'index.html">' + SITE + "</a>" + here +
          '<span class="topbar__gap"></span>' +
          '<button type="button" class="topbar__search" aria-label="분야와 문서 검색">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13l4 4"/></svg>' +
            '<span class="topbar__search-text">검색</span><kbd>/</kbd>' +
          "</button>" +
          '<a class="topbar__quiz" href="' + ROOT + 'quiz.html">점검 문항</a>' +
          (currentTopicId ? '<span class="topbar__progress" aria-hidden="true"></span>' : "") +
        "</header>" +
        '<div class="side-backdrop" hidden></div>' +
        '<aside class="side" id="side" aria-label="분야와 설정">' +
          '<div class="side__head">' +
            '<div><div class="side__brand"><a href="' + ROOT + 'index.html">' + SITE + "</a></div>" +
            '<div class="side__sub">' + SUBTITLE + "</div></div>" +
            '<button type="button" class="side__close" aria-label="메뉴 닫기">×</button>' +
          "</div>" +
          '<input type="search" class="side__search" placeholder="분야 · 문서 검색" aria-label="분야와 문서 검색">' +
          '<div class="side__label">분야</div>' +
          '<ul class="nav">' + nav + "</ul>" +
          '<div class="side__label"><a href="' + ROOT + 'quiz.html">점검 문항 풀기 →</a></div>' +
          '<div class="side__label">설정</div>' +
          '<div class="settings">' +
            '<label>테마<select id="theme-select">' + themeOptions + "</select></label>" +
            '<label>본문 폭<span class="width-row"><input type="range" id="width-range" min="600" max="1400" step="20"><span id="width-val"></span></span></label>' +
            '<label>학습 모드<button type="button" id="study-toggle"></button></label>' +
          "</div>" +
        "</aside>" +
        '<div class="main"><div class="main__inner"></div></div>' +
      "</div>"
    );
    shell.querySelector(".main__inner").appendChild(content);
    body.insertBefore(shell, body.firstChild);
    return shell.querySelector(".main__inner");
  }

  function bindShell() {
    var root = document.documentElement;

    var themeSel = document.getElementById("theme-select");
    themeSel.value = store("theme") || "sepia";
    themeSel.addEventListener("change", function () {
      store("theme", themeSel.value);
      if (themeSel.value === "auto") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", themeSel.value);
    });

    var range = document.getElementById("width-range");
    var rangeVal = document.getElementById("width-val");
    var width = parseInt(store("width"), 10) || parseInt(getComputedStyle(root).getPropertyValue("--content-width"), 10) || 880;
    range.value = width;
    rangeVal.textContent = width + "px";
    range.addEventListener("input", function () {
      root.style.setProperty("--content-width", range.value + "px");
      rangeVal.textContent = range.value + "px";
      store("width", range.value);
    });

    var studyBtn = document.getElementById("study-toggle");
    function renderStudy() {
      studyBtn.textContent = root.classList.contains("study") ? "ON — 빈칸 가리기" : "OFF";
    }
    renderStudy();
    studyBtn.addEventListener("click", function () {
      root.classList.toggle("study");
      store("study", root.classList.contains("study") ? "on" : "off");
      renderStudy();
    });

    // 메뉴 드로어: 버튼, 바깥 클릭, Esc로 여닫고, "/"나 Ctrl+K는 열면서 검색 칸으로 간다.
    var body = document.body;
    var side = document.getElementById("side");
    var menuBtn = document.querySelector(".menu-btn");
    var backdrop = document.querySelector(".side-backdrop");
    var search = document.querySelector(".side__search");
    function setMenu(open, focusSearch) {
      if (open === body.classList.contains("side-open")) {
        if (open && focusSearch) search.focus();
        return;
      }
      body.classList.toggle("side-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      if (open) {
        backdrop.hidden = false;
        var cur = side.querySelector(".nav__topics a.is-current, .nav__cat.is-current > a");
        if (cur) cur.scrollIntoView({ block: "center" });
        (focusSearch ? search : side.querySelector(".side__close")).focus({ preventScroll: true });
      } else {
        setTimeout(function () { if (!body.classList.contains("side-open")) backdrop.hidden = true; }, 250);
        if (side.contains(document.activeElement)) menuBtn.focus();
      }
    }
    menuBtn.addEventListener("click", function () { setMenu(!body.classList.contains("side-open")); });
    document.querySelector(".topbar__search").addEventListener("click", function () { setMenu(true, true); });
    document.querySelector(".side__close").addEventListener("click", function () { setMenu(false); });
    backdrop.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === "Escape" && body.classList.contains("side-open")) setMenu(false);
      else if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setMenu(true, true);
      }
    });

    // 문서 페이지에서는 위쪽 바 아래에 읽은 정도를 가는 선으로 보여 준다.
    var progress = document.querySelector(".topbar__progress");
    if (progress) {
      var onScroll = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
    }

    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".nav__cat").forEach(function (li) {
        li.hidden = q && li.getAttribute("data-search").indexOf(q) === -1;
      });
    });

    // 학습 모드의 빈칸: 클릭하면 드러나고 다시 클릭하면 가려진다.
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".blank");
      if (b && root.classList.contains("study")) b.classList.toggle("is-open");
    });
  }

  // ---------- pages ----------

  // 학습 로드맵의 단계. 분야 순서(catalog.js)가 곧 학습 순서라서 단계는 그 순서를 묶기만 한다.
  var ROADMAP = [
    { name: "기반", desc: "코드가 CPU와 OS 위에서 실제로 어떻게 도는가", dirs: ["computer-architecture", "operating-system", "system-programming"] },
    { name: "도구", desc: "데이터를 담는 모양과 다루는 방법", dirs: ["data-structure", "algorithm"] },
    { name: "통신", desc: "바이트가 망을 건너 서버 로직에 닿기까지", dirs: ["network", "server"] },
    { name: "언어", desc: "서버를 짓는 언어와 런타임의 속사정", dirs: ["csharp", "cpp"] },
    { name: "설계", desc: "게임 로직, 데이터, 서버 구성", dirs: ["game-patterns", "database", "architecture"] },
    { name: "운영", desc: "지키고, 배포하고, 살려 두기", dirs: ["security", "operations"] },
  ];
  var ROADMAP_SIDE = { name: "클라이언트 접점", desc: "서버가 상대하는 반대편을 알아 두기", dirs: ["unity", "graphics"] };

  // 세 원이 겹치는 자리에 놓을 토픽과 짧은 이름표. 겹친 칸이 좁아서 제목 대신 이름표를 쓴다.
  // 아직 없는 토픽은 흐리게 표시된다.
  var VENN = {
    circles: [
      { name: "시스템", sub: ["컴퓨터 구조", "운영체제", "시스템 프로그래밍"] },
      { name: "네트워크", sub: ["네트워크", "서버 프로그래밍"] },
      { name: "게임", sub: ["게임 패턴", "Unity", "그래픽스"] },
    ],
    ab: [["server/io-models", "I/O 모델"], ["server/completion-port", "IOCP"], ["system-programming/syscall-cost", "시스템 콜 비용"]],
    ac: [["server/tick-loop", "틱 루프"], ["data-structure/memory-layout", "메모리 배치"], ["operating-system/clocks-timers", "시계와 타이머"]],
    bc: [["server/protocol-choice", "프로토콜 설계"], ["server/aoi-broadcast", "관심 영역"], ["game-patterns/state-sync", "상태 동기화"]],
    abc: ["server/threading-model", "스레딩 모델"],
  };

  function importanceCount(cat) {
    var n = { core: 0, mid: 0, ref: 0 };
    cat.topics.forEach(function (t) {
      if (t.importance === "핵심") n.core++;
      else if (t.importance === "참고") n.ref++;
      else n.mid++;
    });
    return n;
  }

  // 핵심·보통·참고 구성 막대. 막대 전체 길이는 가장 큰 분야를 기준으로 한 상대 길이다.
  function mixBar(cat, max) {
    var n = importanceCount(cat), total = cat.topics.length || 1;
    var w = Math.round((cat.topics.length / max) * 100);
    return (
      '<span class="mix" style="width:' + w + '%" title="핵심 ' + n.core + " · 보통 " + n.mid + " · 참고 " + n.ref + '">' +
        '<i class="mix__core" style="flex:' + n.core / total + '"></i>' +
        '<i class="mix__mid" style="flex:' + n.mid / total + '"></i>' +
        '<i class="mix__ref" style="flex:' + n.ref / total + '"></i>' +
      "</span>"
    );
  }

  function roadmapNode(cat, max) {
    var empty = cat.topics.length === 0;
    return (
      '<a class="rm-node' + (empty ? " is-empty" : "") + '" href="' + catHref(cat) + '">' +
        '<span class="rm-node__no">' + catNo(cat) + "</span>" +
        '<span class="rm-node__k">' + esc(cat.title) + "</span>" +
        '<span class="rm-node__v">' + (empty ? "작성 예정" : "문서 " + cat.topics.length + " · 핵심 " + importanceCount(cat).core) + "</span>" +
        (empty ? "" : mixBar(cat, max)) +
      "</a>"
    );
  }

  function roadmapStage(stage, i, max, side) {
    var nodes = stage.dirs.map(findCategory).filter(Boolean).map(function (c) { return roadmapNode(c, max); }).join("");
    return (
      '<li class="rm-stage' + (side ? " rm-stage--side" : "") + '">' +
        '<div class="rm-stage__head">' +
          '<span class="rm-stage__step">' + (side ? "곁가지" : "STEP " + (i + 1)) + "</span>" +
          '<span class="rm-stage__name">' + esc(stage.name) + "</span>" +
          '<span class="rm-stage__desc">' + esc(stage.desc) + "</span>" +
        "</div>" +
        '<div class="rm-stage__nodes">' + nodes + "</div>" +
      "</li>"
    );
  }

  // 벤 다이어그램 안의 토픽 한 줄. 등록된 토픽이면 링크, 아니면 흐린 글자.
  function vennTopic(item, x, y, cls) {
    var f = findTopic(item[0]);
    if (!f) return '<text class="vn-topic is-pending" x="' + x + '" y="' + y + '" text-anchor="middle">' + esc(item[1]) + "<title>작성 예정 문서</title></text>";
    return (
      '<a href="' + topicHref(f.cat, f.topic) + '"><title>' + esc(f.topic.title) + '</title><text class="vn-topic' + (cls ? " " + cls : "") +
        '" x="' + x + '" y="' + y + '" text-anchor="middle">' + esc(item[1]) + "</text></a>"
    );
  }

  function vennSvg() {
    var c = VENN.circles;
    function lines(ids, x, y0) {
      return ids.map(function (item, i) { return vennTopic(item, x, y0 + i * 20); }).join("");
    }
    function subs(list, x, y0, anchor) {
      return list.map(function (s, i) {
        return '<text class="vn-sub" x="' + x + '" y="' + (y0 + i * 18) + '" text-anchor="' + anchor + '">' + esc(s) + "</text>";
      }).join("");
    }
    return (
      '<svg class="venn" viewBox="0 0 720 520" role="img" aria-label="시스템, 네트워크, 게임 세 영역이 겹치는 자리에 게임 서버 프로그래밍이 있다">' +
        '<circle class="vn-c vn-c1" cx="270" cy="190" r="165"/>' +
        '<circle class="vn-c vn-c2" cx="450" cy="190" r="165"/>' +
        '<circle class="vn-c vn-c3" cx="360" cy="345" r="165"/>' +
        '<text class="vn-name vn-n1" x="170" y="118" text-anchor="middle">' + c[0].name + "</text>" +
        '<text class="vn-name vn-n2" x="550" y="118" text-anchor="middle">' + c[1].name + "</text>" +
        '<text class="vn-name vn-n3" x="360" y="492" text-anchor="middle">' + c[2].name + "</text>" +
        subs(c[0].sub, 170, 146, "middle") +
        subs(c[1].sub, 550, 146, "middle") +
        subs(c[2].sub, 360, 424, "middle") +
        lines(VENN.ab, 360, 92) +
        lines(VENN.ac, 262, 284) +
        lines(VENN.bc, 458, 284) +
        '<text class="vn-core" x="360" y="214" text-anchor="middle">게임 서버</text>' +
        vennTopic(VENN.abc, 360, 238, "vn-topic--core") +
      "</svg>"
    );
  }

  // 날짜마다 바뀌는 핵심 토픽 하나. 같은 날에는 누구에게나 같은 토픽이 나온다.
  function topicOfDay() {
    var pool = [];
    CATALOG.forEach(function (cat) {
      cat.topics.forEach(function (t) { if (t.importance === "핵심") pool.push({ cat: cat, topic: t }); });
    });
    if (!pool.length) return "";
    var day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    var p = pool[(day * 7919) % pool.length];
    return (
      '<a class="today" href="' + topicHref(p.cat, p.topic) + '">' +
        '<span class="today__label">오늘의 토픽 · ' + catNo(p.cat) + " " + esc(p.cat.title) + "</span>" +
        '<span class="today__title">' + esc(p.topic.title) + "</span>" +
        '<span class="today__sum">' + esc(p.topic.summary) + "</span>" +
      "</a>"
    );
  }

  function renderHome(main) {
    var t = totals();
    var max = Math.max.apply(null, CATALOG.map(function (c) { return c.topics.length; }).concat([1]));
    var core = 0, started = 0;
    CATALOG.forEach(function (c) {
      core += importanceCount(c).core;
      if (c.topics.length) started++;
    });
    var stages = ROADMAP.map(function (s, i) { return roadmapStage(s, i, max, false); }).join("") +
      roadmapStage(ROADMAP_SIDE, 0, max, true);

    main.insertAdjacentHTML(
      "afterbegin",
      '<section class="hero">' +
        '<p class="hero__eyebrow">게임 서버 프로그래머를 위한 기초와 심화</p>' +
        '<h1 class="hero__title">' + SITE + "</h1>" +
        '<p class="hero__lead">"어떻게 고쳤나"보다 "왜 그렇게 동작하나"까지. CPU와 커널에서 출발해 네트워크와 서버, ' +
          "게임 설계와 운영까지 한 줄로 이어지는 이론 정리다. 모든 점검 문항은 그 근거가 되는 문서로 이어진다.</p>" +
        '<dl class="stats">' +
          "<div><dt>문서</dt><dd>" + t.topics + "</dd></div>" +
          "<div><dt>점검 문항</dt><dd>" + t.questions + "</dd></div>" +
          "<div><dt>★ 핵심 토픽</dt><dd>" + core + "</dd></div>" +
          "<div><dt>분야</dt><dd>" + started + '<small>/' + CATALOG.length + "</small></dd></div>" +
        "</dl>" +
        '<div class="hero__actions">' +
          '<a class="cta" href="#roadmap">로드맵 보기 ↓</a>' +
          '<a class="cta cta--ghost" href="' + ROOT + 'quiz.html">점검 문항 무작위로 풀기 →</a>' +
        "</div>" +
      "</section>" +
      topicOfDay() +
      '<h2 id="roadmap">학습 로드맵</h2>' +
      '<p class="doc-desc">아래로 갈수록 앞 단계를 딛고 선다. 막대는 분야의 문서 수와 ' +
        '<span class="key key--core">핵심</span> <span class="key key--mid">보통</span> <span class="key key--ref">참고</span> 구성이다.</p>' +
      '<ol class="roadmap">' + stages + "</ol>" +
      "<h2>게임 서버 프로그래머가 서 있는 자리</h2>" +
      '<p class="doc-desc">시스템, 네트워크, 게임 세 영역이 겹치는 곳이다. 겹친 자리의 토픽을 누르면 그 문서로 간다.</p>' +
      '<div class="venn-wrap">' + vennSvg() + "</div>"
    );
  }

  // 분야의 태그 중 실제로 쓰인 것만, 분야에 정의된 순서대로 돌려준다.
  function usedTags(cat) {
    var tags = cat.tags || [];
    if (tags.length >= 10) console.warn("[catalog] " + cat.dir + " 의 태그가 " + tags.length + "개입니다. 10개 미만으로 유지하세요.");
    cat.topics.forEach(function (t) {
      (t.tags || []).forEach(function (tag) {
        if (tags.indexOf(tag) === -1) console.warn("[catalog] " + cat.dir + "/" + t.slug + " 의 태그 '" + tag + "' 가 분야 tags 에 없습니다.");
      });
    });
    return tags.filter(function (tag) {
      return cat.topics.some(function (t) { return (t.tags || []).indexOf(tag) !== -1; });
    });
  }

  function tagHref(cat, tag) {
    return catHref(cat) + "?tag=" + encodeURIComponent(tag);
  }

  function renderCategory(main, cat) {
    var list = "";
    // 핵심 · 보통은 한 목록에, 참고는 아래 별도 섹션으로 나눈다.
    var regular = cat.topics.filter(function (t) { return t.importance !== "참고"; });
    var refs = cat.topics.filter(function (t) { return t.importance === "참고"; });
    var tags = usedTags(cat);

    function row(t, isRef) {
      var cls = !isRef && t.importance === "핵심" ? ' class="is-core"' : "";
      return (
        "<li" + cls + ' data-tags="' + esc((t.tags || []).join("|")) + '"><a href="' + topicHref(cat, t) + '">' +
          '<span class="tlist__title">' + esc(t.title) + (isRef ? "" : " " + badge(t.importance)) + "</span>" +
          '<span class="tlist__n">문항 ' + questionsOf(topicId(cat, t)).length + "</span>" +
          (!isRef && t.summary ? '<span class="tlist__sum">' + esc(t.summary) + "</span>" : "") +
        "</a></li>"
      );
    }

    if (tags.length) {
      list +=
        '<div class="tagbar" role="group" aria-label="태그로 거르기">' +
          '<button type="button" class="tag is-on" data-tag="">전체 <span>' + cat.topics.length + "</span></button>" +
          tags.map(function (tag) {
            var n = cat.topics.filter(function (t) { return (t.tags || []).indexOf(tag) !== -1; }).length;
            return '<button type="button" class="tag" data-tag="' + esc(tag) + '"># ' + esc(tag) + " <span>" + n + "</span></button>";
          }).join("") +
        "</div>";
    }
    if (regular.length) {
      list +=
        '<div class="legend"><span>' + badge("핵심") + " 면접에서 주로 다룬다</span><span>표시 없음 · 보통</span></div>" +
        '<ul class="tlist">' + regular.map(function (t) { return row(t, false); }).join("") + "</ul>";
    }
    if (refs.length) {
      list +=
        '<section class="ref-section">' +
          '<h2 class="ref-title">참고</h2>' +
          '<p class="doc-desc">알아두면 좋지만 면접이나 실무에 꼭 필요하지는 않은 내용이다.</p>' +
          '<ul class="tlist tlist--ref">' + refs.map(function (t) { return row(t, true); }).join("") + "</ul>" +
        "</section>";
    }
    if (!cat.topics.length) {
      list =
        '<div class="empty">아직 등록된 문서가 없습니다.<br>' +
        "<code>templates/topic.html</code>을 <code>" + esc(cat.dir) + "/</code>에 복사하고 " +
        "<code>assets/catalog.js</code>에 등록하세요.</div>";
    }
    main.insertAdjacentHTML(
      "afterbegin",
      '<div class="crumbs"><a href="' + ROOT + 'index.html">' + SITE + "</a><span>/</span>" + catNo(cat) + "</div>" +
      '<h1 class="doc-title">' + esc(cat.title) + "</h1>" +
      '<p class="doc-desc">' + esc(cat.desc) + "</p>" +
      list
    );

    if (tags.length) bindTagFilter(main, tags);
  }

  function bindTagFilter(main, tags) {
    var bar = main.querySelector(".tagbar");

    function apply(tag) {
      bar.querySelectorAll(".tag").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-tag") === tag);
      });
      main.querySelectorAll(".tlist li").forEach(function (li) {
        li.hidden = !!tag && li.getAttribute("data-tags").split("|").indexOf(tag) === -1;
      });
      // 걸러진 결과가 없는 목록 · 섹션은 통째로 숨긴다.
      main.querySelectorAll(".tlist").forEach(function (ul) {
        var any = ul.querySelector("li:not([hidden])");
        ul.hidden = !any;
        var legend = ul.previousElementSibling;
        if (legend && legend.classList.contains("legend")) legend.hidden = !any;
      });
      var ref = main.querySelector(".ref-section");
      if (ref) ref.hidden = !ref.querySelector("li:not([hidden])");
      try {
        history.replaceState(null, "", location.pathname + (tag ? "?tag=" + encodeURIComponent(tag) : "") + location.hash);
      } catch (e) { /* file:// 등에서 막히면 주소만 안 바뀐다 */ }
    }

    bar.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".tag");
      if (!b) return;
      var tag = b.getAttribute("data-tag");
      apply(b.classList.contains("is-on") ? "" : tag);
    });

    var initial = "";
    try { initial = new URLSearchParams(location.search).get("tag") || ""; } catch (e) {}
    if (tags.indexOf(initial) !== -1) apply(initial);
  }

  function renderTopic(main, found, id) {
    var body = main.querySelector(".doc-body");
    if (!found) {
      main.insertAdjacentHTML(
        "afterbegin",
        '<div class="empty">이 문서(<code>' + esc(id) + "</code>)가 <code>assets/catalog.js</code>에 등록되어 있지 않습니다.</div>"
      );
      return;
    }
    var cat = found.cat, t = found.topic;
    document.title = t.title + " · " + cat.title + " · " + SITE;

    // h2 · h3 에 id 를 붙이고 2단 목차를 만든다.
    var heads = body ? body.querySelectorAll("h2, h3") : [];
    var toc = "";
    if (heads.length > 1) {
      var html = "", open = false;
      Array.prototype.forEach.call(heads, function (h, i) {
        if (!h.id) h.id = "s" + (i + 1);
        var item = '<a href="#' + h.id + '">' + esc(h.textContent) + "</a>";
        if (h.tagName === "H3") {
          if (!open) { html += "<ol>"; open = true; }
          html += "<li>" + item + "</li>";
        } else {
          if (open) { html += "</ol>"; open = false; }
          html += (i ? "</li>" : "") + "<li>" + item;
        }
      });
      if (open) html += "</ol>";
      if (questionsOf(id).length) html += '</li><li><a href="#questions">점검 문항</a>';
      toc = '<nav class="toc"><strong>목차</strong><ol>' + html + "</li></ol></nav>";
    }

    main.insertAdjacentHTML(
      "afterbegin",
      '<div class="crumbs"><a href="' + ROOT + 'index.html">' + SITE + '</a><span>/</span><a href="' + catHref(cat) + '">' +
        esc(cat.title) + "</a></div>" +
      '<h1 class="doc-title">' + esc(t.title) + " " + badge(t.importance) + "</h1>" +
      (t.tags && t.tags.length
        ? '<div class="tagbar tagbar--doc">' + t.tags.map(function (tag) {
            return '<a class="tag" href="' + tagHref(cat, tag) + '"># ' + esc(tag) + "</a>";
          }).join("") + "</div>"
        : "") +
      (t.summary ? '<p class="doc-desc">' + esc(t.summary) + "</p>" : "") +
      toc
    );

    var qs = questionsOf(id);
    if (qs.length) {
      main.insertAdjacentHTML(
        "beforeend",
        '<h2 id="questions">점검 문항</h2><div class="qlist">' +
          qs.map(function (q) {
            return '<details class="q"><summary>' + esc(q.q) + '</summary><div class="q__a">' + q.a + "</div></details>";
          }).join("") +
        "</div>"
      );
    }

    var prev = cat.topics[found.index - 1], next = cat.topics[found.index + 1];
    main.insertAdjacentHTML(
      "beforeend",
      '<nav class="pager">' +
        (prev ? '<a class="prev" href="' + topicHref(cat, prev) + '"><small>← 이전</small>' + esc(prev.title) + "</a>" : "<span></span>") +
        (next ? '<a class="next" href="' + topicHref(cat, next) + '"><small>다음 →</small>' + esc(next.title) + "</a>" : "<span></span>") +
      "</nav>"
    );
  }

  // ---------- 문서 참조: <a data-ref="분야/slug">…</a> ----------
  // 대상 문서가 catalog.js 에 등록돼 있으면 링크가 되고, 아직 없으면 "작성 예정" 표시로 남는다.
  // 그래서 나중에 쓸 문서도 미리 걸어 둘 수 있다.
  function resolveRefs() {
    document.querySelectorAll("a[data-ref]").forEach(function (a) {
      var found = findTopic(a.getAttribute("data-ref"));
      if (found) {
        a.href = topicHref(found.cat, found.topic);
        a.title = found.topic.title;
      } else {
        a.removeAttribute("href");
        a.classList.add("ref-pending");
        a.title = "작성 예정 문서";
      }
    });
  }

  // ---------- code highlight (pre > code 가 있을 때만 CDN 로드) ----------

  function highlight() {
    if (!document.querySelector("pre code")) return;
    // 토큰 색은 style.css 에서 테마 변수로 지정하므로 hljs 테마 CSS 는 불러오지 않는다.
    var s = document.createElement("script");
    s.src = HLJS + "highlight.min.js";
    s.onload = function () {
      if (window.hljs) window.hljs.highlightAll();
    };
    document.head.appendChild(s);
  }

  // ---------- boot ----------

  function boot() {
    var page = document.body.getAttribute("data-page") || "topic";
    var currentCat = null, found = null, id = null;

    if (page === "category") currentCat = findCategory(document.body.getAttribute("data-category"));
    if (page === "topic") {
      id = document.body.getAttribute("data-topic");
      found = findTopic(id);
      currentCat = found ? found.cat : findCategory(String(id).split("/")[0]);
    }

    var main = buildShell(currentCat, id);
    bindShell();

    if (page === "home") renderHome(main);
    else if (page === "category" && currentCat) renderCategory(main, currentCat);
    else if (page === "topic") renderTopic(main, found, id);

    resolveRefs();
    highlight();
    document.dispatchEvent(new CustomEvent("sdw:ready", { detail: { root: ROOT } }));
  }

  // 다른 스크립트(quiz.js)에서 쓰도록 노출
  window.SDW = {
    root: ROOT,
    esc: esc,
    store: store,
    findTopic: findTopic,
    topicHref: topicHref,
    sideDirs: ROADMAP_SIDE.dirs,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
