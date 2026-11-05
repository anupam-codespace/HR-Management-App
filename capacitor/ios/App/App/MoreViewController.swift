import UIKit

class MoreModuleCell: UITableViewCell {
    static let identifier = "MoreModuleCell"

    private let iconImageView = UIImageView()
    private let titleLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    private func setupViews() {
        backgroundColor = .white
        contentView.backgroundColor = .white
        selectionStyle = .default

        iconImageView.contentMode = .scaleAspectFit
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(iconImageView)

        titleLabel.font = .systemFont(ofSize: 16, weight: .regular)
        titleLabel.textColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(titleLabel)

        NSLayoutConstraint.activate([
            iconImageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            iconImageView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            iconImageView.widthAnchor.constraint(equalToConstant: 22),
            iconImageView.heightAnchor.constraint(equalToConstant: 22),

            titleLabel.leadingAnchor.constraint(equalTo: iconImageView.trailingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            titleLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor)
        ])
    }

    func configure(with module: MoreModule) {
        titleLabel.text = module.title

        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .regular)
        iconImageView.image = UIImage(systemName: module.systemIcon, withConfiguration: config)

        if let tint = module.iconColor {
            iconImageView.tintColor = tint
        } else {
            iconImageView.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        }
    }
}

class MoreViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UITextFieldDelegate {

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let titleLabel = UILabel()
    private let notificationBellButton = UIButton(type: .system)
    private let notificationBadgeDot = UIView()
    private let avatarContainer = UIView()
    private let avatarInitialsLabel = UILabel()

    // Bottom Navigation Bar
    private let bottomNavBar = UIView()
    private let bottomNavContainer = UIView()

    private let searchContainer = UIView()
    private let searchIconView = UIImageView()
    private let searchTextField = UITextField()

    private let tableView = UITableView()
    private let emptyLabel = UILabel()

    private var allModules: [MoreModule] = []
    private var rolePermittedModules: [MoreModule] = []
    private var filteredModules: [MoreModule] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        initModules()
        filterModulesByRole()
        setupTopBar()
        setupSearchBar()
        setupTableView()
        setupBottomNavBar()

        let swipeGesture = UISwipeGestureRecognizer(target: self, action: #selector(handleBack))
        swipeGesture.direction = .right
        view.addGestureRecognizer(swipeGesture)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        filterModulesByRole()
        updateHeaderState()
        updateNotificationBadge()

        // Real-time synchronization of currently logged-in user profile & role modules
        AuthService.shared.getProfile { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let profile):
                if let userRole = profile["role"] as? String, !userRole.isEmpty {
                    AuthService.shared.saveRole(userRole)
                }
                if let desigDict = profile["designation"] as? [String: Any],
                   let modules = desigDict["sidebarModules"] as? [String] {
                    AuthService.shared.saveSidebarModules(modules)
                }
                self.filterModulesByRole()
            case .failure:
                break
            }
        }
    }

    private func updateHeaderState() {
        let name = AuthService.shared.getFirstName()
        avatarInitialsLabel.text = name.isEmpty ? "U" : String(name.prefix(1)).uppercased()
    }

    private func updateNotificationBadge() {
        notificationBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
    }

    @objc private func handleNotifications() {
        notificationBadgeDot.isHidden = true
        let notifVC = NotificationsViewController()
        notifVC.modalPresentationStyle = .fullScreen
        present(notifVC, animated: true)
    }

    @objc private func handleBack() {
        if let nav = navigationController {
            nav.popViewController(animated: true)
        } else {
            dismiss(animated: true)
        }
    }

    @objc private func didTapAvatar() {
        let settingsVC = SettingsViewController()
        settingsVC.modalPresentationStyle = .fullScreen
        present(settingsVC, animated: true)
    }

    private func initModules() {
        allModules = [
            MoreModule(id: "employees", title: "Employees", systemIcon: "person.2", iconColor: nil, allowedRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "attendance", title: "Clock ins/outs", systemIcon: "clock", iconColor: nil, allowedRoles: ["EMPLOYEE", "HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "schedules", title: "Schedules", systemIcon: "calendar", iconColor: nil, allowedRoles: ["EMPLOYEE", "MANAGER"]),
            MoreModule(id: "leave", title: "Leave", systemIcon: "calendar.badge.clock", iconColor: nil, allowedRoles: ["EMPLOYEE", "MANAGER"]),
            MoreModule(id: "leave_approvals", title: "Leave Approvals", systemIcon: "calendar.badge.checkmark", iconColor: nil, allowedRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "leave_policies", title: "Leave Policies", systemIcon: "slider.horizontal.3", iconColor: nil, allowedRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "payslips", title: "My Payslips", systemIcon: "banknote", iconColor: nil, allowedRoles: ["EMPLOYEE", "MANAGER"]),
            MoreModule(id: "payroll", title: "Payroll Processing", systemIcon: "dollarsign.circle", iconColor: nil, allowedRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "shifts", title: "Shifts", systemIcon: "briefcase", iconColor: nil, allowedRoles: ["EMPLOYEE"]),
            MoreModule(id: "tasks", title: "Tasks", systemIcon: "checklist", iconColor: nil, allowedRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "documents", title: "Documents", systemIcon: "folder", iconColor: nil, allowedRoles: ["EMPLOYEE", "MANAGER"]),
            MoreModule(id: "documents_admin", title: "Documents (Admin)", systemIcon: "folder.badge.gearshape", iconColor: nil, allowedRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "manage_schedules", title: "Manage Schedules", systemIcon: "calendar.badge.plus", iconColor: nil, allowedRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"]),
            MoreModule(id: "settings", title: "Settings", systemIcon: "gearshape", iconColor: nil, allowedRoles: ["SUPER_ADMIN", "OWNER"])
        ]
    }

    private func filterModulesByRole() {
        let role = AuthService.shared.getRole()
        let sidebarModules = AuthService.shared.getSidebarModules()
        rolePermittedModules = allModules.filter { $0.isAllowed(for: role, sidebarModules: sidebarModules) }
        applySearchQuery(searchTextField.text ?? "")
    }

    private func applySearchQuery(_ text: String) {
        let query = text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if query.isEmpty {
            filteredModules = rolePermittedModules
            emptyLabel.isHidden = true
            tableView.isHidden = false
        } else {
            filteredModules = rolePermittedModules.filter { $0.title.lowercased().contains(query) }
            let hasResults = !filteredModules.isEmpty
            emptyLabel.isHidden = hasResults
            tableView.isHidden = !hasResults
        }
        tableView.reloadData()
    }

    private func setupTopBar() {
        topBar.backgroundColor = .white
        topBar.layer.shadowColor = UIColor.black.cgColor
        topBar.layer.shadowOpacity = 0.03
        topBar.layer.shadowOffset = CGSize(width: 0, height: 1)
        topBar.layer.shadowRadius = 4
        topBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(topBar)

        topBarContainer.translatesAutoresizingMaskIntoConstraints = false
        topBar.addSubview(topBarContainer)

        let brandHeaderStack = UIStackView()
        brandHeaderStack.axis = .vertical
        brandHeaderStack.spacing = 1
        brandHeaderStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(brandHeaderStack)

        let appLabel = UILabel()
        appLabel.text = "TEAMHUB"
        appLabel.font = .systemFont(ofSize: 11, weight: .heavy)
        appLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        brandHeaderStack.addArrangedSubview(appLabel)

        titleLabel.text = "More"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        brandHeaderStack.addArrangedSubview(titleLabel)

        let rightActionsStack = UIStackView()
        rightActionsStack.axis = .horizontal
        rightActionsStack.spacing = 12
        rightActionsStack.alignment = .center
        rightActionsStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(rightActionsStack)

        // Notification Bell with Conditional Red Dot
        let bellConfig = UIImage.SymbolConfiguration(pointSize: 19, weight: .regular)
        notificationBellButton.setImage(UIImage(systemName: "bell", withConfiguration: bellConfig), for: .normal)
        notificationBellButton.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        notificationBellButton.addTarget(self, action: #selector(handleNotifications), for: .touchUpInside)
        notificationBellButton.translatesAutoresizingMaskIntoConstraints = false
        rightActionsStack.addArrangedSubview(notificationBellButton)

        notificationBadgeDot.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        notificationBadgeDot.layer.cornerRadius = 4
        notificationBadgeDot.layer.borderWidth = 1.5
        notificationBadgeDot.layer.borderColor = UIColor.white.cgColor
        notificationBadgeDot.isHidden = true
        notificationBadgeDot.translatesAutoresizingMaskIntoConstraints = false
        notificationBellButton.addSubview(notificationBadgeDot)

        // Avatar
        avatarContainer.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        avatarContainer.layer.cornerRadius = 18
        avatarContainer.layer.masksToBounds = true
        avatarContainer.isUserInteractionEnabled = true
        avatarContainer.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapAvatar)))
        avatarContainer.translatesAutoresizingMaskIntoConstraints = false
        rightActionsStack.addArrangedSubview(avatarContainer)

        avatarInitialsLabel.text = "A"
        avatarInitialsLabel.font = .systemFont(ofSize: 14, weight: .bold)
        avatarInitialsLabel.textColor = .white
        avatarInitialsLabel.textAlignment = .center
        avatarInitialsLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarInitialsLabel)

        let topBarWidth = topBarContainer.widthAnchor.constraint(equalTo: topBar.widthAnchor, constant: -32)
        topBarWidth.priority = UILayoutPriority(999)
        topBarWidth.isActive = true

        NSLayoutConstraint.activate([
            topBar.topAnchor.constraint(equalTo: view.topAnchor),
            topBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            topBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            topBar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 58),

            topBarContainer.leadingAnchor.constraint(greaterThanOrEqualTo: topBar.leadingAnchor, constant: 16),
            topBarContainer.trailingAnchor.constraint(lessThanOrEqualTo: topBar.trailingAnchor, constant: -16),
            topBarContainer.centerXAnchor.constraint(equalTo: topBar.centerXAnchor),
            topBarContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            topBarContainer.bottomAnchor.constraint(equalTo: topBar.bottomAnchor, constant: -10),
            topBarContainer.heightAnchor.constraint(equalToConstant: 44),

            brandHeaderStack.leadingAnchor.constraint(equalTo: topBarContainer.leadingAnchor),
            brandHeaderStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            rightActionsStack.trailingAnchor.constraint(equalTo: topBarContainer.trailingAnchor),
            rightActionsStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            notificationBellButton.widthAnchor.constraint(equalToConstant: 38),
            notificationBellButton.heightAnchor.constraint(equalToConstant: 38),

            notificationBadgeDot.topAnchor.constraint(equalTo: notificationBellButton.topAnchor, constant: 4),
            notificationBadgeDot.trailingAnchor.constraint(equalTo: notificationBellButton.trailingAnchor, constant: -4),
            notificationBadgeDot.widthAnchor.constraint(equalToConstant: 8),
            notificationBadgeDot.heightAnchor.constraint(equalToConstant: 8),

            avatarContainer.widthAnchor.constraint(equalToConstant: 36),
            avatarContainer.heightAnchor.constraint(equalToConstant: 36),

            avatarInitialsLabel.centerXAnchor.constraint(equalTo: avatarContainer.centerXAnchor),
            avatarInitialsLabel.centerYAnchor.constraint(equalTo: avatarContainer.centerYAnchor)
        ])
    }

    // MARK: - Bottom Navigation Bar Setup
    private func setupBottomNavBar() {
        bottomNavBar.backgroundColor = .white
        bottomNavBar.layer.shadowColor = UIColor.black.cgColor
        bottomNavBar.layer.shadowOpacity = 0.06
        bottomNavBar.layer.shadowOffset = CGSize(width: 0, height: -2)
        bottomNavBar.layer.shadowRadius = 6
        bottomNavBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(bottomNavBar)

        bottomNavContainer.translatesAutoresizingMaskIntoConstraints = false
        bottomNavBar.addSubview(bottomNavContainer)

        let navStack = UIStackView()
        navStack.axis = .horizontal
        navStack.distribution = .fillEqually
        navStack.translatesAutoresizingMaskIntoConstraints = false
        bottomNavContainer.addSubview(navStack)

        let tabs = [
            ("house", "Home", false),
            ("clock", "Attendance", false),
            ("calendar", "Leave", false),
            ("checkmark.square", "Tasks", false),
            ("ellipsis", "More", true)
        ]

        for (idx, tab) in tabs.enumerated() {
            let item = makeNavItem(icon: tab.0, title: tab.1, isSelected: tab.2, tag: idx)
            navStack.addArrangedSubview(item)
        }

        let navWidth = bottomNavContainer.widthAnchor.constraint(equalTo: bottomNavBar.widthAnchor)
        navWidth.priority = .defaultHigh
        navWidth.isActive = true

        NSLayoutConstraint.activate([
            bottomNavBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomNavBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomNavBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            bottomNavBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -64),

            bottomNavContainer.topAnchor.constraint(equalTo: bottomNavBar.topAnchor),
            bottomNavContainer.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            bottomNavContainer.centerXAnchor.constraint(equalTo: bottomNavBar.centerXAnchor),
            bottomNavContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),

            navStack.topAnchor.constraint(equalTo: bottomNavContainer.topAnchor, constant: 6),
            navStack.leadingAnchor.constraint(equalTo: bottomNavContainer.leadingAnchor),
            navStack.trailingAnchor.constraint(equalTo: bottomNavContainer.trailingAnchor),
            navStack.bottomAnchor.constraint(equalTo: bottomNavContainer.bottomAnchor, constant: -6)
        ])
    }

    private func makeNavItem(icon: String, title: String, isSelected: Bool, tag: Int) -> UIView {
        let container = UIView()
        container.tag = tag
        container.isUserInteractionEnabled = true
        container.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapNavTab(_:))))

        let stack = UIStackView()
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 2
        stack.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(stack)

        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: isSelected ? .semibold : .regular)
        let imageView = UIImageView(image: UIImage(systemName: icon, withConfiguration: config))
        imageView.tintColor = isSelected ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        imageView.contentMode = .scaleAspectFit
        stack.addArrangedSubview(imageView)

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 11, weight: isSelected ? .bold : .medium)
        label.textColor = isSelected ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        stack.addArrangedSubview(label)

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            imageView.heightAnchor.constraint(equalToConstant: 22)
        ])
        return container
    }

    @objc private func didTapNavTab(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view else { return }
        switch view.tag {
        case 0:
            let homeVC = HomeViewController()
            homeVC.modalPresentationStyle = .fullScreen
            present(homeVC, animated: false)
        case 1:
            let attendanceVC = AttendanceViewController()
            attendanceVC.modalPresentationStyle = .fullScreen
            present(attendanceVC, animated: false)
        case 2:
            let leaveVC = LeaveViewController()
            leaveVC.modalPresentationStyle = .fullScreen
            present(leaveVC, animated: false)
        case 3:
            let tasksVC = TasksViewController()
            tasksVC.modalPresentationStyle = .fullScreen
            present(tasksVC, animated: false)
        case 4:
            // Already in More
            break
        default:
            break
        }
    }

    private func setupSearchBar() {
        searchContainer.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        searchContainer.layer.cornerRadius = 22
        searchContainer.clipsToBounds = true
        searchContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(searchContainer)

        let searchConfig = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        searchIconView.image = UIImage(systemName: "magnifyingglass", withConfiguration: searchConfig)
        searchIconView.tintColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        searchIconView.contentMode = .scaleAspectFit
        searchIconView.translatesAutoresizingMaskIntoConstraints = false
        searchContainer.addSubview(searchIconView)

        searchTextField.placeholder = "Search..."
        searchTextField.font = .systemFont(ofSize: 15)
        searchTextField.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        searchTextField.clearButtonMode = .whileEditing
        searchTextField.autocorrectionType = .no
        searchTextField.autocapitalizationType = .none
        searchTextField.returnKeyType = .search
        searchTextField.delegate = self
        searchTextField.addTarget(self, action: #selector(searchTextChanged(_:)), for: .editingChanged)
        searchTextField.translatesAutoresizingMaskIntoConstraints = false
        searchContainer.addSubview(searchTextField)

        let searchWidth = searchContainer.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -40)
        searchWidth.priority = UILayoutPriority(999)
        searchWidth.isActive = true

        NSLayoutConstraint.activate([
            searchContainer.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 8),
            searchContainer.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            searchContainer.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20),
            searchContainer.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            searchContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            searchContainer.heightAnchor.constraint(equalToConstant: 44),

            searchIconView.leadingAnchor.constraint(equalTo: searchContainer.leadingAnchor, constant: 14),
            searchIconView.centerYAnchor.constraint(equalTo: searchContainer.centerYAnchor),
            searchIconView.widthAnchor.constraint(equalToConstant: 20),
            searchIconView.heightAnchor.constraint(equalToConstant: 20),

            searchTextField.leadingAnchor.constraint(equalTo: searchIconView.trailingAnchor, constant: 10),
            searchTextField.trailingAnchor.constraint(equalTo: searchContainer.trailingAnchor, constant: -14),
            searchTextField.topAnchor.constraint(equalTo: searchContainer.topAnchor),
            searchTextField.bottomAnchor.constraint(equalTo: searchContainer.bottomAnchor)
        ])
    }

    private func setupTableView() {
        tableView.backgroundColor = .white
        tableView.separatorStyle = .none
        tableView.rowHeight = 52
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(MoreModuleCell.self, forCellReuseIdentifier: MoreModuleCell.identifier)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)

        emptyLabel.text = "No modules found"
        emptyLabel.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        emptyLabel.font = .systemFont(ofSize: 15)
        emptyLabel.textAlignment = .center
        emptyLabel.isHidden = true
        emptyLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(emptyLabel)

        let tableWidth = tableView.widthAnchor.constraint(equalTo: view.widthAnchor)
        tableWidth.priority = UILayoutPriority(999)
        tableWidth.isActive = true

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: searchContainer.bottomAnchor, constant: 12),
            tableView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor),
            tableView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            tableView.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            tableView.bottomAnchor.constraint(equalTo: bottomNavBar.topAnchor),

            emptyLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emptyLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    @objc private func searchTextChanged(_ textField: UITextField) {
        applySearchQuery(textField.text ?? "")
    }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
    }

    @objc private func openCustomizeTabs() {
        let customizeVC = CustomizeTabsViewController()
        customizeVC.modalPresentationStyle = .fullScreen
        present(customizeVC, animated: true)
    }

    // MARK: - UITableViewDataSource & Delegate
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredModules.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: MoreModuleCell.identifier, for: indexPath) as? MoreModuleCell else {
            return UITableViewCell()
        }
        let module = filteredModules[indexPath.row]
        cell.configure(with: module)
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let module = filteredModules[indexPath.row]

        if module.id == "attendance" {
            let attendanceVC = AttendanceViewController()
            attendanceVC.modalPresentationStyle = .fullScreen
            present(attendanceVC, animated: true)
        } else if module.id == "leave" {
            let leaveVC = LeaveViewController()
            leaveVC.modalPresentationStyle = .fullScreen
            present(leaveVC, animated: true)
        } else if module.id == "tasks" {
            let tasksVC = TasksViewController()
            tasksVC.modalPresentationStyle = .fullScreen
            present(tasksVC, animated: true)
        } else if module.id == "settings" {
            let settingsVC = SettingsViewController()
            settingsVC.modalPresentationStyle = .fullScreen
            present(settingsVC, animated: true)
        } else {
            let alert = UIAlertController(title: module.title, message: "\(module.title) module is active.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
        }
    }
}
