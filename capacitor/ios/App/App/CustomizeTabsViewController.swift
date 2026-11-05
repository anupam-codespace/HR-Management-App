import UIKit

class CustomizeTabCell: UITableViewCell {
    static let identifier = "CustomizeTabCell"

    let titleLabel = UILabel()
    let lockImageView = UIImageView()
    let toggleSwitch = UISwitch()
    let dragHandleImageView = UIImageView()

    var onToggleChanged: ((Bool) -> Void)?

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    private func setupViews() {
        selectionStyle = .none
        backgroundColor = .white
        contentView.backgroundColor = .white

        titleLabel.font = .systemFont(ofSize: 16, weight: .regular)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(titleLabel)

        let lockConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .regular)
        lockImageView.image = UIImage(systemName: "lock", withConfiguration: lockConfig)
        lockImageView.tintColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) // #EF4444
        lockImageView.contentMode = .scaleAspectFit
        lockImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(lockImageView)

        toggleSwitch.onTintColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0) // #0056FD
        toggleSwitch.addTarget(self, action: #selector(switchToggled(_:)), for: .valueChanged)
        toggleSwitch.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(toggleSwitch)

        let dragConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .regular)
        dragHandleImageView.image = UIImage(systemName: "line.3.horizontal", withConfiguration: dragConfig)
        dragHandleImageView.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        dragHandleImageView.contentMode = .scaleAspectFit
        dragHandleImageView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(dragHandleImageView)

        NSLayoutConstraint.activate([
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            titleLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: toggleSwitch.leadingAnchor, constant: -12),

            lockImageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            lockImageView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            lockImageView.widthAnchor.constraint(equalToConstant: 22),
            lockImageView.heightAnchor.constraint(equalToConstant: 22),

            dragHandleImageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            dragHandleImageView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            dragHandleImageView.widthAnchor.constraint(equalToConstant: 22),
            dragHandleImageView.heightAnchor.constraint(equalToConstant: 22),

            toggleSwitch.trailingAnchor.constraint(equalTo: dragHandleImageView.leadingAnchor, constant: -16),
            toggleSwitch.centerYAnchor.constraint(equalTo: contentView.centerYAnchor)
        ])
    }

    func configure(with tab: TabItem) {
        titleLabel.text = tab.title

        if tab.isLocked {
            lockImageView.isHidden = false
            toggleSwitch.isHidden = true
            dragHandleImageView.isHidden = true
        } else {
            lockImageView.isHidden = true
            toggleSwitch.isHidden = false
            dragHandleImageView.isHidden = false
            toggleSwitch.isOn = tab.isEnabled
        }
    }

    @objc private func switchToggled(_ sender: UISwitch) {
        onToggleChanged?(sender.isOn)
    }
}

class CustomizeTabsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {

    private var tabs: [TabItem] = []

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let titleLabel = UILabel()
    private let divider = UIView()

    private let tableView = UITableView()

    // Floating dark toast
    private let toastView = UIView()
    private let toastLabel = UILabel()
    private var toastTimer: Timer?

    // Drag reordering state
    private var sourceIndexPath: IndexPath?
    private var snapshotView: UIView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        tabs = TabManager.shared.getTabs()

        setupTopBar()
        setupTableView()
        setupToast()
        setupLongPressGesture()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
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

        let arrowConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        let backBtn = UIButton(type: .system)
        backBtn.setImage(UIImage(systemName: "arrow.left", withConfiguration: arrowConfig), for: .normal)
        backBtn.tintColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        backBtn.addTarget(self, action: #selector(handleBack), for: .touchUpInside)
        backBtn.translatesAutoresizingMaskIntoConstraints = false
        leftStack.addArrangedSubview(backBtn)

        let headerStack = UIStackView()
        headerStack.axis = .vertical
        headerStack.spacing = 1
        headerStack.translatesAutoresizingMaskIntoConstraints = false
        leftStack.addArrangedSubview(headerStack)

        titleLabel.text = "Customize Tabs"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        headerStack.addArrangedSubview(titleLabel)

        divider.backgroundColor = UIColor(red: 241/255, green: 245/255, blue: 249/255, alpha: 1.0)
        divider.translatesAutoresizingMaskIntoConstraints = false
        topBar.addSubview(divider)

        let topBarWidth = topBarContainer.widthAnchor.constraint(equalTo: topBar.widthAnchor)
        topBarWidth.priority = UILayoutPriority(999)
        topBarWidth.isActive = true

        NSLayoutConstraint.activate([
            topBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            topBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            topBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            topBar.heightAnchor.constraint(equalToConstant: 60),

            topBarContainer.topAnchor.constraint(equalTo: topBar.topAnchor),
            topBarContainer.bottomAnchor.constraint(equalTo: topBar.bottomAnchor),
            topBarContainer.centerXAnchor.constraint(equalTo: topBar.centerXAnchor),
            topBarContainer.widthAnchor.constraint(lessThanOrEqualToConstant: 680),

            leftStack.leadingAnchor.constraint(equalTo: topBarContainer.leadingAnchor, constant: 12),
            leftStack.centerYAnchor.constraint(equalTo: topBarContainer.centerYAnchor),

            backBtn.widthAnchor.constraint(equalToConstant: 36),
            backBtn.heightAnchor.constraint(equalToConstant: 36),

            divider.leadingAnchor.constraint(equalTo: topBar.leadingAnchor),
            divider.trailingAnchor.constraint(equalTo: topBar.trailingAnchor),
            divider.bottomAnchor.constraint(equalTo: topBar.bottomAnchor),
            divider.heightAnchor.constraint(equalToConstant: 1)
        ])
    }

    private func setupTableView() {
        tableView.backgroundColor = .white
        tableView.separatorStyle = .none
        tableView.rowHeight = 58
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(CustomizeTabCell.self, forCellReuseIdentifier: CustomizeTabCell.identifier)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 8),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func setupToast() {
        toastView.backgroundColor = UIColor(red: 33/255, green: 38/255, blue: 46/255, alpha: 0.95)
        toastView.layer.cornerRadius = 10
        toastView.clipsToBounds = true
        toastView.alpha = 0
        toastView.isUserInteractionEnabled = false
        toastView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(toastView)

        toastLabel.text = "Your changes have been successfully\nupdated."
        toastLabel.textColor = .white
        toastLabel.font = .systemFont(ofSize: 14, weight: .medium)
        toastLabel.textAlignment = .center
        toastLabel.numberOfLines = 2
        toastLabel.translatesAutoresizingMaskIntoConstraints = false
        toastView.addSubview(toastLabel)

        NSLayoutConstraint.activate([
            toastView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            toastView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -32),
            toastView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 32),
            toastView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -32),

            toastLabel.topAnchor.constraint(equalTo: toastView.topAnchor, constant: 12),
            toastLabel.bottomAnchor.constraint(equalTo: toastView.bottomAnchor, constant: -12),
            toastLabel.leadingAnchor.constraint(equalTo: toastView.leadingAnchor, constant: 20),
            toastLabel.trailingAnchor.constraint(equalTo: toastView.trailingAnchor, constant: -20)
        ])
    }

    private func showToast() {
        toastTimer?.invalidate()
        toastView.layer.removeAllAnimations()

        UIView.animate(withDuration: 0.25) {
            self.toastView.alpha = 1.0
            self.toastView.transform = .identity
        }

        toastTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            UIView.animate(withDuration: 0.3) {
                self.toastView.alpha = 0.0
                self.toastView.transform = CGAffineTransform(translationX: 0, y: 10)
            }
        }
    }

    @objc private func handleBack() {
        dismiss(animated: true)
    }

    // MARK: - Reordering Logic via Long Press Gesture
    private func setupLongPressGesture() {
        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        longPress.minimumPressDuration = 0.15
        tableView.addGestureRecognizer(longPress)
    }

    @objc private func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
        let location = gesture.location(in: tableView)

        switch gesture.state {
        case .began:
            guard let indexPath = tableView.indexPathForRow(at: location), indexPath.row >= 2 else { return }
            sourceIndexPath = indexPath

            guard let cell = tableView.cellForRow(at: indexPath) else { return }
            snapshotView = customSnapshotFromView(cell)

            guard let snapshot = snapshotView else { return }
            var center = cell.center
            snapshot.center = center
            snapshot.alpha = 0.92
            snapshot.layer.shadowRadius = 8
            snapshot.layer.shadowOpacity = 0.25
            snapshot.layer.shadowOffset = CGSize(width: 0, height: 4)
            tableView.addSubview(snapshot)

            UIView.animate(withDuration: 0.2) {
                snapshot.transform = CGAffineTransform(scaleX: 1.03, y: 1.03)
                cell.alpha = 0.0
            }

            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

        case .changed:
            guard let snapshot = snapshotView, let source = sourceIndexPath else { return }
            snapshot.center.y = location.y

            if let targetIndexPath = tableView.indexPathForRow(at: location),
               targetIndexPath.row >= 2,
               targetIndexPath != source {

                // Reorder items in data model
                let movedItem = tabs.remove(at: source.row)
                tabs.insert(movedItem, at: targetIndexPath.row)

                // Move row in table view
                tableView.moveRow(at: source, to: targetIndexPath)
                sourceIndexPath = targetIndexPath

                let selectionFeedback = UISelectionFeedbackGenerator()
                selectionFeedback.selectionChanged()
            }

        case .ended, .cancelled:
            guard let snapshot = snapshotView, let source = sourceIndexPath else { return }
            guard let cell = tableView.cellForRow(at: source) else {
                snapshot.removeFromSuperview()
                snapshotView = nil
                sourceIndexPath = nil
                return
            }

            UIView.animate(withDuration: 0.25, animations: {
                snapshot.transform = .identity
                snapshot.center = cell.center
                snapshot.alpha = 1.0
            }) { [weak self] _ in
                guard let self = self else { return }
                cell.alpha = 1.0
                snapshot.removeFromSuperview()
                self.snapshotView = nil
                self.sourceIndexPath = nil

                // Auto-save and show toast
                TabManager.shared.saveTabs(self.tabs)
                self.showToast()
            }

        default:
            break
        }
    }

    private func customSnapshotFromView(_ inputView: UIView) -> UIView? {
        UIGraphicsBeginImageContextWithOptions(inputView.bounds.size, false, 0)
        defer { UIGraphicsEndImageContext() }
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        inputView.layer.render(in: context)
        guard let image = UIGraphicsGetImageFromCurrentImageContext() else { return nil }

        let snapshot = UIImageView(image: image)
        snapshot.layer.masksToBounds = false
        snapshot.layer.cornerRadius = 0
        snapshot.layer.shadowOffset = CGSize(width: -5.0, height: 0.0)
        snapshot.layer.shadowRadius = 5.0
        snapshot.layer.shadowOpacity = 0.4
        return snapshot
    }

    // MARK: - UITableViewDataSource & Delegate
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return tabs.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: CustomizeTabCell.identifier, for: indexPath) as? CustomizeTabCell else {
            return UITableViewCell()
        }

        let tab = tabs[indexPath.row]
        cell.configure(with: tab)

        cell.onToggleChanged = { [weak self, weak cell] isEnabled in
            guard let self = self,
                  let cell = cell,
                  let currentIndexPath = self.tableView.indexPath(for: cell),
                  currentIndexPath.row < self.tabs.count else { return }
            self.tabs[currentIndexPath.row].isEnabled = isEnabled
            TabManager.shared.saveTabs(self.tabs)
            self.showToast()
        }

        return cell
    }
}
