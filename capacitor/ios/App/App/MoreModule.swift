import UIKit

struct MoreModule {
    let id: String
    let title: String
    let systemIcon: String
    let iconColor: UIColor?
    let allowedRoles: [String]

    func isAllowed(for role: String, sidebarModules: [String]? = nil) -> Bool {
        let upperRole = role.uppercased()

        // Admin roles have full access to all system modules
        if upperRole == "SUPER_ADMIN" || upperRole == "OWNER" || upperRole == "ADMIN" {
            return true
        }

        // If the logged-in user has specific designation sidebarModules configured, check against them
        if let modules = sidebarModules, !modules.isEmpty {
            return modules.contains(id)
        }

        // Fallback to default role definitions
        if allowedRoles.contains("ALL") { return true }
        if upperRole.isEmpty { return true }
        return allowedRoles.contains(upperRole)
    }
}
