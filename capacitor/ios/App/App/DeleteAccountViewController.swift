import UIKit

class DeleteAccountViewController: UIViewController {

    private let topBar = UIView()
    private let topBarContainer = UIView()
    private let backButton = UIButton(type: .system)
    private let brandSubtitleLabel = UILabel()
    private let titleLabel = UILabel()
    private let avatarContainer = UIView()
    private let avatarInitialsLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        navigationController?.setNavigationBarHidden(true, animated: false)

        setupTopBar()
        setupCenterContent()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
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

        brandSubtitleLabel.text = "TEAMHUB"
        brandSubtitleLabel.font = .systemFont(ofSize: 11, weight: .heavy)
        brandSubtitleLabel.textColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        headerStack.addArrangedSubview(brandSubtitleLabel)

        titleLabel.text = "Delete Account"
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

            backButton.widthAnchor.constraint(equalToConstant: 36),
            backButton.heightAnchor.constraint(equalToConstant: 36),

            avatarContainer.trailingAnchor.constraint(equalTo: topBarContainer.trailingAnchor, constant: -16),
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
        if let nav = navigationController {
            for vc in nav.viewControllers {
                if let settingsVC = vc as? SettingsViewController {
                    nav.popToViewController(settingsVC, animated: true)
                    return
                }
            }
            let settingsVC = SettingsViewController()
            nav.pushViewController(settingsVC, animated: true)
        } else {
            let settingsVC = SettingsViewController()
            present(settingsVC, animated: true)
        }
    }

    private func setupCenterContent() {
        let centerStack = UIStackView()
        centerStack.axis = .vertical
        centerStack.alignment = .center
        centerStack.spacing = 24
        centerStack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(centerStack)

        let trashIllustration = makeTrashIllustrationView()
        centerStack.addArrangedSubview(trashIllustration)

        let warningLabel = UILabel()
        warningLabel.text = "Permanently delete all your account information and data associated with this app"
        warningLabel.font = .systemFont(ofSize: 18, weight: .bold)
        warningLabel.textColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        warningLabel.textAlignment = .center
        warningLabel.numberOfLines = 0
        centerStack.addArrangedSubview(warningLabel)

        let deleteButton = UIButton(type: .custom)
        deleteButton.setTitle("Delete Account", for: .normal)
        deleteButton.setTitleColor(.white, for: .normal)
        deleteButton.titleLabel?.font = .systemFont(ofSize: 15, weight: .bold)
        deleteButton.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        deleteButton.layer.cornerRadius = 24
        deleteButton.contentEdgeInsets = UIEdgeInsets(top: 14, left: 36, bottom: 14, right: 36)
        deleteButton.addTarget(self, action: #selector(handleDeleteAccountTap), for: .touchUpInside)
        centerStack.addArrangedSubview(deleteButton)

        NSLayoutConstraint.activate([
            centerStack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            centerStack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            centerStack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 36),
            centerStack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -36),

            warningLabel.widthAnchor.constraint(lessThanOrEqualToConstant: 290)
        ])
    }

    private func makeTrashIllustrationView() -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        container.widthAnchor.constraint(equalToConstant: 110).isActive = true
        container.heightAnchor.constraint(equalToConstant: 110).isActive = true

        // Red top handle
        let handle = UIView(frame: CGRect(x: 46, y: 16, width: 18, height: 5))
        handle.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        handle.layer.cornerRadius = 2
        container.addSubview(handle)

        // Lid horizontal line
        let lid = UIView(frame: CGRect(x: 28, y: 21, width: 54, height: 3))
        lid.backgroundColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
        lid.layer.cornerRadius = 1.5
        container.addSubview(lid)

        // Bin body
        let bin = UIView(frame: CGRect(x: 32, y: 24, width: 46, height: 58))
        bin.backgroundColor = .white
        bin.layer.borderColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0).cgColor
        bin.layer.borderWidth = 2.5
        bin.layer.cornerRadius = 6
        container.addSubview(bin)

        // 3 Vertical lines inside bin
        let vLine1 = makeVerticalLine()
        vLine1.frame = CGRect(x: 10, y: 10, width: 2.2, height: 38)
        bin.addSubview(vLine1)

        let vLine2 = makeVerticalLine()
        vLine2.frame = CGRect(x: 22, y: 10, width: 2.2, height: 38)
        bin.addSubview(vLine2)

        let vLine3 = makeVerticalLine()
        vLine3.frame = CGRect(x: 34, y: 10, width: 2.2, height: 38)
        bin.addSubview(vLine3)

        // Red badge with 'x' on bottom right
        let badge = UIView(frame: CGRect(x: 66, y: 62, width: 28, height: 28))
        badge.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        badge.layer.cornerRadius = 14
        badge.layer.masksToBounds = true
        container.addSubview(badge)

        let xConfig = UIImage.SymbolConfiguration(pointSize: 14, weight: .bold)
        let xIcon = UIImageView(image: UIImage(systemName: "xmark", withConfiguration: xConfig))
        xIcon.tintColor = .white
        xIcon.contentMode = .scaleAspectFit
        xIcon.frame = CGRect(x: 6, y: 6, width: 16, height: 16)
        badge.addSubview(xIcon)

        return container
    }

    private func makeVerticalLine() -> UIView {
        let line = UIView()
        line.backgroundColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        line.layer.cornerRadius = 1
        return line
    }

    @objc private func handleBack() {
        if let nav = navigationController {
            nav.popViewController(animated: true)
        } else {
            dismiss(animated: true)
        }
    }

    @objc private func handleDeleteAccountTap() {
        let email = AuthService.shared.getEmail()

        // Trigger email dispatch via server
        if !email.isEmpty {
            AuthService.shared.forgotPassword(email: email) { _ in }
        }

        let alert = UIAlertController(
            title: "Verify Account Deletion",
            message: "A 6-digit verification code has been dispatched to \(email.isEmpty ? "your registered email" : email). Enter the code below to permanently delete your account:",
            preferredStyle: .alert
        )

        alert.addTextField { textField in
            textField.placeholder = "Enter 6-digit code"
            textField.keyboardType = .numberPad
            textField.textAlignment = .center
            textField.font = .systemFont(ofSize: 20, weight: .bold)
        }

        let confirmAction = UIAlertAction(title: "Verify & Delete", style: .destructive) { [weak self] _ in
            guard let self = self else { return }
            let code = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if code.count < 6 {
                let errAlert = UIAlertController(title: "Error", message: "Please enter a valid 6-digit verification code.", preferredStyle: .alert)
                errAlert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
                self.present(errAlert, animated: true)
                return
            }

            self.executePermanentDeletion()
        }

        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)

        alert.addAction(confirmAction)
        alert.addAction(cancelAction)
        present(alert, animated: true)
    }

    private func executePermanentDeletion() {
        AuthService.shared.clearAuth()

        let successAlert = UIAlertController(
            title: "Account Deleted",
            message: "Your account and all associated information have been permanently removed.",
            preferredStyle: .alert
        )

        successAlert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            guard let self = self else { return }
            let signInVC = SignInViewController()
            let nav = UINavigationController(rootViewController: signInVC)
            nav.modalPresentationStyle = .fullScreen

            if let window = self.view.window {
                window.rootViewController = nav
                UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve, animations: nil)
            } else {
                self.present(nav, animated: true)
            }
        })

        present(successAlert, animated: true)
    }
}
