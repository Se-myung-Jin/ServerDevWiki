// quiz.html 전용: 분야/단계를 골라 점검 문항을 무작위로 푼다.
(function () {
  "use strict";

  document.addEventListener("sdw:ready", function () {
    var SDW = window.SDW;
    var esc = SDW.esc;
    var CATALOG = window.CATALOG || [];
    var QUIZ = window.QUIZ || [];
    var mount = document.getElementById("quiz");

    // 문항에 분야/문서 정보를 붙인다. 카탈로그에 없는 문서를 가리키는 문항은 제외.
    var pool = QUIZ.map(function (q) {
      var f = SDW.findTopic(q.topic);
      return f ? { q: q.q, a: q.a, cat: f.cat, topic: f.topic } : null;
    }).filter(Boolean);
    var orphan = QUIZ.length - pool.length;

    if (!pool.length) {
      mount.innerHTML =
        '<div class="empty">아직 점검 문항이 없습니다.<br><code>assets/quiz-data.js</code>에 문항을 추가하면 여기서 풀 수 있습니다.</div>';
      return;
    }

    function countIn(dir) {
      return pool.filter(function (p) { return p.cat.dir === dir; }).length;
    }

    var catChips = CATALOG.map(function (cat) {
      var n = countIn(cat.dir);
      return (
        '<label class="' + (n ? "" : "is-disabled") + '"><input type="checkbox" name="cat" value="' + cat.dir + '"' +
        (n ? " checked" : " disabled") + "> " + esc(cat.title) + " <small>(" + n + ")</small></label>"
      );
    }).join("");

    mount.innerHTML =
      '<form class="quiz-filters">' +
        "<fieldset><legend>분야</legend>" +
          '<div class="chips">' + catChips + "</div>" +
          '<div class="btn-row" style="margin-top:8px"><button type="button" class="btn" data-all="1">전체 선택</button>' +
          '<button type="button" class="btn" data-all="0">전체 해제</button></div>' +
        "</fieldset>" +
        "<fieldset><legend>중요도</legend><div class=\"chips\">" +
          '<label><input type="checkbox" name="importance" value="핵심" checked> ★ 핵심</label>' +
          '<label><input type="checkbox" name="importance" value="보통" checked> 보통</label>' +
          '<label><input type="checkbox" name="importance" value="참고" checked> 참고</label>' +
        "</div></fieldset>" +
        "<fieldset><legend>문항 수</legend><div class=\"chips\">" +
          '<label><input type="radio" name="size" value="10" checked> 10</label>' +
          '<label><input type="radio" name="size" value="20"> 20</label>' +
          '<label><input type="radio" name="size" value="0"> 전부</label>' +
        "</div></fieldset>" +
        '<div class="btn-row"><button type="submit" class="btn btn--primary">시작</button>' +
        '<span class="quiz-progress" id="quiz-avail"></span></div>' +
        (orphan ? '<p class="quiz-progress">catalog.js에 없는 문서를 가리키는 문항 ' + orphan + "개는 제외했습니다.</p>" : "") +
      "</form>" +
      '<div id="quiz-stage"></div>';

    var form = mount.querySelector("form");
    var stage = document.getElementById("quiz-stage");
    var avail = document.getElementById("quiz-avail");

    function checked(name) {
      return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) {
        return i.value;
      });
    }

    function selection() {
      var cats = checked("cat"), picked = checked("importance");
      return pool.filter(function (p) {
        return cats.indexOf(p.cat.dir) !== -1 && picked.indexOf(p.topic.importance || "보통") !== -1;
      });
    }

    function updateAvail() {
      avail.textContent = "선택한 범위의 문항 " + selection().length + "개";
    }
    form.addEventListener("change", updateAvail);
    form.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-all");
      if (v === null || v === undefined) return;
      form.querySelectorAll('input[name="cat"]:not(:disabled)').forEach(function (i) { i.checked = v === "1"; });
      updateAvail();
    });
    updateAvail();

    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    var deck = [], pos = 0, missed = [], known = 0;

    function start(items) {
      deck = items;
      pos = 0;
      missed = [];
      known = 0;
      show();
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var items = shuffle(selection());
      var size = parseInt(checked("size")[0], 10);
      if (size) items = items.slice(0, size);
      if (!items.length) {
        stage.innerHTML = '<div class="empty">선택한 범위에 문항이 없습니다.</div>';
        return;
      }
      start(items);
    });

    function show() {
      if (pos >= deck.length) return finish();
      var p = deck[pos];
      stage.innerHTML =
        '<div class="quiz-card">' +
          '<div class="quiz-card__meta">' + (pos + 1) + " / " + deck.length + " · " + esc(p.cat.title) + " · " +
            '<a href="' + SDW.topicHref(p.cat, p.topic) + '" target="_blank" rel="noopener">' + esc(p.topic.title) + "</a></div>" +
          '<p class="quiz-card__q">' + esc(p.q) + "</p>" +
          '<div class="quiz-card__a" hidden>' + p.a + "</div>" +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn--primary" data-act="reveal">정답 보기</button>' +
            '<button type="button" class="btn btn--ok" data-act="ok" hidden>알았다</button>' +
            '<button type="button" class="btn btn--bad" data-act="miss" hidden>몰랐다</button>' +
          "</div>" +
        "</div>";
    }

    function finish() {
      var missList = missed.map(function (p) {
        return '<li><a href="' + SDW.topicHref(p.cat, p.topic) + '">' + esc(p.topic.title) + "</a> — " + esc(p.q) + "</li>";
      }).join("");
      stage.innerHTML =
        '<div class="quiz-card">' +
          '<p class="quiz-card__q">끝. ' + deck.length + "문항 중 " + known + "개를 알았습니다.</p>" +
          (missed.length ? "<p>다시 읽어볼 문서</p><ul>" + missList + "</ul>" : "<p>모르는 문항이 없었습니다.</p>") +
          '<div class="btn-row">' +
            (missed.length ? '<button type="button" class="btn btn--primary" data-act="retry">모른 것만 다시</button>' : "") +
            '<button type="button" class="btn" data-act="again">같은 범위 새로 섞기</button>' +
          "</div>" +
        "</div>";
    }

    stage.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      if (act === "reveal") {
        stage.querySelector(".quiz-card__a").hidden = false;
        e.target.hidden = true;
        stage.querySelector('[data-act="ok"]').hidden = false;
        stage.querySelector('[data-act="miss"]').hidden = false;
      } else if (act === "ok" || act === "miss") {
        if (act === "ok") known++;
        else missed.push(deck[pos]);
        pos++;
        show();
      } else if (act === "retry") {
        start(shuffle(missed.slice()));
      } else if (act === "again") {
        form.requestSubmit();
      }
    });
  });
})();
