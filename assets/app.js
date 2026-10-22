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

    var shell = el(
      '<div class="layout">' +
        '<button type="button" class="menu-btn" aria-label="메뉴 열기">☰ 목차</button>' +
        '<aside class="side">' +
          '<div class="side__brand"><a href="' + ROOT + 'index.html">' + SITE + "</a></div>" +
          '<div class="side__sub">' + SUBTITLE + "</div>" +
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

    document.querySelector(".menu-btn").addEventListener("click", function () {
      document.body.classList.toggle("side-open");
    });

    var search = document.querySelector(".side__search");
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

  function renderHome(main) {
    var t = totals();
    var cards = CATALOG.map(function (cat) {
      return (
        '<a class="card" href="' + catHref(cat) + '">' +
          '<div class="card__no">' + catNo(cat) + "</div>" +
          '<div class="card__k">' + esc(cat.title) + "</div>" +
          '<div class="card__v">문서 ' + cat.topics.length + " · 문항 " + questionCount(cat) + "</div>" +
        "</a>"
      );
    }).join("");
    var rows = CATALOG.map(function (cat) {
      return (
        "<tr><td class=\"num\">" + catNo(cat) + '</td><td><a href="' + catHref(cat) + '">' + esc(cat.title) + "</a></td>" +
        "<td>" + esc(cat.desc) + '</td><td class="num">' + cat.topics.length + '</td><td class="num">' + questionCount(cat) + "</td></tr>"
      );
    }).join("");

    main.insertAdjacentHTML(
      "afterbegin",
      '<h1 class="doc-title">' + SITE + "</h1>" +
      '<p class="doc-desc">주제 문서가 본체이고, 점검 문항은 모두 그 문서로 이어진다. 현재 문서 ' +
        t.topics + "개 · 문항 " + t.questions + "개.</p>" +
      '<a class="cta" href="' + ROOT + 'quiz.html">점검 문항 · 골라서 무작위로 풀기 →</a>' +
      '<div class="cards">' + cards + "</div>" +
      "<h2>분야</h2>" +
      '<div class="table-scroll"><table><thead><tr><th class="num">#</th><th>분야</th><th>다루는 내용</th>' +
        '<th class="num">문서</th><th class="num">문항</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
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
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
