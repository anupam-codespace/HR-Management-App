package com.teamhub.hrms;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Outline;
import android.os.Bundle;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.Executors;

public class SettingsActivity extends AppCompatActivity {

    private FrameLayout flProfileAvatar;
    private ImageView ivProfileAvatar;
    private TextView tvProfileInitials;
    private TextView tvProfileName;
    private TextView tvProfileEmail;
    private TextView tvCompanyName;
    private TextView tvAppVersion;

    private androidx.appcompat.widget.SwitchCompat swAttendanceConfirm;
    private androidx.appcompat.widget.SwitchCompat swAttendanceNotes;
    private androidx.appcompat.widget.SwitchCompat swLocationAccuracy;
    private androidx.appcompat.widget.SwitchCompat swPushNotification;

    private static final String PREFS_SETTINGS = "TeamHub_Settings_Prefs";

    private ApiClient apiClient;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        apiClient = ApiClient.getInstance(this);

        initViews();
        loadProfileData();
    }

    @Override
    protected void onResume() {
        super.onResume();
        View viewNotificationDot = findViewById(R.id.viewNotificationDot);
        if (viewNotificationDot != null) {
            viewNotificationDot.setVisibility(apiClient.hasUnreadLocalNotifications() ? View.VISIBLE : View.GONE);
        }
    }

    private void initViews() {
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnSignOutTop).setOnClickListener(v -> confirmSignOut());
        TabletHelper.applyTabletConstraint(findViewById(R.id.settingsContentContainer));
        TabletHelper.applyTabletConstraint(findViewById(R.id.settingsTopBar));

        View btnNotifications = findViewById(R.id.btnNotifications);
        View viewNotificationDot = findViewById(R.id.viewNotificationDot);
        if (viewNotificationDot != null) {
            viewNotificationDot.setVisibility(apiClient.hasUnreadLocalNotifications() ? View.VISIBLE : View.GONE);
        }
        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(v -> {
                apiClient.markLocalNotificationsAsRead();
                if (viewNotificationDot != null) {
                    viewNotificationDot.setVisibility(View.GONE);
                }
                startActivity(new Intent(this, NotificationsActivity.class));
            });
        }

        flProfileAvatar = findViewById(R.id.flProfileAvatar);
        ivProfileAvatar = findViewById(R.id.ivProfileAvatar);
        tvProfileInitials = findViewById(R.id.tvProfileInitials);
        tvProfileName = findViewById(R.id.tvProfileName);
        tvProfileEmail = findViewById(R.id.tvProfileEmail);
        tvCompanyName = findViewById(R.id.tvCompanyName);
        tvAppVersion = findViewById(R.id.tvAppVersion);

        if (tvAppVersion != null) {
            tvAppVersion.setText("1.0");
        }

        swAttendanceConfirm = findViewById(R.id.swAttendanceConfirm);
        swAttendanceNotes = findViewById(R.id.swAttendanceNotes);
        swLocationAccuracy = findViewById(R.id.swLocationAccuracy);
        swPushNotification = findViewById(R.id.swPushNotification);

        setupSwitchAutoSave(swAttendanceConfirm, "pref_attendance_confirm", true);
        setupSwitchAutoSave(swAttendanceNotes, "pref_attendance_notes", false);
        setupSwitchAutoSave(swLocationAccuracy, "pref_location_accuracy", false);
        if (swPushNotification != null) {
            swPushNotification.setChecked(AppNotificationManager.isPushNotificationEnabled(this));
            swPushNotification.setOnCheckedChangeListener((buttonView, isChecked) -> {
                AppNotificationManager.setPushNotificationEnabled(this, isChecked);
                if (isChecked) {
                    AppNotificationManager.requestNotificationPermission(this);
                    Toast.makeText(this, "Push notifications enabled", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, "Push notifications paused (in-app records retained)", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Circular outline
        flProfileAvatar.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View view, Outline outline) {
                outline.setOval(0, 0, view.getWidth(), view.getHeight());
            }
        });
        flProfileAvatar.setClipToOutline(true);

        findViewById(R.id.btnViewProfile).setOnClickListener(v -> {
            Toast.makeText(this, "Profile view", Toast.LENGTH_SHORT).show();
        });

        findViewById(R.id.btnRefresh).setOnClickListener(v -> {
            loadProfileData();
            Toast.makeText(this, "Settings refreshed", Toast.LENGTH_SHORT).show();
        });

        findViewById(R.id.btnManageAccount).setOnClickListener(v -> {
            startActivity(new Intent(this, DeleteAccountActivity.class));
        });

        findViewById(R.id.btnSignOut).setOnClickListener(v -> confirmSignOut());
    }

    private void setupSwitchAutoSave(androidx.appcompat.widget.SwitchCompat sw, String prefKey, boolean defaultValue) {
        if (sw == null) return;
        android.content.SharedPreferences sp = getSharedPreferences(PREFS_SETTINGS, MODE_PRIVATE);
        sw.setChecked(sp.getBoolean(prefKey, defaultValue));
        sw.setOnCheckedChangeListener((buttonView, isChecked) -> {
            sp.edit().putBoolean(prefKey, isChecked).apply();
        });
    }

    private void loadProfileData() {
        String token = apiClient.getToken();
        String savedEmail = apiClient.getEmail();
        tvProfileEmail.setText(savedEmail);

        if (token == null) return;

        apiClient.getProfile(token, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject user) {
                if (isFinishing() || isDestroyed()) return;

                String firstName = user.optString("firstName", "");
                String lastName = user.optString("lastName", "");
                String email = user.optString("email", savedEmail);
                String photoUrl = user.optString("profilePhoto", "");

                String fullName = (firstName + " " + lastName).trim();
                if (fullName.isEmpty()) {
                    fullName = email.contains("@") ? email.substring(0, email.indexOf("@")) : "Team Member";
                }
                tvProfileName.setText(fullName);
                tvProfileEmail.setText(email);

                // Initial
                String initial = "U";
                if (!firstName.isEmpty()) {
                    initial = firstName.substring(0, 1).toUpperCase(Locale.ROOT);
                } else if (!email.isEmpty()) {
                    initial = email.substring(0, 1).toUpperCase(Locale.ROOT);
                }
                tvProfileInitials.setText(initial);

                if (photoUrl != null && !photoUrl.trim().isEmpty()) {
                    loadAvatarBitmap(photoUrl.trim());
                } else {
                    ivProfileAvatar.setVisibility(View.GONE);
                    tvProfileInitials.setVisibility(View.VISIBLE);
                }

                // Real-time Organization / Company Name
                String resolvedOrgName = null;
                if (user.has("company") && !user.isNull("company")) {
                    JSONObject compObj = user.optJSONObject("company");
                    if (compObj != null && compObj.has("name")) {
                        resolvedOrgName = compObj.optString("name", "");
                    }
                }
                if ((resolvedOrgName == null || resolvedOrgName.isEmpty()) && user.has("companyName")) {
                    resolvedOrgName = user.optString("companyName", "");
                }
                if ((resolvedOrgName == null || resolvedOrgName.isEmpty()) && user.has("organization")) {
                    JSONObject orgObj = user.optJSONObject("organization");
                    if (orgObj != null && orgObj.has("name")) {
                        resolvedOrgName = orgObj.optString("name", "");
                    } else {
                        resolvedOrgName = user.optString("organization", "");
                    }
                }
                if ((resolvedOrgName == null || resolvedOrgName.isEmpty()) && user.has("organizationName")) {
                    resolvedOrgName = user.optString("organizationName", "");
                }
                if (resolvedOrgName == null || resolvedOrgName.isEmpty()) {
                    resolvedOrgName = "GlobizHub";
                }
                tvCompanyName.setText(resolvedOrgName);
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Keep defaults
            }
        });
    }

    private void loadAvatarBitmap(String imageUrl) {
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                URL url = new URL(imageUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setDoInput(true);
                conn.connect();
                InputStream is = conn.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(is);

                runOnUiThread(() -> {
                    if (bitmap != null && !isFinishing() && !isDestroyed()) {
                        ivProfileAvatar.setImageBitmap(bitmap);
                        ivProfileAvatar.setVisibility(View.VISIBLE);
                        tvProfileInitials.setVisibility(View.GONE);
                    }
                });
            } catch (Exception ignored) {
            }
        });
    }

    private void confirmSignOut() {
        new AlertDialog.Builder(this)
                .setTitle("Sign Out")
                .setMessage("Are you sure you want to sign out?")
                .setPositiveButton("Sign Out", (dialog, which) -> executeSignOut())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void executeSignOut() {
        apiClient.clearAuth();
        Intent intent = new Intent(this, SignInActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
