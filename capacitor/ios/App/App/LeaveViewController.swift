import UIKit

class LeaveViewController: UIViewController {

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
        setupBalancesCard()
        setupRecentLeavesCard()
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

        topBarTitleLabel.text = "Leaves"
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

    // MARK: - Leave Balances Card
    private func setupBalancesCard() {
        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 20
        card.layer.borderWidth = 1
        card.layer.borderColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0).cgColor
        card.translatesAutoresizingMaskIntoConstraints = false
        contentStackView.addArrangedSubview(card)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)

        let headerRow = UIStackView()
        headerRow.axis = .horizontal
        headerRow.distribution = .equalSpacing

        let titleLabel = UILabel()
        titleLabel.text = "Leave Balances"
        titleLabel.font = .systemFont(ofSize: 17, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        headerRow.addArrangedSubview(titleLabel)

        let yearLabel = UILabel()
        yearLabel.text = "Year 2026"
        yearLabel.font = .systemFont(ofSize: 12, weight: .bold)
        yearLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        headerRow.addArrangedSubview(yearLabel)
        stack.addArrangedSubview(headerRow)

        // 3 Pillars Row
        let pillarsStack = UIStackView()
        pillarsStack.axis = .horizontal
        pillarsStack.distribution = .fillEqually
        pillarsStack.spacing = 10

        pillarsStack.addArrangedSubview(makeBalancePillar(title: "Casual", count: "10 / 12", color: UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)))
        pillarsStack.addArrangedSubview(makeBalancePillar(title: "Sick", count: "6 / 7", color: UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)))
        pillarsStack.addArrangedSubview(makeBalancePillar(title: "Earned", count: "15 / 18", color: UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0)))
        stack.addArrangedSubview(pillarsStack)

        // Apply Button
        let applyBtn = UIButton(type: .system)
        applyBtn.setTitle("+ Apply for Leave", for: .normal)
        applyBtn.titleLabel?.font = .systemFont(ofSize: 15, weight: .bold)
        applyBtn.setTitleColor(.white, for: .normal)
        applyBtn.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        applyBtn.layer.cornerRadius = 14
        applyBtn.heightAnchor.constraint(equalToConstant: 48).isActive = true
        applyBtn.addTarget(self, action: #selector(didTapApplyLeave), for: .touchUpInside)
        stack.addArrangedSubview(applyBtn)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -18)
        ])
    }

    private func makeBalancePillar(title: String, count: String, color: UIColor) -> UIView {
        let pill = UIView()
        pill.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        pill.layer.cornerRadius = 14
        pill.layer.borderWidth = 1
        pill.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor

        let vStack = UIStackView()
        vStack.axis = .vertical
        vStack.alignment = .center
        vStack.spacing = 4
        vStack.translatesAutoresizingMaskIntoConstraints = false
        pill.addSubview(vStack)

        let tLbl = UILabel()
        tLbl.text = title
        tLbl.font = .systemFont(ofSize: 12, weight: .bold)
        tLbl.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        vStack.addArrangedSubview(tLbl)

        let cLbl = UILabel()
        cLbl.text = count
        cLbl.font = .systemFont(ofSize: 18, weight: .bold)
        cLbl.textColor = color
        vStack.addArrangedSubview(cLbl)

        let subLbl = UILabel()
        subLbl.text = "days left"
        subLbl.font = .systemFont(ofSize: 10, weight: .regular)
        subLbl.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        vStack.addArrangedSubview(subLbl)

        NSLayoutConstraint.activate([
            vStack.topAnchor.constraint(equalTo: pill.topAnchor, constant: 12),
            vStack.leadingAnchor.constraint(equalTo: pill.leadingAnchor, constant: 8),
            vStack.trailingAnchor.constraint(equalTo: pill.trailingAnchor, constant: -8),
            vStack.bottomAnchor.constraint(equalTo: pill.bottomAnchor, constant: -12)
        ])
        return pill
    }

    // MARK: - Recent Leaves Card
    private func setupRecentLeavesCard() {
        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 20
        card.layer.borderWidth = 1
        card.layer.borderColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0).cgColor
        card.translatesAutoresizingMaskIntoConstraints = false
        contentStackView.addArrangedSubview(card)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)

        let titleLabel = UILabel()
        titleLabel.text = "Recent Applications"
        titleLabel.font = .systemFont(ofSize: 17, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        stack.addArrangedSubview(titleLabel)

        let items = [
            ("Casual Leave • 1 Day", "Approved", "Oct 15, 2026 • Family Function", UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)),
            ("Sick Leave • 2 Days", "Approved", "Sep 28 - Sep 29, 2026 • Medical Checkup", UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)),
            ("Earned Leave • 3 Days", "Pending", "Nov 12 - Nov 14, 2026 • Vacation", UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0))
        ]

        for item in items {
            stack.addArrangedSubview(makeRecentLeaveRow(title: item.0, status: item.1, sub: item.2, badgeColor: item.3))
        }

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -18)
        ])
    }

    private func makeRecentLeaveRow(title: String, status: String, sub: String, badgeColor: UIColor) -> UIView {
        let box = UIView()
        box.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        box.layer.cornerRadius = 14
        box.layer.borderWidth = 1
        box.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor

        let vStack = UIStackView()
        vStack.axis = .vertical
        vStack.spacing = 4
        vStack.translatesAutoresizingMaskIntoConstraints = false
        box.addSubview(vStack)

        let topRow = UIStackView()
        topRow.axis = .horizontal
        topRow.distribution = .equalSpacing

        let tLbl = UILabel()
        tLbl.text = title
        tLbl.font = .systemFont(ofSize: 14, weight: .bold)
        tLbl.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        topRow.addArrangedSubview(tLbl)

        let bLbl = UILabel()
        bLbl.text = "  \(status)  "
        bLbl.font = .systemFont(ofSize: 11, weight: .bold)
        bLbl.textColor = badgeColor
        bLbl.backgroundColor = badgeColor.withAlphaComponent(0.12)
        bLbl.layer.cornerRadius = 6
        bLbl.layer.masksToBounds = true
        topRow.addArrangedSubview(bLbl)
        vStack.addArrangedSubview(topRow)

        let sLbl = UILabel()
        sLbl.text = sub
        sLbl.font = .systemFont(ofSize: 12, weight: .regular)
        sLbl.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        vStack.addArrangedSubview(sLbl)

        NSLayoutConstraint.activate([
            vStack.topAnchor.constraint(equalTo: box.topAnchor, constant: 12),
            vStack.leadingAnchor.constraint(equalTo: box.leadingAnchor, constant: 14),
            vStack.trailingAnchor.constraint(equalTo: box.trailingAnchor, constant: -14),
            vStack.bottomAnchor.constraint(equalTo: box.bottomAnchor, constant: -12)
        ])
        return box
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
            ("calendar", "Leave", true),
            ("checkmark.square", "Tasks", false),
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
            scrollView.setContentOffset(.zero, animated: true)
        case 3:
            let tasksVC = TasksViewController()
            tasksVC.modalPresentationStyle = .fullScreen
            present(tasksVC, animated: false)
        case 4:
            let moreVC = MoreViewController()
            moreVC.modalPresentationStyle = .fullScreen
            present(moreVC, animated: false)
        default:
            break
        }
    }

    @objc private func didTapApplyLeave() {
        let alert = UIAlertController(title: "Apply for Leave", message: "Select leave category:", preferredStyle: .actionSheet)
        alert.addAction(UIAlertAction(title: "Casual Leave (10 days left)", style: .default, handler: { _ in
            self.showSuccessAlert()
        }))
        alert.addAction(UIAlertAction(title: "Sick Leave (6 days left)", style: .default, handler: { _ in
            self.showSuccessAlert()
        }))
        alert.addAction(UIAlertAction(title: "Earned Leave (15 days left)", style: .default, handler: { _ in
            self.showSuccessAlert()
        }))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        present(alert, animated: true)
    }

    private func showSuccessAlert() {
        let ok = UIAlertController(title: "Request Submitted", message: "Your leave application has been sent to your manager for approval.", preferredStyle: .alert)
        ok.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(ok, animated: true)
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
