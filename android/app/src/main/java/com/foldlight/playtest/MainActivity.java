package com.foldlight.playtest;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public final class MainActivity extends Activity {
    private WebView game;
    private static final String HOST = "appassets.androidplatform.net";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        game = new WebView(this);
        game.setBackgroundColor(0xff132831);
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        game.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse result = loader.shouldInterceptRequest(request.getUrl());
                return result != null ? result : new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
        });
        game.setWebChromeClient(new WebChromeClient());
        setContentView(game);
        fullscreen();
        game.loadUrl("https://" + HOST + "/assets/index.html");
    }
    private void fullscreen() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) fullscreen();
    }
    @Override protected void onPause() {
        game.evaluateJavascript("window.dispatchEvent(new Event('blur'))", null);
        game.onPause();
        game.pauseTimers();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (game != null) { game.onResume(); game.resumeTimers(); }
        fullscreen();
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("window.dispatchEvent(new Event('blur'))", null);
        new AlertDialog.Builder(this).setTitle("退出折光遗迹？")
            .setMessage("关卡进度会保存在手机上。")
            .setPositiveButton("退出", (d, which) -> finish())
            .setNegativeButton("继续试玩", (d, which) -> fullscreen()).show();
    }
    @Override protected void onDestroy() {
        game.destroy();
        super.onDestroy();
    }
}
