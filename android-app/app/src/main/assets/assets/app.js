// AgentLab 客户端脚本：主题切换 + 站内搜索
(function () {
  // 站点根相对前缀：文章页在 /courses/ 子目录下需要回退一级
  var BASE = location.pathname.indexOf('/courses/') > -1 ? '../' : '';
  var SEARCH_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // ---- 主题切换 ----
  var themeBtn = document.getElementById('themeToggle');
  function applyTheme(next) {
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    if (themeBtn) {
      themeBtn.title = next === 'dark' ? '切换到亮色' : '切换到暗色';
      themeBtn.querySelector('span').textContent = next === 'dark' ? '☀️' : '🌙';
    }
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  // ---- 站内搜索 ----
  var trigger = document.getElementById('searchTrigger');
  var indexUrl = BASE + 'search-index.json';
  var indexCache = null;

  function loadIndex(cb) {
    if (indexCache) return cb(indexCache);
    fetch(indexUrl).then(function (r) { return r.json(); }).then(function (d) {
      indexCache = Array.isArray(d) ? d : [];
      cb(indexCache);
    }).catch(function () { cb([]); });
  }

  function highlight(text, q) {
    if (!q) return text;
    var lower = text.toLowerCase();
    var i = lower.indexOf(q.toLowerCase());
    if (i < 0) return text;
    var start = Math.max(0, i - 24);
    var end = Math.min(text.length, i + q.length + 56);
    var before = (start > 0 ? '…' : '') + text.slice(start, i);
    var hit = text.slice(i, i + q.length);
    var after = text.slice(i + q.length, end) + (end < text.length ? '…' : '');
    return before + '<mark class="sr-mark">' + hit + '</mark>' + after;
  }

  function openSearch() {
    if (document.getElementById('sr-overlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'sr-overlay';
    overlay.id = 'sr-overlay';
    overlay.innerHTML =
      '<div class="sr-panel" role="dialog" aria-modal="true" aria-label="站内搜索">' +
      '  <div class="sr-inputRow">' + SEARCH_SVG +
      '    <input class="sr-input" placeholder="搜索教程、工具、框架、概念…"/>' +
      '    <button class="sr-close" aria-label="关闭">Esc</button>' +
      '  </div>' +
      '  <div class="sr-results"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('.sr-input');
    var results = overlay.querySelector('.sr-results');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    overlay.querySelector('.sr-close').addEventListener('click', closeSearch);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closeSearch(); }
    });
    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!q) { results.innerHTML = '<p class="sr-hint">输入关键词即可搜索全部教程（标题、描述、正文、标签）。</p>'; return; }
      loadIndex(function (idx) {
        var ql = q.toLowerCase();
        var res = idx.filter(function (p) {
          return p.title.toLowerCase().indexOf(ql) > -1 ||
            p.description.toLowerCase().indexOf(ql) > -1 ||
            p.body.toLowerCase().indexOf(ql) > -1 ||
            p.tags.some(function (t) { return t.toLowerCase().indexOf(ql) > -1; });
        }).slice(0, 20);
        if (res.length === 0) {
          results.innerHTML = '<p class="sr-empty">没有找到与「' + q + '」相关的内容。</p>';
          return;
        }
        results.innerHTML = res.map(function (p) {
          return '<button class="sr-item" data-url="' + p.url + '">' +
            '<div class="sr-itemHead">' + (p.category ? '<span class="sr-mod">' + p.category + '</span>' : '') +
            '<span class="sr-itemTitle">' + highlight(p.title, q) + '</span></div>' +
            (p.description ? '<p class="sr-itemDesc">' + highlight(p.description, q) + '</p>' : '') +
            '<p class="sr-itemSnip">' + highlight(p.body, q) + '</p></button>';
        }).join('');
        Array.prototype.forEach.call(results.querySelectorAll('.sr-item'), function (b) {
          b.addEventListener('click', function () {
            closeSearch();
            location.href = BASE + b.getAttribute('data-url');
          });
        });
      });
    });
    setTimeout(function () { input.focus(); }, 30);
  }

  function closeSearch() {
    var o = document.getElementById('sr-overlay');
    if (o) o.remove();
  }

  if (trigger) trigger.addEventListener('click', openSearch);
})();
