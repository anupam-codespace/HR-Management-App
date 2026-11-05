import UIKit

class NotificationItemCell: UITableViewCell {
    static let identifier = "NotificationItemCell"

    private let container = UIView()
    private let iconContainer = UIView()
    private let iconView = UIImageView()
    private let titleLabel = UILabel()
    private let bodyLabel = UILabel()
    private let timeLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        selectionStyle = .none
        backgroundColor = .clear
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        container.backgroundColor = .white
        container.layer.cornerRadius = 16
        container.layer.borderWidth = 1
        container.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        container.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(container)

        iconContainer.backgroundColor = UIColor(red: 238/255, green: 242/255, blue: 255/255, alpha: 1.0)
        iconContainer.layer.cornerRadius = 20
        iconContainer.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(iconContainer)

        let bellConfig = UIImage.SymbolConfiguration(pointSize: 16, weight: .bold)
        iconView.image = UIImage(systemName: "bell.fill", withConfiguration: bellConfig)
        iconView.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        iconView.contentMode = .scaleAspectFit
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconContainer.addSubview(iconView)

        titleLabel.font = .systemFont(ofSize: 15, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(titleLabel)

        bodyLabel.font = .systemFont(ofSize: 13, weight: .regular)
        bodyLabel.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        bodyLabel.numberOfLines = 0
        bodyLabel.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(bodyLabel)

        timeLabel.font = .systemFont(ofSize: 11, weight: .medium)
        timeLabel.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        timeLabel.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(timeLabel)

        NSLayoutConstraint.activate([
            container.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 6),
            container.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -6),
            container.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            container.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            iconContainer.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 14),
            iconContainer.topAnchor.constraint(equalTo: container.topAnchor, constant: 14),
            iconContainer.widthAnchor.constraint(equalToConstant: 40),
            iconContainer.heightAnchor.constraint(equalToConstant: 40),

            iconView.centerXAnchor.constraint(equalTo: iconContainer.centerXAnchor),
            iconView.centerYAnchor.constraint(equalTo: iconContainer.centerYAnchor),

            titleLabel.topAnchor.constraint(equalTo: container.topAnchor, constant: 14),
            titleLabel.leadingAnchor.constraint(equalTo: iconContainer.trailingAnchor, constant: 12),
            titleLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -14),

            bodyLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
            bodyLabel.leadingAnchor.constraint(equalTo: iconContainer.trailingAnchor, constant: 12),
            bodyLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -14),

            timeLabel.topAnchor.constraint(equalTo: bodyLabel.bottomAnchor, constant: 8),
            timeLabel.leadingAnchor.constraint(equalTo: iconContainer.trailingAnchor, constant: 12),
            timeLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -14),
            timeLabel.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -14)
        ])
    }

    func configure(title: String, body: String, timestamp: String) {
        titleLabel.text = title
        bodyLabel.text = body
        timeLabel.text = timestamp
    }
}

struct NotificationSection {
    let dateKey: String
    let headerTitle: String
    var items: [[String: String]]
}

class NotificationsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let backButton = UIButton(type: .system)
    private let brandSubtitleLabel = UILabel()
    private let titleLabel = UILabel()
    private let avatarContainer = UIView()
    private let avatarInitialsLabel = UILabel()
    private let tableView = UITableView(frame: .zero, style: .plain)
    private let emptyStateView = UIView()
    private var sections: [NotificationSection] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        navigationController?.setNavigationBarHidden(true, animated: false)

        setupTopBar()
        setupTableView()
        setupEmptyState()

        let swipeGesture = UISwipeGestureRecognizer(target: self, action: #selector(handleBack))
        swipeGesture.direction = .right
        view.addGestureRecognizer(swipeGesture)

        NotificationCenter.default.addObserver(self, selector: #selector(handleNotificationReceived), name: AppNotificationManager.notificationBadgeChangedNotification, object: nil)
    }

    @objc private func handleNotificationReceived() {
        loadNotifications()
        AuthService.shared.markLocalNotificationsAsRead()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        loadNotifications()
        AuthService.shared.markLocalNotificationsAsRead()

        let firstName = AuthService.shared.getFirstName()
        avatarInitialsLabel.text = firstName.isEmpty ? "U" : String(firstName.prefix(1)).uppercased()
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

        let leftStack = UIStackView()
        leftStack.axis = .horizontal
        leftStack.spacing = 8
        leftStack.alignment = .center
        leftStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(leftStack)

        let backConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        backButton.setImage(UIImage(systemName: "arrow.backward", withConfiguration: backConfig), for: .normal)
        backButton.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        backButton.translatesAutoresizingMaskIntoConstraints = false
        backButton.addTarget(self, action: #selector(handleBack), for: .touchUpInside)
        leftStack.addArrangedSubview(backButton)

        let headerStack = UIStackView()
        headerStack.axis = .vertical
        headerStack.spacing = 1
        headerStack.translatesAutoresizingMaskIntoConstraints = false
        leftStack.addArrangedSubview(headerStack)

        titleLabel.text = "Notifications"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        headerStack.addArrangedSubview(titleLabel)

        // Profile Avatar on Right
        avatarContainer.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        avatarContainer.layer.cornerRadius = 18
        avatarContainer.layer.masksToBounds = true
        avatarContainer.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.isUserInteractionEnabled = true
        avatarContainer.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapAvatar)))
        topBarContainer.addSubview(avatarContainer)

        let firstName = AuthService.shared.getFirstName()
        avatarInitialsLabel.text = firstName.isEmpty ? "U" : String(firstName.prefix(1)).uppercased()
        avatarInitialsLabel.textColor = .white
        avatarInitialsLabel.font = .systemFont(ofSize: 14, weight: .bold)
        avatarInitialsLabel.textAlignment = .center
        avatarInitialsLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarInitialsLabel)

        let divider = UIView()
        divider.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        divider.translatesAutoresizingMaskIntoConstraints = false
        topBar.addSubview(divider)

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

            leftStack.leadingAnchor.constraint(equalTo: topBarContainer.leadingAnchor),
            leftStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            backButton.widthAnchor.constraint(equalToConstant: 36),
            backButton.heightAnchor.constraint(equalToConstant: 36),

            avatarContainer.trailingAnchor.constraint(equalTo: topBarContainer.trailingAnchor),
            avatarContainer.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),
            avatarContainer.widthAnchor.constraint(equalToConstant: 36),
            avatarContainer.heightAnchor.constraint(equalToConstant: 36),

            avatarInitialsLabel.centerXAnchor.constraint(equalTo: avatarContainer.centerXAnchor),
            avatarInitialsLabel.centerYAnchor.constraint(equalTo: avatarContainer.centerYAnchor),

            divider.bottomAnchor.constraint(equalTo: topBar.bottomAnchor),
            divider.leadingAnchor.constraint(equalTo: topBar.leadingAnchor),
            divider.trailingAnchor.constraint(equalTo: topBar.trailingAnchor),
            divider.heightAnchor.constraint(equalToConstant: 1)
        ])
    }

    @objc private func didTapAvatar() {
        let settingsVC = SettingsViewController()
        if let nav = navigationController {
            nav.pushViewController(settingsVC, animated: true)
        } else {
            settingsVC.modalPresentationStyle = .fullScreen
            present(settingsVC, animated: true)
        }
    }

    private func setupTableView() {
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(NotificationItemCell.self, forCellReuseIdentifier: NotificationItemCell.identifier)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)

        let tableWidth = tableView.widthAnchor.constraint(equalTo: view.widthAnchor)
        tableWidth.priority = UILayoutPriority(999)
        tableWidth.isActive = true

        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(handleRefresh(_:)), for: .valueChanged)
        tableView.refreshControl = refreshControl

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor),
            tableView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            tableView.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    @objc private func handleRefresh(_ sender: UIRefreshControl) {
        loadNotifications()
        sender.endRefreshing()
    }

    private func setupEmptyState() {
        emptyStateView.translatesAutoresizingMaskIntoConstraints = false
        emptyStateView.isHidden = true
        view.addSubview(emptyStateView)

        let noRecordsLabel = UILabel()
        noRecordsLabel.text = "No Notifications Yet"
        noRecordsLabel.font = .systemFont(ofSize: 18, weight: .bold)
        noRecordsLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        noRecordsLabel.textAlignment = .center
        noRecordsLabel.translatesAutoresizingMaskIntoConstraints = false
        emptyStateView.addSubview(noRecordsLabel)

        let subLabel = UILabel()
        subLabel.text = "Shift updates and punch logs will appear here."
        subLabel.font = .systemFont(ofSize: 13, weight: .regular)
        subLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        subLabel.textAlignment = .center
        subLabel.translatesAutoresizingMaskIntoConstraints = false
        emptyStateView.addSubview(subLabel)

        NSLayoutConstraint.activate([
            emptyStateView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emptyStateView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            emptyStateView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            emptyStateView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),

            noRecordsLabel.topAnchor.constraint(equalTo: emptyStateView.topAnchor),
            noRecordsLabel.centerXAnchor.constraint(equalTo: emptyStateView.centerXAnchor),

            subLabel.topAnchor.constraint(equalTo: noRecordsLabel.bottomAnchor, constant: 6),
            subLabel.centerXAnchor.constraint(equalTo: emptyStateView.centerXAnchor),
            subLabel.bottomAnchor.constraint(equalTo: emptyStateView.bottomAnchor)
        ])
    }

    private func ordinalSuffix(for day: Int) -> String {
        switch day {
        case 11, 12, 13: return "th"
        default:
            switch day % 10 {
            case 1: return "st"
            case 2: return "nd"
            case 3: return "rd"
            default: return "th"
            }
        }
    }

    private func formatHeaderTitle(for dateKey: String) -> String {
        let keyFmt = DateFormatter()
        keyFmt.dateFormat = "yyyy-MM-dd"
        guard let date = keyFmt.date(from: dateKey) else {
            return dateKey
        }
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "EEEE"
        let monthFormatter = DateFormatter()
        monthFormatter.dateFormat = "MMMM"
        let day = Calendar.current.component(.day, from: date)
        let suffix = ordinalSuffix(for: day)
        let dayName = dayFormatter.string(from: date)
        let monthName = monthFormatter.string(from: date)
        return "\(dayName), \(day)\(suffix) \(monthName)"
    }

    private func buildSections(from rawItems: [[String: String]]) {
        // Enforce maximum 100 notifications allowed
        let cappedItems = Array(rawItems.prefix(100))

        let inFmt1 = DateFormatter()
        inFmt1.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let inFmt2 = DateFormatter()
        inFmt2.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        let keyFmt = DateFormatter()
        keyFmt.dateFormat = "yyyy-MM-dd"

        var sectionsMap: [String: [[String: String]]] = [:]
        var orderedDateKeys: [String] = []

        for item in cappedItems {
            let timeStr = item["timestamp"] ?? ""
            var itemDate: Date? = inFmt1.date(from: timeStr)
            if itemDate == nil {
                itemDate = inFmt2.date(from: timeStr)
            }
            let dateKey: String
            if let d = itemDate {
                dateKey = keyFmt.string(from: d)
            } else if timeStr.count >= 10 {
                dateKey = String(timeStr.prefix(10))
            } else {
                dateKey = keyFmt.string(from: Date())
            }

            if sectionsMap[dateKey] == nil {
                sectionsMap[dateKey] = []
                orderedDateKeys.append(dateKey)
            }
            sectionsMap[dateKey]?.append(item)
        }

        self.sections = orderedDateKeys.map { key in
            NotificationSection(
                dateKey: key,
                headerTitle: formatHeaderTitle(for: key),
                items: sectionsMap[key] ?? []
            )
        }
    }

    private func loadNotifications() {
        let localList = AuthService.shared.getLocalNotifications()
        buildSections(from: localList)

        if sections.isEmpty {
            tableView.isHidden = true
            emptyStateView.isHidden = false
        } else {
            tableView.isHidden = false
            emptyStateView.isHidden = true
            tableView.reloadData()
        }

        // Fetch remote unread notifications and sync
        AuthService.shared.getUnreadNotifications { [weak self] result in
            guard let self = self else { return }
            if case .success(let remoteItems) = result, !remoteItems.isEmpty {
                AppNotificationManager.shared.syncRemoteNotifications(remoteItems)
                let updatedList = AuthService.shared.getLocalNotifications()
                self.buildSections(from: updatedList)
                if !self.sections.isEmpty {
                    self.tableView.isHidden = false
                    self.emptyStateView.isHidden = true
                    self.tableView.reloadData()
                }
            }
        }
    }

    func numberOfSections(in tableView: UITableView) -> Int {
        return sections.count
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return sections[section].items.count
    }

    func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
        return 38
    }

    func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let headerView = UIView()
        headerView.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 0.96)

        let label = UILabel()
        label.text = sections[section].headerTitle
        label.font = .systemFont(ofSize: 13, weight: .bold)
        label.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        label.translatesAutoresizingMaskIntoConstraints = false
        headerView.addSubview(label)

        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 18),
            label.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -18),
            label.centerYAnchor.constraint(equalTo: headerView.centerYAnchor)
        ])

        return headerView
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: NotificationItemCell.identifier, for: indexPath) as? NotificationItemCell else {
            return UITableViewCell()
        }
        let item = sections[indexPath.section].items[indexPath.row]
        cell.configure(
            title: item["title"] ?? "Notification",
            body: item["body"] ?? "",
            timestamp: item["timestamp"] ?? ""
        )
        return cell
    }

    @objc private func handleBack() {
        if let nav = navigationController, nav.viewControllers.count > 1 {
            nav.popViewController(animated: true)
        } else if presentingViewController != nil {
            dismiss(animated: true, completion: nil)
        } else {
            let homeVC = HomeViewController()
            if let window = view.window ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow }) {
                UIView.transition(with: window, duration: 0.25, options: .transitionCrossDissolve, animations: {
                    window.rootViewController = homeVC
                }, completion: nil)
            } else {
                homeVC.modalPresentationStyle = .fullScreen
                present(homeVC, animated: true)
            }
        }
    }
}
