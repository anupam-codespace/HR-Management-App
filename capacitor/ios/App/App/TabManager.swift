import Foundation

struct TabItem: Codable, Equatable {
    let id: String
    let title: String
    let isLocked: Bool
    var isEnabled: Bool
}

class TabManager {
    static let shared = TabManager()
    private let key = "TeamHub_Tabs_Config"

    private init() {}

    func getDefaultTabs() -> [TabItem] {
        return [
            TabItem(id: "activities", title: "Activities", isLocked: true, isEnabled: true),
            TabItem(id: "dashboard", title: "Dashboard", isLocked: true, isEnabled: true),
            TabItem(id: "feeds", title: "Feeds", isLocked: false, isEnabled: true),
            TabItem(id: "profile", title: "Profile", isLocked: false, isEnabled: true),
            TabItem(id: "approvals", title: "Approvals", isLocked: false, isEnabled: true),
            TabItem(id: "leave", title: "Leave", isLocked: false, isEnabled: true),
            TabItem(id: "attendance", title: "Attendance", isLocked: false, isEnabled: true),
            TabItem(id: "timelogs", title: "Time Logs", isLocked: false, isEnabled: true),
            TabItem(id: "timesheets", title: "Timesheets", isLocked: false, isEnabled: true),
            TabItem(id: "jobs", title: "Jobs", isLocked: false, isEnabled: true),
            TabItem(id: "career", title: "Career History", isLocked: false, isEnabled: true),
            TabItem(id: "files", title: "Files", isLocked: false, isEnabled: true),
            TabItem(id: "goals", title: "Goals", isLocked: false, isEnabled: true),
            TabItem(id: "feedback", title: "Feedback", isLocked: false, isEnabled: true),
            TabItem(id: "related", title: "Related Data", isLocked: false, isEnabled: true)
        ]
    }

    func getTabs() -> [TabItem] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([TabItem].self, from: data) else {
            return getDefaultTabs()
        }

        // Ensure first two are always locked and enabled
        var validated = decoded
        for i in 0..<min(2, validated.count) {
            if validated[i].id == "activities" || validated[i].id == "dashboard" {
                validated[i] = TabItem(id: validated[i].id, title: validated[i].title, isLocked: true, isEnabled: true)
            }
        }
        return validated
    }

    func saveTabs(_ tabs: [TabItem]) {
        if let encoded = try? JSONEncoder().encode(tabs) {
            UserDefaults.standard.set(encoded, forKey: key)
        }
    }

    func getEnabledTabs() -> [TabItem] {
        return getTabs().filter { $0.isEnabled }
    }
}
