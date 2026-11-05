package com.teamhub.hrms;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatButton;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONObject;

public class ForgotPasswordActivity extends AppCompatActivity {

    public static final String EXTRA_EMAIL = "extra_email";

    private LinearLayout llFormContainer;
    private LinearLayout llSuccessContainer;
    private EditText etEmail;
    private TextView tvErrorMessage;
    private AppCompatButton btnSendResetLink;
    private ProgressBar pbResetLoading;
    private TextView tvBackToLogin;
    private AppCompatButton btnReturnToLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);
        TabletHelper.applyTabletConstraint(findViewById(R.id.forgotContentContainer), TabletHelper.AUTH_MAX_WIDTH_DP);

        llFormContainer = findViewById(R.id.llFormContainer);
        llSuccessContainer = findViewById(R.id.llSuccessContainer);
        etEmail = findViewById(R.id.etEmail);
        tvErrorMessage = findViewById(R.id.tvErrorMessage);
        btnSendResetLink = findViewById(R.id.btnSendResetLink);
        pbResetLoading = findViewById(R.id.pbResetLoading);
        tvBackToLogin = findViewById(R.id.tvBackToLogin);
        btnReturnToLogin = findViewById(R.id.btnReturnToLogin);

        // Pre-fill email if passed from Sign In screen
        String incomingEmail = getIntent().getStringExtra(EXTRA_EMAIL);
        if (incomingEmail != null && !incomingEmail.trim().isEmpty()) {
            etEmail.setText(incomingEmail.trim());
        }

        // Send Reset Link action
        btnSendResetLink.setOnClickListener(v -> submitForgotPassword());

        // Back to Sign In actions
        tvBackToLogin.setOnClickListener(v -> finish());
        btnReturnToLogin.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            Intent intent = new Intent(ForgotPasswordActivity.this, SignInActivity.class);
            if (!email.isEmpty()) {
                intent.putExtra(SignInActivity.EXTRA_PREFILL_EMAIL, email);
            }
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
        });
    }

    private void submitForgotPassword() {
        String email = etEmail.getText().toString().trim();

        if (email.isEmpty()) {
            etEmail.setError("Please enter your email address");
            etEmail.requestFocus();
            return;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.setError("Please enter a valid email address");
            etEmail.requestFocus();
            return;
        }

        tvErrorMessage.setVisibility(View.GONE);
        setLoading(true);

        ApiClient.getInstance(this).forgotPassword(email, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject response) {
                setLoading(false);
                // Switch to in-app confirmation container matching web functionality
                llFormContainer.setVisibility(View.GONE);
                llSuccessContainer.setVisibility(View.VISIBLE);
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                setLoading(false);
                tvErrorMessage.setText(errorMessage != null ? errorMessage : "Unable to send reset link. Please check your internet connection and try again.");
                tvErrorMessage.setVisibility(View.VISIBLE);
                Toast.makeText(ForgotPasswordActivity.this, errorMessage != null ? errorMessage : "Failed to send reset link", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean loading) {
        if (loading) {
            btnSendResetLink.setEnabled(false);
            btnSendResetLink.setText("");
            pbResetLoading.setVisibility(View.VISIBLE);
        } else {
            btnSendResetLink.setEnabled(true);
            btnSendResetLink.setText("Send Reset Link");
            pbResetLoading.setVisibility(View.GONE);
        }
    }
}
