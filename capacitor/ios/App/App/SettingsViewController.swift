import UIKit

class SettingsViewController: UIViewController {

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let backButton = UIButton(type: .system)
    private let brandSubtitleLabel = UILabel()
    private let titleLabel = UILabel()
    private let notificationButton = UIButton(type: .system)
    private let notifBadgeDot = UIView()
    private let signOutTopButton = UIButton(type: .system)

    private let scrollView = UIScrollView()
    private let contentView = UIStackView()

    // Profile Card
    private let profileCard = UIView()
    private let avatarContainer = UIView()
    private let avatarImageView = UIImageView()
    private let avatarInitialsLabel = UILabel()
    private let profileNameLabel = UILabel()
    private let profileEmailLabel = UILabel()
    private let viewProfileButton = UIButton(type: .custom)

    private let companyNameLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        navigationController?.setNavigationBarHidden(true, animated: false)

        setupTopBar()
        setupScrollView()
        setupProfileCard()
        setupSettingsGroups()
        loadProfileData()

        NotificationCenter.default.addObserver(self, selector: #selector(handleNotificationBadgeChanged), name: AppNotificationManager.notificationBadgeChangedNotification, object: nil)
    }

    @objc private func handleNotificationBadgeChanged() {
        notifBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        notifBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
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

        titleLabel.text = "Settings"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        headerStack.addArrangedSubview(titleLabel)

        // Right stack: Sign Out Power Icon only (Notification bell completely removed as requested)
        let rightStack = UIStackView()
        rightStack.axis = .horizontal
        rightStack.spacing = 6
        rightStack.alignment = .center
        rightStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(rightStack)

        let powerConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .medium)
        signOutTopButton.setImage(UIImage(systemName: "power", withConfiguration: powerConfig), for: .normal)
        signOutTopButton.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        signOutTopButton.translatesAutoresizingMaskIntoConstraints = false
        signOutTopButton.addTarget(self, action: #selector(confirmSignOut), for: .touchUpInside)
        rightStack.addArrangedSubview(signOutTopButton)

        let divider = UIView()
        divider.backgroundColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
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

            rightStack.trailingAnchor.constraint(equalTo: topBarContainer.trailingAnchor),
            rightStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            signOutTopButton.widthAnchor.constraint(equalToConstant: 36),
            signOutTopButton.heightAnchor.constraint(equalToConstant: 36),

            divider.bottomAnchor.constraint(equalTo: topBar.bottomAnchor),
            divider.leadingAnchor.constraint(equalTo: topBar.leadingAnchor),
            divider.trailingAnchor.constraint(equalTo: topBar.trailingAnchor),
            divider.heightAnchor.constraint(equalToConstant: 1)
        ])
    }

    @objc private func handleNotifications() {
        AuthService.shared.markLocalNotificationsAsRead()
        notifBadgeDot.isHidden = true
        let notifVC = NotificationsViewController()
        if let nav = navigationController {
            nav.pushViewController(notifVC, animated: true)
        } else {
            notifVC.modalPresentationStyle = .fullScreen
            present(notifVC, animated: true)
        }
    }

    private func setupScrollView() {
        scrollView.showsVerticalScrollIndicator = false
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)

        contentView.axis = .vertical
        contentView.spacing = 12
        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)

        let contentWidth = contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -32)
        contentWidth.priority = UILayoutPriority(999)
        contentWidth.isActive = true

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: topBar.bottomAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 16),
            contentView.leadingAnchor.constraint(greaterThanOrEqualTo: scrollView.leadingAnchor, constant: 16),
            contentView.trailingAnchor.constraint(lessThanOrEqualTo: scrollView.trailingAnchor, constant: -16),
            contentView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor),
            contentView.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -32)
        ])
    }

    // MARK: - Profile Card
    private func setupProfileCard() {
        profileCard.backgroundColor = .white
        profileCard.layer.cornerRadius = 24
        profileCard.layer.borderWidth = 1
        profileCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        profileCard.layer.shadowColor = UIColor.black.cgColor
        profileCard.layer.shadowOpacity = 0.03
        profileCard.layer.shadowOffset = CGSize(width: 0, height: 2)
        profileCard.layer.shadowRadius = 6
        profileCard.translatesAutoresizingMaskIntoConstraints = false
        contentView.addArrangedSubview(profileCard)

        avatarContainer.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        avatarContainer.layer.cornerRadius = 28
        avatarContainer.layer.masksToBounds = true
        avatarContainer.translatesAutoresizingMaskIntoConstraints = false
        profileCard.addSubview(avatarContainer)

        avatarImageView.contentMode = .scaleAspectFill
        avatarImageView.isHidden = true
        avatarImageView.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarImageView)

        avatarInitialsLabel.textColor = .white
        avatarInitialsLabel.font = .systemFont(ofSize: 22, weight: .bold)
        avatarInitialsLabel.textAlignment = .center
        avatarInitialsLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarInitialsLabel)

        let rightColumn = UIStackView()
        rightColumn.axis = .vertical
        rightColumn.alignment = .leading
        rightColumn.spacing = 3
        rightColumn.translatesAutoresizingMaskIntoConstraints = false
        profileCard.addSubview(rightColumn)

        profileNameLabel.font = .systemFont(ofSize: 20, weight: .bold)
        profileNameLabel.textColor = .black
        rightColumn.addArrangedSubview(profileNameLabel)

        profileEmailLabel.font = .systemFont(ofSize: 15, weight: .regular)
        profileEmailLabel.textColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        rightColumn.addArrangedSubview(profileEmailLabel)

        viewProfileButton.setTitle("View Profile", for: .normal)
        viewProfileButton.setTitleColor(.white, for: .normal)
        viewProfileButton.titleLabel?.font = .systemFont(ofSize: 13, weight: .semibold)
        viewProfileButton.backgroundColor = .black
        viewProfileButton.layer.cornerRadius = 18
        viewProfileButton.contentEdgeInsets = UIEdgeInsets(top: 8, left: 20, bottom: 8, right: 20)
        viewProfileButton.translatesAutoresizingMaskIntoConstraints = false

        let spacer = UIView()
        spacer.translatesAutoresizingMaskIntoConstraints = false
        spacer.heightAnchor.constraint(equalToConstant: 8).isActive = true
        rightColumn.addArrangedSubview(spacer)
        rightColumn.addArrangedSubview(viewProfileButton)

        NSLayoutConstraint.activate([
            avatarContainer.leadingAnchor.constraint(equalTo: profileCard.leadingAnchor, constant: 20),
            avatarContainer.topAnchor.constraint(equalTo: profileCard.topAnchor, constant: 20),
            avatarContainer.widthAnchor.constraint(equalToConstant: 56),
            avatarContainer.heightAnchor.constraint(equalToConstant: 56),

            avatarImageView.topAnchor.constraint(equalTo: avatarContainer.topAnchor),
            avatarImageView.bottomAnchor.constraint(equalTo: avatarContainer.bottomAnchor),
            avatarImageView.leadingAnchor.constraint(equalTo: avatarContainer.leadingAnchor),
            avatarImageView.trailingAnchor.constraint(equalTo: avatarContainer.trailingAnchor),

            avatarInitialsLabel.centerXAnchor.constraint(equalTo: avatarContainer.centerXAnchor),
            avatarInitialsLabel.centerYAnchor.constraint(equalTo: avatarContainer.centerYAnchor),

            rightColumn.leadingAnchor.constraint(equalTo: avatarContainer.trailingAnchor, constant: 16),
            rightColumn.topAnchor.constraint(equalTo: profileCard.topAnchor, constant: 20),
            rightColumn.trailingAnchor.constraint(equalTo: profileCard.trailingAnchor, constant: -20),
            rightColumn.bottomAnchor.constraint(equalTo: profileCard.bottomAnchor, constant: -20)
        ])
    }

    // MARK: - Settings Groups
    private func setupSettingsGroups() {
        // 1. Organization
        let orgCard = makeCardView()
        let orgHeader = makeRow(icon: "building.2.fill", title: "Organization")
        companyNameLabel.text = "GlobizHub"
        companyNameLabel.font = .systemFont(ofSize: 13, weight: .bold)
        companyNameLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)

        let chevronDown = UIImageView(image: UIImage(systemName: "chevron.down"))
        chevronDown.tintColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        chevronDown.contentMode = .scaleAspectFit

        let orgRightStack = UIStackView(arrangedSubviews: [companyNameLabel, chevronDown])
        orgRightStack.spacing = 4
        orgRightStack.alignment = .center
        orgRightStack.translatesAutoresizingMaskIntoConstraints = false
        orgHeader.addSubview(orgRightStack)
        NSLayoutConstraint.activate([
            orgRightStack.trailingAnchor.constraint(equalTo: orgHeader.trailingAnchor),
            orgRightStack.centerYAnchor.constraint(equalTo: orgHeader.centerYAnchor),
            chevronDown.widthAnchor.constraint(equalToConstant: 14),
            chevronDown.heightAnchor.constraint(equalToConstant: 14)
        ])
        orgCard.addArrangedSubview(orgHeader)
        contentView.addArrangedSubview(orgCard)

        // 2. Attendance
        let attCard = makeCardView()
        attCard.addArrangedSubview(makeRow(icon: "clock.fill", title: "Attendance"))
        attCard.addArrangedSubview(makeDivider())
        attCard.addArrangedSubview(makeSwitchRow(title: "Check-in/Check-out Confirmation", key: "pref_attendance_confirm", defaultValue: true))
        attCard.addArrangedSubview(makeDivider())
        attCard.addArrangedSubview(makeSwitchRow(title: "Check-in Notes", key: "pref_attendance_notes", defaultValue: false))
        contentView.addArrangedSubview(attCard)

        // 3. Theme
        let themeCard = makeCardView()
        let themeRow = makeRow(icon: "paintbrush.fill", title: "Theme")
        let themeLabel = UILabel()
        themeLabel.text = "System Default"
        themeLabel.font = .systemFont(ofSize: 13, weight: .regular)
        themeLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        let themeChevron = makeChevron()
        let themeRight = UIStackView(arrangedSubviews: [themeLabel, themeChevron])
        themeRight.spacing = 4
        themeRight.alignment = .center
        themeRight.translatesAutoresizingMaskIntoConstraints = false
        themeRow.addSubview(themeRight)
        NSLayoutConstraint.activate([
            themeRight.trailingAnchor.constraint(equalTo: themeRow.trailingAnchor),
            themeRight.centerYAnchor.constraint(equalTo: themeRow.centerYAnchor)
        ])
        themeCard.addArrangedSubview(themeRow)
        contentView.addArrangedSubview(themeCard)

        // 4. Language
        let langCard = makeCardView()
        let langRow = makeRow(icon: "globe", title: "Language")
        let langLabel = UILabel()
        langLabel.text = "English"
        langLabel.font = .systemFont(ofSize: 13, weight: .regular)
        langLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        let langChevron = makeChevron()
        let langRight = UIStackView(arrangedSubviews: [langLabel, langChevron])
        langRight.spacing = 4
        langRight.alignment = .center
        langRight.translatesAutoresizingMaskIntoConstraints = false
        langRow.addSubview(langRight)
        NSLayoutConstraint.activate([
            langRight.trailingAnchor.constraint(equalTo: langRow.trailingAnchor),
            langRight.centerYAnchor.constraint(equalTo: langRow.centerYAnchor)
        ])
        langCard.addArrangedSubview(langRow)
        contentView.addArrangedSubview(langCard)

        // 5. Location Settings
        let locCard = makeCardView()
        locCard.addArrangedSubview(makeRow(icon: "location.fill", title: "Location Settings"))
        locCard.addArrangedSubview(makeDivider())
        locCard.addArrangedSubview(makeSwitchRow(title: "Improve Location Accuracy", key: "pref_location_accuracy", defaultValue: false))
        contentView.addArrangedSubview(locCard)

        // 6. Privacy & Security
        let privCard = makeCardView()
        privCard.addArrangedSubview(makeRow(icon: "shield.fill", title: "Privacy & Security"))
        privCard.addArrangedSubview(makeDivider())
        privCard.addArrangedSubview(makeNavRow(title: "App Lock"))
        privCard.addArrangedSubview(makeDivider())
        privCard.addArrangedSubview(makeNavRow(title: "Privacy Preferences"))
        privCard.addArrangedSubview(makeDivider())
        privCard.addArrangedSubview(makeNavRow(title: "Privacy Policy"))
        privCard.addArrangedSubview(makeDivider())
        privCard.addArrangedSubview(makeNavRow(title: "Terms of Service"))
        contentView.addArrangedSubview(privCard)

        // 7. About
        let aboutCard = makeCardView()
        aboutCard.addArrangedSubview(makeRow(icon: "info.circle.fill", title: "About"))
        aboutCard.addArrangedSubview(makeDivider())

        let versionStr = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let versionRow = makeSimpleTextRow(title: "Version", rightText: versionStr)
        aboutCard.addArrangedSubview(versionRow)
        aboutCard.addArrangedSubview(makeDivider())
        aboutCard.addArrangedSubview(makeNavRow(title: "Take A Tour"))
        aboutCard.addArrangedSubview(makeDivider())
        aboutCard.addArrangedSubview(makeNavRow(title: "Rate Us"))
        aboutCard.addArrangedSubview(makeDivider())
        aboutCard.addArrangedSubview(makeNavRow(title: "App Issues & Feedback"))
        contentView.addArrangedSubview(aboutCard)

        // 8. Others
        let othersCard = makeCardView()
        othersCard.addArrangedSubview(makeRow(icon: "gearshape.fill", title: "Others"))
        othersCard.addArrangedSubview(makeDivider())
        othersCard.addArrangedSubview(makeNavRow(title: "Refresh", action: #selector(handleRefresh)))
        othersCard.addArrangedSubview(makeDivider())
        othersCard.addArrangedSubview(makeSwitchRow(title: "Push Notification", key: "pref_push_notification", defaultValue: true))
        othersCard.addArrangedSubview(makeDivider())
        othersCard.addArrangedSubview(makeNavRow(title: "Manage Account", action: #selector(handleManageAccount)))
        othersCard.addArrangedSubview(makeDivider())

        // Sign Out Row
        let signOutRow = UIView()
        signOutRow.translatesAutoresizingMaskIntoConstraints = false
        signOutRow.isUserInteractionEnabled = true
        signOutRow.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(confirmSignOut)))

        let signOutLabel = UILabel()
        signOutLabel.text = "Sign Out"
        signOutLabel.font = .systemFont(ofSize: 14, weight: .bold)
        signOutLabel.textColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        signOutLabel.translatesAutoresizingMaskIntoConstraints = false
        signOutRow.addSubview(signOutLabel)

        NSLayoutConstraint.activate([
            signOutRow.heightAnchor.constraint(equalToConstant: 36),
            signOutLabel.leadingAnchor.constraint(equalTo: signOutRow.leadingAnchor),
            signOutLabel.centerYAnchor.constraint(equalTo: signOutRow.centerYAnchor)
        ])
        othersCard.addArrangedSubview(signOutRow)
        contentView.addArrangedSubview(othersCard)
    }

    private func makeCardView() -> UIStackView {
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 10
        stack.backgroundColor = .white
        stack.layer.cornerRadius = 14
        stack.layer.borderWidth = 1
        stack.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 14, left: 16, bottom: 14, right: 16)
        return stack
    }

    private func makeRow(icon: String, title: String) -> UIView {
        let row = UIView()
        row.translatesAutoresizingMaskIntoConstraints = false

        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .medium)
        let iconView = UIImageView(image: UIImage(systemName: icon, withConfiguration: config))
        iconView.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        iconView.contentMode = .scaleAspectFit
        iconView.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(iconView)

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 15, weight: .bold)
        label.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        label.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(label)

        NSLayoutConstraint.activate([
            row.heightAnchor.constraint(equalToConstant: 28),
            iconView.leadingAnchor.constraint(equalTo: row.leadingAnchor),
            iconView.centerYAnchor.constraint(equalTo: row.centerYAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 22),
            iconView.heightAnchor.constraint(equalToConstant: 22),

            label.leadingAnchor.constraint(equalTo: iconView.trailingAnchor, constant: 12),
            label.centerYAnchor.constraint(equalTo: row.centerYAnchor)
        ])
        return row
    }

    private func makeSwitchRow(title: String, key: String, defaultValue: Bool) -> UIView {
        let row = UIView()
        row.translatesAutoresizingMaskIntoConstraints = false

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 13, weight: .regular)
        label.textColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
        label.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(label)

        let sw = UISwitch()
        let savedVal = UserDefaults.standard.object(forKey: key) as? Bool ?? defaultValue
        sw.isOn = savedVal
        sw.onTintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        sw.accessibilityIdentifier = key
        sw.addTarget(self, action: #selector(handleSwitchToggled(_:)), for: .valueChanged)
        sw.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(sw)

        NSLayoutConstraint.activate([
            row.heightAnchor.constraint(equalToConstant: 34),
            label.leadingAnchor.constraint(equalTo: row.leadingAnchor),
            label.centerYAnchor.constraint(equalTo: row.centerYAnchor),

            sw.trailingAnchor.constraint(equalTo: row.trailingAnchor),
            sw.centerYAnchor.constraint(equalTo: row.centerYAnchor)
        ])
        return row
    }

    @objc private func handleSwitchToggled(_ sender: UISwitch) {
        if let key = sender.accessibilityIdentifier {
            UserDefaults.standard.set(sender.isOn, forKey: key)
            UserDefaults.standard.synchronize()
            if key == "pref_push_notification" {
                AppNotificationManager.shared.setPushNotificationEnabled(sender.isOn)
            }
        }
        let feedback = UISelectionFeedbackGenerator()
        feedback.selectionChanged()
    }

    private func makeNavRow(title: String, action: Selector? = nil) -> UIView {
        let row = UIView()
        row.translatesAutoresizingMaskIntoConstraints = false
        if let action = action {
            row.isUserInteractionEnabled = true
            row.addGestureRecognizer(UITapGestureRecognizer(target: self, action: action))
        }

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 13, weight: .regular)
        label.textColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
        label.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(label)

        let chevron = makeChevron()
        row.addSubview(chevron)

        NSLayoutConstraint.activate([
            row.heightAnchor.constraint(equalToConstant: 32),
            label.leadingAnchor.constraint(equalTo: row.leadingAnchor),
            label.centerYAnchor.constraint(equalTo: row.centerYAnchor),

            chevron.trailingAnchor.constraint(equalTo: row.trailingAnchor),
            chevron.centerYAnchor.constraint(equalTo: row.centerYAnchor)
        ])
        return row
    }

    private func makeSimpleTextRow(title: String, rightText: String) -> UIView {
        let row = UIView()
        row.translatesAutoresizingMaskIntoConstraints = false

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 13, weight: .regular)
        label.textColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
        label.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(label)

        let right = UILabel()
        right.text = rightText
        right.font = .systemFont(ofSize: 13, weight: .regular)
        right.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        right.translatesAutoresizingMaskIntoConstraints = false
        row.addSubview(right)

        NSLayoutConstraint.activate([
            row.heightAnchor.constraint(equalToConstant: 32),
            label.leadingAnchor.constraint(equalTo: row.leadingAnchor),
            label.centerYAnchor.constraint(equalTo: row.centerYAnchor),

            right.trailingAnchor.constraint(equalTo: row.trailingAnchor),
            right.centerYAnchor.constraint(equalTo: row.centerYAnchor)
        ])
        return row
    }

    private func makeDivider() -> UIView {
        let divider = UIView()
        divider.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        divider.translatesAutoresizingMaskIntoConstraints = false
        divider.heightAnchor.constraint(equalToConstant: 1).isActive = true
        return divider
    }

    private func makeChevron() -> UIImageView {
        let chevron = UIImageView(image: UIImage(systemName: "chevron.right"))
        chevron.tintColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        chevron.contentMode = .scaleAspectFit
        chevron.translatesAutoresizingMaskIntoConstraints = false
        chevron.widthAnchor.constraint(equalToConstant: 14).isActive = true
        chevron.heightAnchor.constraint(equalToConstant: 14).isActive = true
        return chevron
    }

    // MARK: - Actions
    @objc private func handleBack() {
        dismiss(animated: true)
    }

    @objc private func handleManageAccount() {
        let deleteVC = DeleteAccountViewController()
        deleteVC.modalPresentationStyle = .fullScreen
        present(deleteVC, animated: true)
    }

    @objc private func handleRefresh() {
        loadProfileData()
        let alert = UIAlertController(title: "Settings", message: "Refreshed successfully.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    @objc private func confirmSignOut() {
        let alert = UIAlertController(title: "Sign Out", message: "Are you sure you want to sign out?", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Sign Out", style: .destructive, handler: { [weak self] _ in
            self?.executeSignOut()
        }))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func executeSignOut() {
        AuthService.shared.clearAuth()
        let signInVC = SignInViewController()
        let nav = UINavigationController(rootViewController: signInVC)
        nav.modalPresentationStyle = .fullScreen

        if let window = view.window {
            window.rootViewController = nav
            UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve, animations: nil)
        } else {
            present(nav, animated: true)
        }
    }

    // MARK: - Data Loading
    private func loadProfileData() {
        let savedEmail = AuthService.shared.getEmail()
        profileEmailLabel.text = savedEmail
        let fallbackInitial = savedEmail.isEmpty ? "U" : String(savedEmail.prefix(1)).uppercased()
        avatarInitialsLabel.text = fallbackInitial

        AuthService.shared.getProfile { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let user):
                let firstName = user["firstName"] as? String ?? ""
                let lastName = user["lastName"] as? String ?? ""
                let email = user["email"] as? String ?? savedEmail
                let photoUrl = user["profilePhoto"] as? String ?? ""

                var fullName = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
                if fullName.isEmpty {
                    fullName = email.contains("@") ? String(email.prefix(upTo: email.firstIndex(of: "@")!)) : "Team Member"
                }
                self.profileNameLabel.text = fullName
                self.profileEmailLabel.text = email

                if !firstName.isEmpty {
                    self.avatarInitialsLabel.text = String(firstName.prefix(1)).uppercased()
                }

                if !photoUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.loadAvatarImage(urlStr: photoUrl)
                } else {
                    self.avatarImageView.isHidden = true
                    self.avatarInitialsLabel.isHidden = false
                }

                var resolvedOrg = "GlobizHub"
                if let company = user["company"] as? [String: Any], let cName = company["name"] as? String, !cName.isEmpty {
                    resolvedOrg = cName
                } else if let cName = user["companyName"] as? String, !cName.isEmpty {
                    resolvedOrg = cName
                } else if let org = user["organization"] as? [String: Any], let oName = org["name"] as? String, !oName.isEmpty {
                    resolvedOrg = oName
                } else if let oName = user["organization"] as? String, !oName.isEmpty {
                    resolvedOrg = oName
                } else if let oName = user["organizationName"] as? String, !oName.isEmpty {
                    resolvedOrg = oName
                }
                self.companyNameLabel.text = resolvedOrg
            case .failure:
                break
            }
        }
    }

    private func loadAvatarImage(urlStr: String) {
        guard let url = URL(string: urlStr) else { return }
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            if let data = data, let img = UIImage(data: data) {
                DispatchQueue.main.async {
                    self?.avatarImageView.image = img
                    self?.avatarImageView.isHidden = false
                    self?.avatarInitialsLabel.isHidden = true
                }
            }
        }.resume()
    }
}
