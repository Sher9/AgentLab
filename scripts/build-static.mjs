// ============================================================
//  AgentLab 静态站生成器（纯 HTML5，无 Next.js 运行时）
//  用法：node scripts/build-static.mjs
//  输出：static/ 目录（index.html / courses.html / about.html / courses/*.html）
//  结构：14 个一级分类 + 子主题文章（frontmatter 用 category + order）
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_DIR = path.join(ROOT, 'static');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const COURSES_OUT = path.join(OUT_DIR, 'courses');

// ---- 站点样式源 ----
// 已从原 Next.js 的 CSS Modules（globals.css + 各 .module.css）合并为单一文件，
// 前缀类 hdr-/ftr-/hv-/co-/tt-/sr-/home-/cr-/art- 已内联，样式与视觉完全一致。
// 改样式只需编辑 src/styles/site.css，然后重新 node scripts/build-static.mjs。
const SITE_CSS = path.join(ROOT, 'src/styles/site.css');

// ---- 14 个一级分类（顺序即展示顺序；name 必须与文章 frontmatter 的 category 一致）----
const CATEGORIES = [
  { key: 'python',     name: 'Python',     desc: '核心语法 · FastAPI · 工程化',         color: '#dbeafe', icon: '🐍' },
  { key: 'frontend',   name: '前端工程',   desc: 'Vue3 · React · Next · Electron',       color: '#fce7f3', icon: '🎨' },
  { key: 'tools',      name: '开发工具',   desc: 'CodeBuddy 进阶技巧与规则',            color: '#ede9fe', icon: '🛠️' },
  { key: 'agent',      name: 'AI Agent',   desc: '设计模式 · 多智能体 · 记忆',          color: '#dcfce7', icon: '🤖' },
  { key: 'llm',        name: 'LLM大模型',  desc: 'Transformer · 微调 · 私有化部署',      color: '#fee2e2', icon: '🧠' },
  { key: 'prompt',     name: 'Prompt工程', desc: '框架 · 项目踩坑与优化',               color: '#ffedd5', icon: '✍️' },
  { key: 'rag',        name: 'RAG',        desc: '检索增强生成全链路',                  color: '#ccfbf1', icon: '📚' },
  { key: 'tooldev',    name: '工具开发',   desc: 'Function Calling · MCP',              color: '#ecfccb', icon: '🔧' },
  { key: 'frameworks', name: '框架',       desc: 'LangChain · LangGraph · CrewAI',      color: '#e0e7ff', icon: '🏗️' },
  { key: 'data',       name: '数据处理',   desc: 'PostgreSQL · PGVector · Pandas',      color: '#fef3c7', icon: '🗄️' },
  { key: 'deploy',     name: '部署运维',   desc: 'Docker · K8s · 云服务器',             color: '#d1fae5', icon: '🚀' },
  { key: 'eval',       name: '评估调优',   desc: 'LangSmith · 成本 · 幻觉检测',         color: '#fae8ff', icon: '📊' },
  { key: 'product',    name: '产品工程',   desc: 'Context · Loop · Workflow',          color: '#cffafe', icon: '💡' },
  { key: 'interview',  name: '常见面试题', desc: 'Agent / LLM / 工程高频题',           color: '#ffe4e6', icon: '🎯' },
];
const CATEGORY_ORDER = new Map(CATEGORIES.map((c, i) => [c.name, i]));
const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.name, c]));

const CALLOUT_ICONS = { tip: '💡', warn: '⚠️', note: '📌', danger: '🚫' };
const CALLOUT_DEFAULT_TITLE = { tip: '提示', warn: '注意', danger: '危险', note: '说明' };

marked.setOptions({ gfm: true, breaks: false });

// ============================================================
//  内容读取
// ============================================================
function readPostFile(fileName) {
  const slug = fileName.replace(/\.mdx$/, '');
  const raw = fs.readFileSync(path.join(CONTENT_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    category: data.category ?? 'AI Agent',
    order: typeof data.order === 'number' ? data.order : 0,
    difficulty: data.difficulty ?? '入门',
    duration: data.duration ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date ?? '',
    content,
  };
}

function getAllPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(readPostFile)
    .sort((a, b) => {
      const ca = CATEGORY_ORDER.has(a.category) ? CATEGORY_ORDER.get(a.category) : 999;
      const cb = CATEGORY_ORDER.has(b.category) ? CATEGORY_ORDER.get(b.category) : 999;
      return ca === cb ? a.order - b.order : ca - cb;
    });
}

function getCategories(posts) {
  const map = new Map();
  for (const p of posts) {
    if (!map.has(p.category)) map.set(p.category, { name: p.category, posts: [] });
    map.get(p.category).posts.push(p);
  }
  return Array.from(map.values())
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.has(a.name) ? CATEGORY_ORDER.get(a.name) : 999;
      const ib = CATEGORY_ORDER.has(b.name) ? CATEGORY_ORDER.get(b.name) : 999;
      return ia - ib;
    })
    .map((g) => ({ ...g, meta: CATEGORY_MAP.get(g.name) || null, posts: g.posts.slice().sort((x, y) => x.order - y.order) }));
}

// ============================================================
//  MDX -> HTML（递归处理 <Callout>，其余交给 marked）
// ============================================================
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderContent(md, stash) {
  // 最外层调用时，先把代码块预渲染为 HTML 并暂存为占位符，
  // 避免正文/示例里出现的 <Callout> / </Callout> 串扰全局正则配对。
  // 围栏代码块用 <!--FENCEDn--> 占位，行内代码用 <!--CBn--> 占位，
  // marked 会保留 HTML 注释，最后统一还原。
  if (!stash) {
    stash = { fenced: [], inline: [] };
    // 围栏代码块：提取语言并预渲染成 HTML，用 <!--FENCEDn--> 占位
    md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (match, info, code) => {
      const lang = info.trim().split(/\s+/)[0] || '';
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      const html = `<pre><code${cls}>${escapeHtml(code)}</code></pre>`;
      stash.fenced.push(html);
      return `<!--FENCED${stash.fenced.length - 1}-->`;
    });
    // 行内代码：预渲染成 <code> 并用 HTML 注释占位
    md = md.replace(/`([^`\n]+)`/g, (match, code) => {
      stash.inline.push(`<code>${escapeHtml(code)}</code>`);
      return `<!--CB${stash.inline.length - 1}-->`;
    });
  }

  // 注意：attrs 用 [^>\n]*? 而非 [^>]* —— 若某篇 Callout 开标签漏写结尾的 `>`，
  // 旧写法会把整段内容吞到下一个 </Callout> 的 `>`，导致相邻 Callout 被串扰成残标。
  // 改为遇到首个 `>` 或换行即止：漏 `>` 的坏标签会安全退化成原文，不再污染兄弟节点。
  const re = /<Callout\b([^>\n]*?)>([\s\S]*?)<\/Callout>/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(md)) !== null) {
    const before = md.slice(last, m.index);
    out += marked.parse(before);
    const attrs = m[1];
    const inner = m[2];
    const type = (attrs.match(/type="([^"]*)"/) || [])[1] || 'note';
    const title = (attrs.match(/title="([^"]*)"/) || [])[1] || CALLOUT_DEFAULT_TITLE[type] || '说明';
    const icon = CALLOUT_ICONS[type] || '📌';
    const innerHtml = renderContent(inner, stash);
    out +=
      `<div class="co-callout co-${type}">` +
      `<div class="co-head"><span aria-hidden>${icon}</span>` +
      `<span class="co-title">${escapeHtml(title)}</span></div>` +
      `<div class="co-body">${innerHtml}</div></div>`;
    last = re.lastIndex;
  }
  out += marked.parse(md.slice(last));
  // 先还原围栏代码块（HTML 注释占位），再还原行内代码
  out = out.replace(/<!--FENCED(\d+)-->/g, (_, n) => stash.fenced[+n]);
  out = out.replace(/<!--CB(\d+)-->/g, (_, n) => stash.inline[+n]);
  return out;
}

function slugify(text) {
  const clean = text.replace(/<[^>]+>/g, '').trim();
  return clean
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function addHeadingIds(html) {
  return html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (full, lvl, text) => {
    const id = slugify(text);
    return `<h${lvl} id="${id}">${text}</h${lvl}>`;
  });
}

function toPlainText(md) {
  const noCallout = md
    .replace(/<Callout\b[^>]*>/g, '')
    .replace(/<\/Callout>/g, '');
  const html = marked.parse(noCallout);
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
//  公共部件（Header / Footer / Logo）
// ============================================================
const LOGO_SVG = `<svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="40" height="40" rx="10" fill="url(#agentlab-logo)"/>
  <path d="M20 8L10 31H14.5L16.8 25.5H23.2L25.5 31H30L20 8ZM18.3 21.5L20 16.8L21.7 21.5H18.3Z" fill="white"/>
  <defs><linearGradient id="agentlab-logo" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
    <stop stop-color="#1a9a6e"/><stop offset="1" stop-color="#15875d"/>
  </linearGradient></defs>
</svg>`;

const SEARCH_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
  <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

function headerHtml(active, depth) {
  const p = depth ? '../' : '';
  const a = (key, label, href) =>
    `<a href="${p}${href}" class="${active === key ? 'hdr-active' : ''}">${label}</a>`;
  return `<header class="hdr-header">
  <div class="hdr-inner">
    <a class="hdr-brand" href="${p}index.html">${LOGO_SVG}<span class="hdr-brandText">AgentLab</span></a>
    <nav class="hdr-nav">
      ${a('home', '首页', 'index.html')}
      ${a('courses', '课程', 'courses.html')}
      ${a('about', '关于', 'about.html')}
    </nav>
    <div class="hdr-actions">
      <button class="sr-trigger" id="searchTrigger" type="button" aria-label="站内搜索">${SEARCH_ICON}<span class="sr-triggerText">搜索</span></button>
      <button class="tt-btn" id="themeToggle" type="button" aria-label="切换主题" title="切换到暗色"><span aria-hidden>🌙</span></button>
      <a class="hdr-cta" href="${p}courses.html">开始学习</a>
    </div>
  </div>
</header>`;
}

function footerHtml(depth) {
  const p = depth ? '../' : '';
  const year = new Date().getFullYear();
  return `<footer class="ftr-footer">
  <div class="ftr-inner">
    <span>© ${year} AgentLab · 边学边做，锻造你的第一个 Agent</span>
    <nav class="ftr-nav">
      <a href="${p}courses.html">课程</a>
      <a href="${p}about.html">关于</a>
    </nav>
  </div>
</footer>`;
}

function shell({ title, description, active, depth, body, ogType = 'website' }) {
  const p = depth ? '../' : '';
  const cssPath = p + 'assets/styles.css';
  const bodyClass = active === 'article' ? '' : 'main';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta property="og:type" content="${ogType}"/>
  <meta property="og:site_name" content="AgentLab"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta name="twitter:card" content="summary"/>
  <link rel="stylesheet" href="${cssPath}"/>
  <link rel="icon" href="${p}assets/favicon.svg" type="image/svg+xml"/>
  <script>
    try { var t = localStorage.getItem('theme'); if (t === 'dark') document.documentElement.setAttribute('data-theme','dark'); } catch(e){}
  </script>
</head>
<body>
  ${headerHtml(active, depth)}
  <${active === 'article' ? 'div class="main"' : 'main class="main"'}>
${body}
  </${active === 'article' ? 'div' : 'main'}>
  ${footerHtml(depth)}
  <script src="${p}assets/app.js" defer></script>
</body>
</html>`;
}

// ============================================================
//  页面：首页
// ============================================================
function renderHome(posts) {
  const first = posts[0];
  const categories = CATEGORIES.map(
    (c) => `<a class="home-catItem" href="courses.html#${c.key}">
      <span class="home-iconCircle" style="background:${c.color}">${c.icon}</span>
      <span class="home-catText">${c.name}</span>
    </a>`
  ).join('');

  const startHref = first ? `courses/${first.slug}.html` : 'courses.html';
  const startLabel = first ? '进入第一课' : '查看课程';

  const body = `  <div class="home-wrap">
    <section class="home-hero">
      <div class="home-heroText">
        <span class="home-badge">面向有开发经验者</span>
        <h1 class="home-title">掌握 <span class="home-serif">AI Agent</span><br/>从工具调用到工程化部署</h1>
        <p class="home-subtitle">AgentLab 是一个实战型学习站：每篇教程都是「能跑的骨架 + 详细注释」，带你把 Agent 的 loop、工具、记忆、编排逐项跑通。覆盖 Python、前端、LLM、RAG、框架与部署运维的完整链路。</p>
        <div class="home-cta">
          <a class="home-primaryBtn" href="courses.html">开始学习</a>
          <a class="home-ghostBtn" href="courses.html"><span class="home-play">▶</span> 浏览全部分类</a>
        </div>
      </div>
      <div class="home-heroVisual">${heroVisualHtml()}</div>
    </section>

    <section class="home-sectionCard">
      <h2 class="home-sectionTitle">按分类学习</h2>
      <p class="home-sectionSub">14 个方向，从工程基础到 Agent / LLM / RAG 与部署运维，体系化掌握。</p>
      <div class="home-grid4">${categories}</div>
    </section>

    <section class="home-startBox">
      <div>
        <h3 class="home-startTitle">准备好开始了吗？</h3>
        <p class="home-startDesc">从 AI Agent 的「介绍」开始，先跑通你的第一个 Agent 环境。</p>
      </div>
      <a class="home-primaryBtn" href="${startHref}">${startLabel}</a>
    </section>
  </div>`;

  return shell({
    title: 'AgentLab · 掌握 AI Agent 开发',
    description: '面向有开发经验者的 AI Agent 开发学习站：每篇教程都是能跑的骨架 + 详细注释。',
    active: 'home',
    depth: 0,
    body,
  });
}

function heroVisualHtml() {
  return `<div class="hv-visual" aria-hidden="true">
  <div class="hv-circle"></div>
  <div class="hv-courseCard">
    <div class="hv-courseThumb"></div>
    <div class="hv-courseBody">
      <div class="hv-courseTitle">Agent 开发入门</div>
      <div class="hv-courseMeta">14 个分类 · 70+ 教程</div>
      <div class="hv-courseBtn">开始学习</div>
    </div>
  </div>
  <div class="hv-videoCard">
    <div class="hv-videoInset"></div>
    <div class="hv-videoAvatar"></div>
    <div class="hv-videoName">导师在线答疑</div>
    <div class="hv-videoControls">
      <span class="hv-ctrlMic"></span>
      <span class="hv-ctrlCall"></span>
      <span class="hv-ctrlCam"></span>
    </div>
  </div>
  <div class="hv-badge"><span class="hv-badgeIcon"></span><span>10k+ 学习者</span></div>
  <span class="hv-deco hv-star1">✦</span>
  <span class="hv-deco hv-dot1"></span>
  <span class="hv-deco hv-dot2"></span>
  <span class="hv-deco hv-half"></span>
</div>`;
}

// ============================================================
//  页面：课程大纲（按分类分组）
// ============================================================
function renderCourses(groups) {
  const body = `  <div class="container">
    <header class="cr-head">
      <h1 class="cr-title">课程大纲</h1>
      <p class="cr-sub">14 个分类、体系化的 AI Agent 开发路径。每篇教程都是「能跑的骨架 + 详细注释」。</p>
    </header>
    ${
      groups.length === 0
        ? '<p class="cr-empty">还没有课程内容，先去写第一篇 MDX 吧。</p>'
        : groups
            .map(
              (g) => `    <section class="cr-module" id="${g.meta ? g.meta.key : ''}">
      <div class="cr-moduleHead">
        <span class="cr-moduleId">${g.meta ? g.meta.icon : '📁'}</span>
        <div>
          <h2 class="cr-moduleTitle">${escapeHtml(g.name)}</h2>
          ${g.meta ? `<p class="cr-moduleDesc">${escapeHtml(g.meta.desc)}</p>` : ''}
        </div>
      </div>
      <ul class="cr-list">
        ${g.posts
          .map(
            (p) => `        <li class="cr-item">
          <a class="cr-itemLink" href="courses/${p.slug}.html">
            <div class="cr-itemMain">
              <span class="cr-itemTitle">${escapeHtml(p.title)}</span>
              <span class="cr-itemDesc">${escapeHtml(p.description)}</span>
            </div>
            <div class="cr-itemMeta">
              <span class="cr-tag cr-${p.difficulty}">${p.difficulty}</span>
              ${p.duration ? `<span class="cr-dur">${p.duration}</span>` : ''}
            </div>
          </a>
        </li>`
          )
          .join('\n')}
      </ul>
    </section>`
            )
            .join('\n')
    }
  </div>`;

  return shell({
    title: '课程大纲 · AgentLab',
    description: 'AgentLab 的课程体系：14 个分类，从工程基础、AI Agent、LLM、RAG 到框架、部署与评估调优。',
    active: 'courses',
    depth: 0,
    body,
  });
}

// ============================================================
//  页面：关于
// ============================================================
function renderAbout() {
  const body = `  <div class="prose" style="max-width:760px">
    <h1>关于 AgentLab</h1>
    <p><strong>AgentLab</strong> 是一个面向<strong>有开发经验者</strong>的 AI Agent 开发学习站。我们相信最好的学习方式，是<strong>边学边做</strong>——所以本站本身也用真实 Agent 项目最常用的技术栈搭建。</p>
    <h2>为谁而建</h2>
    <ul>
      <li>已经是程序员，想系统上手 AI Agent 开发；</li>
      <li>受够了碎片化、不成体系的框架文档；</li>
      <li>想要「能复制、能跑、有注释」的实战，而不是概念堆砌。</li>
    </ul>
    <h2>内容是怎么组织的</h2>
    <p>全部教程以 <code>.mdx</code> 文件存放在仓库的 <code>content/</code> 目录，构建期编译成静态页面。你看到的每一篇文章，本质上都是一个可版本控制的代码文件——这意味着内容透明、可溯源，也方便你 Fork 后改成自己的笔记。</p>
    <h2>内容来源与更新</h2>
    <p>示例文章采用「能跑的骨架 + 详细注释」写法：结构完整、可直接运行，关键处配注释讲清为什么。课程按 14 个分类组织，从 Python、前端等工程基础，到 AI Agent、LLM、RAG、框架，再到部署运维与评估调优。</p>
    <h2>开始学习</h2>
    <p>直接前往 <a href="courses.html">课程大纲</a>，或从 <a href="index.html">首页</a> 的第一课开始。</p>
  </div>`;

  return shell({
    title: '关于 AgentLab',
    description: 'AgentLab 是什么、为谁而建，以及内容来源与更新方式。',
    active: 'about',
    depth: 0,
    body,
  });
}

// ============================================================
//  页面：文章详情
// ============================================================
function renderArticle(post, all) {
  const sameCat = all.filter((p) => p.category === post.category).sort((a, b) => a.order - b.order);
  const idx = sameCat.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? sameCat[idx - 1] : null;
  const next = idx >= 0 && idx < sameCat.length - 1 ? sameCat[idx + 1] : null;
  const catMeta = CATEGORY_MAP.get(post.category);

  const html = addHeadingIds(renderContent(post.content));

  const tags = post.tags.length
    ? `<div class="art-tags">${post.tags
        .map((t) => `<span class="art-tag">#${escapeHtml(t)}</span>`)
        .join('')}</div>`
    : '';

  const pager = `<nav class="art-pager">
    ${
      prev
        ? `<a class="art-pagerLink" href="${prev.slug}.html"><span class="art-pagerLabel">← 上一篇</span><span class="art-pagerTitle">${escapeHtml(prev.title)}</span></a>`
        : '<span></span>'
    }
    ${
      next
        ? `<a class="art-pagerLink art-pagerRight" href="${next.slug}.html"><span class="art-pagerLabel">下一篇 →</span><span class="art-pagerTitle">${escapeHtml(next.title)}</span></a>`
        : '<span></span>'
    }
  </nav>`;

  const body = `  <article>
    <div class="art-header">
      <a class="art-back" href="../courses.html#${catMeta ? catMeta.key : ''}">← 课程大纲</a>
      <div class="art-metaRow">
        <span class="art-moduleTag">${catMeta ? catMeta.icon : '📁'}</span>
        <span class="art-moduleName">${escapeHtml(post.category)}</span>
        <span class="art-diff">${post.difficulty}</span>
        ${post.duration ? `<span class="art-dur">${post.duration}</span>` : ''}
      </div>
      <h1 class="art-title">${escapeHtml(post.title)}</h1>
      ${post.description ? `<p class="art-desc">${escapeHtml(post.description)}</p>` : ''}
      ${tags}
    </div>
    <div class="prose">${html}</div>
    ${pager}
  </article>`;

  return shell({
    title: `${post.title} · AgentLab`,
    description: post.description,
    active: 'article',
    depth: 1,
    body,
    ogType: 'article',
  });
}

// ============================================================
//  搜索索引
// ============================================================
function buildSearchIndex(posts) {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    difficulty: p.difficulty,
    tags: p.tags,
    url: `courses/${p.slug}.html`,
    body: toPlainText(p.content).slice(0, 600),
  }));
}

// ============================================================
//  CSS 合并（全局 + 各模块加前缀）
// ============================================================
function buildCss() {
  // 样式源为 src/styles/site.css（由原始 CSS Modules 合并并加前缀后生成，样式与视觉完全一致）
  if (fs.existsSync(SITE_CSS)) return fs.readFileSync(SITE_CSS, 'utf8');
  console.warn('⚠️ 未找到 src/styles/site.css，样式将为空');
  return '';
}

// ============================================================
//  app.js（主题切换 + 站内搜索，客户端）
// ============================================================
const APP_JS = `// AgentLab 客户端脚本：主题切换 + 站内搜索
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
`;

// ============================================================
//  favicon（内联 SVG）
// ============================================================
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="10" fill="#1a9a6e"/>
  <path d="M20 8L10 31H14.5L16.8 25.5H23.2L25.5 31H30L20 8ZM18.3 21.5L20 16.8L21.7 21.5H18.3Z" fill="white"/>
</svg>`;

// ============================================================
//  主流程
// ============================================================
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(COURSES_OUT, { recursive: true });

  const posts = getAllPosts();
  const groups = getCategories(posts);

  // 页面
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderHome(posts));
  fs.writeFileSync(path.join(OUT_DIR, 'courses.html'), renderCourses(groups));
  fs.writeFileSync(path.join(OUT_DIR, 'about.html'), renderAbout());

  for (const p of posts) {
    fs.writeFileSync(path.join(COURSES_OUT, p.slug + '.html'), renderArticle(p, posts));
  }

  // 资源
  fs.writeFileSync(path.join(ASSETS_DIR, 'styles.css'), buildCss());
  fs.writeFileSync(path.join(ASSETS_DIR, 'app.js'), APP_JS);
  fs.writeFileSync(path.join(ASSETS_DIR, 'favicon.svg'), FAVICON);

  // 搜索索引
  fs.writeFileSync(
    path.join(OUT_DIR, 'search-index.json'),
    JSON.stringify(buildSearchIndex(posts), null, 0)
  );

  // SEO：sitemap + robots
  const base = 'https://agentlab.example.com';
  const urls = [base + '/index.html', base + '/courses.html', base + '/about.html']
    .concat(posts.map((p) => base + '/courses/' + p.slug + '.html'))
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n');
  fs.writeFileSync(
    path.join(OUT_DIR, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.w3.org/1999/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
  );

  console.log(`✅ 静态站已生成：${posts.length} 篇文章 + 4 个页面 → ${OUT_DIR}`);
}

main();
