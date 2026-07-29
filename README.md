# AgentLab

面向**有开发经验者**的 AI Agent / LLM 工程学习站。整站为**纯静态站点**（无 Next.js），并提供一键打包的 **Android 离线 App**（WebView 封装）。

- Web 端：MDX 教程 → 静态 HTML，可本地或任意静态 hosting 部署。
- Android 端：把整站打包进 APK，完全离线、无外部 CDN 依赖，站内搜索可用。

---

## 目录结构

```
AgentLab/
├── content/                      # MDX 教程源文件（80+ 篇，14 个一级分类）
├── static/                       # 构建产物：纯静态站点（HTML / CSS / JS / 资源）
├── scripts/
│   └── build-static.mjs          # 静态站生成器（gray-matter + marked，无框架）
├── android-app/                  # Android WebView 离线 App
│   ├── app/src/main/
│   │   ├── assets/               # 站点资源（内容来自 static/，会被打包进 APK）
│   │   ├── java/com/agentlab/app/MainActivity.java  # WebView 与本地资源拦截逻辑
│   │   ├── res/                  # 应用图标、字符串等
│   │   └── AndroidManifest.xml
│   ├── build_apk.ps1             # 一键打包脚本（无需 Gradle）
│   ├── release-key.jks           # 自签名密钥库（别名 agentlab）
│   └── AgentLab.apk              # 构建产物（重新打包后生成）
├── AGENT_BRIEF.md                # 内容写作规范（供内容 Agent 复用）
├── CONTENT_PLAN.md               # 内容规划
└── README.md
```

---

## 1. 本地开发（Web 端）

首次需要安装依赖：

```bash
npm install
```

构建静态站点到 `static/`：

```bash
npm run build
```

本地预览（构建后启动一个静态服务器，访问 http://localhost:8080）：

```bash
npm run dev
```

> 生成器 `scripts/build-static.mjs` 使用 `gray-matter` 解析 frontmatter、`marked` 渲染 Markdown，输出纯 HTML 到 `static/`，并生成 `search-index.json` 供站内搜索使用。

---

## 2. 构建 Android App

`android-app` 把 `static/` 整站封装进一个离线可安装的 APK，**不需要 Android Studio / Gradle**。

### 前置条件
- 安装 **JDK 21**（脚本默认路径 `D:\work\software\jdk21`，可在 `build_apk.ps1` 顶部的 `$JDK` 变量修改）。
- 联网（首次运行会自动下载 Android SDK 组件到 `android-app/android-sdk/`：`platform-tools`、`platforms;android-34`、`build-tools;36.0.0`）。

### 打包命令

```powershell
cd D:\work\agent\AgentLab\android-app
powershell -NoProfile -ExecutionPolicy Bypass -File build_apk.ps1
```

脚本流程（无 Gradle）：
1. `aapt2 compile` 编译 `res/` 资源
2. `aapt2 link` 生成未签名 APK（**不**用 `-A` 注入 assets，见下文「关键技术决策」）
3. `jar uf` 把 `app/src/main/assets` 注入 APK（保证正斜杠路径）
4. `javac` + `d8` 把 `MainActivity.java` 编译为 `classes.dex`
5. `zipalign` 对齐
6. `apksigner` 签名（首次自动用 `release-key.jks` 签名）

成功后生成 `android-app/AgentLab.apk`（已签名，v1/v2/v3 校验通过）。

### 安装到手机
- 手机连电脑后：`android-sdk\platform-tools\adb.exe install AgentLab.apk`
- 或把 `AgentLab.apk` 拷到手机，用文件管理器点击安装（需开启「允许安装未知来源应用」）。

> 包名：`com.agentlab.app`。签名密钥：别名 `agentlab`，密钥库 `release-key.jks`（密码 `agentlab123`）。正式发布请替换为官方密钥。

---

## 3. 内容更新流程

修改教程后，要让 App 生效，需要「重建站点 → 同步到 assets → 重新打包」三步：

```bash
# 1. 编辑 content/*.mdx 后，重建静态站
npm run build

# 2. 把新生成的 static/ 同步进 App 资源目录（二者需保持一致）
#    （可用 xcopy / rsync / 直接复制覆盖 android-app/app/src/main/assets）
xcopy /E /Y static\* android-app\app\src\main\assets\

# 3. 重新打包 APK
cd android-app
powershell -NoProfile -ExecutionPolicy Bypass -File build_apk.ps1
```

> 内容写作规范见 `AGENT_BRIEF.md`（frontmatter 格式、14 个分类名、Callout 用法、质量红线）。

---

## 4. 关键技术决策 / 已知坑

这些是为让打包与运行在 Windows + 离线环境下可靠而做的取舍，记录以备后续维护：

1. **伪 `https://agentlab.local` 源 + `shouldInterceptRequest` 拦截本地资源**
   站点通过 `fetch('search-index.json')` 做站内搜索，而 `file://` 源下 `fetch` 会被浏览器拦截。因此 WebView 以 `https://agentlab.local/` 加载首页，由 `MainActivity` 拦截所有同域请求并从 `assets/` 返回本地文件，搜索功能正常。

2. **使用 build-tools `36.0.0`**
   build-tools 34/35 自带的 R8 8.2.2 在处理 `MainActivity` 内部类（`WebChromeClient`）时会触发空指针崩溃，导致 `d8` 失败。36.0.0 的 R8 已修复该问题。

3. **用 `jar uf` 注入 assets，而非 `aapt2 -A`**
   `aapt2 -A` 在 Windows 上给子目录 assets 写入了反斜杠路径（`assets\app.js`），而 Android 的 `AssetManager` 只认正斜杠，会导致 `app.js`、样式、课程页全部 404。改成 `aapt2 link` 后用 `jar uf` 注入，确保全部为正斜杠。

4. **拦截逻辑剥离 URL 的 `#` / `?`**
   站内大量使用锚点链接（如 `courses.html#python`、课程页「← 课程大纲」）。原始实现用 `getUrl().toString()` 未剥离片段，导致 `assetPath` 变成 `courses.html#python` 而 404。已在解析前剥离查询与片段、并为目录结尾补 `index.html`。

5. **移动端导航不再隐藏**
   原 `styles.css` 在 `max-width:640px` 下直接 `display:none` 隐藏顶部导航与「开始学习」按钮且无替代，手机上无法进入课程页。已改为导航横向滚动胶囊条（保留首页/课程/关于 + 搜索/主题），并增强表格横向滚动、代码块与字号等移动端样式。

---

## 5. 许可证与说明

本项目为内部学习资料站点。Android 端为离线封装演示，自签名证书仅适用于侧载安装，上架应用商店需使用官方签名密钥并补充隐私政策等合规材料。
