package com.agentlab.app;

import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * AgentLab 离线阅读器：用 WebView 加载内置在 assets 里的静态学习站。
 * 通过自定义 https 源 + shouldInterceptRequest 拦截本地资源，
 * 使站内搜索（fetch search-index.json）等依赖 fetch 的功能正常工作。
 */
public class MainActivity extends Activity {
    private static final String HOST = "agentlab.local";
    private static final String START_URL = "https://" + HOST + "/index.html";

    private WebView webView;
    private ProgressBar progressBar;

    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put("html", "text/html");
        MIME.put("htm", "text/html");
        MIME.put("css", "text/css");
        MIME.put("js", "application/javascript");
        MIME.put("mjs", "application/javascript");
        MIME.put("json", "application/json");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("gif", "image/gif");
        MIME.put("webp", "image/webp");
        MIME.put("ico", "image/x-icon");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("txt", "text/plain");
        MIME.put("xml", "application/xml");
        MIME.put("webmanifest", "application/manifest+json");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 6));
        progressBar.setMax(100);
        root.addView(progressBar);

        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setDefaultTextEncodingName("utf-8");

        webView.setWebViewClient(new LocalWebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100 ? ProgressBar.GONE : ProgressBar.VISIBLE);
            }
        });

        root.addView(webView);
        setContentView(root);

        progressBar.setVisibility(ProgressBar.VISIBLE);
        webView.loadUrl(START_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private class LocalWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // 所有导航都在 WebView 内处理
            return false;
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return false;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return intercept(request.getUrl().toString());
        }

        @Override
        @SuppressWarnings("deprecation")
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return intercept(url);
        }

        private WebResourceResponse intercept(String url) {
            if (url == null) return null;
            int hostStart = url.indexOf("://");
            if (hostStart < 0) return null;
            String rest = url.substring(hostStart + 3);
            // 剥离查询字符串与片段：站内大量使用锚点链接（如 courses.html#python），
            // 若带着 #/？会让 assetPath 变成 "courses.html#python" 而找不到文件 → 404。
            int cut = rest.length();
            int q = rest.indexOf('?');
            int f = rest.indexOf('#');
            if (q >= 0) cut = Math.min(cut, q);
            if (f >= 0) cut = Math.min(cut, f);
            rest = rest.substring(0, cut);
            int slash = rest.indexOf('/');
            String host = slash < 0 ? rest : rest.substring(0, slash);
            if (!HOST.equals(host)) {
                // 非本应用托管的地址（如外部链接）交由系统默认处理
                return null;
            }
            String path = slash < 0 ? "/" : rest.substring(slash);
            if (path.equals("") || path.equals("/")) {
                path = "/index.html";
            }
            // 目录请求（以 / 结尾）补 index.html
            if (path.endsWith("/")) {
                path = path + "index.html";
            }

            // 防目录穿越
            if (path.contains("..")) {
                return build404();
            }

            String assetPath = path.startsWith("/") ? path.substring(1) : path;
            String mime = mimeFor(assetPath);
            boolean isText = mime.startsWith("text/")
                    || mime.equals("application/javascript")
                    || mime.equals("application/json")
                    || mime.equals("application/xml")
                    || mime.equals("application/manifest+json");

            try {
                InputStream is = getAssets().open(assetPath);
                return new WebResourceResponse(mime, isText ? "utf-8" : null, is);
            } catch (IOException e) {
                // 可能是目录（如 /courses），尝试补 index.html
                if (!assetPath.endsWith("/") && !assetPath.contains(".")) {
                    try {
                        InputStream is = getAssets().open(assetPath + "/index.html");
                        return new WebResourceResponse("text/html", "utf-8", is);
                    } catch (IOException ignored) {
                        // fall through
                    }
                }
                return build404();
            }
        }

        private WebResourceResponse build404() {
            return new WebResourceResponse("text/plain", "utf-8",
                    404, "Not Found", Collections.<String, String>emptyMap(),
                    new ByteArrayInputStream("404 Not Found".getBytes()));
        }
    }

    private static String mimeFor(String path) {
        int dot = path.lastIndexOf('.');
        if (dot < 0) return "application/octet-stream";
        String ext = path.substring(dot + 1).toLowerCase();
        String m = MIME.get(ext);
        return m != null ? m : "application/octet-stream";
    }
}
