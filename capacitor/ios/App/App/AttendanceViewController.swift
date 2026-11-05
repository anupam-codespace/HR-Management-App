import UIKit

class AttendanceViewController: UIViewController {

    // MARK: - Properties & State
    private let scrollView = UIScrollView()
    private let contentView = UIView()
    private let cardsStackView = UIStackView()

    // Top Bar
    private let topBar = UIView()
    private let topBarTitleLabel = UILabel()
    private let notificationBellButton = UIButton(type: .system)
    private let notificationBadgeDot = UIView()
    private let avatarContainer = UIView()
    private let avatarImageView = UIImageView()
    private let avatarInitialsLabel = UILabel()

    // Segmented Switcher (My Attendance vs Regularization)
    private let tabSegmentedContainer = UIView()
    private let tabIndicatorPill = UIView()
    private var pillLeadingConstraint: NSLayoutConstraint?
    private let myAttendanceTabBtn = UIButton(type: .system)
    private let regularizationTabBtn = UIButton(type: .system)
    private var isRegularizationActive = false

    // Color Palette matching Android and Reference
    private let colorPresent = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0) // #10B981
    private let colorLate = UIColor(red: 245/255, green: 158/255, blue: 11/255, alpha: 1.0)    // #F59E0B
    private let colorAbsent = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)   // #EF4444
    private let colorToday = UIColor(red: 0/255, green: 87/255, blue: 255/255, alpha: 1.0)    // #0057FF

    // Skeleton Loading Overlay
    private let skeletonOverlay = AttendanceSkeletonOverlay()
    private var hasDismissedSkeleton = false

    // Calendar State
    private var calendar = Calendar.current
    private var currentDisplayDate = Date()
    private var selectedDate = Date()
    private var attendanceRecords: [String: [String: Any]] = [:] // Key: "yyyy-MM-dd"

    private var liveTimer: Timer?

    // Calendar UI Elements
    private let calendarCard = UIView()
    private let monthYearLabel = UILabel()
    private let prevMonthBtn = UIButton(type: .system)
    private let nextMonthBtn = UIButton(type: .system)
    private let calendarGridStack = UIStackView()

    // Selected Record UI Elements
    private let selectedRecordCard = UIView()
    private let selectedDateTitleLabel = UILabel()
    private let shiftBadgeLabel = UILabel()
    private let clockInTimeLabel = UILabel()
    private let clockInDeviceLabel = UILabel()
    private let clockOutTimeLabel = UILabel()
    private let clockOutDeviceLabel = UILabel()
    private let totalDurationLabel = UILabel()
    private let overtimePill = UIView()
    private let overtimeLabel = UILabel()

    // Weekly Timeline UI Elements
    private let weeklyTimelineCard = UIView()
    private let weeklyBarsStack = UIStackView()
    private let accumulatedHoursLabel = UILabel()
    private let quotaStatusLabel = UILabel()

    // Geo-Fenced Card & Action Button
    private let geoCard = UIView()
    private let requestRegularizationBtn = UIButton(type: .system)

    // Regularization View (Displayed when Regularization tab is selected)
    private let regularizationView = UIView()

    // Bottom Navigation Bar
    private let bottomNavBar = UIView()
    private let bottomNavContainer = UIView()

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
        navigationController?.setNavigationBarHidden(true, animated: false)

        calendar.firstWeekday = 2 // Monday is first day of week

        setupTopBar()
        setupSwitcherTabs()
        setupScrollView()
        setupCalendarCard()
        setupSelectedRecordCard()
        setupWeeklyTimelineCard()
        setupGeoCard()
        setupRequestRegularizationButton()
        setupRegularizationView()
        setupBottomNavBar()

        updateCalendarGrid()
        updateSelectedRecordUI()
        updateWeeklyTimelineUI()

        NotificationCenter.default.addObserver(self, selector: #selector(handleNotificationBadgeChanged), name: AppNotificationManager.notificationBadgeChangedNotification, object: nil)
    }

    @objc private func handleNotificationBadgeChanged() {
        notificationBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        loadAttendanceData()
        loadUserProfile()
        updateNotificationBadge()
        updateSelectedRecordUI()
        updateWeeklyTimelineUI()

        liveTimer?.invalidate()
        liveTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if AuthService.shared.getLocalAttendanceStatus() == "CLOCKED_IN" {
                self.updateSelectedRecordUI()
                self.updateWeeklyTimelineUI()
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        liveTimer?.invalidate()
        liveTimer = nil
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

        let topBarContainer = UIView()
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

        topBarTitleLabel.text = "Attendance"
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
        avatarContainer.backgroundColor = UIColor(red: 191/255, green: 219/255, blue: 254/255, alpha: 1.0)
        avatarContainer.layer.cornerRadius = 18
        avatarContainer.layer.masksToBounds = true
        avatarContainer.isUserInteractionEnabled = true
        avatarContainer.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapAvatar)))
        avatarContainer.translatesAutoresizingMaskIntoConstraints = false
        rightActionsStack.addArrangedSubview(avatarContainer)

        avatarInitialsLabel.text = "A"
        avatarInitialsLabel.font = .systemFont(ofSize: 14, weight: .bold)
        avatarInitialsLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        avatarInitialsLabel.textAlignment = .center
        avatarInitialsLabel.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarInitialsLabel)

        avatarImageView.contentMode = .scaleAspectFill
        avatarImageView.isHidden = true
        avatarImageView.translatesAutoresizingMaskIntoConstraints = false
        avatarContainer.addSubview(avatarImageView)

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

            notificationBellButton.widthAnchor.constraint(equalToConstant: 36),
            notificationBellButton.heightAnchor.constraint(equalToConstant: 36),

            notificationBadgeDot.topAnchor.constraint(equalTo: notificationBellButton.topAnchor, constant: 5),
            notificationBadgeDot.trailingAnchor.constraint(equalTo: notificationBellButton.trailingAnchor, constant: -4),
            notificationBadgeDot.widthAnchor.constraint(equalToConstant: 8),
            notificationBadgeDot.heightAnchor.constraint(equalToConstant: 8),

            avatarContainer.widthAnchor.constraint(equalToConstant: 36),
            avatarContainer.heightAnchor.constraint(equalToConstant: 36),

            avatarInitialsLabel.centerXAnchor.constraint(equalTo: avatarContainer.centerXAnchor),
            avatarInitialsLabel.centerYAnchor.constraint(equalTo: avatarContainer.centerYAnchor),

            avatarImageView.topAnchor.constraint(equalTo: avatarContainer.topAnchor),
            avatarImageView.leadingAnchor.constraint(equalTo: avatarContainer.leadingAnchor),
            avatarImageView.trailingAnchor.constraint(equalTo: avatarContainer.trailingAnchor),
            avatarImageView.bottomAnchor.constraint(equalTo: avatarContainer.bottomAnchor)
        ])
    }

    // MARK: - Switcher Tabs (My Attendance vs Regularization)
    private func setupSwitcherTabs() {
        tabSegmentedContainer.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        tabSegmentedContainer.layer.cornerRadius = 24
        tabSegmentedContainer.layer.masksToBounds = true
        tabSegmentedContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tabSegmentedContainer)

        tabIndicatorPill.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        tabIndicatorPill.layer.cornerRadius = 20
        tabIndicatorPill.layer.shadowColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 0.25).cgColor
        tabIndicatorPill.layer.shadowOpacity = 0.2
        tabIndicatorPill.layer.shadowOffset = CGSize(width: 0, height: 2)
        tabIndicatorPill.layer.shadowRadius = 4
        tabIndicatorPill.translatesAutoresizingMaskIntoConstraints = false
        tabSegmentedContainer.addSubview(tabIndicatorPill)

        let stack = UIStackView()
        stack.axis = .horizontal
        stack.distribution = .fillEqually
        stack.spacing = 0
        stack.translatesAutoresizingMaskIntoConstraints = false
        tabSegmentedContainer.addSubview(stack)

        myAttendanceTabBtn.setTitle("My Attendance", for: .normal)
        myAttendanceTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .bold)
        myAttendanceTabBtn.setTitleColor(.white, for: .normal)
        myAttendanceTabBtn.backgroundColor = .clear
        myAttendanceTabBtn.addTarget(self, action: #selector(didSelectMyAttendanceTab), for: .touchUpInside)
        stack.addArrangedSubview(myAttendanceTabBtn)

        regularizationTabBtn.setTitle("Regularization", for: .normal)
        regularizationTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        regularizationTabBtn.setTitleColor(UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0), for: .normal)
        regularizationTabBtn.backgroundColor = .clear
        regularizationTabBtn.addTarget(self, action: #selector(didSelectRegularizationTab), for: .touchUpInside)
        stack.addArrangedSubview(regularizationTabBtn)

        let tabWidth = tabSegmentedContainer.widthAnchor.constraint(equalTo: view.widthAnchor, constant: -32)
        tabWidth.priority = UILayoutPriority(999)
        tabWidth.isActive = true

        let leadingConstraint = tabIndicatorPill.leadingAnchor.constraint(equalTo: tabSegmentedContainer.leadingAnchor, constant: 4)
        self.pillLeadingConstraint = leadingConstraint

        NSLayoutConstraint.activate([
            tabSegmentedContainer.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 14),
            tabSegmentedContainer.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            tabSegmentedContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),
            tabSegmentedContainer.heightAnchor.constraint(equalToConstant: 48),

            tabIndicatorPill.topAnchor.constraint(equalTo: tabSegmentedContainer.topAnchor, constant: 4),
            tabIndicatorPill.bottomAnchor.constraint(equalTo: tabSegmentedContainer.bottomAnchor, constant: -4),
            tabIndicatorPill.widthAnchor.constraint(equalTo: tabSegmentedContainer.widthAnchor, multiplier: 0.5, constant: -4),
            leadingConstraint,

            stack.topAnchor.constraint(equalTo: tabSegmentedContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: tabSegmentedContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: tabSegmentedContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: tabSegmentedContainer.bottomAnchor)
        ])
    }

    // MARK: - Scroll View & Main Container
    private func setupScrollView() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.showsVerticalScrollIndicator = false
        view.addSubview(scrollView)

        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)

        cardsStackView.axis = .vertical
        cardsStackView.spacing = 16
        cardsStackView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(cardsStackView)

        let contentWidth = contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor)
        contentWidth.priority = UILayoutPriority(999)
        contentWidth.isActive = true

        contentView.addSubview(skeletonOverlay)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: tabSegmentedContainer.bottomAnchor, constant: 10),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -68),

            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor),
            contentView.widthAnchor.constraint(lessThanOrEqualToConstant: 680),

            cardsStackView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
            cardsStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            cardsStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            cardsStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -24),

            skeletonOverlay.topAnchor.constraint(equalTo: contentView.topAnchor),
            skeletonOverlay.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            skeletonOverlay.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            skeletonOverlay.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])
    }

    // MARK: - 1. Monthly Interactive Calendar Card
    private func setupCalendarCard() {
        calendarCard.backgroundColor = .white
        calendarCard.layer.cornerRadius = 24
        calendarCard.layer.shadowColor = UIColor.black.cgColor
        calendarCard.layer.shadowOpacity = 0.04
        calendarCard.layer.shadowOffset = CGSize(width: 0, height: 4)
        calendarCard.layer.shadowRadius = 12
        calendarCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(calendarCard)

        let paddingStack = UIStackView()
        paddingStack.axis = .vertical
        paddingStack.spacing = 16
        paddingStack.translatesAutoresizingMaskIntoConstraints = false
        calendarCard.addSubview(paddingStack)

        // Header: Calendar Icon + Month Year + Nav Arrows
        let headerRow = UIStackView()
        headerRow.axis = .horizontal
        headerRow.alignment = .center
        headerRow.distribution = .equalSpacing

        let leftTitleStack = UIStackView()
        leftTitleStack.axis = .horizontal
        leftTitleStack.spacing = 8
        leftTitleStack.alignment = .center

        let calIcon = UIImageView(image: UIImage(systemName: "calendar"))
        calIcon.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        calIcon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            calIcon.widthAnchor.constraint(equalToConstant: 20),
            calIcon.heightAnchor.constraint(equalToConstant: 20)
        ])
        leftTitleStack.addArrangedSubview(calIcon)

        monthYearLabel.font = .systemFont(ofSize: 18, weight: .bold)
        monthYearLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        monthYearLabel.isUserInteractionEnabled = true
        monthYearLabel.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(didTapMonthYearPicker)))
        leftTitleStack.addArrangedSubview(monthYearLabel)
        headerRow.addArrangedSubview(leftTitleStack)

        let arrowsStack = UIStackView()
        arrowsStack.axis = .horizontal
        arrowsStack.spacing = 16

        let leftConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .semibold)
        prevMonthBtn.setImage(UIImage(systemName: "chevron.left", withConfiguration: leftConfig), for: .normal)
        prevMonthBtn.tintColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        prevMonthBtn.addTarget(self, action: #selector(didTapPrevMonth), for: .touchUpInside)
        arrowsStack.addArrangedSubview(prevMonthBtn)

        nextMonthBtn.setImage(UIImage(systemName: "chevron.right", withConfiguration: leftConfig), for: .normal)
        nextMonthBtn.tintColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        nextMonthBtn.addTarget(self, action: #selector(didTapNextMonth), for: .touchUpInside)
        arrowsStack.addArrangedSubview(nextMonthBtn)

        headerRow.addArrangedSubview(arrowsStack)
        paddingStack.addArrangedSubview(headerRow)

        // Day of week labels: Mon  Tue  Wed  Thu  Fri  Sat (Monday to Saturday shift days)
        let dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let daysHeaderStack = UIStackView()
        daysHeaderStack.axis = .horizontal
        daysHeaderStack.distribution = .fillEqually

        for name in dayNames {
            let label = UILabel()
            label.text = name
            label.textAlignment = .center
            label.font = .systemFont(ofSize: 12, weight: .bold)
            label.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
            daysHeaderStack.addArrangedSubview(label)
        }
        paddingStack.addArrangedSubview(daysHeaderStack)

        // Days Grid Container
        calendarGridStack.axis = .vertical
        calendarGridStack.spacing = 10
        calendarGridStack.distribution = .fillEqually
        paddingStack.addArrangedSubview(calendarGridStack)

        // Divider
        let divider = UIView()
        divider.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        divider.heightAnchor.constraint(equalToConstant: 1).isActive = true
        paddingStack.addArrangedSubview(divider)

        // Bottom Legend Row: Present (green), Late Punch (amber), Absent (red), Today (blue)
        let legendStack = UIStackView()
        legendStack.axis = .horizontal
        legendStack.distribution = .equalCentering
        legendStack.alignment = .center

        legendStack.addArrangedSubview(makeLegendItem(color: colorPresent, text: "Present"))
        legendStack.addArrangedSubview(makeLegendItem(color: colorLate, text: "Late Punch"))
        legendStack.addArrangedSubview(makeLegendItem(color: colorAbsent, text: "Absent"))
        legendStack.addArrangedSubview(makeLegendItem(color: colorToday, text: "Today"))

        paddingStack.addArrangedSubview(legendStack)

        NSLayoutConstraint.activate([
            paddingStack.topAnchor.constraint(equalTo: calendarCard.topAnchor, constant: 20),
            paddingStack.leadingAnchor.constraint(equalTo: calendarCard.leadingAnchor, constant: 18),
            paddingStack.trailingAnchor.constraint(equalTo: calendarCard.trailingAnchor, constant: -18),
            paddingStack.bottomAnchor.constraint(equalTo: calendarCard.bottomAnchor, constant: -18)
        ])
    }

    private func makeLegendItem(color: UIColor, text: String) -> UIView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 6
        stack.alignment = .center

        let dot = UIView()
        dot.backgroundColor = color
        dot.layer.cornerRadius = 3.5
        dot.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            dot.widthAnchor.constraint(equalToConstant: 7),
            dot.heightAnchor.constraint(equalToConstant: 7)
        ])
        stack.addArrangedSubview(dot)

        let label = UILabel()
        label.text = text
        label.font = .systemFont(ofSize: 11, weight: .medium)
        label.textColor = UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0)
        stack.addArrangedSubview(label)

        return stack
    }

    // MARK: - Calendar Calculation & Grid Rendering (Monday to Saturday Shift Week)
    private func parseIsoDate(_ str: String) -> Date? {
        let f1 = ISO8601DateFormatter()
        f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f1.date(from: str) { return d }
        let f2 = ISO8601DateFormatter()
        f2.formatOptions = [.withInternetDateTime]
        if let d = f2.date(from: str) { return d }
        let f3 = DateFormatter()
        f3.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        if let d = f3.date(from: str) { return d }
        let f4 = DateFormatter()
        f4.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return f4.date(from: str)
    }

    private func parseDurationToHours(_ duration: String) -> Double {
        var hours: Double = 0
        let parts = duration.components(separatedBy: " ")
        for part in parts {
            if part.hasSuffix("h") {
                let hStr = part.replacingOccurrences(of: "h", with: "")
                hours += Double(hStr) ?? 0
            } else if part.hasSuffix("m") {
                let mStr = part.replacingOccurrences(of: "m", with: "")
                hours += (Double(mStr) ?? 0) / 60.0
            }
        }
        return hours
    }

    private func getShiftWeekMonday(for date: Date) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.firstWeekday = 2 // Monday is 1st day of week
        let weekday = cal.component(.weekday, from: date) // 1 = Sunday
        if weekday == 1 {
            // Sunday: week has concluded, next shift starts on Monday
            if let nextMonday = cal.date(byAdding: .day, value: 1, to: date) {
                let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: nextMonday)
                return cal.date(from: comps) ?? nextMonday
            }
        }
        let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: comps) ?? date
    }

    private func updateCalendarGrid() {
        let monday = getShiftWeekMonday(for: currentDisplayDate)
        let saturday = calendar.date(byAdding: .day, value: 5, to: monday) ?? monday

        let startFmt = DateFormatter()
        startFmt.dateFormat = "MMM d"
        let endFmt = DateFormatter()
        endFmt.dateFormat = "MMM d, yyyy"
        monthYearLabel.text = "\(startFmt.string(from: monday)) – \(endFmt.string(from: saturday))"

        // Clear existing rows
        calendarGridStack.arrangedSubviews.forEach { $0.removeFromSuperview() }

        let todayComps = calendar.dateComponents([.year, .month, .day], from: Date())
        let selectedComps = calendar.dateComponents([.year, .month, .day], from: selectedDate)

        let rowStack = UIStackView()
        rowStack.axis = .horizontal
        rowStack.distribution = .fillEqually
        rowStack.spacing = 6

        // Up to Saturday (Mon, Tue, Wed, Thu, Fri, Sat - exactly 6 shift days)
        for dayOffset in 0...5 {
            guard let dayDate = calendar.date(byAdding: .day, value: dayOffset, to: monday) else { continue }
            let dayComps = calendar.dateComponents([.year, .month, .day], from: dayDate)
            let isToday = (todayComps.year == dayComps.year && todayComps.month == dayComps.month && todayComps.day == dayComps.day)
            let isSelected = (selectedComps.year == dayComps.year && selectedComps.month == dayComps.month && selectedComps.day == dayComps.day)
            let dayNum = dayComps.day ?? (dayOffset + 1)

            let cell = makeCalendarDayCell(
                dayNumber: dayNum,
                isCurrentMonth: true,
                date: dayDate,
                isToday: isToday,
                isSelected: isSelected
            )
            rowStack.addArrangedSubview(cell)
        }

        calendarGridStack.addArrangedSubview(rowStack)
    }

    private func makeCalendarDayCell(
        dayNumber: Int,
        isCurrentMonth: Bool,
        date: Date?,
        isToday: Bool = false,
        isSelected: Bool = false
    ) -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        container.heightAnchor.constraint(equalToConstant: 44).isActive = true

        let numberCircle = UIView()
        numberCircle.layer.cornerRadius = 15
        numberCircle.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(numberCircle)

        let numberLabel = UILabel()
        numberLabel.text = "\(dayNumber)"
        numberLabel.font = .systemFont(ofSize: 13, weight: (isToday || isSelected) ? .bold : .medium)
        numberLabel.textAlignment = .center
        numberLabel.translatesAutoresizingMaskIntoConstraints = false
        numberCircle.addSubview(numberLabel)

        let dot = UIView()
        dot.layer.cornerRadius = 2.5
        dot.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(dot)

        if isSelected || isToday {
            numberCircle.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
            numberLabel.textColor = .white
            dot.backgroundColor = .white
        } else if isCurrentMonth {
            numberCircle.backgroundColor = .clear
            numberLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)

            // Status dot based on records or realistic weekday attendance
            if let date = date {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                let key = formatter.string(from: date)

                let weekday = calendar.component(.weekday, from: date)
                let isWeekend = (weekday == 1 || weekday == 7) // Sun or Sat

                if let rec = attendanceRecords[key], let status = rec["status"] as? String {
                    if status == "PRESENT" {
                        dot.backgroundColor = colorPresent
                    } else if status == "LATE" {
                        dot.backgroundColor = colorLate
                    } else if status == "ABSENT" {
                        dot.backgroundColor = colorAbsent
                    }
                } else if !isWeekend && date <= Date() {
                    // Default historical weekday representation
                    if dayNumber % 9 == 0 {
                        dot.backgroundColor = colorAbsent // Absent
                    } else if dayNumber % 6 == 0 {
                        dot.backgroundColor = colorLate // Late punch
                    } else {
                        dot.backgroundColor = colorPresent // Present
                    }
                } else {
                    dot.backgroundColor = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0) // Neutral
                }
            }
        } else {
            numberCircle.backgroundColor = .clear
            numberLabel.textColor = UIColor(red: 203/255, green: 213/255, blue: 225/255, alpha: 1.0)
            dot.backgroundColor = .clear
        }

        NSLayoutConstraint.activate([
            numberCircle.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            numberCircle.topAnchor.constraint(equalTo: container.topAnchor, constant: 2),
            numberCircle.widthAnchor.constraint(equalToConstant: 30),
            numberCircle.heightAnchor.constraint(equalToConstant: 30),

            numberLabel.centerXAnchor.constraint(equalTo: numberCircle.centerXAnchor),
            numberLabel.centerYAnchor.constraint(equalTo: numberCircle.centerYAnchor),

            dot.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            dot.topAnchor.constraint(equalTo: numberCircle.bottomAnchor, constant: 3),
            dot.widthAnchor.constraint(equalToConstant: 5),
            dot.heightAnchor.constraint(equalToConstant: 5)
        ])

        if isCurrentMonth, let targetDate = date {
            container.isUserInteractionEnabled = true
            let tap = DayTapGestureRecognizer(target: self, action: #selector(didTapCalendarDay(_:)))
            tap.associatedDate = targetDate
            container.addGestureRecognizer(tap)
        }

        return container
    }

    // MARK: - 2. Selected Record Card
    private func setupSelectedRecordCard() {
        selectedRecordCard.backgroundColor = .white
        selectedRecordCard.layer.cornerRadius = 24
        selectedRecordCard.layer.shadowColor = UIColor.black.cgColor
        selectedRecordCard.layer.shadowOpacity = 0.04
        selectedRecordCard.layer.shadowOffset = CGSize(width: 0, height: 4)
        selectedRecordCard.layer.shadowRadius = 12
        selectedRecordCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(selectedRecordCard)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        selectedRecordCard.addSubview(stack)

        // Header: Calendar Icon + "SELECTED RECORD" + Date + Badge
        let header = UIStackView()
        header.axis = .horizontal
        header.alignment = .center
        header.spacing = 12

        let iconBg = UIView()
        iconBg.backgroundColor = UIColor(red: 239/255, green: 246/255, blue: 255/255, alpha: 1.0)
        iconBg.layer.cornerRadius = 14
        iconBg.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            iconBg.widthAnchor.constraint(equalToConstant: 40),
            iconBg.heightAnchor.constraint(equalToConstant: 40)
        ])

        let calImg = UIImageView(image: UIImage(systemName: "calendar.badge.clock"))
        calImg.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        calImg.translatesAutoresizingMaskIntoConstraints = false
        iconBg.addSubview(calImg)
        NSLayoutConstraint.activate([
            calImg.centerXAnchor.constraint(equalTo: iconBg.centerXAnchor),
            calImg.centerYAnchor.constraint(equalTo: iconBg.centerYAnchor),
            calImg.widthAnchor.constraint(equalToConstant: 20),
            calImg.heightAnchor.constraint(equalToConstant: 20)
        ])
        header.addArrangedSubview(iconBg)

        let textStack = UIStackView()
        textStack.axis = .vertical
        textStack.spacing = 2

        let caption = UILabel()
        caption.text = "SELECTED RECORD"
        caption.font = .systemFont(ofSize: 10, weight: .bold)
        caption.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        textStack.addArrangedSubview(caption)

        selectedDateTitleLabel.font = .systemFont(ofSize: 15, weight: .bold)
        selectedDateTitleLabel.adjustsFontSizeToFitWidth = true
        selectedDateTitleLabel.minimumScaleFactor = 0.8
        selectedDateTitleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        textStack.addArrangedSubview(selectedDateTitleLabel)
        header.addArrangedSubview(textStack)

        let spacer = UIView()
        spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        header.addArrangedSubview(spacer)

        let badgeContainer = UIView()
        badgeContainer.setContentCompressionResistancePriority(.required, for: .horizontal)
        badgeContainer.backgroundColor = UIColor(red: 209/255, green: 250/255, blue: 229/255, alpha: 1.0) // Mint
        badgeContainer.layer.cornerRadius = 12
        badgeContainer.translatesAutoresizingMaskIntoConstraints = false

        shiftBadgeLabel.text = "Regular Shift"
        shiftBadgeLabel.font = .systemFont(ofSize: 11, weight: .bold)
        shiftBadgeLabel.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        shiftBadgeLabel.translatesAutoresizingMaskIntoConstraints = false
        badgeContainer.addSubview(shiftBadgeLabel)

        NSLayoutConstraint.activate([
            shiftBadgeLabel.topAnchor.constraint(equalTo: badgeContainer.topAnchor, constant: 5),
            shiftBadgeLabel.bottomAnchor.constraint(equalTo: badgeContainer.bottomAnchor, constant: -5),
            shiftBadgeLabel.leadingAnchor.constraint(equalTo: badgeContainer.leadingAnchor, constant: 10),
            shiftBadgeLabel.trailingAnchor.constraint(equalTo: badgeContainer.trailingAnchor, constant: -10)
        ])
        header.addArrangedSubview(badgeContainer)
        stack.addArrangedSubview(header)

        // 2-Column Row: Clock In & Clock Out
        let punchesRow = UIStackView()
        punchesRow.axis = .horizontal
        punchesRow.spacing = 12
        punchesRow.distribution = .fillEqually

        // Clock In Card
        let inCard = UIView()
        inCard.backgroundColor = UIColor(red: 243/255, green: 246/255, blue: 255/255, alpha: 1.0)
        inCard.layer.cornerRadius = 14
        let inStack = UIStackView()
        inStack.axis = .vertical
        inStack.spacing = 4
        inStack.translatesAutoresizingMaskIntoConstraints = false
        inCard.addSubview(inStack)

        let inHeader = UIStackView()
        inHeader.axis = .horizontal
        inHeader.spacing = 6
        inHeader.alignment = .center

        let inIcon = UIImageView(image: UIImage(systemName: "arrow.right.to.line"))
        inIcon.tintColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        inIcon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            inIcon.widthAnchor.constraint(equalToConstant: 16),
            inIcon.heightAnchor.constraint(equalToConstant: 16)
        ])
        inHeader.addArrangedSubview(inIcon)

        let inTitle = UILabel()
        inTitle.text = "CLOCK IN"
        inTitle.font = .systemFont(ofSize: 11, weight: .bold)
        inTitle.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        inHeader.addArrangedSubview(inTitle)
        inStack.addArrangedSubview(inHeader)

        clockInTimeLabel.font = .systemFont(ofSize: 20, weight: .bold)
        clockInTimeLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        inStack.addArrangedSubview(clockInTimeLabel)

        clockInDeviceLabel.font = .systemFont(ofSize: 12, weight: .medium)
        clockInDeviceLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        inStack.addArrangedSubview(clockInDeviceLabel)

        NSLayoutConstraint.activate([
            inStack.topAnchor.constraint(equalTo: inCard.topAnchor, constant: 14),
            inStack.leadingAnchor.constraint(equalTo: inCard.leadingAnchor, constant: 14),
            inStack.trailingAnchor.constraint(equalTo: inCard.trailingAnchor, constant: -14),
            inStack.bottomAnchor.constraint(equalTo: inCard.bottomAnchor, constant: -14)
        ])
        punchesRow.addArrangedSubview(inCard)

        // Clock Out Card
        let outCard = UIView()
        outCard.backgroundColor = UIColor(red: 243/255, green: 246/255, blue: 255/255, alpha: 1.0)
        outCard.layer.cornerRadius = 14
        let outStack = UIStackView()
        outStack.axis = .vertical
        outStack.spacing = 4
        outStack.translatesAutoresizingMaskIntoConstraints = false
        outCard.addSubview(outStack)

        let outHeader = UIStackView()
        outHeader.axis = .horizontal
        outHeader.spacing = 6
        outHeader.alignment = .center

        let outIcon = UIImageView(image: UIImage(systemName: "rectangle.portrait.and.arrow.right") ?? UIImage(systemName: "arrow.right.to.line"))
        outIcon.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        outIcon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            outIcon.widthAnchor.constraint(equalToConstant: 16),
            outIcon.heightAnchor.constraint(equalToConstant: 16)
        ])
        outHeader.addArrangedSubview(outIcon)

        let outTitle = UILabel()
        outTitle.text = "CLOCK OUT"
        outTitle.font = .systemFont(ofSize: 11, weight: .bold)
        outTitle.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        outHeader.addArrangedSubview(outTitle)
        outStack.addArrangedSubview(outHeader)

        clockOutTimeLabel.font = .systemFont(ofSize: 20, weight: .bold)
        clockOutTimeLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        outStack.addArrangedSubview(clockOutTimeLabel)

        clockOutDeviceLabel.font = .systemFont(ofSize: 12, weight: .medium)
        clockOutDeviceLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        outStack.addArrangedSubview(clockOutDeviceLabel)

        NSLayoutConstraint.activate([
            outStack.topAnchor.constraint(equalTo: outCard.topAnchor, constant: 14),
            outStack.leadingAnchor.constraint(equalTo: outCard.leadingAnchor, constant: 14),
            outStack.trailingAnchor.constraint(equalTo: outCard.trailingAnchor, constant: -14),
            outStack.bottomAnchor.constraint(equalTo: outCard.bottomAnchor, constant: -14)
        ])
        punchesRow.addArrangedSubview(outCard)
        stack.addArrangedSubview(punchesRow)

        // Bottom Duration Strip
        let durationBanner = UIView()
        durationBanner.backgroundColor = UIColor(red: 239/255, green: 246/255, blue: 255/255, alpha: 1.0)
        durationBanner.layer.cornerRadius = 16
        durationBanner.translatesAutoresizingMaskIntoConstraints = false

        let bannerStack = UIStackView()
        bannerStack.axis = .horizontal
        bannerStack.distribution = .equalSpacing
        bannerStack.alignment = .center
        bannerStack.translatesAutoresizingMaskIntoConstraints = false
        durationBanner.addSubview(bannerStack)

        let durationTextStack = UIStackView()
        durationTextStack.axis = .vertical
        durationTextStack.spacing = 2

        let durationCaption = UILabel()
        durationCaption.text = "Total Duration Logged"
        durationCaption.font = .systemFont(ofSize: 11, weight: .medium)
        durationCaption.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        durationTextStack.addArrangedSubview(durationCaption)

        totalDurationLabel.font = .systemFont(ofSize: 22, weight: .bold)
        totalDurationLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        durationTextStack.addArrangedSubview(totalDurationLabel)
        bannerStack.addArrangedSubview(durationTextStack)

        overtimePill.backgroundColor = UIColor(red: 209/255, green: 250/255, blue: 229/255, alpha: 1.0)
        overtimePill.layer.cornerRadius = 12
        overtimePill.translatesAutoresizingMaskIntoConstraints = false

        let otStack = UIStackView()
        otStack.axis = .horizontal
        otStack.spacing = 4
        otStack.alignment = .center
        otStack.translatesAutoresizingMaskIntoConstraints = false
        overtimePill.addSubview(otStack)

        let otIcon = UIImageView(image: UIImage(systemName: "arrow.up.right"))
        otIcon.tintColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        otIcon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            otIcon.widthAnchor.constraint(equalToConstant: 12),
            otIcon.heightAnchor.constraint(equalToConstant: 12)
        ])
        otStack.addArrangedSubview(otIcon)

        overtimeLabel.font = .systemFont(ofSize: 11, weight: .bold)
        overtimeLabel.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        otStack.addArrangedSubview(overtimeLabel)

        NSLayoutConstraint.activate([
            otStack.topAnchor.constraint(equalTo: overtimePill.topAnchor, constant: 5),
            otStack.bottomAnchor.constraint(equalTo: overtimePill.bottomAnchor, constant: -5),
            otStack.leadingAnchor.constraint(equalTo: overtimePill.leadingAnchor, constant: 8),
            otStack.trailingAnchor.constraint(equalTo: overtimePill.trailingAnchor, constant: -8)
        ])
        bannerStack.addArrangedSubview(overtimePill)

        NSLayoutConstraint.activate([
            bannerStack.topAnchor.constraint(equalTo: durationBanner.topAnchor, constant: 12),
            bannerStack.bottomAnchor.constraint(equalTo: durationBanner.bottomAnchor, constant: -12),
            bannerStack.leadingAnchor.constraint(equalTo: durationBanner.leadingAnchor, constant: 16),
            bannerStack.trailingAnchor.constraint(equalTo: durationBanner.trailingAnchor, constant: -16)
        ])
        stack.addArrangedSubview(durationBanner)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: selectedRecordCard.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: selectedRecordCard.leadingAnchor, constant: 18),
            stack.trailingAnchor.constraint(equalTo: selectedRecordCard.trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: selectedRecordCard.bottomAnchor, constant: -18)
        ])
    }

    private func updateSelectedRecordUI() {
        let formatter = DateFormatter()
        let isToday = calendar.isDateInToday(selectedDate)
        formatter.dateFormat = "MMM d, yyyy"
        let dateStr = formatter.string(from: selectedDate)
        selectedDateTitleLabel.text = isToday ? "Today, \(dateStr)" : dateStr

        let keyFormatter = DateFormatter()
        keyFormatter.dateFormat = "yyyy-MM-dd"
        let key = keyFormatter.string(from: selectedDate)

        let weekday = calendar.component(.weekday, from: selectedDate)
        let isWeekend = (weekday == 1 || weekday == 7)

        if isWeekend {
            shiftBadgeLabel.text = "Weekend"
            clockInTimeLabel.text = "--:--"
            clockInDeviceLabel.text = "Weekend / Off Day"
            clockOutTimeLabel.text = "--:--"
            clockOutDeviceLabel.text = "No punch logged"
            totalDurationLabel.text = "0h 00m"
            overtimePill.isHidden = true
            return
        }

        if let rec = attendanceRecords[key] {
            let inTime = (rec["firstCheckIn"] as? String) ?? (rec["clockIn"] as? String) ?? "--:--"
            let outTime = (rec["lastCheckOut"] as? String) ?? (rec["clockOut"] as? String) ?? "--:--"
            let duration = (rec["duration"] as? String) ?? "8h 00m"
            let overtime = rec["overtime"] as? String

            clockInTimeLabel.text = inTime
            clockInDeviceLabel.text = "Office Biometric A"
            clockOutTimeLabel.text = outTime
            clockOutDeviceLabel.text = "Office Biometric B"
            totalDurationLabel.text = duration

            if let ot = overtime, !ot.isEmpty {
                overtimeLabel.text = ot
                overtimePill.isHidden = false
            } else {
                overtimePill.isHidden = true
            }
            shiftBadgeLabel.text = "Regular Shift"
        } else {
            let now = Date()
            if selectedDate > now && !isToday {
                shiftBadgeLabel.text = "Scheduled"
                clockInTimeLabel.text = "--:--"
                clockInDeviceLabel.text = "Shift: 09:00 AM - 06:00 PM"
                clockOutTimeLabel.text = "--:--"
                clockOutDeviceLabel.text = "Scheduled Exit"
                totalDurationLabel.text = "0h 00m"
                overtimePill.isHidden = true
            } else if isToday {
                if AuthService.shared.getLocalAttendanceStatus() == "CLOCKED_IN",
                   let checkInIso = AuthService.shared.getLocalCheckInIso(),
                   let checkInDate = parseIsoDate(checkInIso) {
                    shiftBadgeLabel.text = "Active Shift"
                    let timeFmt = DateFormatter()
                    timeFmt.dateFormat = "hh:mm a"
                    clockInTimeLabel.text = timeFmt.string(from: checkInDate)
                    clockInDeviceLabel.text = "Office Biometric A"
                    clockOutTimeLabel.text = "--:--"
                    clockOutDeviceLabel.text = "Awaiting exit punch"
                    let elapsed = max(0, Int(Date().timeIntervalSince(checkInDate)))
                    let hrs = elapsed / 3600
                    let mins = (elapsed % 3600) / 60
                    totalDurationLabel.text = String(format: "%dh %02dm", hrs, mins)
                    overtimePill.isHidden = true
                } else {
                    shiftBadgeLabel.text = "Active Day"
                    clockInTimeLabel.text = "--:--"
                    clockInDeviceLabel.text = "Awaiting biometric punch"
                    clockOutTimeLabel.text = "--:--"
                    clockOutDeviceLabel.text = "Awaiting exit punch"
                    totalDurationLabel.text = "0h 00m"
                    overtimePill.isHidden = true
                }
            } else {
                shiftBadgeLabel.text = "No Records"
                clockInTimeLabel.text = "--:--"
                clockInDeviceLabel.text = "No biometric entry"
                clockOutTimeLabel.text = "--:--"
                clockOutDeviceLabel.text = "No biometric exit"
                totalDurationLabel.text = "0h 00m"
                overtimePill.isHidden = true
            }
        }
    }

    // MARK: - 3. Weekly Hours Timeline Card
    private func setupWeeklyTimelineCard() {
        weeklyTimelineCard.backgroundColor = .white
        weeklyTimelineCard.layer.cornerRadius = 24
        weeklyTimelineCard.layer.shadowColor = UIColor.black.cgColor
        weeklyTimelineCard.layer.shadowOpacity = 0.04
        weeklyTimelineCard.layer.shadowOffset = CGSize(width: 0, height: 4)
        weeklyTimelineCard.layer.shadowRadius = 12
        weeklyTimelineCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(weeklyTimelineCard)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        weeklyTimelineCard.addSubview(stack)

        // Header: Chart icon + "Weekly Hours Timeline" + "Target: 40h/wk"
        let header = UIStackView()
        header.axis = .horizontal
        header.alignment = .center
        header.distribution = .equalSpacing

        let titleStack = UIStackView()
        titleStack.axis = .horizontal
        titleStack.spacing = 8
        titleStack.alignment = .center

        let chartIcon = UIImageView(image: UIImage(systemName: "chart.bar.fill"))
        chartIcon.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        chartIcon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            chartIcon.widthAnchor.constraint(equalToConstant: 18),
            chartIcon.heightAnchor.constraint(equalToConstant: 18)
        ])
        titleStack.addArrangedSubview(chartIcon)

        let titleLabel = UILabel()
        titleLabel.text = "Weekly Hours Timeline"
        titleLabel.font = .systemFont(ofSize: 16, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        titleStack.addArrangedSubview(titleLabel)
        header.addArrangedSubview(titleStack)

        let targetLabel = UILabel()
        targetLabel.text = "Target: 40h/wk"
        targetLabel.font = .systemFont(ofSize: 12, weight: .medium)
        targetLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        header.addArrangedSubview(targetLabel)
        stack.addArrangedSubview(header)

        // Weekly Bars
        weeklyBarsStack.axis = .vertical
        weeklyBarsStack.spacing = 10
        stack.addArrangedSubview(weeklyBarsStack)

        // Divider
        let divider = UIView()
        divider.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        divider.heightAnchor.constraint(equalToConstant: 1).isActive = true
        stack.addArrangedSubview(divider)

        // Footer: Accumulated Hours + Quota Achieved
        let footer = UIStackView()
        footer.axis = .horizontal
        footer.alignment = .center
        footer.distribution = .equalSpacing

        accumulatedHoursLabel.text = "Accumulated: 41h 07m"
        accumulatedHoursLabel.font = .systemFont(ofSize: 13, weight: .bold)
        accumulatedHoursLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        footer.addArrangedSubview(accumulatedHoursLabel)

        quotaStatusLabel.text = "Quota Achieved"
        quotaStatusLabel.font = .systemFont(ofSize: 12, weight: .bold)
        quotaStatusLabel.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        footer.addArrangedSubview(quotaStatusLabel)
        stack.addArrangedSubview(footer)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: weeklyTimelineCard.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: weeklyTimelineCard.leadingAnchor, constant: 18),
            stack.trailingAnchor.constraint(equalTo: weeklyTimelineCard.trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: weeklyTimelineCard.bottomAnchor, constant: -18)
        ])
    }

    private func updateWeeklyTimelineUI() {
        weeklyBarsStack.arrangedSubviews.forEach { $0.removeFromSuperview() }

        let dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        let weekMonday = getShiftWeekMonday(for: currentDisplayDate)

        var totalMinutesWorked: Int = 0
        let keyFmt = DateFormatter()
        keyFmt.dateFormat = "yyyy-MM-dd"

        let isUserClockedIn = (AuthService.shared.getLocalAttendanceStatus() == "CLOCKED_IN")
        let localCheckInDate: Date? = {
            if let iso = AuthService.shared.getLocalCheckInIso() {
                return parseIsoDate(iso)
            }
            return nil
        }()

        for offset in 0..<7 {
            guard let dayDate = calendar.date(byAdding: .day, value: offset, to: weekMonday) else { continue }
            let dayName = dayNames[offset]
            let dateKey = keyFmt.string(from: dayDate)
            let isDayToday = calendar.isDateInToday(dayDate)

            var hoursVal: Double = 0.0
            var timeDisplayText = "--"
            var hasActivity = false

            if isDayToday && isUserClockedIn, let checkIn = localCheckInDate {
                hasActivity = true
                let elapsed = max(0, Int(Date().timeIntervalSince(checkIn)))
                let h = elapsed / 3600
                let m = (elapsed % 3600) / 60
                hoursVal = Double(elapsed) / 3600.0
                timeDisplayText = String(format: "%dh %02dm", h, m)
                totalMinutesWorked += (h * 60 + m)
            } else if let rec = attendanceRecords[dateKey] {
                let durStr = (rec["duration"] as? String) ?? ""
                let parsed = parseDurationToHours(durStr)
                if parsed > 0.05 {
                    hasActivity = true
                    hoursVal = parsed
                    timeDisplayText = durStr
                    let h = Int(parsed)
                    let m = Int(round((parsed - Double(h)) * 60))
                    totalMinutesWorked += (h * 60 + m)
                } else if isDayToday {
                    timeDisplayText = "0h 00m"
                } else {
                    timeDisplayText = "--"
                }
            } else {
                // Honest real representation: No punch logged -> Blank / Empty track, NO blue bar!
                timeDisplayText = isDayToday ? "0h 00m" : "--"
                hoursVal = 0.0
                hasActivity = false
            }

            let ratio: CGFloat = hasActivity ? CGFloat(min(1.0, max(0.0, hoursVal / 8.0))) : 0.0

            let row = UIStackView()
            row.axis = .horizontal
            row.spacing = 12
            row.alignment = .center

            let dayLabel = UILabel()
            dayLabel.text = dayName
            dayLabel.font = .systemFont(ofSize: 13, weight: isDayToday ? .bold : .medium)
            dayLabel.textColor = isDayToday ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
            dayLabel.widthAnchor.constraint(equalToConstant: 34).isActive = true
            row.addArrangedSubview(dayLabel)

            // Progress Bar Track & Fill
            let track = UIView()
            track.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
            track.layer.cornerRadius = 4.5
            track.layer.masksToBounds = true
            track.translatesAutoresizingMaskIntoConstraints = false
            track.heightAnchor.constraint(equalToConstant: 9).isActive = true

            if hasActivity && ratio > 0.01 {
                let fill = UIView()
                fill.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
                fill.layer.cornerRadius = 4.5
                fill.translatesAutoresizingMaskIntoConstraints = false
                track.addSubview(fill)

                NSLayoutConstraint.activate([
                    fill.leadingAnchor.constraint(equalTo: track.leadingAnchor),
                    fill.topAnchor.constraint(equalTo: track.topAnchor),
                    fill.bottomAnchor.constraint(equalTo: track.bottomAnchor),
                    fill.widthAnchor.constraint(equalTo: track.widthAnchor, multiplier: ratio)
                ])
            }
            row.addArrangedSubview(track)

            let timeLabel = UILabel()
            timeLabel.text = timeDisplayText
            timeLabel.font = .systemFont(ofSize: 13, weight: isDayToday ? .bold : .medium)
            timeLabel.textColor = (isDayToday && hasActivity) ? UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) : (hasActivity ? UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0) : UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0))
            timeLabel.textAlignment = .right
            timeLabel.widthAnchor.constraint(equalToConstant: 62).isActive = true
            row.addArrangedSubview(timeLabel)

            weeklyBarsStack.addArrangedSubview(row)
        }

        let totH = totalMinutesWorked / 60
        let totM = totalMinutesWorked % 60
        accumulatedHoursLabel.text = String(format: "Accumulated: %dh %02dm", totH, totM)
        if totH >= 40 {
            quotaStatusLabel.text = "Quota Achieved"
            quotaStatusLabel.textColor = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0)
        } else {
            quotaStatusLabel.text = "Target: 40h/wk"
            quotaStatusLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        }
    }

    // MARK: - 4. Geo-Fenced Biometric Sync Card
    private func setupGeoCard() {
        geoCard.backgroundColor = .white
        geoCard.layer.cornerRadius = 20
        geoCard.layer.borderWidth = 1
        geoCard.layer.borderColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0).cgColor
        geoCard.translatesAutoresizingMaskIntoConstraints = false
        cardsStackView.addArrangedSubview(geoCard)

        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 14
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        geoCard.addSubview(stack)

        // Thumbnail image
        let thumbContainer = UIView()
        thumbContainer.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        thumbContainer.layer.cornerRadius = 22
        thumbContainer.layer.masksToBounds = true
        thumbContainer.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            thumbContainer.widthAnchor.constraint(equalToConstant: 44),
            thumbContainer.heightAnchor.constraint(equalToConstant: 44)
        ])

        let icon = UIImageView(image: UIImage(systemName: "sensor.tag.radiowaves.forward.fill"))
        icon.tintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        icon.contentMode = .scaleAspectFit
        icon.translatesAutoresizingMaskIntoConstraints = false
        thumbContainer.addSubview(icon)
        NSLayoutConstraint.activate([
            icon.centerXAnchor.constraint(equalTo: thumbContainer.centerXAnchor),
            icon.centerYAnchor.constraint(equalTo: thumbContainer.centerYAnchor),
            icon.widthAnchor.constraint(equalToConstant: 24),
            icon.heightAnchor.constraint(equalToConstant: 24)
        ])
        stack.addArrangedSubview(thumbContainer)

        let textStack = UIStackView()
        textStack.axis = .vertical
        textStack.spacing = 2

        let title = UILabel()
        title.text = "Geo-Fenced Biometric Sync"
        title.font = .systemFont(ofSize: 14, weight: .bold)
        title.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        textStack.addArrangedSubview(title)

        let sub = UILabel()
        sub.text = "Location verified: Enterprise Tower 4, Fl..."
        sub.font = .systemFont(ofSize: 12, weight: .regular)
        sub.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        textStack.addArrangedSubview(sub)
        stack.addArrangedSubview(textStack)

        let spacer = UIView()
        stack.addArrangedSubview(spacer)

        let shield = UIImageView(image: UIImage(systemName: "checkmark.shield.fill"))
        shield.tintColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        shield.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            shield.widthAnchor.constraint(equalToConstant: 22),
            shield.heightAnchor.constraint(equalToConstant: 22)
        ])
        stack.addArrangedSubview(shield)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: geoCard.topAnchor, constant: 14),
            stack.leadingAnchor.constraint(equalTo: geoCard.leadingAnchor, constant: 14),
            stack.trailingAnchor.constraint(equalTo: geoCard.trailingAnchor, constant: -14),
            stack.bottomAnchor.constraint(equalTo: geoCard.bottomAnchor, constant: -14)
        ])
    }

    // MARK: - 5. Request Regularization Action Button
    private func setupRequestRegularizationButton() {
        requestRegularizationBtn.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        requestRegularizationBtn.layer.cornerRadius = 27
        requestRegularizationBtn.setTitleColor(.white, for: .normal)
        requestRegularizationBtn.titleLabel?.font = .systemFont(ofSize: 16, weight: .bold)
        requestRegularizationBtn.layer.shadowColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 0.35).cgColor
        requestRegularizationBtn.layer.shadowOpacity = 0.3
        requestRegularizationBtn.layer.shadowOffset = CGSize(width: 0, height: 4)
        requestRegularizationBtn.layer.shadowRadius = 8

        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .bold)
        requestRegularizationBtn.setImage(UIImage(systemName: "calendar.badge.plus", withConfiguration: config), for: .normal)
        requestRegularizationBtn.tintColor = .white
        requestRegularizationBtn.setTitle("  Request Regularization", for: .normal)
        requestRegularizationBtn.addTarget(self, action: #selector(didTapRequestRegularization), for: .touchUpInside)
        requestRegularizationBtn.translatesAutoresizingMaskIntoConstraints = false
        requestRegularizationBtn.heightAnchor.constraint(equalToConstant: 54).isActive = true

        cardsStackView.addArrangedSubview(requestRegularizationBtn)
    }

    // MARK: - Regularization Requests View
    private func setupRegularizationView() {
        regularizationView.isHidden = true
        regularizationView.backgroundColor = .clear
        regularizationView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(regularizationView)

        let regCard = UIView()
        regCard.backgroundColor = .white
        regCard.layer.cornerRadius = 24
        regCard.layer.shadowColor = UIColor.black.cgColor
        regCard.layer.shadowOpacity = 0.04
        regCard.layer.shadowOffset = CGSize(width: 0, height: 4)
        regCard.layer.shadowRadius = 12
        regCard.translatesAutoresizingMaskIntoConstraints = false
        regularizationView.addSubview(regCard)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        regCard.addSubview(stack)

        let title = UILabel()
        title.text = "Pending Regularization Requests"
        title.font = .systemFont(ofSize: 16, weight: .bold)
        title.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        stack.addArrangedSubview(title)

        let sampleRequests = [
            ("Oct 21, 2026", "Late punch due to client meeting", "Under Review", UIColor(red: 180/255, green: 83/255, blue: 9/255, alpha: 1.0), UIColor(red: 254/255, green: 243/255, blue: 199/255, alpha: 1.0)),
            ("Oct 14, 2026", "Outdoor client site setup", "Approved", UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1.0), UIColor(red: 209/255, green: 250/255, blue: 229/255, alpha: 1.0))
        ]

        for req in sampleRequests {
            let row = UIView()
            row.backgroundColor = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1.0)
            row.layer.cornerRadius = 16
            row.translatesAutoresizingMaskIntoConstraints = false

            let rStack = UIStackView()
            rStack.axis = .horizontal
            rStack.distribution = .equalSpacing
            rStack.alignment = .center
            rStack.translatesAutoresizingMaskIntoConstraints = false
            row.addSubview(rStack)

            let tStack = UIStackView()
            tStack.axis = .vertical
            tStack.spacing = 2

            let dateLabel = UILabel()
            dateLabel.text = req.0
            dateLabel.font = .systemFont(ofSize: 14, weight: .bold)
            dateLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
            tStack.addArrangedSubview(dateLabel)

            let noteLabel = UILabel()
            noteLabel.text = req.1
            noteLabel.font = .systemFont(ofSize: 12, weight: .regular)
            noteLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
            tStack.addArrangedSubview(noteLabel)
            rStack.addArrangedSubview(tStack)

            let badge = UIView()
            badge.backgroundColor = req.4
            badge.layer.cornerRadius = 10
            badge.translatesAutoresizingMaskIntoConstraints = false

            let bLabel = UILabel()
            bLabel.text = req.2
            bLabel.font = .systemFont(ofSize: 11, weight: .bold)
            bLabel.textColor = req.3
            bLabel.translatesAutoresizingMaskIntoConstraints = false
            badge.addSubview(bLabel)

            NSLayoutConstraint.activate([
                bLabel.topAnchor.constraint(equalTo: badge.topAnchor, constant: 4),
                bLabel.bottomAnchor.constraint(equalTo: badge.bottomAnchor, constant: -4),
                bLabel.leadingAnchor.constraint(equalTo: badge.leadingAnchor, constant: 8),
                bLabel.trailingAnchor.constraint(equalTo: badge.trailingAnchor, constant: -8)
            ])
            rStack.addArrangedSubview(badge)

            NSLayoutConstraint.activate([
                rStack.topAnchor.constraint(equalTo: row.topAnchor, constant: 12),
                rStack.bottomAnchor.constraint(equalTo: row.bottomAnchor, constant: -12),
                rStack.leadingAnchor.constraint(equalTo: row.leadingAnchor, constant: 14),
                rStack.trailingAnchor.constraint(equalTo: row.trailingAnchor, constant: -14)
            ])
            stack.addArrangedSubview(row)
        }

        NSLayoutConstraint.activate([
            regCard.topAnchor.constraint(equalTo: regularizationView.topAnchor, constant: 8),
            regCard.leadingAnchor.constraint(equalTo: regularizationView.leadingAnchor, constant: 16),
            regCard.trailingAnchor.constraint(equalTo: regularizationView.trailingAnchor, constant: -16),
            regCard.bottomAnchor.constraint(equalTo: regularizationView.bottomAnchor, constant: -16),

            stack.topAnchor.constraint(equalTo: regCard.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: regCard.leadingAnchor, constant: 18),
            stack.trailingAnchor.constraint(equalTo: regCard.trailingAnchor, constant: -18),
            stack.bottomAnchor.constraint(equalTo: regCard.bottomAnchor, constant: -18),

            regularizationView.topAnchor.constraint(equalTo: contentView.topAnchor),
            regularizationView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            regularizationView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            regularizationView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])
    }

    // MARK: - Actions
    @objc private func didTapPrevMonth() {
        if let newDate = calendar.date(byAdding: .day, value: -7, to: currentDisplayDate) {
            currentDisplayDate = newDate
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            updateCalendarGrid()
            updateWeeklyTimelineUI()
        }
    }

    @objc private func didTapNextMonth() {
        if let newDate = calendar.date(byAdding: .day, value: 7, to: currentDisplayDate) {
            currentDisplayDate = newDate
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            updateCalendarGrid()
            updateWeeklyTimelineUI()
        }
    }

    @objc private func didTapMonthYearPicker() {
        // Quick Year Navigator Sheet
        let alert = UIAlertController(title: "Select Year & Month", message: "Jump across years from 1990 to 2030+", preferredStyle: .actionSheet)
        let currentYear = calendar.component(.year, from: currentDisplayDate)

        alert.addAction(UIAlertAction(title: "Previous Year (\(currentYear - 1))", style: .default) { [weak self] _ in
            guard let self = self else { return }
            if let newDate = self.calendar.date(byAdding: .year, value: -1, to: self.currentDisplayDate) {
                self.currentDisplayDate = newDate
                self.updateCalendarGrid()
            }
        })
        alert.addAction(UIAlertAction(title: "Current Month (\(DateFormatter().monthSymbols[self.calendar.component(.month, from: Date()) - 1]))", style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.currentDisplayDate = Date()
            self.updateCalendarGrid()
        })
        alert.addAction(UIAlertAction(title: "Next Year (\(currentYear + 1))", style: .default) { [weak self] _ in
            guard let self = self else { return }
            if let newDate = self.calendar.date(byAdding: .year, value: 1, to: self.currentDisplayDate) {
                self.currentDisplayDate = newDate
                self.updateCalendarGrid()
            }
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        if let popover = alert.popoverPresentationController {
            popover.sourceView = monthYearLabel
            popover.sourceRect = monthYearLabel.bounds
        }
        present(alert, animated: true)
    }

    @objc private func didTapCalendarDay(_ gesture: DayTapGestureRecognizer) {
        guard let date = gesture.associatedDate else { return }
        selectedDate = date
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        updateCalendarGrid()
        updateSelectedRecordUI()
    }

    @objc private func didSelectMyAttendanceTab() {
        guard isRegularizationActive else { return }
        isRegularizationActive = false

        pillLeadingConstraint?.constant = 4
        cardsStackView.isHidden = false

        UIView.animate(withDuration: 0.35, delay: 0, usingSpringWithDamping: 0.82, initialSpringVelocity: 0.4, options: [.curveEaseInOut], animations: {
            self.tabSegmentedContainer.layoutIfNeeded()
            self.myAttendanceTabBtn.setTitleColor(.white, for: .normal)
            self.myAttendanceTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .bold)
            self.regularizationTabBtn.setTitleColor(UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0), for: .normal)
            self.regularizationTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
            self.cardsStackView.alpha = 1.0
            self.regularizationView.alpha = 0.0
        }) { _ in
            self.regularizationView.isHidden = true
        }
    }

    @objc private func didSelectRegularizationTab() {
        guard !isRegularizationActive else { return }
        isRegularizationActive = true

        let halfWidth = (tabSegmentedContainer.bounds.width - 8) / 2
        pillLeadingConstraint?.constant = 4 + halfWidth
        regularizationView.isHidden = false
        regularizationView.alpha = 0.0

        UIView.animate(withDuration: 0.35, delay: 0, usingSpringWithDamping: 0.82, initialSpringVelocity: 0.4, options: [.curveEaseInOut], animations: {
            self.tabSegmentedContainer.layoutIfNeeded()
            self.regularizationTabBtn.setTitleColor(.white, for: .normal)
            self.regularizationTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .bold)
            self.myAttendanceTabBtn.setTitleColor(UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1.0), for: .normal)
            self.myAttendanceTabBtn.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
            self.cardsStackView.alpha = 0.0
            self.regularizationView.alpha = 1.0
        }) { _ in
            self.cardsStackView.isHidden = true
        }
    }

    @objc private func didTapRequestRegularization() {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM d, yyyy"
        let dateStr = formatter.string(from: selectedDate)

        let alert = UIAlertController(
            title: "Request Regularization",
            message: "Submit an attendance regularization request for \(dateStr).",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = "Reason (e.g. Missing punch, client site)"
        }
        alert.addAction(UIAlertAction(title: "Submit", style: .default) { [weak self] _ in
            let note = alert.textFields?.first?.text ?? ""
            self?.submitRegularization(for: dateStr, reason: note)
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func submitRegularization(for dateStr: String, reason: String) {
        AppNotificationManager.shared.sendNotification(
            title: "Regularization Request Submitted",
            body: "Your attendance regularization for \(dateStr) has been sent to your reporting manager for approval."
        )
        updateNotificationBadge()

        let confirmation = UIAlertController(
            title: "Request Submitted",
            message: "Your attendance regularization for \(dateStr) has been sent to your reporting manager for approval.",
            preferredStyle: .alert
        )
        confirmation.addAction(UIAlertAction(title: "OK", style: .default))
        present(confirmation, animated: true)
    }

    @objc private func didTapNotificationBell() {
        AuthService.shared.markLocalNotificationsAsRead()
        updateNotificationBadge()
        let notifVC = NotificationsViewController()
        if let nav = navigationController {
            nav.pushViewController(notifVC, animated: true)
        } else {
            notifVC.modalPresentationStyle = .fullScreen
            present(notifVC, animated: true)
        }
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

    // MARK: - Bottom Navigation Bar
    private func setupBottomNavBar() {
        bottomNavBar.backgroundColor = .white
        bottomNavBar.layer.shadowColor = UIColor.black.cgColor
        bottomNavBar.layer.shadowOpacity = 0.05
        bottomNavBar.layer.shadowOffset = CGSize(width: 0, height: -2)
        bottomNavBar.layer.shadowRadius = 8
        bottomNavBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(bottomNavBar)

        bottomNavContainer.translatesAutoresizingMaskIntoConstraints = false
        bottomNavBar.addSubview(bottomNavContainer)

        let navStack = UIStackView()
        navStack.axis = .horizontal
        navStack.distribution = .fillEqually
        navStack.translatesAutoresizingMaskIntoConstraints = false
        bottomNavContainer.addSubview(navStack)

        let tabs: [(icon: String, title: String, isActive: Bool)] = [
            ("house", "Home", false),
            ("clock.fill", "Attendance", true),
            ("calendar", "Leave", false),
            ("checklist", "Tasks", false),
            ("ellipsis", "More", false)
        ]

        for (index, tab) in tabs.enumerated() {
            let tabView = makeNavTab(icon: tab.icon, title: tab.title, isActive: tab.isActive, tag: index)
            navStack.addArrangedSubview(tabView)
        }

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

    @objc private func didTapNavTab(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view else { return }
        switch view.tag {
        case 0:
            // Go to Home
            if let nav = navigationController {
                if let home = nav.viewControllers.first(where: { $0 is HomeViewController }) {
                    nav.popToViewController(home, animated: false)
                } else {
                    nav.setViewControllers([HomeViewController()], animated: false)
                }
            } else if let presenter = presentingViewController as? HomeViewController {
                dismiss(animated: false)
            } else if let window = view.window ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow }) {
                UIView.transition(with: window, duration: 0.25, options: .transitionCrossDissolve, animations: {
                    window.rootViewController = HomeViewController()
                }, completion: nil)
            } else {
                dismiss(animated: false)
            }
        case 1:
            break // Already on Attendance
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

    private func openMoreSection() {
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

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    // MARK: - Real-Time API Data Loading
    private func loadAttendanceData() {
        AuthService.shared.getMyAttendanceHistory { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let items):
                for item in items {
                    if let dateStr = item["date"] as? String, dateStr.count >= 10 {
                        let key = String(dateStr.prefix(10))
                        self.attendanceRecords[key] = item
                    }
                }
                self.updateCalendarGrid()
                self.updateSelectedRecordUI()
                self.dismissSkeleton()
            case .failure:
                self.dismissSkeleton()
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            self?.dismissSkeleton()
        }
    }

    private func dismissSkeleton() {
        guard !hasDismissedSkeleton else { return }
        hasDismissedSkeleton = true
        UIView.animate(withDuration: 0.35, delay: 0.1, options: [.curveEaseOut], animations: {
            self.skeletonOverlay.alpha = 0.0
        }) { _ in
            self.skeletonOverlay.removeFromSuperview()
        }
    }

    private func loadUserProfile() {
        let initial = String(AuthService.shared.getFirstName().prefix(1)).uppercased()
        avatarInitialsLabel.text = initial.isEmpty ? "A" : initial

        AuthService.shared.getProfile { [weak self] result in
            guard let self = self else { return }
            if case .success(let user) = result {
                let firstName = user["firstName"] as? String
                let photoUrl = user["profilePhoto"] as? String ?? ""

                var designation = ""
                if let desigDict = user["designation"] as? [String: Any], let dName = desigDict["name"] as? String {
                    designation = dName
                } else if let desigStr = user["designation"] as? String {
                    designation = desigStr
                } else if let role = user["role"] as? String {
                    designation = role
                }

                var company = "GlobizHub Inc."
                if let compDict = user["company"] as? [String: Any], let cName = compDict["name"] as? String {
                    company = cName
                } else if let orgStr = user["organization"] as? String {
                    company = orgStr
                }

                AuthService.shared.saveUserProfile(firstName: firstName, designation: designation, organization: company)

                let updatedInitial = String(AuthService.shared.getFirstName().prefix(1)).uppercased()
                self.avatarInitialsLabel.text = updatedInitial.isEmpty ? "A" : updatedInitial

                if !photoUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.loadAvatarImage(urlStr: photoUrl)
                }
            }
        }
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

    private func updateNotificationBadge() {
        notificationBadgeDot.isHidden = !AuthService.shared.hasUnreadLocalNotifications()
    }
}

// MARK: - Skeleton Shimmer View for Attendance
final class AttendanceSkeletonOverlay: UIView {
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
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: bottomAnchor, constant: -20)
        ])

        // 1. Calendar Card Placeholder
        stack.addArrangedSubview(createSkeletonCard(height: 320))
        // 2. Selected Record Card Placeholder
        stack.addArrangedSubview(createSkeletonCard(height: 160))
        // 3. Stats Timeline Card Placeholder
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

        let headerPlaceholder = UIView()
        headerPlaceholder.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        headerPlaceholder.layer.cornerRadius = 8
        headerPlaceholder.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(headerPlaceholder)

        let bodyPlaceholder = UIView()
        bodyPlaceholder.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        bodyPlaceholder.layer.cornerRadius = 12
        bodyPlaceholder.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(bodyPlaceholder)

        headerPlaceholder.layer.add(pulse, forKey: "pulse")
        bodyPlaceholder.layer.add(pulse, forKey: "pulse")

        NSLayoutConstraint.activate([
            headerPlaceholder.topAnchor.constraint(equalTo: card.topAnchor, constant: 18),
            headerPlaceholder.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            headerPlaceholder.widthAnchor.constraint(equalToConstant: 160),
            headerPlaceholder.heightAnchor.constraint(equalToConstant: 22),

            bodyPlaceholder.topAnchor.constraint(equalTo: headerPlaceholder.bottomAnchor, constant: 16),
            bodyPlaceholder.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 18),
            bodyPlaceholder.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -18),
            bodyPlaceholder.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -18)
        ])

        return card
    }
}

// MARK: - Day Tap Gesture Subclass
private class DayTapGestureRecognizer: UITapGestureRecognizer {
    var associatedDate: Date?
}

// MARK: - Array Chunking Extension
private extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
