package com.teamhub.hrms;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;
import com.teamhub.hrms.network.ApiClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure user is logged in
        if (!ApiClient.getInstance(this).isLoggedIn()) {
            startActivity(new Intent(this, SignInActivity.class));
            finish();
            return;
        }

        setupWebViewSessionSync();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!ApiClient.getInstance(this).isLoggedIn()) {
            startActivity(new Intent(this, SignInActivity.class));
            finish();
            return;
        }
        injectSession();
    }

    private void setupWebViewSessionSync() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);

            // Inject session immediately and on page events
            injectSession();
        }
    }

    private void injectSession() {
        String token = ApiClient.getInstance(this).getToken();
        String role = ApiClient.getInstance(this).getRole();

        if (bridge != null && bridge.getWebView() != null && token != null && !token.trim().isEmpty()) {
            WebView webView = bridge.getWebView();
            String script = "try {" +
                    "localStorage.setItem('hrms_token', '" + token + "');" +
                    "localStorage.setItem('user_role', '" + role + "');" +
                    "} catch(e) {}";
            webView.evaluateJavascript(script, null);
        }
    }
}
