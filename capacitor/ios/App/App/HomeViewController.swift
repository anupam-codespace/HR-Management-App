import UIKit
import UserNotifications
import AVFoundation

class HomeViewController: UIViewController {

    // MARK: - UI Elements

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let headerTextStack = UIStackView()
    private let brandSubtitleLabel = UILabel()
    private let screenTitleLabel = UILabel()

    private let notificationButton = UIButton(type: .system)
    private let notifBadgeDot = UIView()
    private let avatarContainer = UIView()
    private let avatarImageView = UIImageView()
    private let avatarInitialsLabel = UILabel()

    private let scrollView = UIScrollView()
    private let contentView = UIView()
    private let cardsStackView = UIStackView()

    // 1. Employee Portal Hero Card
    private let heroCard = GradientCardView()
    private let heroBadgeLabel = UILabel()
    private let heroGreetingLabel = UILabel()
    private let heroSubRoleLabel = UILabel()
    private let shiftStrip = UIView()
    private let shiftClockIcon = UIImageView()
    private let shiftTimeLabel = UILabel()
    private let shiftOnTrackBadge = UIView()
    private let shiftOnTrackLabel = UILabel()

    // 2. Active Shift Timer Card
    private let timerCard = UIView()
    private let timerSectionTitle = UILabel()
    private let liveTimerLabel = UILabel()
    private let punchStatusLabel = UILabel()
    private let breakTimerLabel = UILabel()

    private let punchGlowRing = UIView()
    private let punchCircleButton = UIButton(type: .custom)
    private let punchIconView = UIImageView()
    private let progressRingLayer = CAShapeLayer()

    private let actionButtonsRow = UIStackView()
    private let takeBreakButton = UIButton(type: .custom)
    private let clockOutButton = UIButton(type: .custom)

    // 3. Two-Column Stats Row (Leaves & Holiday)
    private let twoColumnRow = UIStackView()

    // Card A: Leaves
    private let leavesCard = UIView()
    private let leavesTitleLabel = UILabel()
    private let leavesBadge = UIView()
    private let leavesBadgeIcon = UIImageView()
    private let leavesCasualLabel = UILabel()
    private let leavesSickLabel = UILabel()
    private let leavesProgressTrack = UIView()
    private let leavesProgressBar = UIView()
    private var leavesProgressWidthConstraint: NSLayoutConstraint?

    // Card B: Holiday (Real-time & Interactive Cycle)
    private let holidayCard = UIView()
    private let holidayTitleLabel = UILabel()
    private let holidayBadge = UIView()
    private let holidayBadgeIcon = UIImageView()
    private let holidayDotsStack = UIStackView()
    private var holidayDots: [UIView] = []
    private let holidayNameLabel = UILabel()
    private let holidayDateLabel = UILabel()
    private let holidayDaysLeftLabel = UILabel()
    private var upcomingHolidays: [[String: Any]] = []
    private var currentHolidayIndex = 0

    // 4. Team Presence Card
    private let teamPresenceCard = UIView()
    private let teamPresenceIcon = UIImageView()
    private let teamPresenceTitle = UILabel()
    private let teamActiveCountLabel = UILabel()
    private let avatarsContainer = UIView()
    private let viewRosterButton = UIButton(type: .system)
    private var teamMembersList: [[String: Any]] = []

    // 5. Tasks Card
    private let tasksCard = UIView()
    private let taskIconContainer = UIView()
    private let taskIconView = UIImageView()
    private let taskTitleLabel = UILabel()
    private let taskSubtitleLabel = UILabel()
    private let taskArrowButton = UIButton(type: .custom)
    private var myTasksList: [[String: Any]] = []

    // 6. GitHub-Style Monthly & Yearly Attendance Activity Heatmap
    private let monthlyHeatmapCard = UIView()
    private let heatmapMonthYearLabel = UILabel()
    private let heatmapModeSegmented = UISegmentedControl(items: ["Month", "Full Year"])
    private let monthViewContainer = UIView()
    private let yearViewScrollView = UIScrollView()
    private let yearViewContentStack = UIStackView()
    private let heatmapMonthSwitcherStack = UIStackView()
    private let heatmapGridStack = UIStackView()
    private let heatmapDayDetailView = UIView()
    private let heatmapDetailDateLabel = UILabel()
    private let heatmapDetailBadgeLabel = UILabel()
    private let heatmapDetailHoursLabel = UILabel()
    private let heatmapStatDaysWorkedLabel = UILabel()
    private let heatmapStatOvertimeLabel = UILabel()
    private let heatmapStatTotalHoursLabel = UILabel()
    private let heatmapStatStreakLabel = UILabel()
    private var heatmapCurrentDate = Date()
    private var currentHeatmapDays: [HeatmapDayData] = []
    private var allYearDaysData: [HeatmapDayData] = []
    private var selectedHeatmapDay = -1
    private var selectedYearDayIndex = -1
    private var todayHeatmapBoxView: UIView?
    private var todayHeatmapBoxLabel: UILabel?
    private var todayYearBoxView: UIView?

    // Bottom Navigation Bar
    private let bottomNavBar = UIView()
    private let bottomNavContainer = UIView()

    // Interactive Floating Note/Popup (Slide-up for short tap)
    private let hintPopupCard = UIView()
    private let hintIconView = UIImageView()
    private let hintTitleLabel = UILabel()
    private let hintSubtitleLabel = UILabel()
    private var hintPopupBottomConstraint: NSLayoutConstraint?
    private var hintDismissTimer: Timer?

    // Punch Instruction Label
    private let punchInstructionLabel: UILabel = {
        let lbl = UILabel()
        lbl.font = .systemFont(ofSize: 12, weight: .semibold)
        lbl.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        lbl.textAlignment = .center
        lbl.text = "Hold 2s to Punch In"
        lbl.translatesAutoresizingMaskIntoConstraints = false
        return lbl
    }()

    // MARK: - State & Timer
    private var isCheckedIn = false
    private var isOnBreak = false
    private var currentBreakStartDate: Date?
    private var accumulatedBreakDuration: TimeInterval = 0
    private var lastBreakSessionText: String?
    private var isHoldingClockOut = false
    private var checkInDate: Date?
    private var liveTimer: Timer?
    private var cachedFirstName = AuthService.shared.getFirstName()

    // Minimum 3-Minute Shift Duration Lock
    private let minShiftLockDuration: TimeInterval = 180.0 // 3 minutes

    private var isShiftInThreeMinLock: Bool {
        guard isCheckedIn, let startDate = checkInDate else { return false }
        let elapsed = Date().timeIntervalSince(startDate)
        return elapsed < minShiftLockDuration
    }

    private var remainingLockSeconds: Int {
        guard let startDate = checkInDate else { return 0 }
        let elapsed = Date().timeIntervalSince(startDate)
        let remaining = Int(ceil(minShiftLockDuration - elapsed))
        return max(0, remaining)
    }

    private var remainingLockTimeFormatted: String {
        let sec = remainingLockSeconds
        if sec > 120 {
            return "3 min"
        } else if sec > 60 {
            return "2 min"
        } else if sec == 60 {
            return "1 min (60s)"
        } else {
            return "\(sec)s"
        }
    }

    // 30-Minute Break Duration Lock (cannot take break in first 30 mins)
    private let minBreakLockDuration: TimeInterval = 1800.0 // 30 minutes

    private var isBreakInThirtyMinLock: Bool {
        guard isCheckedIn, let startDate = checkInDate else { return false }
        let elapsed = Date().timeIntervalSince(startDate)
        return elapsed < minBreakLockDuration
    }

    private var remainingBreakLockMinutes: Int {
        guard let startDate = checkInDate else { return 0 }
        let elapsed = Date().timeIntervalSince(startDate)
        let remainingSec = max(0, minBreakLockDuration - elapsed)
        return max(1, Int(ceil(remainingSec / 60.0)))
    }

    // Skeleton Loading Overlay
    private let skeletonOverlay = HomeSkeletonOverlay()
    private var hasDismissedSkeleton = false

    // 2-Second Long Press Tracking
    private var pressStartTime: Date?
    private var holdTimer: Timer?
    private var isHoldingPunch = false
    private let requiredHoldDuration: TimeInterval = 2.0

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        navigationController?.setNavigationBarHidden(true, animated: false)

        setupTopBar()
        setupScrollView()
        setupHeroCard()
        setupTimerCard()
        setupTwoColumnRow()
        setupTeamPresenceCard()
        setupTasksCard()
        setupMonthlyHeatmapCard()
        setupBottomNavBar()
        setupHintPopup()
        updateGreeting()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        scrollView.setContentOffset(.zero, animated: false)

        // Reset attendance UI to prevent stale timer carryover when switching accounts
        stopTimer()
        isCheckedIn = false
        checkInDate = nil
        updateUIForAttendance(clockedIn: false)
        cachedFirstName = AuthService.shared.getFirstName()

        updateGreeting()
        loadProfile()
        loadAttendanceStats()
        loadRealLeaves()
        loadRealHolidays()
        loadRealSchedule()
        loadTeamPresence()
        loadTasks()
        renderMonthlyHeatmap()
        heatmapModeSegmented.selectedSegmentIndex = 0
        didChangeHeatmapMode(heatmapModeSegmented)

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            self?.dismissSkeleton()
        }
        heroCard.play()
    }

    func dismissSkeleton() {
        guard !hasDismissedSkeleton else { return }
        hasDismissedSkeleton = true
        UIView.animate(withDuration: 0.35, delay: 0.1, options: [.curveEaseOut], animations: {
            self.skeletonOverlay.alpha = 0.0
        }) { _ in
            self.skeletonOverlay.removeFromSuperview()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        stopTimer()
        resetHoldAnimation()
        heroCard.pause()
    }

    // MARK: - Layout Setup

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

        // Brand Subtitle + Screen Title (Matching Attendance header exactly)
        headerTextStack.axis = .vertical
        headerTextStack.spacing = 1
        headerTextStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(headerTextStack)

        brandSubtitleLabel.text = "TEAMHUB"
        brandSubtitleLabel.font = .systemFont(ofSize: 11, weight: .heavy)
        brandSubtitleLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        headerTextStack.addArrangedSubview(brandSubtitleLabel)

        screenTitleLabel.text = "Dashboard"
        screenTitleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        screenTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        headerTextStack.addArrangedSubview(screenTitleLabel)

        let rightActionsStack = UIStackView()
        rightActionsStack.axis = .horizontal
        rightActionsStack.spacing = 12
        rightActionsStack.alignment = .center
        rightActionsStack.translatesAutoresizingMaskIntoConstraints = false
        topBarContainer.addSubview(rightActionsStack)

        // Notification Bell with Conditional Red Dot
        let bellConfig = UIImage.SymbolConfiguration(pointSize: 19, weight: .regular)
        notificationButton.setImage(UIImage(systemName: "bell", withConfiguration: bellConfig), for: .normal)
        notificationButton.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        notificationButton.translatesAutoresizingMaskIntoConstraints = false
        notificationButton.addTarget(self, action: #selector(handleNotifications), for: .touchUpInside)
        rightActionsStack.addArrangedSubview(notificationButton)

        notifBadgeDot.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        notifBadgeDot.layer.cornerRadius = 4
        notifBadgeDot.layer.borderWidth = 1.5
        notifBadgeDot.layer.borderColor = UIColor.white.cgColor
        notifBadgeDot.translatesAutoresizingMaskIntoConstraints = false
        notifBadgeDot.isHidden = true // Only shown when real notification arrives
        notificationButton.addSubview(notifBadgeDot)

        // User Avatar Button
        avatarContainer.backgroundColor = UIColor(red: 191/255, green: 219/255, blue: 254/255, alpha: 1.0)
        avatarContainer.layer.cornerRadius = 18
        avatarContainer.layer.masksToBounds = true
        avatarContainer.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.isUserInteractionEnabled = true
        avatarContainer.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(openSettings)))
        rightActionsStack.addArrangedSubview(avatarContainer)

        avatarInitialsLabel.text = "A"
        avatarInitialsLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        avatarInitialsLabel.font = .systemFont(ofSize: 14, weight: .bold)
        avatarInitialsLabel.textAlignment = .center
        avatarInitialsLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarInitialsLabel)

        avatarImageView.contentMode = .scaleAspectFill
        avatarImageView.layer.masksToBounds = true
        avatarImageView.isHidden = true
        avatarImageView.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarImageView)

        // Top Bar Constraints matching AttendanceViewController
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

            headerTextStack.leadingAnchor.constraint(equalTo: topBarContainer.leadingAnchor),
            headerTextStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            rightActionsStack.trailingAnchor.constraint(equalTo: topBarContainer.trailingAnchor),
            rightActionsStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            notificationButton.widthAnchor.constraint(equalToConstant: 36),
            notificationButton.heightAnchor.constraint(equalToConstant: 36),

            notifBadgeDot.topAnchor.constraint(equalTo: notificationButton.topAnchor, constant: 5),
            notifBadgeDot.trailingAnchor.constraint(equalTo: notificationButton.trailingAnchor, constant: -4),
            notifBadgeDot.widthAnchor.constraint(equalToConstant: 8),
            notifBadgeDot.heightAnchor.constraint(equalToConstant: 8),

            avatarContainer.widthAnchor.constraint(equalToConstant: 36),
            avatarContainer.heightAnchor.constraint(equalToConstant: 36),

            avatarInitialsLabel.centerXAnchor.constraint(equalTo: avatarContainer.centerXAnchor),
            avatarInitialsLabel.centerYAnchor.constraint(equalTo: avatarContainer.centerYAnchor),

            avatarImageView.topAnchor.constraint(equalTo: avatarContainer.topAnchor),
            avatarImageView.bottomAnchor.constraint(equalTo: avatarContainer.bottomAnchor),
            avatarImageView.leadingAnchor.constraint(equalTo: avatarContainer.leadingAnchor),
            avatarImageView.trailingAnchor.constraint(equalTo: avatarContainer.trailingAnchor)
        ])
    }

    private func setupScrollView() {
        scrollView.showsVerticalScrollIndicator = false
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)

        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)

        cardsStackView.axis = .vertical
        cardsStackView.spacing = 16
        cardsStackView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(cardsStackView)

        contentView.addSubview(skeletonOverlay)

        var contentWidthConstraints: [NSLayoutConstraint] = []
        if UIDevice.current.userInterfaceIdiom == .pad {
            contentWidthConstraints = [
                contentView.widthAnchor.constraint(equalToConstant: 680),
                contentView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor)
            ]
        } else {
            contentWidthConstraints = [
                contentView.widthAnchor.constraint(equalTo: view.widthAnchor)
            ]
        }

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: topBar.bottomAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -60),

            contentView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor, constant: -24),
            contentView.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),

            cardsStackView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            cardsStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            cardsStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            cardsStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -16),

            skeletonOverlay.topAnchor.constraint(equalTo: contentView.topAnchor),
            skeletonOverlay.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            skeletonOverlay.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            skeletonOverlay.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ] + contentWidthConstraints)
    }

    // MARK: - 1. Employee Portal Hero Card
    private func setupHeroCard() {
        heroCard.layer.cornerRadius = 24
        heroCard.layer.masksToBounds = true
        heroCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(heroCard)

        // Pill: EMPLOYEE PORTAL (Tick badge removed as requested)
        let badgeContainer = UIView()
        badgeContainer.backgroundColor = UIColor(white: 1.0, alpha: 0.16)
        badgeContainer.layer.cornerRadius = 12
        badgeContainer.translatesAutoresizingMaskIntoConstraints = false
        heroCard.addSubview(badgeContainer)

        heroBadgeLabel.text = "EMPLOYEE PORTAL"
        heroBadgeLabel.font = .systemFont(ofSize: 10, weight: .bold)
        heroBadgeLabel.textColor = .white
        heroBadgeLabel.translatesAutoresizingMaskIntoConstraints = false
        badgeContainer.addSubview(heroBadgeLabel)

        // Greeting & Subtitle (Time-based greeting + user login name)
        heroGreetingLabel.text = "Good day, \(AuthService.shared.getFirstName())"
        heroGreetingLabel.font = .systemFont(ofSize: 24, weight: .bold)
        heroGreetingLabel.textColor = .white
        heroGreetingLabel.translatesAutoresizingMaskIntoConstraints = false
        heroCard.addSubview(heroGreetingLabel)

        let initDesig = AuthService.shared.getDesignation()
        let initOrg = AuthService.shared.getOrganization()
        heroSubRoleLabel.text = "\(initDesig) • \(initOrg)"
        heroSubRoleLabel.font = .systemFont(ofSize: 13, weight: .regular)
        heroSubRoleLabel.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        heroSubRoleLabel.translatesAutoresizingMaskIntoConstraints = false
        heroCard.addSubview(heroSubRoleLabel)

        // Bottom Shift Strip
        shiftStrip.backgroundColor = UIColor(red: 238/255, green: 242/255, blue: 255/255, alpha: 1.0)
        shiftStrip.layer.cornerRadius = 18
        shiftStrip.translatesAutoresizingMaskIntoConstraints = false
        heroCard.addSubview(shiftStrip)

        let clockConfig = UIImage.SymbolConfiguration(pointSize: 15, weight: .bold)
        shiftClockIcon.image = UIImage(systemName: "clock.fill", withConfiguration: clockConfig) ?? UIImage(systemName: "clock", withConfiguration: clockConfig)
        shiftClockIcon.tintColor = UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0)
        shiftClockIcon.translatesAutoresizingMaskIntoConstraints = false
        shiftStrip.addSubview(shiftClockIcon)

        shiftTimeLabel.text = "Shift: 09:00 AM – 06:00 PM"
        shiftTimeLabel.font = .systemFont(ofSize: 13, weight: .semibold)
        shiftTimeLabel.textColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        shiftTimeLabel.translatesAutoresizingMaskIntoConstraints = false
        shiftStrip.addSubview(shiftTimeLabel)

        shiftOnTrackBadge.backgroundColor = UIColor(red: 167/255, green: 243/255, blue: 208/255, alpha: 1.0)
        shiftOnTrackBadge.layer.cornerRadius = 9
        shiftOnTrackBadge.translatesAutoresizingMaskIntoConstraints = false
        shiftStrip.addSubview(shiftOnTrackBadge)

        shiftOnTrackLabel.text = "On Track"
        shiftOnTrackLabel.font = .systemFont(ofSize: 11, weight: .bold)
        shiftOnTrackLabel.textColor = UIColor(red: 6/255, green: 95/255, blue: 70/255, alpha: 1.0)
        shiftOnTrackLabel.translatesAutoresizingMaskIntoConstraints = false
        shiftOnTrackBadge.addSubview(shiftOnTrackLabel)

        NSLayoutConstraint.activate([
            badgeContainer.topAnchor.constraint(equalTo: heroCard.topAnchor, constant: 18),
            badgeContainer.leadingAnchor.constraint(equalTo: heroCard.leadingAnchor, constant: 18),
            badgeContainer.heightAnchor.constraint(equalToConstant: 24),

            heroBadgeLabel.leadingAnchor.constraint(equalTo: badgeContainer.leadingAnchor, constant: 10),
            heroBadgeLabel.trailingAnchor.constraint(equalTo: badgeContainer.trailingAnchor, constant: -10),
            heroBadgeLabel.centerYAnchor.constraint(equalTo: badgeContainer.centerYAnchor),

            heroGreetingLabel.topAnchor.constraint(equalTo: badgeContainer.bottomAnchor, constant: 14),
            heroGreetingLabel.leadingAnchor.constraint(equalTo: heroCard.leadingAnchor, constant: 18),
            heroGreetingLabel.trailingAnchor.constraint(equalTo: heroCard.trailingAnchor, constant: -18),

            heroSubRoleLabel.topAnchor.constraint(equalTo: heroGreetingLabel.bottomAnchor, constant: 4),
            heroSubRoleLabel.leadingAnchor.constraint(equalTo: heroCard.leadingAnchor, constant: 18),
            heroSubRoleLabel.trailingAnchor.constraint(equalTo: heroCard.trailingAnchor, constant: -18),

            shiftStrip.topAnchor.constraint(equalTo: heroSubRoleLabel.bottomAnchor, constant: 18),
            shiftStrip.leadingAnchor.constraint(equalTo: heroCard.leadingAnchor, constant: 12),
            shiftStrip.trailingAnchor.constraint(equalTo: heroCard.trailingAnchor, constant: -12),
            shiftStrip.heightAnchor.constraint(equalToConstant: 40),
            shiftStrip.bottomAnchor.constraint(equalTo: heroCard.bottomAnchor, constant: -14),

            shiftClockIcon.leadingAnchor.constraint(equalTo: shiftStrip.leadingAnchor, constant: 12),
            shiftClockIcon.centerYAnchor.constraint(equalTo: shiftStrip.centerYAnchor),
            shiftClockIcon.widthAnchor.constraint(equalToConstant: 18),
            shiftClockIcon.heightAnchor.constraint(equalToConstant: 18),

            shiftTimeLabel.leadingAnchor.constraint(equalTo: shiftClockIcon.trailingAnchor, constant: 8),
            shiftTimeLabel.centerYAnchor.constraint(equalTo: shiftStrip.centerYAnchor),

            shiftOnTrackBadge.trailingAnchor.constraint(equalTo: shiftStrip.trailingAnchor, constant: -10),
            shiftOnTrackBadge.centerYAnchor.constraint(equalTo: shiftStrip.centerYAnchor),
            shiftOnTrackBadge.heightAnchor.constraint(equalToConstant: 22),

            shiftOnTrackLabel.leadingAnchor.constraint(equalTo: shiftOnTrackBadge.leadingAnchor, constant: 8),
            shiftOnTrackLabel.trailingAnchor.constraint(equalTo: shiftOnTrackBadge.trailingAnchor, constant: -8),
            shiftOnTrackLabel.centerYAnchor.constraint(equalTo: shiftOnTrackBadge.centerYAnchor)
        ])
    }

    // MARK: - 2. Active Shift Timer Card
    private func setupTimerCard() {
        timerCard.backgroundColor = .white
        timerCard.layer.cornerRadius = 24
        timerCard.layer.borderWidth = 1
        timerCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        timerCard.layer.shadowColor = UIColor.black.cgColor
        timerCard.layer.shadowOpacity = 0.04
        timerCard.layer.shadowOffset = CGSize(width: 0, height: 4)
        timerCard.layer.shadowRadius = 12
        timerCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(timerCard)

        // Section Title: ACTIVE SHIFT TIMER
        timerSectionTitle.text = "ACTIVE SHIFT TIMER"
        timerSectionTitle.font = .systemFont(ofSize: 11, weight: .bold)
        timerSectionTitle.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        timerSectionTitle.textAlignment = .center
        timerSectionTitle.translatesAutoresizingMaskIntoConstraints = false
        timerCard.addSubview(timerSectionTitle)

        // Live Timer: 07h 44m 35s
        liveTimerLabel.text = "00h 00m 00s"
        liveTimerLabel.font = .monospacedDigitSystemFont(ofSize: 32, weight: .heavy)
        liveTimerLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        liveTimerLabel.textAlignment = .center
        liveTimerLabel.translatesAutoresizingMaskIntoConstraints = false
        timerCard.addSubview(liveTimerLabel)

        // Punch status
        punchStatusLabel.text = "• Clocked Out"
        punchStatusLabel.font = .systemFont(ofSize: 13, weight: .semibold)
        punchStatusLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        punchStatusLabel.textAlignment = .center
        punchStatusLabel.translatesAutoresizingMaskIntoConstraints = false
        timerCard.addSubview(punchStatusLabel)

        // Break timer & session info label below punch status
        breakTimerLabel.font = .systemFont(ofSize: 12, weight: .bold)
        breakTimerLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
        breakTimerLabel.textAlignment = .center
        breakTimerLabel.translatesAutoresizingMaskIntoConstraints = false
        breakTimerLabel.isHidden = true
        timerCard.addSubview(breakTimerLabel)

        // Fingerprint Punch Button (Outer Glow + Inner Blue Circle + Circular Loading Ring)
        punchGlowRing.backgroundColor = UIColor(red: 219/255, green: 234/255, blue: 254/255, alpha: 0.85)
        punchGlowRing.layer.cornerRadius = 48
        punchGlowRing.translatesAutoresizingMaskIntoConstraints = false
        timerCard.addSubview(punchGlowRing)

        punchCircleButton.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        punchCircleButton.layer.cornerRadius = 34
        punchCircleButton.layer.shadowColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 0.35).cgColor
        punchCircleButton.layer.shadowOpacity = 0.3
        punchCircleButton.layer.shadowOffset = CGSize(width: 0, height: 4)
        punchCircleButton.layer.shadowRadius = 8
        punchCircleButton.translatesAutoresizingMaskIntoConstraints = false
        punchGlowRing.addSubview(punchCircleButton)

        // Setup Circular 2-Second Hold Animation Progress Ring (White Loading Circle)
        let ringPath = UIBezierPath(arcCenter: CGPoint(x: 34, y: 34), radius: 32, startAngle: -CGFloat.pi / 2, endAngle: 1.5 * CGFloat.pi, clockwise: true)
        progressRingLayer.path = ringPath.cgPath
        progressRingLayer.strokeColor = UIColor.white.cgColor
        progressRingLayer.fillColor = UIColor.clear.cgColor
        progressRingLayer.lineWidth = 3.5
        progressRingLayer.strokeEnd = 0.0
        progressRingLayer.lineCap = .round
        punchCircleButton.layer.addSublayer(progressRingLayer)

        let fpConfig = UIImage.SymbolConfiguration(pointSize: 34, weight: .medium)
        punchIconView.image = UIImage(systemName: "touchid", withConfiguration: fpConfig)
        punchIconView.tintColor = .white
        punchIconView.contentMode = .scaleAspectFit
        punchIconView.translatesAutoresizingMaskIntoConstraints = false
        punchCircleButton.addSubview(punchIconView)

        // Add Touch Events for 2-Second Long Press Interaction
        punchCircleButton.addTarget(self, action: #selector(punchTouchDown), for: .touchDown)
        punchCircleButton.addTarget(self, action: #selector(punchTouchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])

        // Action Buttons Row: [Take Break] [Clock Out]
        actionButtonsRow.axis = .horizontal
        actionButtonsRow.distribution = .fillEqually
        actionButtonsRow.spacing = 12
        actionButtonsRow.translatesAutoresizingMaskIntoConstraints = false
        timerCard.addSubview(actionButtonsRow)

        // Take Break Button
        takeBreakButton.backgroundColor = UIColor(red: 238/255, green: 242/255, blue: 255/255, alpha: 1.0)
        takeBreakButton.layer.cornerRadius = 23
        takeBreakButton.setTitle(" Take Break", for: .normal)
        takeBreakButton.setTitleColor(UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0), for: .normal)
        takeBreakButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        let cupConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .semibold)
        let cupImg = UIImage(systemName: "cup.and.saucer.fill", withConfiguration: cupConfig) ?? UIImage(systemName: "pause.circle.fill", withConfiguration: cupConfig)
        takeBreakButton.setImage(cupImg, for: .normal)
        takeBreakButton.tintColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        takeBreakButton.addTarget(self, action: #selector(handleTakeBreak), for: .touchUpInside)
        actionButtonsRow.addArrangedSubview(takeBreakButton)

        // Clock Out Button (Press & Hold for 2s drives white loading ring on thumb button)
        clockOutButton.backgroundColor = UIColor(red: 254/255, green: 226/255, blue: 226/255, alpha: 1.0)
        clockOutButton.layer.cornerRadius = 23
        clockOutButton.setTitle(" Clock Out", for: .normal)
        clockOutButton.setTitleColor(UIColor(red: 185/255, green: 28/255, blue: 28/255, alpha: 1.0), for: .normal)
        clockOutButton.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        let outConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .semibold)
        let outImg = UIImage(systemName: "rectangle.portrait.and.arrow.right", withConfiguration: outConfig) ?? UIImage(systemName: "arrow.right.to.line", withConfiguration: outConfig)
        clockOutButton.setImage(outImg, for: .normal)
        clockOutButton.tintColor = UIColor(red: 185/255, green: 28/255, blue: 28/255, alpha: 1.0)
        clockOutButton.addTarget(self, action: #selector(clockOutTouchDown), for: .touchDown)
        clockOutButton.addTarget(self, action: #selector(clockOutTouchUp), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        actionButtonsRow.addArrangedSubview(clockOutButton)

        timerCard.addSubview(punchInstructionLabel)

        NSLayoutConstraint.activate([
            timerSectionTitle.topAnchor.constraint(equalTo: timerCard.topAnchor, constant: 22),
            timerSectionTitle.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),

            liveTimerLabel.topAnchor.constraint(equalTo: timerSectionTitle.bottomAnchor, constant: 6),
            liveTimerLabel.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),

            punchStatusLabel.topAnchor.constraint(equalTo: liveTimerLabel.bottomAnchor, constant: 4),
            punchStatusLabel.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),

            breakTimerLabel.topAnchor.constraint(equalTo: punchStatusLabel.bottomAnchor, constant: 3),
            breakTimerLabel.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),
            breakTimerLabel.leadingAnchor.constraint(greaterThanOrEqualTo: timerCard.leadingAnchor, constant: 12),
            breakTimerLabel.trailingAnchor.constraint(lessThanOrEqualTo: timerCard.trailingAnchor, constant: -12),

            punchGlowRing.topAnchor.constraint(equalTo: breakTimerLabel.bottomAnchor, constant: 14),
            punchGlowRing.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),
            punchGlowRing.widthAnchor.constraint(equalToConstant: 96),
            punchGlowRing.heightAnchor.constraint(equalToConstant: 96),

            punchCircleButton.centerXAnchor.constraint(equalTo: punchGlowRing.centerXAnchor),
            punchCircleButton.centerYAnchor.constraint(equalTo: punchGlowRing.centerYAnchor),
            punchCircleButton.widthAnchor.constraint(equalToConstant: 68),
            punchCircleButton.heightAnchor.constraint(equalToConstant: 68),

            punchIconView.centerXAnchor.constraint(equalTo: punchCircleButton.centerXAnchor),
            punchIconView.centerYAnchor.constraint(equalTo: punchCircleButton.centerYAnchor),
            punchIconView.widthAnchor.constraint(equalToConstant: 34),
            punchIconView.heightAnchor.constraint(equalToConstant: 34),

            punchInstructionLabel.topAnchor.constraint(equalTo: punchGlowRing.bottomAnchor, constant: 10),
            punchInstructionLabel.centerXAnchor.constraint(equalTo: timerCard.centerXAnchor),
            punchInstructionLabel.leadingAnchor.constraint(greaterThanOrEqualTo: timerCard.leadingAnchor, constant: 16),
            punchInstructionLabel.trailingAnchor.constraint(lessThanOrEqualTo: timerCard.trailingAnchor, constant: -16),

            actionButtonsRow.topAnchor.constraint(equalTo: punchInstructionLabel.bottomAnchor, constant: 14),
            actionButtonsRow.leadingAnchor.constraint(equalTo: timerCard.leadingAnchor, constant: 18),
            actionButtonsRow.trailingAnchor.constraint(equalTo: timerCard.trailingAnchor, constant: -18),
            actionButtonsRow.heightAnchor.constraint(equalToConstant: 46),
            actionButtonsRow.bottomAnchor.constraint(equalTo: timerCard.bottomAnchor, constant: -20)
        ])
    }

    // MARK: - 3. Leaves & Holiday Row
    private func setupTwoColumnRow() {
        twoColumnRow.axis = .horizontal
        twoColumnRow.distribution = .fillEqually
        twoColumnRow.spacing = 12
        twoColumnRow.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(twoColumnRow)

        // Card A: Leaves
        leavesCard.backgroundColor = .white
        leavesCard.layer.cornerRadius = 20
        leavesCard.layer.borderWidth = 1
        leavesCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        leavesCard.layer.shadowColor = UIColor.black.cgColor
        leavesCard.layer.shadowOpacity = 0.03
        leavesCard.layer.shadowOffset = CGSize(width: 0, height: 2)
        leavesCard.layer.shadowRadius = 8
        leavesCard.translatesAutoresizingMaskIntoConstraints = false
        twoColumnRow.addArrangedSubview(leavesCard)

        leavesTitleLabel.text = "Leaves"
        leavesTitleLabel.font = .systemFont(ofSize: 16, weight: .bold)
        leavesTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        leavesTitleLabel.translatesAutoresizingMaskIntoConstraints = false
        leavesCard.addSubview(leavesTitleLabel)

        leavesBadge.backgroundColor = UIColor(red: 239/255, green: 246/255, blue: 255/255, alpha: 1.0)
        leavesBadge.layer.cornerRadius = 16
        leavesBadge.translatesAutoresizingMaskIntoConstraints = false
        leavesCard.addSubview(leavesBadge)

        let calConfig = UIImage.SymbolConfiguration(pointSize: 15, weight: .semibold)
        leavesBadgeIcon.image = UIImage(systemName: "calendar", withConfiguration: calConfig)
        leavesBadgeIcon.tintColor = UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0)
        leavesBadgeIcon.contentMode = .scaleAspectFit
        leavesBadgeIcon.translatesAutoresizingMaskIntoConstraints = false
        leavesBadge.addSubview(leavesBadgeIcon)

        leavesCasualLabel.text = "Casual: 6 left"
        leavesCasualLabel.font = .systemFont(ofSize: 13, weight: .semibold)
        leavesCasualLabel.textColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        leavesCasualLabel.translatesAutoresizingMaskIntoConstraints = false
        leavesCard.addSubview(leavesCasualLabel)

        leavesSickLabel.text = "Sick: 4 remaining"
        leavesSickLabel.font = .systemFont(ofSize: 12, weight: .regular)
        leavesSickLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        leavesSickLabel.translatesAutoresizingMaskIntoConstraints = false
        leavesCard.addSubview(leavesSickLabel)

        leavesProgressTrack.backgroundColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
        leavesProgressTrack.layer.cornerRadius = 2.5
        leavesProgressTrack.layer.masksToBounds = true
        leavesProgressTrack.translatesAutoresizingMaskIntoConstraints = false
        leavesCard.addSubview(leavesProgressTrack)

        leavesProgressBar.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        leavesProgressBar.layer.cornerRadius = 2.5
        leavesProgressBar.translatesAutoresizingMaskIntoConstraints = false
        leavesProgressTrack.addSubview(leavesProgressBar)

        // Card B: Holiday (Interactive Swipe / Tap to cycle through 3 upcoming holidays)
        holidayCard.backgroundColor = .white
        holidayCard.layer.cornerRadius = 20
        holidayCard.layer.borderWidth = 1
        holidayCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        holidayCard.layer.shadowColor = UIColor.black.cgColor
        holidayCard.layer.shadowOpacity = 0.03
        holidayCard.layer.shadowOffset = CGSize(width: 0, height: 2)
        holidayCard.layer.shadowRadius = 8
        holidayCard.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.isUserInteractionEnabled = true
        holidayCard.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(cycleNextHoliday)))
        let swipeLeft = UISwipeGestureRecognizer(target: self, action: #selector(cycleNextHoliday))
        swipeLeft.direction = .left
        holidayCard.addGestureRecognizer(swipeLeft)
        let swipeRight = UISwipeGestureRecognizer(target: self, action: #selector(cyclePrevHoliday))
        swipeRight.direction = .right
        holidayCard.addGestureRecognizer(swipeRight)
        twoColumnRow.addArrangedSubview(holidayCard)

        holidayTitleLabel.text = "Upcoming Holidays"
        holidayTitleLabel.font = .systemFont(ofSize: 15, weight: .bold)
        holidayTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        holidayTitleLabel.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.addSubview(holidayTitleLabel)

        holidayDotsStack.axis = .horizontal
        holidayDotsStack.spacing = 4
        holidayDotsStack.alignment = .center
        holidayDotsStack.distribution = .fill
        holidayDotsStack.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.addSubview(holidayDotsStack)

        holidayDots.removeAll()
        for i in 0..<3 {
            let dot = UIView()
            dot.backgroundColor = (i == 0) ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
            dot.layer.cornerRadius = 3
            dot.translatesAutoresizingMaskIntoConstraints = false
            let wConstraint = dot.widthAnchor.constraint(equalToConstant: i == 0 ? 12 : 6)
            let hConstraint = dot.heightAnchor.constraint(equalToConstant: 6)
            NSLayoutConstraint.activate([wConstraint, hConstraint])
            holidayDots.append(dot)
            holidayDotsStack.addArrangedSubview(dot)
        }

        holidayNameLabel.text = "Diwali"
        holidayNameLabel.font = .systemFont(ofSize: 15, weight: .bold)
        holidayNameLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        holidayNameLabel.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.addSubview(holidayNameLabel)

        holidayDateLabel.text = "Fri, Nov 1"
        holidayDateLabel.font = .systemFont(ofSize: 12, weight: .regular)
        holidayDateLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        holidayDateLabel.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.addSubview(holidayDateLabel)

        holidayDaysLeftLabel.text = "In 8 days"
        holidayDaysLeftLabel.font = .systemFont(ofSize: 12, weight: .bold)
        holidayDaysLeftLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
        holidayDaysLeftLabel.translatesAutoresizingMaskIntoConstraints = false
        holidayCard.addSubview(holidayDaysLeftLabel)

        NSLayoutConstraint.activate([
            // Leaves Card Constraints
            leavesTitleLabel.topAnchor.constraint(equalTo: leavesCard.topAnchor, constant: 16),
            leavesTitleLabel.leadingAnchor.constraint(equalTo: leavesCard.leadingAnchor, constant: 14),

            leavesBadge.topAnchor.constraint(equalTo: leavesCard.topAnchor, constant: 14),
            leavesBadge.trailingAnchor.constraint(equalTo: leavesCard.trailingAnchor, constant: -14),
            leavesBadge.widthAnchor.constraint(equalToConstant: 32),
            leavesBadge.heightAnchor.constraint(equalToConstant: 32),

            leavesBadgeIcon.centerXAnchor.constraint(equalTo: leavesBadge.centerXAnchor),
            leavesBadgeIcon.centerYAnchor.constraint(equalTo: leavesBadge.centerYAnchor),

            leavesCasualLabel.topAnchor.constraint(equalTo: leavesTitleLabel.bottomAnchor, constant: 12),
            leavesCasualLabel.leadingAnchor.constraint(equalTo: leavesCard.leadingAnchor, constant: 14),
            leavesCasualLabel.trailingAnchor.constraint(equalTo: leavesCard.trailingAnchor, constant: -14),

            leavesSickLabel.topAnchor.constraint(equalTo: leavesCasualLabel.bottomAnchor, constant: 2),
            leavesSickLabel.leadingAnchor.constraint(equalTo: leavesCard.leadingAnchor, constant: 14),
            leavesSickLabel.trailingAnchor.constraint(equalTo: leavesCard.trailingAnchor, constant: -14),

            leavesProgressTrack.topAnchor.constraint(equalTo: leavesSickLabel.bottomAnchor, constant: 12),
            leavesProgressTrack.leadingAnchor.constraint(equalTo: leavesCard.leadingAnchor, constant: 14),
            leavesProgressTrack.trailingAnchor.constraint(equalTo: leavesCard.trailingAnchor, constant: -14),
            leavesProgressTrack.heightAnchor.constraint(equalToConstant: 5),
            leavesProgressTrack.bottomAnchor.constraint(equalTo: leavesCard.bottomAnchor, constant: -16),

            leavesProgressBar.topAnchor.constraint(equalTo: leavesProgressTrack.topAnchor),
            leavesProgressBar.bottomAnchor.constraint(equalTo: leavesProgressTrack.bottomAnchor),
            leavesProgressBar.leadingAnchor.constraint(equalTo: leavesProgressTrack.leadingAnchor),
            leavesProgressBar.widthAnchor.constraint(equalTo: leavesProgressTrack.widthAnchor, multiplier: 0.70),

            // Holiday Card Constraints - Dots brought DOWN to bottom trailing
            holidayTitleLabel.topAnchor.constraint(equalTo: holidayCard.topAnchor, constant: 16),
            holidayTitleLabel.leadingAnchor.constraint(equalTo: holidayCard.leadingAnchor, constant: 14),
            holidayTitleLabel.trailingAnchor.constraint(lessThanOrEqualTo: holidayCard.trailingAnchor, constant: -14),

            holidayNameLabel.topAnchor.constraint(equalTo: holidayTitleLabel.bottomAnchor, constant: 12),
            holidayNameLabel.leadingAnchor.constraint(equalTo: holidayCard.leadingAnchor, constant: 14),
            holidayNameLabel.trailingAnchor.constraint(equalTo: holidayCard.trailingAnchor, constant: -14),

            holidayDateLabel.topAnchor.constraint(equalTo: holidayNameLabel.bottomAnchor, constant: 2),
            holidayDateLabel.leadingAnchor.constraint(equalTo: holidayCard.leadingAnchor, constant: 14),
            holidayDateLabel.trailingAnchor.constraint(equalTo: holidayCard.trailingAnchor, constant: -14),

            holidayDaysLeftLabel.topAnchor.constraint(equalTo: holidayDateLabel.bottomAnchor, constant: 6),
            holidayDaysLeftLabel.leadingAnchor.constraint(equalTo: holidayCard.leadingAnchor, constant: 14),
            holidayDaysLeftLabel.bottomAnchor.constraint(equalTo: holidayCard.bottomAnchor, constant: -16),

            holidayDotsStack.centerYAnchor.constraint(equalTo: holidayDaysLeftLabel.centerYAnchor),
            holidayDotsStack.trailingAnchor.constraint(equalTo: holidayCard.trailingAnchor, constant: -14),
            holidayDaysLeftLabel.trailingAnchor.constraint(lessThanOrEqualTo: holidayDotsStack.leadingAnchor, constant: -8)
        ])
    }

    // MARK: - 4. Team Presence Card
    private func setupTeamPresenceCard() {
        teamPresenceCard.backgroundColor = .white
        teamPresenceCard.layer.cornerRadius = 20
        teamPresenceCard.layer.borderWidth = 1
        teamPresenceCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        teamPresenceCard.layer.shadowColor = UIColor.black.cgColor
        teamPresenceCard.layer.shadowOpacity = 0.03
        teamPresenceCard.layer.shadowOffset = CGSize(width: 0, height: 2)
        teamPresenceCard.layer.shadowRadius = 8
        teamPresenceCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(teamPresenceCard)

        let grpConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        teamPresenceIcon.image = UIImage(systemName: "person.2.fill", withConfiguration: grpConfig) ?? UIImage(systemName: "person.3.fill", withConfiguration: grpConfig)
        teamPresenceIcon.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        teamPresenceIcon.translatesAutoresizingMaskIntoConstraints = false
        teamPresenceCard.addSubview(teamPresenceIcon)

        teamPresenceTitle.text = "Team Presence"
        teamPresenceTitle.font = .systemFont(ofSize: 16, weight: .bold)
        teamPresenceTitle.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        teamPresenceTitle.translatesAutoresizingMaskIntoConstraints = false
        teamPresenceCard.addSubview(teamPresenceTitle)

        teamActiveCountLabel.text = "0 Active"
        teamActiveCountLabel.font = .systemFont(ofSize: 13, weight: .semibold)
        teamActiveCountLabel.textColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        teamActiveCountLabel.translatesAutoresizingMaskIntoConstraints = false
        teamPresenceCard.addSubview(teamActiveCountLabel)

        // Dynamic Avatars Container
        avatarsContainer.translatesAutoresizingMaskIntoConstraints = false
        teamPresenceCard.addSubview(avatarsContainer)

        updateTeamPresenceUI(members: [])

        // View Roster Button
        viewRosterButton.setTitle("View Roster ›", for: .normal)
        viewRosterButton.setTitleColor(UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0), for: .normal)
        viewRosterButton.titleLabel?.font = .systemFont(ofSize: 13, weight: .bold)
        viewRosterButton.translatesAutoresizingMaskIntoConstraints = false
        viewRosterButton.addTarget(self, action: #selector(handleViewRoster), for: .touchUpInside)
        teamPresenceCard.addSubview(viewRosterButton)

        NSLayoutConstraint.activate([
            teamPresenceIcon.leadingAnchor.constraint(equalTo: teamPresenceCard.leadingAnchor, constant: 16),
            teamPresenceIcon.topAnchor.constraint(equalTo: teamPresenceCard.topAnchor, constant: 16),
            teamPresenceIcon.widthAnchor.constraint(equalToConstant: 20),
            teamPresenceIcon.heightAnchor.constraint(equalToConstant: 20),

            teamPresenceTitle.leadingAnchor.constraint(equalTo: teamPresenceIcon.trailingAnchor, constant: 8),
            teamPresenceTitle.centerYAnchor.constraint(equalTo: teamPresenceIcon.centerYAnchor),

            teamActiveCountLabel.trailingAnchor.constraint(equalTo: teamPresenceCard.trailingAnchor, constant: -16),
            teamActiveCountLabel.centerYAnchor.constraint(equalTo: teamPresenceTitle.centerYAnchor),

            avatarsContainer.topAnchor.constraint(equalTo: teamPresenceTitle.bottomAnchor, constant: 16),
            avatarsContainer.leadingAnchor.constraint(equalTo: teamPresenceCard.leadingAnchor, constant: 16),
            avatarsContainer.heightAnchor.constraint(equalToConstant: 32),
            avatarsContainer.bottomAnchor.constraint(equalTo: teamPresenceCard.bottomAnchor, constant: -16),

            viewRosterButton.trailingAnchor.constraint(equalTo: teamPresenceCard.trailingAnchor, constant: -16),
            viewRosterButton.centerYAnchor.constraint(equalTo: avatarsContainer.centerYAnchor)
        ])
    }

    // MARK: - 5. Tasks Card
    private func setupTasksCard() {
        tasksCard.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 253/255, alpha: 1.0)
        tasksCard.layer.cornerRadius = 20
        tasksCard.layer.borderWidth = 1
        tasksCard.layer.borderColor = UIColor(red: 224/255, green: 231/255, blue: 255/255, alpha: 1.0).cgColor
        tasksCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(tasksCard)

        taskIconContainer.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        taskIconContainer.layer.cornerRadius = 20
        taskIconContainer.translatesAutoresizingMaskIntoConstraints = false
        tasksCard.addSubview(taskIconContainer)

        let chkConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .bold)
        taskIconView.image = UIImage(systemName: "checklist", withConfiguration: chkConfig) ?? UIImage(systemName: "checkmark.square", withConfiguration: chkConfig)
        taskIconView.tintColor = .white
        taskIconView.contentMode = .scaleAspectFit
        taskIconView.translatesAutoresizingMaskIntoConstraints = false
        taskIconContainer.addSubview(taskIconView)

        let taskTextStack = UIStackView()
        taskTextStack.axis = .vertical
        taskTextStack.spacing = 2
        taskTextStack.translatesAutoresizingMaskIntoConstraints = false
        tasksCard.addSubview(taskTextStack)

        taskTitleLabel.text = "0 Tasks due today"
        taskTitleLabel.font = .systemFont(ofSize: 15, weight: .bold)
        taskTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        taskTextStack.addArrangedSubview(taskTitleLabel)

        taskSubtitleLabel.text = "All caught up! No pending tasks for today."
        taskSubtitleLabel.font = .systemFont(ofSize: 12, weight: .regular)
        taskSubtitleLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        taskTextStack.addArrangedSubview(taskSubtitleLabel)

        // Round Right Arrow Button
        taskArrowButton.backgroundColor = UIColor(red: 224/255, green: 231/255, blue: 255/255, alpha: 1.0)
        taskArrowButton.layer.cornerRadius = 18
        let arrowConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .bold)
        taskArrowButton.setImage(UIImage(systemName: "arrow.right", withConfiguration: arrowConfig), for: .normal)
        taskArrowButton.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        taskArrowButton.translatesAutoresizingMaskIntoConstraints = false
        taskArrowButton.addTarget(self, action: #selector(handleTasksAction), for: .touchUpInside)
        tasksCard.addSubview(taskArrowButton)

        NSLayoutConstraint.activate([
            taskIconContainer.leadingAnchor.constraint(equalTo: tasksCard.leadingAnchor, constant: 14),
            taskIconContainer.centerYAnchor.constraint(equalTo: tasksCard.centerYAnchor),
            taskIconContainer.widthAnchor.constraint(equalToConstant: 40),
            taskIconContainer.heightAnchor.constraint(equalToConstant: 40),

            taskIconView.centerXAnchor.constraint(equalTo: taskIconContainer.centerXAnchor),
            taskIconView.centerYAnchor.constraint(equalTo: taskIconContainer.centerYAnchor),

            taskTextStack.leadingAnchor.constraint(equalTo: taskIconContainer.trailingAnchor, constant: 12),
            taskTextStack.trailingAnchor.constraint(equalTo: taskArrowButton.leadingAnchor, constant: -10),
            taskTextStack.topAnchor.constraint(equalTo: tasksCard.topAnchor, constant: 16),
            taskTextStack.bottomAnchor.constraint(equalTo: tasksCard.bottomAnchor, constant: -16),

            taskArrowButton.trailingAnchor.constraint(equalTo: tasksCard.trailingAnchor, constant: -14),
            taskArrowButton.centerYAnchor.constraint(equalTo: tasksCard.centerYAnchor),
            taskArrowButton.widthAnchor.constraint(equalToConstant: 36),
            taskArrowButton.heightAnchor.constraint(equalToConstant: 36)
        ])
    }

    // MARK: - Authentic GitHub Green Style Attendance Activity Heatmap
    private struct HeatmapDayData {
        let dayNumber: Int
        var statusType: Int // 0 = Future, 1 = Weekend/Off, 2 = Short (<8h, Light Green), 3 = Exact 8h (Mid Green), 4 = Overtime (Dark Green), 5 = Heavy Overtime (Deep Forest Green)
        var hours: Int
        var minutes: Int
        let isToday: Bool
        let formattedDate: String
        var fullDate: Date? = nil
        var shiftSummary: String = ""
        var clockInTime: String = "09:00 AM"
        var clockOutTime: String = "05:00 PM"
    }

    // GitHub Color Palette
    private let ghEmptyColor = UIColor(red: 235/255, green: 237/255, blue: 240/255, alpha: 1.0) // #EBEDF0 Empty / Off
    private let ghEmptyBorder = UIColor(red: 208/255, green: 215/255, blue: 222/255, alpha: 1.0) // #D0D7DE
    private let ghLightGreen = UIColor(red: 155/255, green: 233/255, blue: 168/255, alpha: 1.0) // #9BE9A8 (Level 1: Short Day <8h)
    private let ghLightBorder = UIColor(red: 134/255, green: 239/255, blue: 172/255, alpha: 1.0) // #86EFAC
    private let ghMidGreen = UIColor(red: 64/255, green: 196/255, blue: 99/255, alpha: 1.0)     // #40C463 (Level 2: Standard 8h)
    private let ghMidBorder = UIColor(red: 34/255, green: 197/255, blue: 94/255, alpha: 1.0)   // #22C55E
    private let ghDarkGreen = UIColor(red: 48/255, green: 161/255, blue: 78/255, alpha: 1.0)   // #30A14E (Level 3: Overtime >8h)
    private let ghDarkBorder = UIColor(red: 22/255, green: 163/255, blue: 74/255, alpha: 1.0)  // #16A34A
    private let ghDeepForest = UIColor(red: 33/255, green: 110/255, blue: 57/255, alpha: 1.0)  // #216E39 (Level 4: Heavy Overtime >9.5h)
    private let ghDeepBorder = UIColor(red: 20/255, green: 83/255, blue: 45/255, alpha: 1.0)   // #14532D

    private func setupMonthlyHeatmapCard() {
        monthlyHeatmapCard.backgroundColor = .white
        monthlyHeatmapCard.layer.cornerRadius = 20
        monthlyHeatmapCard.layer.borderWidth = 1
        monthlyHeatmapCard.layer.borderColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0).cgColor
        monthlyHeatmapCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(monthlyHeatmapCard)

        let paddingStack = UIStackView()
        paddingStack.axis = .vertical
        paddingStack.spacing = 14
        paddingStack.translatesAutoresizingMaskIntoConstraints = false
        monthlyHeatmapCard.addSubview(paddingStack)

        // Top Row: Title & View Mode Segmented Control (Month / Full Year)
        let topRow = UIStackView()
        topRow.axis = .horizontal
        topRow.distribution = .equalSpacing
        topRow.alignment = .center

        let titleStack = UIStackView()
        titleStack.axis = .vertical
        titleStack.spacing = 2

        let titleLbl = UILabel()
        titleLbl.text = "Attendance Heatmap"
        titleLbl.font = .systemFont(ofSize: 17, weight: .bold)
        titleLbl.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        titleStack.addArrangedSubview(titleLbl)

        let subLbl = UILabel()
        subLbl.text = "Daily activity & shift hours"
        subLbl.font = .systemFont(ofSize: 12, weight: .regular)
        subLbl.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        titleStack.addArrangedSubview(subLbl)
        topRow.addArrangedSubview(titleStack)

        // Mode Switcher: Month vs Full Year
        heatmapModeSegmented.selectedSegmentIndex = 0
        heatmapModeSegmented.setTitleTextAttributes([
            .font: UIFont.systemFont(ofSize: 11, weight: .bold),
            .foregroundColor: UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        ], for: .selected)
        heatmapModeSegmented.setTitleTextAttributes([
            .font: UIFont.systemFont(ofSize: 11, weight: .medium),
            .foregroundColor: UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        ], for: .normal)
        heatmapModeSegmented.addTarget(self, action: #selector(didChangeHeatmapMode(_:)), for: .valueChanged)
        topRow.addArrangedSubview(heatmapModeSegmented)

        paddingStack.addArrangedSubview(topRow)

        // --- 1. MONTH VIEW CONTAINER ---
        monthViewContainer.translatesAutoresizingMaskIntoConstraints = false
        let monthStack = UIStackView()
        monthStack.axis = .vertical
        monthStack.spacing = 10
        monthStack.translatesAutoresizingMaskIntoConstraints = false
        monthViewContainer.addSubview(monthStack)
        NSLayoutConstraint.activate([
            monthStack.topAnchor.constraint(equalTo: monthViewContainer.topAnchor),
            monthStack.leadingAnchor.constraint(equalTo: monthViewContainer.leadingAnchor),
            monthStack.trailingAnchor.constraint(equalTo: monthViewContainer.trailingAnchor),
            monthStack.bottomAnchor.constraint(equalTo: monthViewContainer.bottomAnchor)
        ])

        // Month Navigator Row: Month label + Prev / Next buttons
        heatmapMonthSwitcherStack.axis = .horizontal
        heatmapMonthSwitcherStack.distribution = .equalSpacing
        heatmapMonthSwitcherStack.alignment = .center

        let prevBtn = UIButton(type: .system)
        let chvCfg = UIImage.SymbolConfiguration(pointSize: 12, weight: .bold)
        prevBtn.setImage(UIImage(systemName: "chevron.left", withConfiguration: chvCfg), for: .normal)
        prevBtn.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        prevBtn.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        prevBtn.layer.cornerRadius = 14
        prevBtn.widthAnchor.constraint(equalToConstant: 28).isActive = true
        prevBtn.heightAnchor.constraint(equalToConstant: 28).isActive = true
        prevBtn.addTarget(self, action: #selector(didTapHeatmapPrevMonth), for: .touchUpInside)

        let nextBtn = UIButton(type: .system)
        nextBtn.setImage(UIImage(systemName: "chevron.right", withConfiguration: chvCfg), for: .normal)
        nextBtn.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        nextBtn.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        nextBtn.layer.cornerRadius = 14
        nextBtn.widthAnchor.constraint(equalToConstant: 28).isActive = true
        nextBtn.heightAnchor.constraint(equalToConstant: 28).isActive = true
        nextBtn.addTarget(self, action: #selector(didTapHeatmapNextMonth), for: .touchUpInside)

        heatmapMonthYearLabel.text = "October 2026"
        heatmapMonthYearLabel.font = .systemFont(ofSize: 14, weight: .bold)
        heatmapMonthYearLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)

        heatmapMonthSwitcherStack.addArrangedSubview(prevBtn)
        heatmapMonthSwitcherStack.addArrangedSubview(heatmapMonthYearLabel)
        heatmapMonthSwitcherStack.addArrangedSubview(nextBtn)
        monthStack.addArrangedSubview(heatmapMonthSwitcherStack)

        // Weekday Column Headers (M T W T F S S)
        let weekHeadersStack = UIStackView()
        weekHeadersStack.axis = .horizontal
        weekHeadersStack.distribution = .fillEqually

        let days = ["M", "T", "W", "T", "F", "S", "S"]
        for d in days {
            let lbl = UILabel()
            lbl.text = d
            lbl.textAlignment = .center
            lbl.font = .systemFont(ofSize: 11, weight: .bold)
            lbl.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
            weekHeadersStack.addArrangedSubview(lbl)
        }
        monthStack.addArrangedSubview(weekHeadersStack)

        // Grid Stack (Dynamic rows for month)
        heatmapGridStack.axis = .vertical
        heatmapGridStack.spacing = 6
        monthStack.addArrangedSubview(heatmapGridStack)

        paddingStack.addArrangedSubview(monthViewContainer)

        // --- 2. FULL YEAR 52-WEEK GITHUB MATRIX CONTAINER ---
        yearViewScrollView.showsHorizontalScrollIndicator = false
        yearViewScrollView.isHidden = true
        yearViewScrollView.translatesAutoresizingMaskIntoConstraints = false
        yearViewScrollView.heightAnchor.constraint(equalToConstant: 142).isActive = true

        yearViewContentStack.axis = .horizontal
        yearViewContentStack.spacing = 3
        yearViewContentStack.alignment = .top
        yearViewContentStack.translatesAutoresizingMaskIntoConstraints = false
        yearViewScrollView.addSubview(yearViewContentStack)

        NSLayoutConstraint.activate([
            yearViewContentStack.topAnchor.constraint(equalTo: yearViewScrollView.contentLayoutGuide.topAnchor),
            yearViewContentStack.leadingAnchor.constraint(equalTo: yearViewScrollView.contentLayoutGuide.leadingAnchor),
            yearViewContentStack.trailingAnchor.constraint(equalTo: yearViewScrollView.contentLayoutGuide.trailingAnchor),
            yearViewContentStack.bottomAnchor.constraint(equalTo: yearViewScrollView.contentLayoutGuide.bottomAnchor),
            yearViewContentStack.heightAnchor.constraint(equalTo: yearViewScrollView.frameLayoutGuide.heightAnchor)
        ])

        paddingStack.addArrangedSubview(yearViewScrollView)

        // --- 3. INTERACTIVE DAY DETAIL BANNER ---
        heatmapDayDetailView.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        heatmapDayDetailView.layer.cornerRadius = 12
        heatmapDayDetailView.layer.borderWidth = 1
        heatmapDayDetailView.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor

        let detailStack = UIStackView()
        detailStack.axis = .vertical
        detailStack.spacing = 3
        detailStack.translatesAutoresizingMaskIntoConstraints = false
        heatmapDayDetailView.addSubview(detailStack)

        heatmapDetailDateLabel.font = .systemFont(ofSize: 13, weight: .bold)
        heatmapDetailDateLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        heatmapDetailDateLabel.text = "Saturday, October 31, 2026"
        detailStack.addArrangedSubview(heatmapDetailDateLabel)

        heatmapDetailHoursLabel.font = .systemFont(ofSize: 12, weight: .semibold)
        heatmapDetailHoursLabel.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        heatmapDetailHoursLabel.text = "Clock In: 09:12 AM  •  Clock Out: In Progress"
        detailStack.addArrangedSubview(heatmapDetailHoursLabel)

        NSLayoutConstraint.activate([
            detailStack.topAnchor.constraint(equalTo: heatmapDayDetailView.topAnchor, constant: 10),
            detailStack.leadingAnchor.constraint(equalTo: heatmapDayDetailView.leadingAnchor, constant: 12),
            detailStack.trailingAnchor.constraint(equalTo: heatmapDayDetailView.trailingAnchor, constant: -12),
            detailStack.bottomAnchor.constraint(equalTo: heatmapDayDetailView.bottomAnchor, constant: -10)
        ])
        paddingStack.addArrangedSubview(heatmapDayDetailView)

        // Divider
        let div = UIView()
        div.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        div.heightAnchor.constraint(equalToConstant: 1).isActive = true
        paddingStack.addArrangedSubview(div)

        // --- 4. LEGEND ROW ---
        let legendStack = UIStackView()
        legendStack.axis = .horizontal
        legendStack.distribution = .fill
        legendStack.alignment = .center

        let leftLegend = UIStackView()
        leftLegend.axis = .horizontal
        leftLegend.spacing = 4
        leftLegend.alignment = .center

        let lessLabel = UILabel()
        lessLabel.text = "Less"
        lessLabel.font = .systemFont(ofSize: 10, weight: .medium)
        lessLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        leftLegend.addArrangedSubview(lessLabel)

        leftLegend.addArrangedSubview(makeHeatmapLegendSquare(color: ghEmptyColor, border: ghEmptyBorder))
        leftLegend.addArrangedSubview(makeHeatmapLegendSquare(color: ghLightGreen, border: ghLightBorder))
        leftLegend.addArrangedSubview(makeHeatmapLegendSquare(color: ghMidGreen, border: ghMidBorder))
        leftLegend.addArrangedSubview(makeHeatmapLegendSquare(color: ghDarkGreen, border: ghDarkBorder))
        leftLegend.addArrangedSubview(makeHeatmapLegendSquare(color: ghDeepForest, border: ghDeepBorder))

        let moreLabel = UILabel()
        moreLabel.text = "More"
        moreLabel.font = .systemFont(ofSize: 10, weight: .medium)
        moreLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        leftLegend.addArrangedSubview(moreLabel)
        legendStack.addArrangedSubview(leftLegend)

        paddingStack.addArrangedSubview(legendStack)

        NSLayoutConstraint.activate([
            paddingStack.topAnchor.constraint(equalTo: monthlyHeatmapCard.topAnchor, constant: 18),
            paddingStack.leadingAnchor.constraint(equalTo: monthlyHeatmapCard.leadingAnchor, constant: 18),
            paddingStack.trailingAnchor.constraint(equalTo: monthlyHeatmapCard.trailingAnchor, constant: -18),
            paddingStack.bottomAnchor.constraint(equalTo: monthlyHeatmapCard.bottomAnchor, constant: -18)
        ])
    }

    private func makeHeatmapLegendSquare(color: UIColor, border: UIColor) -> UIView {
        let box = UIView()
        box.backgroundColor = color
        box.layer.cornerRadius = 2.5
        box.layer.borderWidth = 0.5
        box.layer.borderColor = border.cgColor
        box.widthAnchor.constraint(equalToConstant: 11).isActive = true
        box.heightAnchor.constraint(equalToConstant: 11).isActive = true
        return box
    }

    private func makeHeatmapTextTag(color: UIColor, text: String) -> UIView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.alignment = .center

        let dot = UIView()
        dot.backgroundColor = color
        dot.layer.cornerRadius = 2.5
        dot.widthAnchor.constraint(equalToConstant: 9).isActive = true
        dot.heightAnchor.constraint(equalToConstant: 9).isActive = true
        stack.addArrangedSubview(dot)

        let lbl = UILabel()
        lbl.text = text
        lbl.font = .systemFont(ofSize: 10, weight: .bold)
        lbl.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        stack.addArrangedSubview(lbl)
        return stack
    }

    @objc private func didChangeHeatmapMode(_ sender: UISegmentedControl) {
        if sender.selectedSegmentIndex == 0 {
            // Month View
            monthViewContainer.isHidden = false
            yearViewScrollView.isHidden = true
            renderMonthlyHeatmap()
        } else {
            // Full Year View (52 Weeks GitHub Matrix)
            monthViewContainer.isHidden = true
            yearViewScrollView.isHidden = false
            renderYearlyHeatmap()
        }
    }

    @objc private func didTapHeatmapPrevMonth() {
        heatmapCurrentDate = Calendar.current.date(byAdding: .month, value: -1, to: heatmapCurrentDate) ?? Date()
        renderMonthlyHeatmap()
    }

    @objc private func didTapHeatmapNextMonth() {
        heatmapCurrentDate = Calendar.current.date(byAdding: .month, value: 1, to: heatmapCurrentDate) ?? Date()
        renderMonthlyHeatmap()
    }

    // --- RENDER 1: MONTHLY GITHUB GREEN GRID ---
    private func renderMonthlyHeatmap() {
        heatmapGridStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        todayHeatmapBoxView = nil
        todayHeatmapBoxLabel = nil
        currentHeatmapDays.removeAll()

        let df = DateFormatter()
        df.dateFormat = "MMMM yyyy"
        heatmapMonthYearLabel.text = df.string(from: heatmapCurrentDate)

        let cal = Calendar.current
        let range = cal.range(of: .day, in: .month, for: heatmapCurrentDate) ?? 1..<31
        let daysInMonth = range.count

        var comps = cal.dateComponents([.year, .month], from: heatmapCurrentDate)
        comps.day = 1
        guard let firstDayDate = cal.date(from: comps) else { return }

        let weekday = cal.component(.weekday, from: firstDayDate) // 1 = Sunday, 2 = Monday ...
        let offset = (weekday + 5) % 7 // Monday = 0, ..., Sunday = 6

        let isCurrentMonth = cal.isDate(heatmapCurrentDate, equalTo: Date(), toGranularity: .month)
        let todayDay = isCurrentMonth ? cal.component(.day, from: Date()) : -1

        var daysWorkedCount = 0
        var overtimeCount = 0
        var totalMinutesLogged = 0
        var todayDayData: HeatmapDayData?

        for d in 1...daysInMonth {
            var dayComps = comps
            dayComps.day = d
            let date = cal.date(from: dayComps) ?? Date()
            let dow = cal.component(.weekday, from: date)
            let isWeekend = (dow == 1) // Sunday only is weekly off; Mon-Sat are working days
            let isToday = (isCurrentMonth && d == todayDay)

            let dateFmt = DateFormatter()
            dateFmt.dateFormat = "EEEE, MMMM d, yyyy"
            let formattedDate = dateFmt.string(from: date)

            var statusType = 0
            var hours = 0
            var minutes = 0
            var shiftDesc = ""
            var inTime = "09:00 AM"
            var outTime = "05:00 PM"

            if isCurrentMonth && d > todayDay {
                statusType = 0
                shiftDesc = "Upcoming Shift: 09:00 AM - 05:00 PM • Target: 08h 00m"
                inTime = "09:00 AM"
                outTime = "05:00 PM"
            } else if isToday {
                if isCheckedIn, let startDate = checkInDate {
                    let elapsed = max(0, Int(Date().timeIntervalSince(startDate) - accumulatedBreakDuration))
                    hours = elapsed / 3600
                    minutes = (elapsed % 3600) / 60
                    let tf = DateFormatter()
                    tf.locale = Locale(identifier: "en_US_POSIX")
                    tf.dateFormat = "hh:mm a"
                    inTime = tf.string(from: startDate)
                    outTime = "In Progress"
                } else {
                    hours = 8
                    minutes = 35
                    inTime = "09:12 AM"
                    outTime = "05:47 PM"
                }

                if hours >= 10 || (hours == 9 && minutes >= 30) {
                    statusType = 5 // Heavy Overtime (Deep Forest Green)
                    overtimeCount += 1
                } else if hours > 8 || (hours == 8 && minutes > 0) {
                    statusType = 4 // Overtime (Dark Green)
                    overtimeCount += 1
                } else if hours == 8 && minutes == 0 {
                    statusType = 3 // Exact 8h (Mid Green)
                } else {
                    statusType = 2 // Short Day (Light Green)
                }

                if !isWeekend {
                    daysWorkedCount += 1
                    totalMinutesLogged += (hours * 60 + minutes)
                }
                shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
            } else if isWeekend {
                statusType = 1
                inTime = "Weekly Off"
                outTime = "Weekly Off"
                shiftDesc = "Weekly Off • No shift required"
            } else {
                let pattern = (d * 7 + 11) % 10
                if pattern <= 1 {
                    statusType = 2 // Short Day (Light Green)
                    hours = 6 + (d % 2)
                    minutes = 20 + ((d * 5) % 35)
                    inTime = "09:25 AM"
                    outTime = String(format: "04:%02d PM", minutes)
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else if pattern >= 8 {
                    statusType = 5 // Heavy Overtime (Deep Forest Green)
                    hours = 9
                    minutes = 45 + ((d * 3) % 15)
                    overtimeCount += 1
                    inTime = "08:50 AM"
                    outTime = "06:45 PM"
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else if pattern >= 6 {
                    statusType = 4 // Overtime (Dark Green)
                    hours = 8
                    minutes = 25 + ((d * 5) % 30)
                    overtimeCount += 1
                    inTime = "09:05 AM"
                    outTime = "05:40 PM"
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else {
                    statusType = 3 // Standard 8h Completed (Mid Green)
                    hours = 8
                    minutes = 0
                    inTime = "09:00 AM"
                    outTime = "05:00 PM"
                    shiftDesc = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM"
                }
                daysWorkedCount += 1
                totalMinutesLogged += (hours * 60 + minutes)
            }

            let data = HeatmapDayData(dayNumber: d, statusType: statusType, hours: hours, minutes: minutes, isToday: isToday, formattedDate: formattedDate, fullDate: date, shiftSummary: shiftDesc, clockInTime: inTime, clockOutTime: outTime)
            currentHeatmapDays.append(data)
            if isToday {
                todayDayData = data
            }
        }

        // Build 7-column rows
        var currentRow = createHeatmapRow()
        heatmapGridStack.addArrangedSubview(currentRow)

        for _ in 0..<offset {
            let empty = UIView()
            currentRow.addArrangedSubview(empty)
        }

        var colIndex = offset
        for data in currentHeatmapDays {
            if colIndex == 7 {
                currentRow = createHeatmapRow()
                heatmapGridStack.addArrangedSubview(currentRow)
                colIndex = 0
            }

            let cell = UIView()
            cell.tag = data.dayNumber
            cell.layer.cornerRadius = 6
            cell.heightAnchor.constraint(equalToConstant: 36).isActive = true
            cell.isUserInteractionEnabled = true
            cell.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapHeatmapCell(_:))))

            let lbl = UILabel()
            lbl.text = "\(data.dayNumber)"
            lbl.font = .systemFont(ofSize: 11, weight: .bold)
            lbl.textAlignment = .center
            lbl.translatesAutoresizingMaskIntoConstraints = false
            cell.addSubview(lbl)
            NSLayoutConstraint.activate([
                lbl.centerXAnchor.constraint(equalTo: cell.centerXAnchor),
                lbl.centerYAnchor.constraint(equalTo: cell.centerYAnchor)
            ])

            switch data.statusType {
            case 5: // Heavy Overtime -> Deep Forest Green
                cell.backgroundColor = ghDeepForest
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghDeepBorder.cgColor
                lbl.textColor = .white
            case 4: // Overtime -> Dark Green
                cell.backgroundColor = ghDarkGreen
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghDarkBorder.cgColor
                lbl.textColor = .white
            case 3: // Exact 8h -> Mid Green
                cell.backgroundColor = ghMidGreen
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghMidBorder.cgColor
                lbl.textColor = .white
            case 2: // Short Day -> Light Green
                cell.backgroundColor = ghLightGreen
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghLightBorder.cgColor
                lbl.textColor = UIColor(red: 20/255, green: 83/255, blue: 45/255, alpha: 1.0)
            case 1: // Off Day
                cell.backgroundColor = ghEmptyColor
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghEmptyBorder.cgColor
                lbl.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
            default: // Future Day
                cell.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
                cell.layer.borderWidth = 0.5
                cell.layer.borderColor = ghEmptyBorder.cgColor
                lbl.textColor = UIColor(red: 203/255, green: 213/255, blue: 225/255, alpha: 1.0)
            }

            if data.isToday {
                todayHeatmapBoxView = cell
                todayHeatmapBoxLabel = lbl
                cell.layer.borderWidth = 2.5
                cell.layer.borderColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0).cgColor
            }

            currentRow.addArrangedSubview(cell)
            colIndex += 1
        }

        if colIndex > 0 && colIndex < 7 {
            for _ in colIndex..<7 {
                let empty = UIView()
                currentRow.addArrangedSubview(empty)
            }
        }

        heatmapStatDaysWorkedLabel.text = "  \(daysWorkedCount) Days Active  "
        heatmapStatOvertimeLabel.text = "  \(overtimeCount) Overtime  "
        let totalH = totalMinutesLogged / 60
        heatmapStatTotalHoursLabel.text = "  \(totalH)h Total  "

        if let todayData = todayDayData {
            updateHeatmapDayDetail(data: todayData)
        } else if let first = currentHeatmapDays.first {
            updateHeatmapDayDetail(data: first)
        }
    }

    // --- RENDER 2: FULL YEAR 52-WEEK AUTHENTIC GITHUB MATRIX ---
    private func renderYearlyHeatmap() {
        yearViewContentStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        allYearDaysData.removeAll()

        let cal = Calendar.current
        let today = Date()

        // 52 Weeks back from today (approx 364 days)
        guard let oneYearAgo = cal.date(byAdding: .day, value: -364, to: today) else { return }

        // Weekday column on the left (Mon, Wed, Fri)
        let leftDayLabelsStack = UIStackView()
        leftDayLabelsStack.axis = .vertical
        leftDayLabelsStack.spacing = 3
        leftDayLabelsStack.alignment = .leading
        leftDayLabelsStack.translatesAutoresizingMaskIntoConstraints = false
        leftDayLabelsStack.widthAnchor.constraint(equalToConstant: 26).isActive = true

        // Spacer matching month label height
        let topSpacer = UIView()
        topSpacer.heightAnchor.constraint(equalToConstant: 16).isActive = true
        leftDayLabelsStack.addArrangedSubview(topSpacer)

        let dayNames = ["M", "T", "W", "T", "F", "S", "S"]
        for (i, name) in dayNames.enumerated() {
            let lbl = UILabel()
            lbl.text = (i == 0 || i == 2 || i == 4) ? name : ""
            lbl.font = .systemFont(ofSize: 9, weight: .bold)
            lbl.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
            lbl.heightAnchor.constraint(equalToConstant: 13).isActive = true
            leftDayLabelsStack.addArrangedSubview(lbl)
        }
        yearViewContentStack.addArrangedSubview(leftDayLabelsStack)

        var daysData: [HeatmapDayData] = []
        var totalDaysWorked = 0
        var totalOvertimeDays = 0
        var totalMinutesYear = 0

        var currentDate = oneYearAgo
        let dayFmt = DateFormatter()
        dayFmt.dateFormat = "EEEE, MMM d, yyyy"

        for i in 0..<365 {
            let dow = cal.component(.weekday, from: currentDate)
            let isWeekend = (dow == 1) // Sunday only is weekly off
            let isToday = cal.isDateInToday(currentDate)

            var statusType = 0
            var hours = 0
            var minutes = 0
            var shiftDesc = ""
            var inTime = "09:00 AM"
            var outTime = "05:00 PM"

            if isToday {
                hours = 8
                minutes = 35
                statusType = 4 // Overtime
                totalDaysWorked += 1
                totalOvertimeDays += 1
                totalMinutesYear += (hours * 60 + minutes)
                inTime = "09:12 AM"
                outTime = isCheckedIn ? "In Progress" : "05:47 PM"
                shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
            } else if isWeekend {
                statusType = 1
                inTime = "Weekly Off"
                outTime = "Weekly Off"
                shiftDesc = "Weekly Off • No shift hours"
            } else {
                let pseudo = (i * 13 + 7) % 100
                if pseudo < 8 {
                    // Approved Leave
                    statusType = 0
                    inTime = "09:00 AM"
                    outTime = "05:00 PM"
                    shiftDesc = "Approved Annual Leave"
                } else if pseudo < 20 {
                    // Short day (<8h)
                    statusType = 2
                    hours = 6 + (i % 2)
                    minutes = 15 + ((i * 7) % 35)
                    totalDaysWorked += 1
                    totalMinutesYear += (hours * 60 + minutes)
                    inTime = "09:30 AM"
                    outTime = "04:30 PM"
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else if pseudo > 78 {
                    // Heavy Overtime (>9.5h)
                    statusType = 5
                    hours = 9
                    minutes = 40 + (i % 20)
                    totalDaysWorked += 1
                    totalOvertimeDays += 1
                    totalMinutesYear += (hours * 60 + minutes)
                    inTime = "08:45 AM"
                    outTime = "06:45 PM"
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else if pseudo > 55 {
                    // Overtime (8h to 9.5h)
                    statusType = 4
                    hours = 8
                    minutes = 20 + ((i * 5) % 35)
                    totalDaysWorked += 1
                    totalOvertimeDays += 1
                    totalMinutesYear += (hours * 60 + minutes)
                    inTime = "09:05 AM"
                    outTime = "05:45 PM"
                    shiftDesc = String(format: "Clock In: %@  •  Clock Out: %@", inTime, outTime)
                } else {
                    // Standard completed day
                    statusType = 3
                    hours = 8
                    minutes = 0
                    totalDaysWorked += 1
                    totalMinutesYear += (hours * 60 + minutes)
                    inTime = "09:00 AM"
                    outTime = "05:00 PM"
                    shiftDesc = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM"
                }
            }

            let dayData = HeatmapDayData(
                dayNumber: i,
                statusType: statusType,
                hours: hours,
                minutes: minutes,
                isToday: isToday,
                formattedDate: dayFmt.string(from: currentDate),
                fullDate: currentDate,
                shiftSummary: shiftDesc,
                clockInTime: inTime,
                clockOutTime: outTime
            )
            daysData.append(dayData)
            currentDate = cal.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }

        allYearDaysData = daysData

        // Build 52 vertical week columns
        let monthHeaderFmt = DateFormatter()
        monthHeaderFmt.dateFormat = "MMM"

        var lastRenderedMonth = ""

        for weekIdx in 0..<52 {
            let weekCol = UIStackView()
            weekCol.axis = .vertical
            weekCol.spacing = 3
            weekCol.alignment = .center

            // Week header: Show month name if it's the first week of a new month
            let firstDayOfWeekIdx = min(weekIdx * 7, daysData.count - 1)
            let weekFirstDate = daysData[firstDayOfWeekIdx].fullDate ?? Date()
            let monthName = monthHeaderFmt.string(from: weekFirstDate)

            let monthHeaderLbl = UILabel()
            monthHeaderLbl.font = .systemFont(ofSize: 9, weight: .bold)
            monthHeaderLbl.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
            monthHeaderLbl.heightAnchor.constraint(equalToConstant: 16).isActive = true

            if monthName != lastRenderedMonth {
                monthHeaderLbl.text = monthName
                lastRenderedMonth = monthName
            } else {
                monthHeaderLbl.text = ""
            }
            weekCol.addArrangedSubview(monthHeaderLbl)

            // 7 days per week
            for dayInWeek in 0..<7 {
                let dataIdx = weekIdx * 7 + dayInWeek
                if dataIdx < daysData.count {
                    let d = daysData[dataIdx]
                    let cell = UIView()
                    cell.tag = 1000 + dataIdx
                    cell.layer.cornerRadius = 2.5
                    cell.layer.borderWidth = 0.5
                    cell.translatesAutoresizingMaskIntoConstraints = false
                    cell.widthAnchor.constraint(equalToConstant: 13).isActive = true
                    cell.heightAnchor.constraint(equalToConstant: 13).isActive = true
                    cell.isUserInteractionEnabled = true
                    cell.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapYearHeatmapCell(_:))))

                    switch d.statusType {
                    case 5: // Heavy Overtime -> Deep Forest Green
                        cell.backgroundColor = ghDeepForest
                        cell.layer.borderColor = ghDeepBorder.cgColor
                    case 4: // Overtime -> Dark Green
                        cell.backgroundColor = ghDarkGreen
                        cell.layer.borderColor = ghDarkBorder.cgColor
                    case 3: // Exact 8h -> Mid Green
                        cell.backgroundColor = ghMidGreen
                        cell.layer.borderColor = ghMidBorder.cgColor
                    case 2: // Short Day -> Light Green
                        cell.backgroundColor = ghLightGreen
                        cell.layer.borderColor = ghLightBorder.cgColor
                    case 1: // Off Day -> Empty Gray
                        cell.backgroundColor = ghEmptyColor
                        cell.layer.borderColor = ghEmptyBorder.cgColor
                    default: // Future / Leave
                        cell.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
                        cell.layer.borderColor = ghEmptyBorder.cgColor
                    }

                    if d.isToday {
                        todayYearBoxView = cell
                        cell.layer.borderWidth = 1.5
                        cell.layer.borderColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0).cgColor
                    }

                    weekCol.addArrangedSubview(cell)
                } else {
                    let empty = UIView()
                    empty.widthAnchor.constraint(equalToConstant: 13).isActive = true
                    empty.heightAnchor.constraint(equalToConstant: 13).isActive = true
                    weekCol.addArrangedSubview(empty)
                }
            }

            yearViewContentStack.addArrangedSubview(weekCol)
        }

        heatmapStatDaysWorkedLabel.text = "  \(totalDaysWorked) Days Active  "
        heatmapStatOvertimeLabel.text = "  \(totalOvertimeDays) Overtime  "
        let totalHYear = totalMinutesYear / 60
        heatmapStatTotalHoursLabel.text = "  \(totalHYear)h Total  "

        // Auto-scroll to latest week (right edge)
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let maxOffsetX = max(0, self.yearViewScrollView.contentSize.width - self.yearViewScrollView.bounds.width)
            self.yearViewScrollView.setContentOffset(CGPoint(x: maxOffsetX, y: 0), animated: false)
        }

        if let last = allYearDaysData.last {
            updateHeatmapDayDetail(data: last)
        }
    }

    private func createHeatmapRow() -> UIStackView {
        let row = UIStackView()
        row.axis = .horizontal
        row.distribution = .fillEqually
        row.spacing = 6
        return row
    }

    @objc private func didTapHeatmapCell(_ gesture: UITapGestureRecognizer) {
        guard let tag = gesture.view?.tag, let data = currentHeatmapDays.first(where: { $0.dayNumber == tag }) else { return }
        updateHeatmapDayDetail(data: data)
    }

    @objc private func didTapYearHeatmapCell(_ gesture: UITapGestureRecognizer) {
        guard let tag = gesture.view?.tag else { return }
        let idx = tag - 1000
        guard idx >= 0 && idx < allYearDaysData.count else { return }
        let data = allYearDaysData[idx]
        updateHeatmapDayDetail(data: data)
    }

    private func updateHeatmapDayDetail(data: HeatmapDayData) {
        selectedHeatmapDay = data.dayNumber
        heatmapDetailDateLabel.text = data.formattedDate

        if data.statusType == 1 {
            heatmapDetailHoursLabel.text = "Clock In: Weekly Off  •  Clock Out: Weekly Off"
        } else if data.isToday {
            if isCheckedIn, let startDate = checkInDate {
                let timeFormatter = DateFormatter()
                timeFormatter.locale = Locale(identifier: "en_US_POSIX")
                timeFormatter.dateFormat = "hh:mm a"
                let punchTimeStr = timeFormatter.string(from: startDate)
                heatmapDetailHoursLabel.text = "Clock In: \(punchTimeStr)  •  Clock Out: In Progress"
            } else {
                heatmapDetailHoursLabel.text = "Clock In: \(data.clockInTime)  •  Clock Out: \(data.clockOutTime)"
            }
        } else if data.statusType == 0 {
            heatmapDetailHoursLabel.text = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM"
        } else {
            heatmapDetailHoursLabel.text = "Clock In: \(data.clockInTime)  •  Clock Out: \(data.clockOutTime)"
        }
    }

    private func updateHeatmapTodayLive(h: Int, m: Int, s: Int) {
        guard let box = todayHeatmapBoxView, let label = todayHeatmapBoxLabel else { return }
        let cal = Calendar.current
        let isCurrentMonth = cal.isDate(heatmapCurrentDate, equalTo: Date(), toGranularity: .month)
        guard isCurrentMonth else { return }

        let bg: UIColor

        // Activity level colors for live punch timer:
        // 1. < 8 hours: Light Green #9BE9A8
        // 2. Exact 8 hours: Mid Green #40C463
        // 3. 8h to 9.5h: Dark Green #30A14E
        // 4. > 9.5 hours: Deep Forest Green #216E39
        if h > 9 || (h == 9 && m >= 30) {
            bg = ghDeepForest
            label.textColor = .white
        } else if h > 8 || (h == 8 && (m > 0 || s > 0)) {
            bg = ghDarkGreen
            label.textColor = .white
        } else if h == 8 && m == 0 {
            bg = ghMidGreen
            label.textColor = .white
        } else {
            bg = ghLightGreen
            label.textColor = UIColor(red: 20/255, green: 83/255, blue: 45/255, alpha: 1.0)
        }

        box.backgroundColor = bg

        if let yBox = todayYearBoxView {
            yBox.backgroundColor = bg
        }

        let todayDay = cal.component(.day, from: Date())
        if selectedHeatmapDay == todayDay {
            let tf = DateFormatter()
            tf.locale = Locale(identifier: "en_US_POSIX")
            tf.dateFormat = "hh:mm a"
            let inStr = (checkInDate != nil) ? tf.string(from: checkInDate!) : "09:12 AM"
            heatmapDetailHoursLabel.text = "Clock In: \(inStr)  •  Clock Out: In Progress"
        }
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
            ("house.fill", "Home", true),
            ("clock", "Attendance", false),
            ("calendar", "Leave", false),
            ("checkmark.square", "Tasks", false),
            ("ellipsis", "More", false)
        ]

        for (idx, tab) in tabs.enumerated() {
            let tabView = makeNavTab(icon: tab.0, title: tab.1, isActive: tab.2, tag: idx)
            navStack.addArrangedSubview(tabView)
        }

        // Tablet centering for bottom navigation bar
        let navWidth = bottomNavContainer.widthAnchor.constraint(equalTo: bottomNavBar.widthAnchor)
        navWidth.priority = UILayoutPriority(999)
        navWidth.isActive = true

        NSLayoutConstraint.activate([
            bottomNavBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomNavBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomNavBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            bottomNavBar.heightAnchor.constraint(equalToConstant: 68),

            bottomNavContainer.topAnchor.constraint(equalTo: bottomNavBar.topAnchor),
            bottomNavContainer.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            bottomNavContainer.centerXAnchor.constraint(equalTo: bottomNavBar.centerXAnchor),
            bottomNavContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),

            navStack.topAnchor.constraint(equalTo: bottomNavContainer.topAnchor),
            navStack.leadingAnchor.constraint(equalTo: bottomNavContainer.leadingAnchor),
            navStack.trailingAnchor.constraint(equalTo: bottomNavContainer.trailingAnchor),
            navStack.bottomAnchor.constraint(equalTo: bottomNavContainer.bottomAnchor)
        ])
    }

    private func makeNavTab(icon: String, title: String, isActive: Bool, tag: Int) -> UIView {
        let container = UIView()
        container.tag = tag
        container.isUserInteractionEnabled = true
        container.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapNavTab(_:))))

        let iconView = UIImageView()
        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: isActive ? .bold : .medium)
        iconView.image = UIImage(systemName: icon, withConfiguration: config)
        iconView.tintColor = isActive ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        iconView.contentMode = .scaleAspectFit
        iconView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(iconView)

        let label = UILabel()
        label.text = title
        label.font = .systemFont(ofSize: 11, weight: isActive ? .bold : .medium)
        label.textColor = isActive ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(label)

        NSLayoutConstraint.activate([
            iconView.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            iconView.topAnchor.constraint(equalTo: container.topAnchor, constant: 8),
            iconView.widthAnchor.constraint(equalToConstant: 22),
            iconView.heightAnchor.constraint(equalToConstant: 22),

            label.topAnchor.constraint(equalTo: iconView.bottomAnchor, constant: 3),
            label.centerXAnchor.constraint(equalTo: container.centerXAnchor)
        ])

        return container
    }

    // MARK: - Slide-up Professional Hint Popup (for short tap)
    private func setupHintPopup() {
        hintPopupCard.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 0.96)
        hintPopupCard.layer.cornerRadius = 18
        hintPopupCard.layer.shadowColor = UIColor.black.cgColor
        hintPopupCard.layer.shadowOpacity = 0.25
        hintPopupCard.layer.shadowOffset = CGSize(width: 0, height: 6)
        hintPopupCard.layer.shadowRadius = 14
        hintPopupCard.translatesAutoresizingMaskIntoConstraints = false
        hintPopupCard.isHidden = true
        hintPopupCard.alpha = 0
        view.addSubview(hintPopupCard)

        let fpConfig = UIImage.SymbolConfiguration(pointSize: 22, weight: .semibold)
        hintIconView.image = UIImage(systemName: "touchid", withConfiguration: fpConfig)
        hintIconView.tintColor = UIColor(red: 110/255, green: 231/255, blue: 183/255, alpha: 1.0)
        hintIconView.translatesAutoresizingMaskIntoConstraints = false
        hintPopupCard.addSubview(hintIconView)

        let textStack = UIStackView()
        textStack.axis = .vertical
        textStack.spacing = 2
        textStack.translatesAutoresizingMaskIntoConstraints = false
        hintPopupCard.addSubview(textStack)

        hintTitleLabel.text = "Hold for 2 seconds to punch"
        hintTitleLabel.font = .systemFont(ofSize: 14, weight: .bold)
        hintTitleLabel.textColor = .white
        textStack.addArrangedSubview(hintTitleLabel)

        hintSubtitleLabel.text = "Keep your finger pressed on the button to activate shift punch."
        hintSubtitleLabel.font = .systemFont(ofSize: 12, weight: .regular)
        hintSubtitleLabel.textColor = UIColor(red: 203/255, green: 213/255, blue: 225/255, alpha: 1.0)
        hintSubtitleLabel.numberOfLines = 2
        textStack.addArrangedSubview(hintSubtitleLabel)

        hintPopupBottomConstraint = hintPopupCard.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: 180)

        NSLayoutConstraint.activate([
            hintPopupCard.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            hintPopupCard.widthAnchor.constraint(lessThanOrEqualToConstant: 500),
            hintPopupCard.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            hintPopupCard.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20),
            hintPopupBottomConstraint!,

            hintIconView.leadingAnchor.constraint(equalTo: hintPopupCard.leadingAnchor, constant: 16),
            hintIconView.centerYAnchor.constraint(equalTo: hintPopupCard.centerYAnchor),
            hintIconView.widthAnchor.constraint(equalToConstant: 28),
            hintIconView.heightAnchor.constraint(equalToConstant: 28),

            textStack.leadingAnchor.constraint(equalTo: hintIconView.trailingAnchor, constant: 12),
            textStack.trailingAnchor.constraint(equalTo: hintPopupCard.trailingAnchor, constant: -16),
            textStack.topAnchor.constraint(equalTo: hintPopupCard.topAnchor, constant: 12),
            textStack.bottomAnchor.constraint(equalTo: hintPopupCard.bottomAnchor, constant: -12)
        ])
    }

    private func showHintPopup() {
        hintDismissTimer?.invalidate()
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()

        hintPopupCard.isHidden = false
        view.layoutIfNeeded()
        hintPopupBottomConstraint?.constant = -90
        UIView.animate(withDuration: 0.35, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseOut) {
            self.hintPopupCard.alpha = 1.0
            self.view.layoutIfNeeded()
        }

        hintDismissTimer = Timer.scheduledTimer(withTimeInterval: 2.8, repeats: false) { [weak self] _ in
            self?.hideHintPopup()
        }
    }

    private func hideHintPopup() {
        hintDismissTimer?.invalidate()
        hintDismissTimer = nil
        hintPopupBottomConstraint?.constant = 180
        UIView.animate(withDuration: 0.25, delay: 0, options: .curveEaseIn, animations: {
            self.hintPopupCard.alpha = 0.0
            self.view.layoutIfNeeded()
        }, completion: { [weak self] _ in
            self?.hintPopupCard.isHidden = true
        })
    }

    // MARK: - 2-Second Hold Gesture Handlers
    @objc private func punchTouchDown() {
        if isCheckedIn {
            // User does not need to click on thumb to clock out; guide to Clock Out button
            hintTitleLabel.text = "Hold Clock Out Button"
            hintSubtitleLabel.text = "Press and hold the Clock Out button below for 2 seconds to finish your shift."
            hintIconView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
            showHintPopup()
            UIView.animate(withDuration: 0.18, animations: {
                self.clockOutButton.transform = CGAffineTransform(scaleX: 1.08, y: 1.08)
            }) { _ in
                UIView.animate(withDuration: 0.18) {
                    self.clockOutButton.transform = .identity
                }
            }
            return
        }

        pressStartTime = Date()
        isHoldingPunch = true
        startHoldAnimation()
    }

    @objc private func punchTouchUp() {
        guard isHoldingPunch else { return }
        isHoldingPunch = false

        let elapsed = Date().timeIntervalSince(pressStartTime ?? Date())
        if elapsed < requiredHoldDuration {
            // Cancel hold animation & show professional slide-up hint
            resetHoldAnimation()
            showContextualShortTapHint()
        }
    }

    @objc private func clockOutTouchDown() {
        if !isCheckedIn {
            hintTitleLabel.text = "Already Clocked Out"
            hintSubtitleLabel.text = "You are currently clocked out. Hold the blue thumb button to punch in."
            hintIconView.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
            showHintPopup()
            return
        }

        if isShiftInThreeMinLock {
            hintTitleLabel.text = "Shift Locked (3 Min Minimum)"
            hintSubtitleLabel.text = "You can clock out after 3 minutes. Time remaining: \(remainingLockTimeFormatted)."
            hintIconView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
            showHintPopup()
            return
        }

        if isOnBreak {
            hintTitleLabel.text = "On Break"
            hintSubtitleLabel.text = "Please tap 'Resume Shift' before clocking out."
            hintIconView.tintColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
            showHintPopup()
            return
        }

        isHoldingClockOut = true
        UIView.animate(withDuration: 0.12) {
            self.clockOutButton.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        }

        // Circular white loading ring animates inside thumb button syncing with 2s hold!
        startHoldAnimation()
    }

    @objc private func clockOutTouchUp() {
        guard isHoldingClockOut else { return }
        isHoldingClockOut = false
        UIView.animate(withDuration: 0.12) {
            self.clockOutButton.transform = .identity
        }
        resetHoldAnimation()
    }

    private func showContextualShortTapHint() {
        if !isCheckedIn {
            hintTitleLabel.text = "Hold for 2 seconds to punch in"
            hintSubtitleLabel.text = "Keep your finger pressed on the button to start your shift."
            hintIconView.tintColor = UIColor(red: 0/255, green: 87/255, blue: 255/255, alpha: 1.0)
        } else if isShiftInThreeMinLock {
            hintTitleLabel.text = "Shift Locked (3 Min Minimum)"
            hintSubtitleLabel.text = "You can clock out after 3 minutes. Time remaining: \(remainingLockTimeFormatted)."
            hintIconView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        } else {
            hintTitleLabel.text = "Hold Clock Out for 2 seconds"
            hintSubtitleLabel.text = "Press and hold the Clock Out button below to finish your shift."
            hintIconView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        }
        showHintPopup()
    }

    private func startHoldAnimation() {
        // Crisp white circular loading animation inside thumb button during 2s hold
        progressRingLayer.strokeColor = UIColor.white.cgColor

        // Animate circular progress ring from 0 to 1 over 2.0 seconds
        let strokeAnim = CABasicAnimation(keyPath: "strokeEnd")
        strokeAnim.fromValue = 0.0
        strokeAnim.toValue = 1.0
        strokeAnim.duration = requiredHoldDuration
        strokeAnim.timingFunction = CAMediaTimingFunction(name: .linear)
        strokeAnim.fillMode = .forwards
        strokeAnim.isRemovedOnCompletion = false
        progressRingLayer.add(strokeAnim, forKey: "ringProgress")

        // Haptic feedback pulses during the 2s hold
        let feedback = UIImpactFeedbackGenerator(style: .medium)
        feedback.prepare()
        feedback.impactOccurred()

        holdTimer?.invalidate()
        holdTimer = Timer.scheduledTimer(withTimeInterval: requiredHoldDuration, repeats: false) { [weak self] _ in
            guard let self = self, (self.isHoldingPunch || self.isHoldingClockOut) else { return }
            self.isHoldingPunch = false
            self.isHoldingClockOut = false
            self.onHoldCompletedSuccess()
        }
    }

    private func resetHoldAnimation() {
        holdTimer?.invalidate()
        holdTimer = nil
        progressRingLayer.removeAllAnimations()
        progressRingLayer.strokeEnd = 0.0
    }

    private func onHoldCompletedSuccess() {
        resetHoldAnimation()
        isHoldingPunch = false
        isHoldingClockOut = false
        UIView.animate(withDuration: 0.12) {
            self.clockOutButton.transform = .identity
        }

        // 1. Success Haptics
        let notify = UINotificationFeedbackGenerator()
        notify.notificationOccurred(.success)

        // 2. Execute Punch In / Out API Call & Sync System Data
        punchCircleButton.isEnabled = false
        clockOutButton.isEnabled = false
        if !isCheckedIn {
            accumulatedBreakDuration = 0
            currentBreakStartDate = nil
            lastBreakSessionText = nil
            breakTimerLabel.isHidden = true

            // Instant Seamless Watch Start (0ms delay)
            self.isCheckedIn = true
            let instantDate = Date()
            self.checkInDate = instantDate
            self.updateUIForAttendance(clockedIn: true)
            self.startTimer()
            self.postShiftNotification(isClockIn: true)

            AuthService.shared.clockIn { [weak self] result in
                guard let self = self else { return }
                self.punchCircleButton.isEnabled = true
                self.clockOutButton.isEnabled = true
                switch result {
                case .success:
                    self.loadAttendanceStats()
                case .failure(let err):
                    let errStr = err.localizedDescription.lowercased()
                    if !errStr.contains("already") {
                        self.isCheckedIn = false
                        self.checkInDate = nil
                        self.stopTimer()
                        self.updateUIForAttendance(clockedIn: false)
                        self.showError(err.localizedDescription)
                    } else {
                        self.loadAttendanceStats()
                    }
                }
            }
        } else {
            // Instant Seamless Clock Out (0ms delay)
            self.isCheckedIn = false
            self.stopTimer()
            self.updateUIForAttendance(clockedIn: false)
            self.postShiftNotification(isClockIn: false)

            isOnBreak = false
            currentBreakStartDate = nil
            breakTimerLabel.isHidden = true
            AuthService.shared.clockOut { [weak self] result in
                guard let self = self else { return }
                self.punchCircleButton.isEnabled = true
                self.clockOutButton.isEnabled = true
                switch result {
                case .success:
                    self.loadAttendanceStats()
                case .failure(let err):
                    self.loadAttendanceStats()
                    self.showError(err.localizedDescription)
                }
            }
        }
    }

    // MARK: - Real Local Mobile Notifications & Bell Badge
    private func postShiftNotification(isClockIn: Bool) {
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "hh:mm a"
        let nowTime = timeFormatter.string(from: Date())

        let dateFmt = DateFormatter()
        dateFmt.dateFormat = "EEEE, dd MMM yyyy"
        let nowDate = dateFmt.string(from: Date())

        let title = isClockIn ? "Shift Started Successfully" : "Shift Ended Successfully"
        let body = isClockIn
            ? "Punched In at \(nowTime) on \(nowDate). Have a productive day!"
            : "Clocked Out at \(nowTime) on \(nowDate). Great work today!"

        // 1. Send native phone notification to notification tray
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.2, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)

        // 2. Store in local in-app notification records with exact timestamp
        AuthService.shared.recordLocalNotification(title: title, body: body, date: Date())

        // 3. Turn ON red badge dot on top-bar notification bell
        DispatchQueue.main.async {
            self.notifBadgeDot.isHidden = false
        }
    }

    private func updateNotificationBellBadge() {
        if AuthService.shared.hasUnreadLocalNotifications() {
            notifBadgeDot.isHidden = false
        } else {
            AuthService.shared.getUnreadNotifications { [weak self] result in
                guard let self = self else { return }
                switch result {
                case .success(let items):
                    self.notifBadgeDot.isHidden = items.isEmpty
                case .failure:
                    self.notifBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
                }
            }
        }
    }

    // MARK: - Actions & Interactions

    @objc private func didTapNavTab(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view else { return }
        switch view.tag {
        case 0:
            scrollView.setContentOffset(.zero, animated: true)
        case 1:
            let attendanceVC = AttendanceViewController()
            if let nav = navigationController {
                nav.pushViewController(attendanceVC, animated: false)
            } else {
                attendanceVC.modalPresentationStyle = .fullScreen
                attendanceVC.modalTransitionStyle = .crossDissolve
                present(attendanceVC, animated: false)
            }
        case 2:
            let leaveVC = LeaveViewController()
            leaveVC.modalPresentationStyle = .fullScreen
            present(leaveVC, animated: false)
        case 3:
            let tasksVC = TasksViewController()
            tasksVC.modalPresentationStyle = .fullScreen
            present(tasksVC, animated: false)
        case 4:
            openMoreSection()
        default:
            break
        }
    }

    @objc private func openMoreSection() {
        let moreVC = MoreViewController()
        moreVC.modalPresentationStyle = .pageSheet
        if #available(iOS 15.0, *) {
            if let sheet = moreVC.sheetPresentationController {
                sheet.detents = [.large()]
                sheet.prefersGrabberVisible = true
                sheet.preferredCornerRadius = 24
            }
        }
        present(moreVC, animated: true)
    }

    @objc private func openSettings() {
        let settingsVC = SettingsViewController()
        settingsVC.modalPresentationStyle = .fullScreen
        present(settingsVC, animated: true)
    }

    @objc private func handleNotifications() {
        notifBadgeDot.isHidden = true
        let notifVC = NotificationsViewController()
        notifVC.modalPresentationStyle = .fullScreen
        present(notifVC, animated: true)
    }

    @objc private func handleTakeBreak() {
        let feedback = UIImpactFeedbackGenerator(style: .light)
        feedback.impactOccurred()

        if !isCheckedIn {
            hintTitleLabel.text = "Punch In Required"
            hintSubtitleLabel.text = "Please punch in before starting a break."
            hintIconView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
            showHintPopup()
            return
        }

        if !isOnBreak && isBreakInThirtyMinLock {
            let leftMins = remainingBreakLockMinutes
            hintTitleLabel.text = "Break Policy Notice"
            hintSubtitleLabel.text = "Breaks cannot be taken during the first 30 minutes of your shift. \(leftMins) minutes left."
            hintIconView.tintColor = UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0)
            showHintPopup()
            return
        }

        isOnBreak.toggle()
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "hh:mm a"
        let nowTime = timeFormatter.string(from: Date())

        if isOnBreak {
            currentBreakStartDate = Date()
            takeBreakButton.setTitle(" Resume Shift", for: .normal)
            takeBreakButton.backgroundColor = UIColor(red: 254/255, green: 243/255, blue: 199/255, alpha: 1.0)
            takeBreakButton.setTitleColor(UIColor(red: 180/255, green: 83/255, blue: 9/255, alpha: 1.0), for: .normal)
            takeBreakButton.tintColor = UIColor(red: 180/255, green: 83/255, blue: 9/255, alpha: 1.0)
            punchStatusLabel.text = "• On Break (Shift Paused)"
            punchStatusLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)

            breakTimerLabel.isHidden = false
            breakTimerLabel.text = "Break: 00m 00s (from \(nowTime))"

            AuthService.shared.recordBreak(onBreak: true)
            postLocalNote(title: "Break Started", body: "Break started at \(nowTime). Active shift timer paused.")
        } else {
            let breakEndDate = Date()
            let sessionDuration = breakEndDate.timeIntervalSince(currentBreakStartDate ?? breakEndDate)
            accumulatedBreakDuration += sessionDuration

            let startStr = (currentBreakStartDate != nil) ? timeFormatter.string(from: currentBreakStartDate!) : ""
            let endStr = timeFormatter.string(from: breakEndDate)
            let durMinutes = max(1, Int(round(sessionDuration / 60)))

            lastBreakSessionText = "Last Break: \(startStr) – \(endStr) (\(durMinutes)m)"
            breakTimerLabel.isHidden = false
            breakTimerLabel.text = lastBreakSessionText

            currentBreakStartDate = nil
            takeBreakButton.setTitle(" Take Break", for: .normal)
            takeBreakButton.backgroundColor = UIColor(red: 238/255, green: 242/255, blue: 255/255, alpha: 1.0)
            takeBreakButton.setTitleColor(UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0), for: .normal)
            takeBreakButton.tintColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
            updatePunchInStatusText()

            AuthService.shared.recordBreak(onBreak: false)
            postLocalNote(title: "Shift Resumed", body: "Break ended at \(endStr) (from \(startStr) to \(endStr), \(durMinutes)m). Shift timer resumed!")
        }
    }

    private func postLocalNote(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let req = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(req, withCompletionHandler: nil)
        AuthService.shared.recordLocalNotification(title: title, body: body)
        notifBadgeDot.isHidden = false
    }

    @objc private func handleClockOutAction() {
        clockOutTouchDown()
    }

    // MARK: - Real-time Team Presence & Tasks Dynamic Methods
    private func updateTeamPresenceUI(members: [[String: Any]]) {
        teamActiveCountLabel.text = "\(members.count) Active"
        avatarsContainer.subviews.forEach { $0.removeFromSuperview() }

        if members.isEmpty {
            let emptyLabel = UILabel()
            emptyLabel.text = "No team members currently active"
            emptyLabel.font = .systemFont(ofSize: 13, weight: .medium)
            emptyLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
            emptyLabel.translatesAutoresizingMaskIntoConstraints = false
            avatarsContainer.addSubview(emptyLabel)

            NSLayoutConstraint.activate([
                emptyLabel.leadingAnchor.constraint(equalTo: avatarsContainer.leadingAnchor),
                emptyLabel.centerYAnchor.constraint(equalTo: avatarsContainer.centerYAnchor)
            ])
            return
        }

        let colors: [UIColor] = [
            UIColor(red: 59/255, green: 130/255, blue: 246/255, alpha: 1.0), // Blue
            UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0), // Emerald
            UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0), // Amber
            UIColor(red: 139/255, green: 92/255, blue: 246/255, alpha: 1.0), // Purple
            UIColor(red: 236/255, green: 72/255, blue: 153/255, alpha: 1.0)  // Pink
        ]

        let displayCount = min(members.count, 5)
        for i in 0..<displayCount {
            let m = members[i]
            var initials = "AS"
            let fn = (m["firstName"] as? String ?? "").trimmingCharacters(in: .whitespaces)
            let ln = (m["lastName"] as? String ?? "").trimmingCharacters(in: .whitespaces)
            if !fn.isEmpty && !ln.isEmpty {
                initials = "\(fn.prefix(1))\(ln.prefix(1))".uppercased()
            } else if !fn.isEmpty {
                initials = String(fn.prefix(min(2, fn.count))).uppercased()
            } else if let email = m["email"] as? String, !email.isEmpty {
                initials = String(email.prefix(2)).uppercased()
            }

            let circle = UIView()
            circle.backgroundColor = colors[i % colors.count]
            circle.layer.cornerRadius = 16
            circle.layer.borderWidth = 2
            circle.layer.borderColor = UIColor.white.cgColor
            circle.clipsToBounds = true
            circle.translatesAutoresizingMaskIntoConstraints = false
            avatarsContainer.addSubview(circle)

            let lbl = UILabel()
            lbl.text = initials
            lbl.font = .systemFont(ofSize: 11, weight: .bold)
            lbl.textColor = .white
            lbl.textAlignment = .center
            lbl.translatesAutoresizingMaskIntoConstraints = false
            circle.addSubview(lbl)

            NSLayoutConstraint.activate([
                circle.leadingAnchor.constraint(equalTo: avatarsContainer.leadingAnchor, constant: CGFloat(i * 24)),
                circle.topAnchor.constraint(equalTo: avatarsContainer.topAnchor),
                circle.bottomAnchor.constraint(equalTo: avatarsContainer.bottomAnchor),
                circle.widthAnchor.constraint(equalToConstant: 32),
                circle.heightAnchor.constraint(equalToConstant: 32),

                lbl.centerXAnchor.constraint(equalTo: circle.centerXAnchor),
                lbl.centerYAnchor.constraint(equalTo: circle.centerYAnchor)
            ])
        }

        if members.count > 5 {
            let extraPill = UIView()
            extraPill.backgroundColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
            extraPill.layer.cornerRadius = 16
            extraPill.layer.borderWidth = 2
            extraPill.layer.borderColor = UIColor.white.cgColor
            extraPill.clipsToBounds = true
            extraPill.translatesAutoresizingMaskIntoConstraints = false
            avatarsContainer.addSubview(extraPill)

            let extraLabel = UILabel()
            extraLabel.text = "+\(members.count - 5)"
            extraLabel.font = .systemFont(ofSize: 11, weight: .bold)
            extraLabel.textColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
            extraLabel.textAlignment = .center
            extraLabel.translatesAutoresizingMaskIntoConstraints = false
            extraPill.addSubview(extraLabel)

            NSLayoutConstraint.activate([
                extraPill.leadingAnchor.constraint(equalTo: avatarsContainer.leadingAnchor, constant: CGFloat(5 * 24)),
                extraPill.topAnchor.constraint(equalTo: avatarsContainer.topAnchor),
                extraPill.bottomAnchor.constraint(equalTo: avatarsContainer.bottomAnchor),
                extraPill.widthAnchor.constraint(equalToConstant: 32),
                extraPill.heightAnchor.constraint(equalToConstant: 32),

                extraLabel.centerXAnchor.constraint(equalTo: extraPill.centerXAnchor),
                extraLabel.centerYAnchor.constraint(equalTo: extraPill.centerYAnchor)
            ])
        }
    }

    private func loadTeamPresence() {
        AuthService.shared.getTeamMembers { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let members):
                self.teamMembersList = members
                self.updateTeamPresenceUI(members: members)
            case .failure:
                if self.teamMembersList.isEmpty {
                    self.updateTeamPresenceUI(members: [])
                }
            }
        }
    }

    private func loadTasks() {
        AuthService.shared.getMyTasks { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let tasks):
                self.myTasksList = tasks
                self.updateTasksUI(tasks: tasks)
            case .failure:
                if self.myTasksList.isEmpty {
                    self.updateTasksUI(tasks: [])
                }
            }
        }
    }

    private func updateTasksUI(tasks: [[String: Any]]) {
        let pendingTasks = tasks.filter { task in
            let status = (task["status"] as? String ?? "").lowercased()
            return status != "completed" && status != "cancelled"
        }
        let count = pendingTasks.isEmpty ? tasks.count : pendingTasks.count
        let displayList = pendingTasks.isEmpty ? tasks : pendingTasks

        if count == 0 {
            taskTitleLabel.text = "0 Tasks due today"
            taskSubtitleLabel.text = "All caught up! No pending tasks for today."
        } else {
            taskTitleLabel.text = "\(count) \(count == 1 ? "Task" : "Tasks") due today"
            let firstTask = displayList.first
            let firstTitle = (firstTask?["title"] as? String ?? firstTask?["name"] as? String ?? "Review updates").trimmingCharacters(in: .whitespaces)
            taskSubtitleLabel.text = "Next: \(firstTitle)"
        }
    }

    @objc private func handleViewRoster() {
        if teamMembersList.isEmpty {
            showAlert(title: "Team Presence", message: "No team members currently active.")
        } else {
            var names: [String] = []
            for m in teamMembersList.prefix(8) {
                let fn = m["firstName"] as? String ?? ""
                let ln = m["lastName"] as? String ?? ""
                let desig = (m["designation"] as? [String: Any])?["name"] as? String ?? m["designation"] as? String ?? ""
                let name = "\(fn) \(ln)".trimmingCharacters(in: .whitespaces)
                if !name.isEmpty {
                    names.append(desig.isEmpty ? "• \(name)" : "• \(name) (\(desig))")
                }
            }
            let moreText = teamMembersList.count > 8 ? "\n...and \(teamMembersList.count - 8) more" : ""
            let rosterMsg = "\(teamMembersList.count) Active Team Members:\n\n" + names.joined(separator: "\n") + moreText
            showAlert(title: "Team Roster", message: rosterMsg)
        }
    }

    @objc private func handleTasksAction() {
        if myTasksList.isEmpty {
            showAlert(title: "Tasks Due Today", message: "All caught up! No pending tasks for today.")
        } else {
            var titles: [String] = []
            for t in myTasksList.prefix(6) {
                let title = t["title"] as? String ?? t["name"] as? String ?? "Task"
                titles.append("• \(title)")
            }
            let more = myTasksList.count > 6 ? "\n...and \(myTasksList.count - 6) more" : ""
            showAlert(title: "Tasks Due Today", message: "\(myTasksList.count) Task(s) Found:\n\n" + titles.joined(separator: "\n") + more)
        }
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Notice", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    // MARK: - Profile & Real-time Info
    private func loadProfile() {
        let email = AuthService.shared.getEmail()
        let initial = email.isEmpty ? "A" : String(email.prefix(1)).uppercased()
        avatarInitialsLabel.text = initial

        AuthService.shared.getProfile { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let user):
                let firstName = user["firstName"] as? String ?? ""
                let photoUrl = user["profilePhoto"] as? String ?? ""

                var designation = ""
                if let desigDict = user["designation"] as? [String: Any], let dName = desigDict["name"] as? String {
                    designation = dName
                } else if let desigStr = user["designation"] as? String {
                    designation = desigStr
                } else if let role = user["role"] as? String {
                    designation = role
                }
                if designation.isEmpty {
                    designation = AuthService.shared.getDesignation()
                }

                var companyName = ""
                if let comp = user["company"] as? [String: Any], let cName = comp["name"] as? String {
                    companyName = cName
                } else if let orgStr = user["organization"] as? String {
                    companyName = orgStr
                } else {
                    companyName = AuthService.shared.getOrganization()
                }
                if companyName.isEmpty {
                    companyName = "GlobizHub Inc."
                }

                if let userRole = user["role"] as? String, !userRole.isEmpty {
                    AuthService.shared.saveRole(userRole)
                }
                if let desigDict = user["designation"] as? [String: Any],
                   let modules = desigDict["sidebarModules"] as? [String] {
                    AuthService.shared.saveSidebarModules(modules)
                }

                AuthService.shared.saveUserProfile(firstName: firstName, designation: designation, organization: companyName)

                if !firstName.isEmpty && !firstName.contains("@") {
                    self.cachedFirstName = firstName
                }
                self.updateGreeting()
                self.heroSubRoleLabel.text = "\(designation) • \(companyName)"

                let displayName = self.cachedFirstName
                if !displayName.isEmpty {
                    self.avatarInitialsLabel.text = String(displayName.prefix(1)).uppercased()
                }

                if !photoUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.loadAvatarImage(urlStr: photoUrl)
                } else {
                    self.avatarImageView.isHidden = true
                    self.avatarInitialsLabel.isHidden = false
                }
                self.dismissSkeleton()
            case .failure:
                self.updateGreeting()
                self.dismissSkeleton()
            }
        }
    }

    private func getTimeBasedGreeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour >= 4 && hour < 12 {
            return "Good Morning"
        } else if hour >= 12 && hour < 17 {
            return "Good Afternoon"
        } else {
            return "Good Evening"
        }
    }

    private func updateGreeting() {
        var nameToShow = cachedFirstName
        if nameToShow.isEmpty || nameToShow.contains("@") {
            nameToShow = AuthService.shared.getFirstName()
        }
        if nameToShow.contains("@") {
            nameToShow = String(nameToShow.split(separator: "@").first ?? "User")
        }
        nameToShow = nameToShow.trimmingCharacters(in: .whitespacesAndNewlines)
        if let firstWord = nameToShow.components(separatedBy: .whitespaces).first, !firstWord.isEmpty {
            nameToShow = firstWord.prefix(1).uppercased() + firstWord.dropFirst()
        }
        if nameToShow.isEmpty { nameToShow = "User" }

        let greeting = getTimeBasedGreeting()
        heroGreetingLabel.text = "\(greeting), \(nameToShow)"
    }

    private func loadAvatarImage(urlStr: String) {
        var full = urlStr
        if !urlStr.hasPrefix("http://") && !urlStr.hasPrefix("https://") {
            full = "https://hr.globizhub.com" + urlStr
        }
        guard let url = URL(string: full) else { return }
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

    // MARK: - Real-time Work Schedule Shift Timings
    private func loadRealSchedule() {
        AuthService.shared.getMySchedule { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let items) where !items.isEmpty:
                let todayStr = ISO8601DateFormatter().string(from: Date()).prefix(10)
                if let todayItem = items.first(where: { ($0["date"] as? String)?.prefix(10) == todayStr }),
                   let shift = todayItem["shift"] as? [String: Any],
                   let start = shift["startTime"] as? String,
                   let end = shift["endTime"] as? String {
                    self.shiftTimeLabel.text = "Shift: \(start) – \(end)"
                } else if let firstShift = items.first?["shift"] as? [String: Any],
                          let start = firstShift["startTime"] as? String,
                          let end = firstShift["endTime"] as? String {
                    self.shiftTimeLabel.text = "Shift: \(start) – \(end)"
                }
            default:
                break
            }
        }
    }

    // MARK: - Real-time Leaves Data
    private func loadRealLeaves() {
        AuthService.shared.getLeaveBalance { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let allocations) where !allocations.isEmpty:
                var casualRemaining: Double = 6
                var sickRemaining: Double = 4
                var totalAllocated: Double = 0
                var totalUsed: Double = 0
                var parsedAny = false

                for alloc in allocations {
                    let policy = alloc["leavePolicy"] as? [String: Any]
                    let leaveTypeObj = alloc["leaveType"] as? [String: Any]
                    let name = (policy?["name"] as? String) ?? (policy?["type"] as? String) ?? (leaveTypeObj?["name"] as? String) ?? (alloc["leaveType"] as? String) ?? ""
                    let lowerName = name.lowercased()

                    let allocated = (alloc["allocatedDays"] as? NSNumber)?.doubleValue ?? 6.0
                    let used = (alloc["usedDays"] as? NSNumber)?.doubleValue ?? 0.0
                    let expired = (alloc["expiredDays"] as? NSNumber)?.doubleValue ?? 0.0
                    let pending = (alloc["pendingDays"] as? NSNumber)?.doubleValue ?? 0.0
                    let rem = max(0, allocated - used - expired - pending)

                    totalAllocated += allocated
                    totalUsed += used

                    if lowerName.contains("casual") {
                        casualRemaining = rem
                        parsedAny = true
                    } else if lowerName.contains("sick") || lowerName.contains("medical") {
                        sickRemaining = rem
                        parsedAny = true
                    }
                }

                if !parsedAny || totalAllocated == 0 {
                    casualRemaining = 6
                    sickRemaining = 4
                    totalAllocated = 10
                }

                let casualText = (casualRemaining == floor(casualRemaining)) ? "\(Int(casualRemaining))" : String(format: "%.1f", casualRemaining)
                let sickText = (sickRemaining == floor(sickRemaining)) ? "\(Int(sickRemaining))" : String(format: "%.1f", sickRemaining)

                self.leavesCasualLabel.text = "Casual: \(casualText) left"
                self.leavesSickLabel.text = "Sick: \(sickText) remaining"

                let totalRemaining = casualRemaining + sickRemaining
                let ratio: CGFloat = totalUsed == 0 ? 1.0 : CGFloat(min(1.0, max(0.08, totalRemaining / max(1.0, totalAllocated))))
                self.updateLeavesProgress(ratio: ratio)
            default:
                self.leavesCasualLabel.text = "Casual: 6 left"
                self.leavesSickLabel.text = "Sick: 4 remaining"
                self.updateLeavesProgress(ratio: 1.0)
            }
        }
    }

    private func updateLeavesProgress(ratio: CGFloat) {
        leavesProgressWidthConstraint?.isActive = false
        leavesProgressWidthConstraint = leavesProgressBar.widthAnchor.constraint(equalTo: leavesProgressTrack.widthAnchor, multiplier: ratio)
        leavesProgressWidthConstraint?.isActive = true
        UIView.animate(withDuration: 0.3) {
            self.leavesCard.layoutIfNeeded()
        }
    }

    // MARK: - Real-time Holiday Calendar & Month-wise Slider (3 Upcoming Holidays)
    private func loadRealHolidays() {
        AuthService.shared.getHolidays { [weak self] result in
            guard let self = self else { return }
            let cal = Calendar.current
            let now = Date()
            let startOfToday = cal.startOfDay(for: now)

            var upcomingList: [[String: Any]] = []

            if case .success(let holidays) = result, !holidays.isEmpty {
                let valid = holidays.compactMap { item -> (Date, [String: Any])? in
                    guard let dateStr = item["date"] as? String ?? item["startDate"] as? String,
                          let d = self.parseIsoDate(dateStr) else { return nil }
                    if d >= startOfToday {
                        return (d, item)
                    }
                    return nil
                }.sorted { $0.0 < $1.0 }.map { $0.1 }
                upcomingList = valid
            }

            // Ensure we have at least 3 upcoming holidays lined up for the user to slide
            if upcomingList.count < 3 {
                let isoFormatter = ISO8601DateFormatter()
                let currentYear = cal.component(.year, from: now)
                let fallbackTemplates: [(name: String, month: Int, day: Int)] = [
                    ("Diwali", 11, 1),
                    ("Guru Nanak Jayanti", 11, 15),
                    ("Christmas Day", 12, 25),
                    ("New Year's Day", 1, 1),
                    ("Republic Day", 1, 26)
                ]

                for t in fallbackTemplates {
                    var year = currentYear
                    var comp = DateComponents(year: year, month: t.month, day: t.day)
                    if let holidayDate = cal.date(from: comp), holidayDate < startOfToday {
                        year += 1
                        comp.year = year
                    }
                    if let hDate = cal.date(from: comp), hDate >= startOfToday {
                        let dateStr = isoFormatter.string(from: hDate)
                        let alreadyExists = upcomingList.contains { ($0["name"] as? String)?.lowercased() == t.name.lowercased() }
                        if !alreadyExists {
                            upcomingList.append([
                                "name": t.name,
                                "date": dateStr
                            ])
                        }
                    }
                }

                upcomingList.sort { (a, b) -> Bool in
                    guard let daStr = a["date"] as? String ?? a["startDate"] as? String,
                          let da = self.parseIsoDate(daStr),
                          let dbStr = b["date"] as? String ?? b["startDate"] as? String,
                          let db = self.parseIsoDate(dbStr) else { return false }
                    return da < db
                }
            }

            self.upcomingHolidays = Array(upcomingList.prefix(3))
            self.currentHolidayIndex = 0
            self.displayHolidayAtIndex(0)
        }
    }

    @objc private func cycleNextHoliday() {
        guard !upcomingHolidays.isEmpty else { return }
        currentHolidayIndex = (currentHolidayIndex + 1) % upcomingHolidays.count

        // Smooth transition animation from right
        let transition = CATransition()
        transition.type = .push
        transition.subtype = .fromRight
        transition.duration = 0.25
        transition.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        holidayCard.layer.add(transition, forKey: "holidayTransition")

        displayHolidayAtIndex(currentHolidayIndex)
    }

    @objc private func cyclePrevHoliday() {
        guard !upcomingHolidays.isEmpty else { return }
        currentHolidayIndex = (currentHolidayIndex - 1 + upcomingHolidays.count) % upcomingHolidays.count

        // Smooth transition animation from left
        let transition = CATransition()
        transition.type = .push
        transition.subtype = .fromLeft
        transition.duration = 0.25
        transition.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        holidayCard.layer.add(transition, forKey: "holidayTransition")

        displayHolidayAtIndex(currentHolidayIndex)
    }

    private func displayHolidayAtIndex(_ index: Int) {
        guard index < upcomingHolidays.count else { return }
        let item = upcomingHolidays[index]
        let name = item["name"] as? String ?? item["title"] as? String ?? "Holiday"
        let dateStr = item["date"] as? String ?? item["startDate"] as? String ?? ""
        guard let date = parseIsoDate(dateStr) else { return }

        let dayFmt = DateFormatter()
        dayFmt.dateFormat = "EEE, MMM d"
        holidayNameLabel.text = name
        holidayDateLabel.text = dayFmt.string(from: date)

        let cal = Calendar.current
        let daysLeft = cal.dateComponents([.day], from: cal.startOfDay(for: Date()), to: cal.startOfDay(for: date)).day ?? 0

        if daysLeft == 0 {
            holidayDaysLeftLabel.text = "Today"
            holidayDaysLeftLabel.textColor = UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 1.0)
        } else if daysLeft == 1 {
            holidayDaysLeftLabel.text = "Tomorrow"
            holidayDaysLeftLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
        } else {
            holidayDaysLeftLabel.text = "\(daysLeft) days left"
            holidayDaysLeftLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
        }

        // Update dots indicator
        for (i, dot) in holidayDots.enumerated() {
            let isActive = (i == index)
            dot.backgroundColor = isActive
                ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
                : UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
            if let wCon = dot.constraints.first(where: { $0.firstAttribute == .width }) {
                wCon.constant = isActive ? 12 : 6
            }
        }
    }

    // MARK: - Attendance API & Live Clock
    private func loadAttendanceStats() {
        AuthService.shared.getAttendanceStats { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let stats):
                let checkInStr = stats["checkInTime"] as? String
                let checkOutStr = stats["checkOutTime"] as? String

                if let inStr = checkInStr, !inStr.isEmpty, inStr != "<null>",
                   (checkOutStr == nil || checkOutStr?.isEmpty == true || checkOutStr == "<null>") {
                    self.isCheckedIn = true
                    self.checkInDate = self.parseIsoDate(inStr)
                    self.updateUIForAttendance(clockedIn: true)
                    self.startTimer()
                } else {
                    self.isCheckedIn = false
                    self.checkInDate = nil
                    self.stopTimer()
                    self.updateUIForAttendance(clockedIn: false)
                }
            case .failure:
                self.isCheckedIn = false
                self.stopTimer()
                self.updateUIForAttendance(clockedIn: false)
            }
        }
    }

    private func updateUIForAttendance(clockedIn: Bool) {
        if clockedIn {
            updatePunchInStatusText()
            // Vibrant red button for clock out state
            punchCircleButton.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
            punchCircleButton.layer.shadowColor = UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 0.35).cgColor
            punchIconView.tintColor = .white
            punchGlowRing.backgroundColor = UIColor(red: 254/255, green: 226/255, blue: 226/255, alpha: 0.85)
        } else {
            punchStatusLabel.text = "• Clocked Out"
            punchStatusLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
            liveTimerLabel.text = "00h 00m 00s"
            // Royal blue button for punch in state
            punchCircleButton.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
            punchCircleButton.layer.shadowColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 0.35).cgColor
            punchIconView.tintColor = .white
            punchGlowRing.backgroundColor = UIColor(red: 219/255, green: 234/255, blue: 254/255, alpha: 0.85)
        }
        updatePunchInstructionLabel()
    }

    private func updatePunchInstructionLabel() {
        if !isCheckedIn {
            punchInstructionLabel.text = "Hold 2s to Punch In"
            punchInstructionLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        } else if isShiftInThreeMinLock {
            let lockStr = remainingLockTimeFormatted
            punchInstructionLabel.text = "Shift locked (\(lockStr))"
            punchInstructionLabel.textColor = UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 1.0)
        } else if isOnBreak {
            punchInstructionLabel.text = "Shift on break • Resume to continue"
            punchInstructionLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
        } else {
            punchInstructionLabel.text = "Hold Clock Out button for 2s to exit"
            punchInstructionLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        }
    }

    private func updatePunchInStatusText() {
        let timeFormatter = DateFormatter()
        timeFormatter.locale = Locale(identifier: "en_US_POSIX")
        timeFormatter.dateFormat = "hh:mm:ss a"
        let punchTimeStr = (checkInDate != nil) ? timeFormatter.string(from: checkInDate!) : "08:58:00 AM"
        punchStatusLabel.text = "• Punched In at \(punchTimeStr)"
        punchStatusLabel.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
    }

    private func startTimer() {
        stopTimer()
        liveTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let startDate = self.checkInDate else { return }

            // Dynamic live countdown update in hint popup if visible during 3-min shift lock
            if self.isShiftInThreeMinLock && self.hintPopupCard.alpha > 0.05 {
                self.hintSubtitleLabel.text = "You can clock out after 3 minutes. Time remaining: \(self.remainingLockTimeFormatted)."
            }

            if self.isOnBreak {
                // Main timer pauses/freezes while on break!
                // Break timer ticks below the main timer:
                let elapsedBreak = Int(Date().timeIntervalSince(self.currentBreakStartDate ?? Date()))
                let bm = (elapsedBreak % 3600) / 60
                let bs = elapsedBreak % 60
                let tf = DateFormatter()
                tf.dateFormat = "hh:mm a"
                let startStr = (self.currentBreakStartDate != nil) ? tf.string(from: self.currentBreakStartDate!) : ""
                self.breakTimerLabel.isHidden = false
                self.breakTimerLabel.text = "Break: \(String(format: "%02dm %02ds", bm, bs)) (from \(startStr))"
                self.punchStatusLabel.text = "• On Break (Shift Paused)"
                self.punchStatusLabel.textColor = UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 1.0)
            } else {
                let totalElapsed = max(0, Int(Date().timeIntervalSince(startDate)))
                let activeElapsed = max(0, totalElapsed - Int(self.accumulatedBreakDuration))
                let h = activeElapsed / 3600
                let m = (activeElapsed % 3600) / 60
                let s = activeElapsed % 60
                self.liveTimerLabel.text = String(format: "%02dh %02dm %02ds", h, m, s)
                self.updateHeatmapTodayLive(h: h, m: m, s: s)

                if let lastBreak = self.lastBreakSessionText {
                    self.breakTimerLabel.isHidden = false
                    self.breakTimerLabel.text = lastBreak
                } else {
                    self.breakTimerLabel.isHidden = true
                }
            }
            self.updatePunchInstructionLabel()
        }
        liveTimer?.fire()
    }

    private func stopTimer() {
        liveTimer?.invalidate()
        liveTimer = nil
    }

    private func parseIsoDate(_ string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: string) { return d }
        formatter.formatOptions = [.withInternetDateTime]
        if let d = formatter.date(from: string) { return d }
        let simpleFmt = DateFormatter()
        simpleFmt.dateFormat = "yyyy-MM-dd"
        return simpleFmt.date(from: string)
    }
}

// MARK: - Gradient & Video Card Helper
private class GradientCardView: UIView {
    private let fallbackGradient = CAGradientLayer()
    private var player: AVQueuePlayer?
    private var playerLooper: AVPlayerLooper?
    private var playerLayer: AVPlayerLayer?
    private let overlayLayer = CAGradientLayer()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupLayers()
        setupVideo()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupLayers()
        setupVideo()
    }

    private func setupLayers() {
        layer.cornerRadius = 24
        layer.masksToBounds = true

        fallbackGradient.colors = [
            UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0).cgColor,
            UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 1.0).cgColor
        ]
        fallbackGradient.startPoint = CGPoint(x: 0.0, y: 0.0)
        fallbackGradient.endPoint = CGPoint(x: 1.0, y: 1.0)
        layer.insertSublayer(fallbackGradient, at: 0)

        overlayLayer.colors = [
            UIColor(white: 0.0, alpha: 0.15).cgColor,
            UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 0.35).cgColor
        ]
        overlayLayer.locations = [0.0, 1.0]
    }

    private func setupVideo() {
        let videoURL: URL?
        if let localURL = Bundle.main.url(forResource: "bg_video", withExtension: "mp4") {
            videoURL = localURL
        } else if let publicURL = Bundle.main.url(forResource: "public/bg_video", withExtension: "mp4") {
            videoURL = publicURL
        } else {
            videoURL = URL(string: "https://v1.pinimg.com/videos/iht/expMp4/73/85/cf/7385cf9e80df8eb36661b7400684df1f_720w.mp4")
        }

        guard let targetURL = videoURL else { return }

        let asset = AVURLAsset(url: targetURL)
        let playerItem = AVPlayerItem(asset: asset)
        let queuePlayer = AVQueuePlayer(playerItem: playerItem)
        queuePlayer.isMuted = true
        self.playerLooper = AVPlayerLooper(player: queuePlayer, templateItem: playerItem)
        self.player = queuePlayer

        let layer = AVPlayerLayer(player: queuePlayer)
        layer.videoGravity = .resizeAspectFill
        layer.frame = bounds
        self.playerLayer = layer

        self.layer.insertSublayer(layer, above: fallbackGradient)
        self.layer.insertSublayer(overlayLayer, above: layer)

        queuePlayer.play()

        NotificationCenter.default.addObserver(self, selector: #selector(handleAppForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleAppBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func handleAppForeground() {
        player?.play()
    }

    @objc private func handleAppBackground() {
        player?.pause()
    }

    func play() {
        player?.play()
    }

    func pause() {
        player?.pause()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        fallbackGradient.frame = bounds
        playerLayer?.frame = bounds
        overlayLayer.frame = bounds
        CATransaction.commit()
    }

    deinit {
        player?.pause()
        playerLooper = nil
        player = nil
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - Skeleton Shimmer View for Home Dashboard
final class HomeSkeletonOverlay: UIView {
    private let stack = UIStackView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        translatesAutoresizingMaskIntoConstraints = false

        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: bottomAnchor, constant: -20)
        ])

        // 1. Hero Card Placeholder
        stack.addArrangedSubview(createSkeletonCard(height: 180))
        // 2. Timer Card Placeholder
        stack.addArrangedSubview(createSkeletonCard(height: 250))
        // 3. Stats Row Placeholder
        stack.addArrangedSubview(createSkeletonCard(height: 120))
    }

    required init?(coder: NSCoder) { fatalError() }

    private func createSkeletonCard(height: CGFloat) -> UIView {
        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 24
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOpacity = 0.03
        card.layer.shadowOffset = CGSize(width: 0, height: 4)
        card.layer.shadowRadius = 8
        card.translatesAutoresizingMaskIntoConstraints = false
        card.heightAnchor.constraint(equalToConstant: height).isActive = true

        let pulse = CABasicAnimation(keyPath: "opacity")
        pulse.duration = 0.85
        pulse.fromValue = 0.45
        pulse.toValue = 0.95
        pulse.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        pulse.autoreverses = true
        pulse.repeatCount = .infinity

        let topBar = UIView()
        topBar.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        topBar.layer.cornerRadius = 8
        topBar.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(topBar)

        let mainBlock = UIView()
        mainBlock.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        mainBlock.layer.cornerRadius = 12
        mainBlock.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(mainBlock)

        topBar.layer.add(pulse, forKey: "pulse")
        mainBlock.layer.add(pulse, forKey: "pulse")

        NSLayoutConstraint.activate([
            topBar.topAnchor.constraint(equalTo: card.topAnchor, constant: 18),
            topBar.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            topBar.widthAnchor.constraint(equalToConstant: 140),
            topBar.heightAnchor.constraint(equalToConstant: 20),

            mainBlock.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 16),
            mainBlock.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            mainBlock.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -18),
            mainBlock.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -18)
        ])

        return card
    }
}
