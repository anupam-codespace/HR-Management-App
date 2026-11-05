package com.teamhub.hrms;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONObject;

public class SignInActivity extends AppCompatActivity {

    public static final String EXTRA_PREFILL_EMAIL = "prefill_email";
    private static final String PREF_NAME = "TeamHub_SignIn_Prefs";
    private static final String KEY_REMEMBER_DEVICE = "remember_device";
    private static final String KEY_SAVED_EMAIL = "saved_email";

    private EditText etEmail;
    private EditText etPassword;
    private ImageView ivPasswordToggle;
    private CheckBox cbRememberDevice;
    private View btnDoSignIn;
    private TextView tvSignInButtonText;
    private ImageView ivSignInArrow;
    private ProgressBar pbSignInLoading;
    private TextView tvSignUpFooter;

    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signin);
        TabletHelper.applyTabletConstraint(findViewById(R.id.signInContentContainer), TabletHelper.AUTH_MAX_WIDTH_DP);

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        ivPasswordToggle = findViewById(R.id.ivPasswordToggle);
        cbRememberDevice = findViewById(R.id.cbRememberDevice);
        btnDoSignIn = findViewById(R.id.btnDoSignIn);
        tvSignInButtonText = findViewById(R.id.tvSignInButtonText);
        ivSignInArrow = findViewById(R.id.ivSignInArrow);
        pbSignInLoading = findViewById(R.id.pbSignInLoading);
        tvSignUpFooter = findViewById(R.id.tvSignUpFooter);
        TextView tvForgotPassword = findViewById(R.id.tvForgotPassword);

        // Load Remember Device preference
        SharedPreferences prefs = getSharedPreferences(PREF_NAME, MODE_PRIVATE);
        boolean remember = prefs.getBoolean(KEY_REMEMBER_DEVICE, true);
        cbRememberDevice.setChecked(remember);
        if (remember) {
            String savedEmail = prefs.getString(KEY_SAVED_EMAIL, "");
            if (!savedEmail.isEmpty()) {
                etEmail.setText(savedEmail);
                etPassword.requestFocus();
            }
        }

        // Pre-fill email if passed from Registration
        String prefillEmail = getIntent().getStringExtra(EXTRA_PREFILL_EMAIL);
        if (prefillEmail != null && !prefillEmail.trim().isEmpty()) {
            etEmail.setText(prefillEmail.trim());
            etPassword.requestFocus();
        }

        setupPasswordToggle();
        setupFooterLink();

        tvForgotPassword.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            Intent intent = new Intent(SignInActivity.this, ForgotPasswordActivity.class);
            if (!email.isEmpty()) {
                intent.putExtra(ForgotPasswordActivity.EXTRA_EMAIL, email);
            }
            startActivity(intent);
        });

        btnDoSignIn.setOnClickListener(v -> performLogin());
    }

    private void setupPasswordToggle() {
        if (ivPasswordToggle == null) return;
        ivPasswordToggle.setOnClickListener(v -> {
            isPasswordVisible = !isPasswordVisible;
            if (isPasswordVisible) {
                etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                ivPasswordToggle.setAlpha(1.0f);
            } else {
                etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                ivPasswordToggle.setAlpha(0.6f);
            }
            etPassword.setSelection(etPassword.getText().length());
        });
    }

    private void performLogin() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (email.isEmpty()) {
            etEmail.setError("Please enter your email or mobile number");
            etEmail.requestFocus();
            return;
        }

        if (password.isEmpty()) {
            etPassword.setError("Please enter your password");
            etPassword.requestFocus();
            return;
        }

        // Save Remember device preference
        SharedPreferences.Editor editor = getSharedPreferences(PREF_NAME, MODE_PRIVATE).edit();
        boolean remember = cbRememberDevice.isChecked();
        editor.putBoolean(KEY_REMEMBER_DEVICE, remember);
        if (remember) {
            editor.putString(KEY_SAVED_EMAIL, email);
        } else {
            editor.remove(KEY_SAVED_EMAIL);
        }
        editor.apply();

        setLoading(true);

        ApiClient.getInstance(this).login(email, password, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject result) {
                setLoading(false);
                String token = result.optString("access_token", "");
                if (token.isEmpty()) {
                    token = result.optString("accessToken", "");
                }
                String role = result.optString("role", "");
                if (role.isEmpty() && result.has("user")) {
                    JSONObject u = result.optJSONObject("user");
                    if (u != null) role = u.optString("role", "");
                }
                ApiClient.getInstance(SignInActivity.this).saveToken(token, email, role);

                Toast.makeText(SignInActivity.this, "Signed in successfully!", Toast.LENGTH_SHORT).show();

                // Proceed into the main app
                Intent intent = new Intent(SignInActivity.this, HomeActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                setLoading(false);
                Toast.makeText(SignInActivity.this, errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean loading) {
        if (loading) {
            btnDoSignIn.setEnabled(false);
            if (tvSignInButtonText != null) tvSignInButtonText.setVisibility(View.INVISIBLE);
            if (ivSignInArrow != null) ivSignInArrow.setVisibility(View.INVISIBLE);
            if (pbSignInLoading != null) pbSignInLoading.setVisibility(View.VISIBLE);
        } else {
            btnDoSignIn.setEnabled(true);
            if (tvSignInButtonText != null) tvSignInButtonText.setVisibility(View.VISIBLE);
            if (ivSignInArrow != null) ivSignInArrow.setVisibility(View.VISIBLE);
            if (pbSignInLoading != null) pbSignInLoading.setVisibility(View.GONE);
        }
    }

    private void setupFooterLink() {
        String footerText = "Don't have a TeamHub account? Sign up now";
        SpannableString ss = new SpannableString(footerText);
        int linkStart = footerText.indexOf("Sign up now");
        if (linkStart != -1) {
            ss.setSpan(
                    new ForegroundColorSpan(Color.parseColor("#0056fd")),
                    linkStart,
                    linkStart + "Sign up now".length(),
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            );
        }
        tvSignUpFooter.setText(ss);
        tvSignUpFooter.setOnClickListener(v -> {
            Intent intent = new Intent(SignInActivity.this, SignUpActivity.class);
            startActivity(intent);
        });
    }
}
