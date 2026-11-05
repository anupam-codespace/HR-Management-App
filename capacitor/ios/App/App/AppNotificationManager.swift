import UIKit
import UserNotifications

/**
 * Centralized push and in-app notification manager for TeamHub iOS.
 * Handles system tray push notifications, real-time in-app records,
 * UNUserNotificationCenter authorization, badge synchronization, and user preferences.
 */
class AppNotificationManager {

    static let shared = AppNotificationManager()
    static let notificationBadgeChangedNotification = NSNotification.Name("TeamHubNotificationBadgeChanged")

    private let keyPushNotification = "pref_push_notification"
    private let keyIngestedIds = "ingested_remote_notification_ids"

    private init() {}

    /**
     * Checks if push notifications are enabled by the user in settings.
     * Defaults to true for all users.
     */
    func isPushNotificationEnabled() -> Bool {
        return UserDefaults.standard.object(forKey: keyPushNotification) as? Bool ?? true
    }

    /**
     * Updates the user's push notification preference.
     */
    func setPushNotificationEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: keyPushNotification)
        UserDefaults.standard.synchronize()
        if enabled {
            requestAuthorization()
        }
    }

    /**
     * Requests UNUserNotificationCenter authorization for alerts, sounds, and badges.
     */
    func requestAuthorization(completion: ((Bool) -> Void)? = nil) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                completion?(granted)
            }
        }
    }

    /**
     * Dispatches a real-time notification:
     * 1. ALWAYS records the notification into the local in-app notification panel.
     * 2. Broadcasts a notification change event so any active screen updates its red badge dot instantly.
     * 3. Schedules a native system push notification banner/alert IF push notifications are enabled.
     */
    func sendNotification(title: String, body: String, category: String? = nil) {
        // 1. Always record in local in-app notification store
        AuthService.shared.recordLocalNotification(title: title, body: body)

        // 2. Notify all foreground controllers to refresh notification badge dot in real time
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: AppNotificationManager.notificationBadgeChangedNotification, object: nil)
        }

        // 3. Dispatch system push notification only if enabled
        guard isPushNotificationEnabled() else {
            print("[AppNotificationManager] Push notifications disabled by user. Saved to in-app panel only.")
            return
        }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.badge = 1
        content.userInfo = ["screen": "notifications"]
        if let cat = category {
            content.categoryIdentifier = cat
        }

        // Small 0.1s trigger ensures immediate display in foreground banner or background tray
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[AppNotificationManager] Error adding notification request: \(error.localizedDescription)")
            }
        }
    }

    /**
     * Ingests remote unread notifications fetched from backend API and posts them
     * through the unified notification system if not already seen.
     */
    func syncRemoteNotifications(_ remoteList: [[String: Any]]) {
        var ingested = Set(UserDefaults.standard.stringArray(forKey: keyIngestedIds) ?? [])
        var hasNew = false

        for obj in remoteList {
            let id = (obj["id"] as? String) ?? (obj["_id"] as? String) ?? "\(obj["title"] ?? "")".hashValue.description
            if !ingested.contains(id) {
                ingested.insert(id)
                hasNew = true
                let title = (obj["title"] as? String) ?? "TeamHub Update"
                let body = (obj["message"] as? String) ?? (obj["body"] as? String) ?? "You have a new update."
                sendNotification(title: title, body: body)
            }
        }

        if hasNew {
            UserDefaults.standard.set(Array(ingested), forKey: keyIngestedIds)
            UserDefaults.standard.synchronize()
        }
    }
}
