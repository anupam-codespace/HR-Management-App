package com.teamhub.hrms;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

import android.graphics.Color;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class NotificationsActivity extends AppCompatActivity {

    private ListView lvNotifications;
    private View llEmptyState;
    private ApiClient apiClient;

    private static class NotificationItem {
        String title;
        String message;
        String timestamp;

        NotificationItem(String title, String message, String timestamp) {
            this.title = title;
            this.message = message;
            this.timestamp = timestamp;
        }
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notifications);

        apiClient = ApiClient.getInstance(this);

        View btnBack = findViewById(R.id.btnNotificationsBack);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> handleBack());
        }
        lvNotifications = findViewById(R.id.lvNotifications);
        TabletHelper.applyTabletConstraint(lvNotifications);
        TabletHelper.applyTabletConstraint(findViewById(R.id.notificationsTopBar));
        llEmptyState = findViewById(R.id.llEmptyState);

        View flAvatarContainer = findViewById(R.id.flAvatarContainer);
        TextView tvAvatarInitials = findViewById(R.id.tvAvatarInitials);
        if (tvAvatarInitials != null) {
            String firstName = apiClient.getFirstName();
            if (firstName != null && !firstName.isEmpty()) {
                tvAvatarInitials.setText(firstName.substring(0, 1).toUpperCase(java.util.Locale.ROOT));
            }
        }
        if (flAvatarContainer != null) {
            flAvatarContainer.setOnClickListener(v -> {
                startActivity(new android.content.Intent(this, SettingsActivity.class));
            });
        }

        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(notifReceiver, new android.content.IntentFilter(AppNotificationManager.ACTION_NOTIFICATION_RECEIVED), Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(notifReceiver, new android.content.IntentFilter(AppNotificationManager.ACTION_NOTIFICATION_RECEIVED));
            }
        } catch (Exception ignored) {}

        loadNotifications();
    }

    private final android.content.BroadcastReceiver notifReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            loadNotifications();
        }
    };

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(notifReceiver);
        } catch (Exception ignored) {}
    }

    private void handleBack() {
        if (isTaskRoot()) {
            Intent homeIntent = new Intent(this, HomeActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(homeIntent);
        }
        finish();
    }

    @Override
    public void onBackPressed() {
        if (isTaskRoot()) {
            Intent homeIntent = new Intent(this, HomeActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(homeIntent);
        }
        super.onBackPressed();
    }

    private static class DisplayRow {
        final boolean isHeader;
        final String headerTitle;
        final NotificationItem item;

        DisplayRow(String headerTitle) {
            this.isHeader = true;
            this.headerTitle = headerTitle;
            this.item = null;
        }

        DisplayRow(NotificationItem item) {
            this.isHeader = false;
            this.headerTitle = null;
            this.item = item;
        }
    }

    private static String getOrdinalSuffix(int day) {
        if (day >= 11 && day <= 13) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }

    private static String formatHeaderTitle(String dateKey) {
        try {
            SimpleDateFormat inFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date d = inFmt.parse(dateKey);
            if (d != null) {
                Calendar cal = Calendar.getInstance();
                cal.setTime(d);
                int day = cal.get(Calendar.DAY_OF_MONTH);
                String dayName = new SimpleDateFormat("EEEE", Locale.getDefault()).format(d);
                String monthName = new SimpleDateFormat("MMMM", Locale.getDefault()).format(d);
                return dayName + ", " + day + getOrdinalSuffix(day) + " " + monthName;
            }
        } catch (Exception ignored) {}
        return dateKey;
    }

    private void loadNotifications() {
        List<DisplayRow> displayRows = new ArrayList<>();
        try {
            SharedPreferences prefs = getSharedPreferences("TeamHubAuth", Context.MODE_PRIVATE);
            String raw = prefs.getString("local_notifications_json", "[]");
            JSONArray array = new JSONArray(raw);

            // Limit to max 100 items
            int maxCount = Math.min(array.length(), 100);
            SimpleDateFormat inFmt1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            SimpleDateFormat inFmt2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
            SimpleDateFormat keyFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

            java.util.LinkedHashMap<String, List<NotificationItem>> groupedMap = new java.util.LinkedHashMap<>();

            for (int i = 0; i < maxCount; i++) {
                JSONObject obj = array.getJSONObject(i);
                String title = obj.optString("title", "Notification");
                String message = obj.optString("message", obj.optString("body", ""));
                String timestamp = obj.optString("timestamp", "");

                String dateKey;
                Date d = null;
                try { d = inFmt1.parse(timestamp); } catch (Exception ignored) {}
                if (d == null) {
                    try { d = inFmt2.parse(timestamp); } catch (Exception ignored) {}
                }
                if (d != null) {
                    dateKey = keyFmt.format(d);
                } else if (timestamp.length() >= 10) {
                    dateKey = timestamp.substring(0, 10);
                } else {
                    dateKey = keyFmt.format(new Date());
                }

                if (!groupedMap.containsKey(dateKey)) {
                    groupedMap.put(dateKey, new ArrayList<>());
                }
                groupedMap.get(dateKey).add(new NotificationItem(title, message, timestamp));
            }

            for (Map.Entry<String, List<NotificationItem>> entry : groupedMap.entrySet()) {
                displayRows.add(new DisplayRow(formatHeaderTitle(entry.getKey())));
                for (NotificationItem notif : entry.getValue()) {
                    displayRows.add(new DisplayRow(notif));
                }
            }
        } catch (Exception ignored) {}

        // Mark local as read so badge is cleared everywhere
        apiClient.markLocalNotificationsAsRead();

        if (displayRows.isEmpty()) {
            if (lvNotifications != null) lvNotifications.setVisibility(View.GONE);
            if (llEmptyState != null) llEmptyState.setVisibility(View.VISIBLE);
        } else {
            if (lvNotifications != null) lvNotifications.setVisibility(View.VISIBLE);
            if (llEmptyState != null) llEmptyState.setVisibility(View.GONE);

            NotificationsAdapter adapter = new NotificationsAdapter(this, displayRows);
            lvNotifications.setAdapter(adapter);
        }

        // Fetch remote unread notifications and sync
        String token = apiClient.getToken();
        if (token != null) {
            apiClient.getUnreadNotifications(token, new ApiClient.ApiCallback<JSONArray>() {
                @Override
                public void onSuccess(JSONArray result) {
                    if (isFinishing() || isDestroyed()) return;
                    if (result != null && result.length() > 0) {
                        AppNotificationManager.syncRemoteNotifications(NotificationsActivity.this, result);
                        loadNotifications();
                    }
                }

                @Override
                public void onError(String errorMessage, int statusCode) {}
            });
        }
    }

    private static class NotificationsAdapter extends BaseAdapter {
        private static final int TYPE_HEADER = 0;
        private static final int TYPE_ITEM = 1;

        private final Context context;
        private final List<DisplayRow> rows;
        private final LayoutInflater inflater;

        NotificationsAdapter(Context context, List<DisplayRow> rows) {
            this.context = context;
            this.rows = rows;
            this.inflater = LayoutInflater.from(context);
        }

        @Override
        public int getCount() {
            return rows.size();
        }

        @Override
        public Object getItem(int position) {
            return rows.get(position);
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public int getViewTypeCount() {
            return 2;
        }

        @Override
        public int getItemViewType(int position) {
            return rows.get(position).isHeader ? TYPE_HEADER : TYPE_ITEM;
        }

        @Override
        public boolean isEnabled(int position) {
            return !rows.get(position).isHeader;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            DisplayRow row = rows.get(position);

            if (row.isHeader) {
                TextView tvHeader;
                if (convertView == null || !(convertView instanceof TextView)) {
                    tvHeader = new TextView(context);
                    int padH = (int) (18 * context.getResources().getDisplayMetrics().density);
                    int padTop = (int) (12 * context.getResources().getDisplayMetrics().density);
                    int padBottom = (int) (6 * context.getResources().getDisplayMetrics().density);
                    tvHeader.setPadding(padH, padTop, padH, padBottom);
                    tvHeader.setTextSize(13f);
                    tvHeader.setTypeface(null, android.graphics.Typeface.BOLD);
                    tvHeader.setTextColor(Color.parseColor("#475569"));
                } else {
                    tvHeader = (TextView) convertView;
                }
                tvHeader.setText(row.headerTitle);
                return tvHeader;
            }

            if (convertView == null || convertView instanceof TextView) {
                convertView = inflater.inflate(R.layout.item_notification, parent, false);
            }
            NotificationItem item = row.item;
            if (item != null) {
                TextView tvTitle = convertView.findViewById(R.id.tvNotifTitle);
                TextView tvTime = convertView.findViewById(R.id.tvNotifTime);
                TextView tvMessage = convertView.findViewById(R.id.tvNotifMessage);

                if (tvTitle != null) tvTitle.setText(item.title);
                if (tvTime != null) tvTime.setText(item.timestamp);
                if (tvMessage != null) tvMessage.setText(item.message);
            }

            return convertView;
        }
    }
}
