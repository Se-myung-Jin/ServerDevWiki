// <head> 에서 동기 로드: 첫 페인트 전에 저장된 테마/본문 폭/학습 모드를 적용해 깜빡임을 막는다.
(function () {
  var root = document.documentElement;
  function get(key) {
    try { return localStorage.getItem("sdw." + key); } catch (e) { return null; }
  }
  // 저장된 선택이 없으면 세피아. "auto" 를 고르면 OS 설정을 따른다.
  var theme = get("theme") || "sepia";
  if (theme !== "auto") root.setAttribute("data-theme", theme);
  var width = get("width");
  if (width) root.style.setProperty("--content-width", width + "px");
  if (get("study") !== "off") root.classList.add("study");
})();
