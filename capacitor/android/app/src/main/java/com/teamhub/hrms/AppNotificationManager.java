package com.teamhub.hrms;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Centralized push and in-app notification manager for TeamHub Android.
 * Handles system tray push notifications, real-time in-app records,
 * notification channel setup, Android 13+ permission requests, and user preferences.
 */
public class AppNotificationManager {

    private static final String TAG = "AppNotificationManager";
    public static final String CHANNEL_ID = "teamhub_notifications";
    public static final String PREF_NAME = "TeamHubAuth";
    public static final String KEY_PUSH_NOTIFICATION = "pref_push_notification";
    private static final String KEY_INGESTED_IDS = "ingested_remote_notification_ids";
    public static final String ACTION_NOTIFICATION_RECEIVED = "com.teamhub.hrms.NOTIFICATION_RECEIVED";

    /**
     * Initializes the high-priority notification channel for Android O (8.0) and above.
     */
    public static void initChannel(Context context) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "TeamHub Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Real-time notifications for shifts, attendance, and team announcements");
                channel.enableLights(true);
                channel.setLightColor(Color.parseColor("#0056FD"));
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 250, 150, 250});
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

                manager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * Checks if push notifications are enabled by the user in settings.
     * Defaults to true for all users.
     */
    public static boolean isPushNotificationEnabled(Context context) {
        if (context == null) return true;
        SharedPreferences authPrefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        if (authPrefs.contains(KEY_PUSH_NOTIFICATION)) {
            return authPrefs.getBoolean(KEY_PUSH_NOTIFICATION, true);
        }
        SharedPreferences settingsPrefs = context.getSharedPreferences("TeamHubSettings", Context.MODE_PRIVATE);
        return settingsPrefs.getBoolean(KEY_PUSH_NOTIFICATION, true);
    }

    /**
     * Updates the user's push notification preference.
     */
    public static void setPushNotificationEnabled(Context context, boolean enabled) {
        if (context == null) return;
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_PUSH_NOTIFICATION, enabled).apply();
        context.getSharedPreferences("TeamHubSettings", Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_PUSH_NOTIFICATION, enabled).apply();
    }

    /**
     * Requests POST_NOTIFICATIONS permission on Android 13 (API 33) and above.
     */
    public static void requestNotificationPermission(Activity activity) {
        if (activity == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        activity,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        1001
                );
            }
        }
    }

    /**
     * Dispatches a real-time notification:
     * 1. ALWAYS logs the notification to the in-app notification center store.
     * 2. Fires a local broadcast so active screens refresh the red badge dot in real time.
     * 3. Sends a native system push notification to the device tray IF push notifications are enabled.
     *
     * @param context Context
     * @param title   Notification title
     * @param message Notification message
     */
    public static void sendNotification(Context context, String title, String message) {
        if (context == null || title == null || message == null) return;

        Context appCtx = context.getApplicationContext();
        initChannel(appCtx);

        // 1. Always record in in-app notification center history
        ApiClient.getInstance(appCtx).recordLocalNotification(title, message);

        // 2. Broadcast to any foreground activity to update badges immediately
        try {
            Intent broadcast = new Intent(ACTION_NOTIFICATION_RECEIVED);
            broadcast.setPackage(appCtx.getPackageName());
            appCtx.sendBroadcast(broadcast);
        } catch (Exception e) {
            Log.w(TAG, "Broadcast notification failed", e);
        }

        // 3. Dispatch system push notification only if enabled
        if (!isPushNotificationEnabled(appCtx)) {
            Log.d(TAG, "Push notifications disabled by user. Notification saved to in-app panel only.");
            return;
        }

        // Check runtime permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(appCtx, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted; system tray push skipped.");
                return;
            }
        }

        try {
            Intent intent = new Intent(appCtx, NotificationsActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    appCtx,
                    (int) (System.currentTimeMillis() % Integer.MAX_VALUE),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(appCtx, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notifications)
                    .setColor(Color.parseColor("#0056FD"))
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setSound(defaultSound)
                    .setVibrate(new long[]{0, 250, 150, 250})
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            NotificationManagerCompat manager = NotificationManagerCompat.from(appCtx);
            manager.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
        } catch (SecurityException se) {
            Log.w(TAG, "SecurityException while dispatching notification", se);
        } catch (Exception ex) {
            Log.e(TAG, "Failed to display system notification", ex);
        }
    }

    /**
     * Ingests remote unread notifications fetched from backend API and posts them
     * through the unified notification system if not already seen.
     */
    public static void syncRemoteNotifications(Context context, JSONArray remoteArray) {
        if (context == null || remoteArray == null || remoteArray.length() == 0) return;

        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        Set<String> ingested = new HashSet<>(prefs.getStringSet(KEY_INGESTED_IDS, new HashSet<>()));
        boolean hasNew = false;

        for (int i = 0; i < remoteArray.length(); i++) {
            JSONObject obj = remoteArray.optJSONObject(i);
            if (obj == null) continue;
            String id = obj.optString("id", obj.optString("_id", ""));
            if (id.isEmpty()) {
                id = String.valueOf(obj.optString("title", "").hashCode());
            }

            if (!ingested.contains(id)) {
                ingested.add(id);
                hasNew = true;
                String title = obj.optString("title", "TeamHub Update");
                String message = obj.optString("message", obj.optString("body", "You have a new update."));
                sendNotification(context, title, message);
            }
        }

        if (hasNew) {
            prefs.edit().putStringSet(KEY_INGESTED_IDS, ingested).apply();
        }
    }
}
