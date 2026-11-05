import UIKit

class TasksViewController: UIViewController {

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let topBarTitleLabel = UILabel()
    private let notificationBellButton = UIButton(type: .custom)
    private let notificationBadgeDot = UIView()
    private let avatarContainer = UIView()
    private let avatarInitialsLabel = UILabel()

    private let scrollView = UIScrollView()
    private let contentView = UIView()
    private let contentStackView = UIStackView()

    private let bottomNavBar = UIView()
    private let bottomNavContainer = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        navigationController?.setNavigationBarHidden(true, animated: false)

        setupTopBar()
        setupScrollView()
        setupOverviewHeader()
        setupTasksList()
        setupBottomNavBar()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateHeaderState()
    }

    private func updateHeaderState() {
        notificationBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
        let name = AuthService.shared.getFirstName()
        avatarInitialsLabel.text = name.isEmpty ? "U" : String(name.prefix(1)).uppercased()
    }

    // MARK: - Top Bar
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

        topBarTitleLabel.text = "Tasks"
        topBarTitleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        topBarTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        brandHeaderStack.addArrangedSubview(topBarTitleLabel)

        let rightActionsStack = UIStackView()
        rightActionsStack.axis = .horizontal
        rightActionsStack.spacing = 12
        rightActionsStack.alignment = .center
        rightActionsStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(rightActionsStack)

        // Notification Bell
        let bellConfig = UIImage.SymbolConfiguration(pointSize: 19, weight: .regular)
        notificationBellButton.setImage(UIImage(systemName: "bell", withConfiguration: bellConfig), for: .normal)
        notificationBellButton.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        notificationBellButton.addTarget(self, action: #selector(didTapNotificationBell), for: .touchUpInside)
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

    // MARK: - Scroll View
    private func setupScrollView() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsVerticalScrollIndicator = false
        view.addSubview(scrollView)

        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)

        contentStackView.axis = .vertical
        contentStackView.spacing = 16
        contentStackView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(contentStackView)

        let contentWidthConstraint = contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -32)
        contentWidthConstraint.priority = UILayoutPriority(999)
        contentWidthConstraint.isActive = true

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: topBar.bottomAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -64),

            contentView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor, constant: 16),
            contentView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor, constant: -24),
            contentView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor),
            contentView.widthAnchor.constraint(lessThanOrEqualToConstant: 680),

            contentStackView.topAnchor.constraint(equalTo: contentView.topAnchor),
            contentStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            contentStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            contentStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])
    }

    // MARK: - Header & Add Action
    private func setupOverviewHeader() {
        let container = UIStackView()
        container.axis = .horizontal
        container.distribution = .equalSpacing
        container.alignment = .center

        let textStack = UIStackView()
        textStack.axis = .vertical
        textStack.spacing = 2

        let titleLabel = UILabel()
        titleLabel.text = "Tasks Due Today"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        textStack.addArrangedSubview(titleLabel)

        let subLabel = UILabel()
        subLabel.text = "3 pending items requiring action"
        subLabel.font = .systemFont(ofSize: 13, weight: .regular)
        subLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        textStack.addArrangedSubview(subLabel)
        container.addArrangedSubview(textStack)

        let addBtn = UIButton(type: .system)
        addBtn.setTitle("+ Add Task", for: .normal)
        addBtn.titleLabel?.font = .systemFont(ofSize: 13, weight: .bold)
        addBtn.setTitleColor(.white, for: .normal)
        addBtn.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        addBtn.layer.cornerRadius = 10
        addBtn.contentEdgeInsets = UIEdgeInsets(top: 8, left: 14, bottom: 8, right: 14)
        addBtn.addTarget(self, action: #selector(didTapAddTask), for: .touchUpInside)
        container.addArrangedSubview(addBtn)

        contentStackView.addArrangedSubview(container)
    }

    // MARK: - Tasks List
    private func setupTasksList() {
        let tasks = [
            ("Review Q4 HR Payroll Reports", "Verify employee overtime approvals and deductions before salary disbursement.", "High Priority", "Due today at 05:00 PM • HR Dept", UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0), false),
            ("Conduct 1-on-1 Performance Sync", "Bi-weekly review discussion for design system alignment and milestones.", "Medium", "Due today at 02:30 PM • Team Room 3", UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0), false),
            ("Update Biometric Geofence Guidelines", "Finalize updated office radius coordinates in capacitor config.", "Completed", "Completed at 11:20 AM", UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0), true)
        ]

        for task in tasks {
            contentStackView.addArrangedSubview(makeTaskCard(title: task.0, desc: task.1, priority: task.2, due: task.3, tagColor: task.4, isCompleted: task.5))
        }
    }

    private func makeTaskCard(title: String, desc: String, priority: String, due: String, tagColor: UIColor, isCompleted: Bool) -> UIView {
        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 18
        card.layer.borderWidth = 1
        card.layer.borderColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0).cgColor

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)

        let topRow = UIStackView()
        topRow.axis = .horizontal
        topRow.distribution = .equalSpacing

        let tLbl = UILabel()
        tLbl.text = title
        tLbl.font = .systemFont(ofSize: 15, weight: .bold)
        tLbl.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        topRow.addArrangedSubview(tLbl)

        let tagLbl = UILabel()
        tagLbl.text = "  \(priority)  "
        tagLbl.font = .systemFont(ofSize: 11, weight: .bold)
        tagLbl.textColor = tagColor
        tagLbl.backgroundColor = tagColor.withAlphaComponent(0.12)
        tagLbl.layer.cornerRadius = 6
        tagLbl.layer.masksToBounds = true
        topRow.addArrangedSubview(tagLbl)
        stack.addArrangedSubview(topRow)

        let dLbl = UILabel()
        dLbl.text = desc
        dLbl.font = .systemFont(ofSize: 13, weight: .regular)
        dLbl.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        dLbl.numberOfLines = 0
        stack.addArrangedSubview(dLbl)

        let dueLbl = UILabel()
        dueLbl.text = due
        dueLbl.font = .systemFont(ofSize: 12, weight: .semibold)
        dueLbl.textColor = isCompleted ? UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0) : UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        stack.addArrangedSubview(dueLbl)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 16),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -16)
        ])
        return card
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
            ("checkmark.square.fill", "Tasks", true),
            ("ellipsis", "More", false)
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
            scrollView.setContentOffset(.zero, animated: true)
        case 4:
            let moreVC = MoreViewController()
            moreVC.modalPresentationStyle = .fullScreen
            present(moreVC, animated: false)
        default:
            break
        }
    }

    @objc private func didTapAddTask() {
        let alert = UIAlertController(title: "New Task", message: "Enter task title:", preferredStyle: .alert)
        alert.addTextField { tf in
            tf.placeholder = "e.g. Prepare client onboarding checklist"
        }
        alert.addAction(UIAlertAction(title: "Create", style: .default, handler: { _ in
            let ok = UIAlertController(title: "Task Created", message: "Task has been added to your board.", preferredStyle: .alert)
            ok.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
            self.present(ok, animated: true)
        }))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        present(alert, animated: true)
    }

    @objc private func didTapNotificationBell() {
        AuthService.shared.markLocalNotificationsAsRead()
        notificationBadgeDot.isHidden = true
        let notifVC = NotificationsViewController()
        notifVC.modalPresentationStyle = .fullScreen
        present(notifVC, animated: true)
    }

    @objc private func didTapAvatar() {
        let settingsVC = SettingsViewController()
        settingsVC.modalPresentationStyle = .fullScreen
        present(settingsVC, animated: true)
    }
}
