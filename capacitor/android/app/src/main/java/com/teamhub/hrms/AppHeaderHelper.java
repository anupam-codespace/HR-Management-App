package com.teamhub.hrms;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

import java.util.Locale;

public class AppHeaderHelper {

    /**
     * Configures the unified TeamHub header on any activity.
     *
     * @param activity      The host activity
     * @param screenTitle   The name of the module/screen (e.g., "Dashboard", "Attendance", "More", etc.)
     * @param isBackVisible Whether the back arrow should be visible
     */
    public static void setupHeader(
            AppCompatActivity activity,
            String screenTitle,
            boolean isBackVisible
    ) {
        setupHeader(activity, screenTitle, isBackVisible, null);
    }

    /**
     * Configures the unified TeamHub header with an optional custom back listener.
     */
    public static void setupHeader(
            AppCompatActivity activity,
            String screenTitle,
            boolean isBackVisible,
            View.OnClickListener customBackListener
    ) {
        if (activity == null) return;

        // 1. Standardize Status Bar: White background with crisp dark icons (Android 6.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            activity.getWindow().setStatusBarColor(Color.WHITE);
        }

        // 2. Tablet responsiveness constraint
        View topBarContent = activity.findViewById(R.id.topBarContent);
        if (topBarContent != null) {
            TabletHelper.applyTabletConstraint(topBarContent);
        }

        // 3. Brand & Page Title
        TextView tvBrand = activity.findViewById(R.id.tvHeaderBrand);
        if (tvBrand != null) {
            tvBrand.setText("TEAMHUB");
        }

        TextView tvTitle = activity.findViewById(R.id.tvHeaderTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvHomeTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvAttendanceTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvMoreTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvSettingsTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvNotificationsTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvCustomizeTitle);
        if (tvTitle == null) tvTitle = activity.findViewById(R.id.tvDeleteAccountTitle);

        if (tvTitle != null && screenTitle != null) {
            tvTitle.setText(screenTitle);
        }

        // 4. Back Arrow Navigation
        View btnBack = activity.findViewById(R.id.btnHeaderBack);
        if (btnBack == null) btnBack = activity.findViewById(R.id.btnCustomizeBack);
        if (btnBack == null) btnBack = activity.findViewById(R.id.btnNotificationsBack);
        if (btnBack == null) btnBack = activity.findViewById(R.id.btnBack);
        if (btnBack == null) btnBack = activity.findViewById(R.id.btnDeleteAccountBack);

        if (btnBack != null) {
            if (isBackVisible) {
                btnBack.setVisibility(View.VISIBLE);
                btnBack.setOnClickListener(customBackListener != null ? customBackListener : v -> activity.finish());
            } else {
                btnBack.setVisibility(View.GONE);
            }
        }

        // 5. Notifications Bell & Real-time Red Dot
        View btnNotifications = activity.findViewById(R.id.btnNotifications);
        View viewNotificationDot = activity.findViewById(R.id.viewNotificationDot);
        ApiClient apiClient = ApiClient.getInstance(activity);

        if (viewNotificationDot != null) {
            boolean hasUnread = apiClient.hasUnreadLocalNotifications();
            viewNotificationDot.setVisibility(hasUnread ? View.VISIBLE : View.GONE);
        }

        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(v -> {
                apiClient.markLocalNotificationsAsRead();
                if (viewNotificationDot != null) {
                    viewNotificationDot.setVisibility(View.GONE);
                }
                if (!(activity instanceof NotificationsActivity)) {
                    Intent intent = new Intent(activity, NotificationsActivity.class);
                    activity.startActivity(intent);
                }
            });
        }

        // 6. User Profile Avatar
        View flAvatarContainer = activity.findViewById(R.id.flAvatarContainer);
        TextView tvAvatarInitials = activity.findViewById(R.id.tvAvatarInitials);

        if (tvAvatarInitials != null) {
            String firstName = apiClient.getFirstName();
            if (firstName != null && !firstName.trim().isEmpty()) {
                tvAvatarInitials.setText(firstName.trim().substring(0, 1).toUpperCase(Locale.ROOT));
            } else {
                tvAvatarInitials.setText("U");
            }
        }

        if (flAvatarContainer != null) {
            flAvatarContainer.setOnClickListener(v -> {
                if (!(activity instanceof SettingsActivity)) {
                    Intent intent = new Intent(activity, SettingsActivity.class);
                    activity.startActivity(intent);
                }
            });
        }
    }

    /**
     * Refreshes notification badge and user initials dynamically on resume.
     */
    public static void refreshHeaderState(AppCompatActivity activity) {
        if (activity == null) return;

        ApiClient apiClient = ApiClient.getInstance(activity);

        // Update Notification Red Dot
        View viewNotificationDot = activity.findViewById(R.id.viewNotificationDot);
        if (viewNotificationDot != null) {
            boolean hasUnread = apiClient.hasUnreadLocalNotifications();
            viewNotificationDot.setVisibility(hasUnread ? View.VISIBLE : View.GONE);
        }

        // Update Avatar Initial
        TextView tvAvatarInitials = activity.findViewById(R.id.tvAvatarInitials);
        if (tvAvatarInitials != null) {
            String firstName = apiClient.getFirstName();
            if (firstName != null && !firstName.trim().isEmpty()) {
                tvAvatarInitials.setText(firstName.trim().substring(0, 1).toUpperCase(Locale.ROOT));
            } else {
                tvAvatarInitials.setText("U");
            }
        }
    }
}
