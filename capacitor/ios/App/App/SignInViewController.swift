import UIKit
import Capacitor

class SignInViewController: UIViewController {

    var prefillEmail: String?

    private static let brandBlue = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
    private static let borderSlate = UIColor(red: 226/255, green: 232/255, blue: 240/255, alpha: 1.0)
    private static let iconSlate = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
    private static let textDark = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)

    private let scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        sv.keyboardDismissMode = .onDrag
        sv.showsVerticalScrollIndicator = false
        return sv
    }()

    private let contentView: UIView = {
        let cv = UIView()
        cv.translatesAutoresizingMaskIntoConstraints = false
        return cv
    }()

    private let logoImageView: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.contentMode = .scaleAspectFit
        iv.image = UIImage(named: "splash_logo") ?? UIImage(named: "Splash")
        return iv
    }()

    private let titleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Sign in"
        lbl.font = UIFont.systemFont(ofSize: 30, weight: .bold)
        lbl.textColor = .black
        return lbl
    }()

    private let subtitleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "to access TeamHub"
        lbl.font = UIFont.systemFont(ofSize: 17, weight: .regular)
        lbl.textColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0)
        return lbl
    }()

    // MARK: - Work Email Field & Label
    private let workEmailLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Work Email"
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        lbl.textColor = textDark
        return lbl
    }()

    private let emailContainerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        view.layer.cornerRadius = 22
        view.layer.borderWidth = 1
        view.layer.borderColor = borderSlate.cgColor
        return view
    }()

    private let emailIconImageView: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.contentMode = .scaleAspectFit
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .regular)
        iv.image = UIImage(systemName: "envelope", withConfiguration: config)
        iv.tintColor = iconSlate
        return iv
    }()

    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.placeholder = "Email address or mobile number"
        tf.font = UIFont.systemFont(ofSize: 15)
        tf.textColor = textDark
        tf.backgroundColor = .clear
        tf.borderStyle = .none
        tf.keyboardType = .emailAddress
        tf.autocapitalizationType = .none
        tf.autocorrectionType = .no
        return tf
    }()

    // MARK: - Password Field & Label
    private let passwordLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Password"
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        lbl.textColor = textDark
        return lbl
    }()

    private let passwordContainerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        view.layer.cornerRadius = 22
        view.layer.borderWidth = 1
        view.layer.borderColor = borderSlate.cgColor
        return view
    }()

    private let lockIconImageView: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.contentMode = .scaleAspectFit
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .regular)
        iv.image = UIImage(systemName: "lock", withConfiguration: config)
        iv.tintColor = iconSlate
        return iv
    }()

    private let passwordTextField: UITextField = {
        let tf = UITextField()
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.placeholder = "Password"
        tf.font = UIFont.systemFont(ofSize: 15)
        tf.textColor = textDark
        tf.backgroundColor = .clear
        tf.borderStyle = .none
        tf.isSecureTextEntry = true
        return tf
    }()

    private let passwordToggleBtn: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .regular)
        btn.setImage(UIImage(systemName: "eye", withConfiguration: config), for: .normal)
        btn.tintColor = iconSlate
        return btn
    }()

    // MARK: - Utility Row (Remember device + Forgot password)
    private let rememberContainer: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private let rememberCheckboxBtn: UIButton = {
        let btn = UIButton(type: .custom)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.layer.cornerRadius = 4
        btn.layer.borderWidth = 1.5
        btn.layer.borderColor = UIColor(red: 203/255, green: 213/255, blue: 225/255, alpha: 1.0).cgColor
        btn.backgroundColor = .white
        return btn
    }()

    private let rememberDeviceLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Remember device"
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .regular)
        lbl.textColor = UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1.0)
        return lbl
    }()

    private let forgotPasswordButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Forgot password?", for: .normal)
        btn.setTitleColor(brandBlue, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        return btn
    }()

    // MARK: - Sign In Button (Pill with right arrow)
    private let signInButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.backgroundColor = brandBlue
        btn.layer.cornerRadius = 26
        btn.clipsToBounds = true
        return btn
    }()

    private let signInButtonStack: UIStackView = {
        let sv = UIStackView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        sv.axis = .horizontal
        sv.alignment = .center
        sv.spacing = 8
        sv.isUserInteractionEnabled = false
        return sv
    }()

    private let signInButtonLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Sign In"
        lbl.textColor = .white
        lbl.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        return lbl
    }()

    private let signInButtonArrow: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.contentMode = .scaleAspectFit
        let config = UIImage.SymbolConfiguration(pointSize: 15, weight: .bold)
        iv.image = UIImage(systemName: "arrow.right", withConfiguration: config)
        iv.tintColor = .white
        return iv
    }()

    private let signInSpinner: UIActivityIndicatorView = {
        let aiv = UIActivityIndicatorView(style: .medium)
        aiv.translatesAutoresizingMaskIntoConstraints = false
        aiv.color = .white
        aiv.hidesWhenStopped = true
        return aiv
    }()

    private let footerLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.textAlignment = .center
        lbl.font = UIFont.systemFont(ofSize: 14)
        lbl.textColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0)

        let fullText = "Don't have a TeamHub account? Sign up now"
        let attributedString = NSMutableAttributedString(string: fullText)
        if let range = fullText.range(of: "Sign up now") {
            let nsRange = NSRange(range, in: fullText)
            attributedString.addAttribute(
                .foregroundColor,
                value: brandBlue,
                range: nsRange
            )
        }
        lbl.attributedText = attributedString
        return lbl
    }()

    private var isPasswordVisible: Bool = false
    private var isRememberDeviceChecked: Bool = true {
        didSet {
            updateCheckboxUI()
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        setupLayout()
        setupActions()

        if let prefillEmail = prefillEmail, !prefillEmail.isEmpty {
            emailTextField.text = prefillEmail
            passwordTextField.becomeFirstResponder()
        }

        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        view.addGestureRecognizer(tap)
    }

    private func setupActions() {
        signInButton.addTarget(self, action: #selector(didTapSignIn), for: .touchUpInside)
        forgotPasswordButton.addTarget(self, action: #selector(didTapForgotPassword), for: .touchUpInside)
        passwordToggleBtn.addTarget(self, action: #selector(didTapPasswordToggle), for: .touchUpInside)

        rememberCheckboxBtn.addTarget(self, action: #selector(didTapRememberDevice), for: .touchUpInside)
        let rememberTap = UITapGestureRecognizer(target: self, action: #selector(didTapRememberDevice))
        rememberContainer.addGestureRecognizer(rememberTap)
        rememberContainer.isUserInteractionEnabled = true

        footerLabel.isUserInteractionEnabled = true
        let footerTap = UITapGestureRecognizer(target: self, action: #selector(didTapSignUp))
        footerLabel.addGestureRecognizer(footerTap)

        updateCheckboxUI()
    }

    private func updateCheckboxUI() {
        if isRememberDeviceChecked {
            rememberCheckboxBtn.backgroundColor = SignInViewController.brandBlue
            rememberCheckboxBtn.layer.borderColor = SignInViewController.brandBlue.cgColor
            let config = UIImage.SymbolConfiguration(pointSize: 11, weight: .bold)
            rememberCheckboxBtn.setImage(UIImage(systemName: "checkmark", withConfiguration: config), for: .normal)
            rememberCheckboxBtn.tintColor = .white
        } else {
            rememberCheckboxBtn.backgroundColor = .white
            rememberCheckboxBtn.layer.borderColor = UIColor(red: 203/255, green: 213/255, blue: 225/255, alpha: 1.0).cgColor
            rememberCheckboxBtn.setImage(nil, for: .normal)
        }
    }

    @objc private func didTapRememberDevice() {
        isRememberDeviceChecked.toggle()
    }

    @objc private func didTapPasswordToggle() {
        isPasswordVisible.toggle()
        passwordTextField.isSecureTextEntry = !isPasswordVisible
        let iconName = isPasswordVisible ? "eye.slash" : "eye"
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .regular)
        passwordToggleBtn.setImage(UIImage(systemName: iconName, withConfiguration: config), for: .normal)
    }

    @objc private func didTapSignUp() {
        let signUpVC = SignUpViewController()
        signUpVC.modalPresentationStyle = .fullScreen
        signUpVC.modalTransitionStyle = .coverVertical
        present(signUpVC, animated: true, completion: nil)
    }

    @objc private func didTapForgotPassword() {
        let forgotVC = ForgotPasswordViewController()
        if let email = emailTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines), !email.isEmpty {
            forgotVC.userEmail = email
        }
        forgotVC.modalPresentationStyle = .fullScreen
        forgotVC.modalTransitionStyle = .coverVertical
        present(forgotVC, animated: true, completion: nil)
    }

    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }

    private func setupLayout() {
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        contentView.addSubview(logoImageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(subtitleLabel)

        // Work Email
        contentView.addSubview(workEmailLabel)
        contentView.addSubview(emailContainerView)
        emailContainerView.addSubview(emailIconImageView)
        emailContainerView.addSubview(emailTextField)

        // Password
        contentView.addSubview(passwordLabel)
        contentView.addSubview(passwordContainerView)
        passwordContainerView.addSubview(lockIconImageView)
        passwordContainerView.addSubview(passwordTextField)
        passwordContainerView.addSubview(passwordToggleBtn)

        // Utility Row
        contentView.addSubview(rememberContainer)
        rememberContainer.addSubview(rememberCheckboxBtn)
        rememberContainer.addSubview(rememberDeviceLabel)
        contentView.addSubview(forgotPasswordButton)

        // Sign In Button
        contentView.addSubview(signInButton)
        signInButton.addSubview(signInButtonStack)
        signInButtonStack.addArrangedSubview(signInButtonLabel)
        signInButtonStack.addArrangedSubview(signInButtonArrow)
        signInButton.addSubview(signInSpinner)

        contentView.addSubview(footerLabel)

        let safeArea = view.safeAreaLayoutGuide

        let contentWidth = contentView.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor)
        contentWidth.priority = UILayoutPriority(999)
        contentWidth.isActive = true

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: safeArea.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            contentView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor),
            contentView.widthAnchor.constraint(lessThanOrEqualToConstant: 500),

            // Logo
            logoImageView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 40),
            logoImageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            logoImageView.widthAnchor.constraint(equalToConstant: 56),
            logoImageView.heightAnchor.constraint(equalToConstant: 56),

            // Title: Sign in
            titleLabel.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 28),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),

            // Subtitle: to access TeamHub
            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 6),
            subtitleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            subtitleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),

            // Label: Work Email
            workEmailLabel.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 28),
            workEmailLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            workEmailLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),

            // Container: Work Email
            emailContainerView.topAnchor.constraint(equalTo: workEmailLabel.bottomAnchor, constant: 8),
            emailContainerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            emailContainerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            emailContainerView.heightAnchor.constraint(equalToConstant: 52),

            emailIconImageView.leadingAnchor.constraint(equalTo: emailContainerView.leadingAnchor, constant: 16),
            emailIconImageView.centerYAnchor.constraint(equalTo: emailContainerView.centerYAnchor),
            emailIconImageView.widthAnchor.constraint(equalToConstant: 20),
            emailIconImageView.heightAnchor.constraint(equalToConstant: 20),

            emailTextField.leadingAnchor.constraint(equalTo: emailIconImageView.trailingAnchor, constant: 12),
            emailTextField.trailingAnchor.constraint(equalTo: emailContainerView.trailingAnchor, constant: -16),
            emailTextField.topAnchor.constraint(equalTo: emailContainerView.topAnchor),
            emailTextField.bottomAnchor.constraint(equalTo: emailContainerView.bottomAnchor),

            // Label: Password
            passwordLabel.topAnchor.constraint(equalTo: emailContainerView.bottomAnchor, constant: 18),
            passwordLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            passwordLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),

            // Container: Password
            passwordContainerView.topAnchor.constraint(equalTo: passwordLabel.bottomAnchor, constant: 8),
            passwordContainerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            passwordContainerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            passwordContainerView.heightAnchor.constraint(equalToConstant: 52),

            lockIconImageView.leadingAnchor.constraint(equalTo: passwordContainerView.leadingAnchor, constant: 16),
            lockIconImageView.centerYAnchor.constraint(equalTo: passwordContainerView.centerYAnchor),
            lockIconImageView.widthAnchor.constraint(equalToConstant: 20),
            lockIconImageView.heightAnchor.constraint(equalToConstant: 20),

            passwordTextField.leadingAnchor.constraint(equalTo: lockIconImageView.trailingAnchor, constant: 12),
            passwordTextField.trailingAnchor.constraint(equalTo: passwordToggleBtn.leadingAnchor, constant: -8),
            passwordTextField.topAnchor.constraint(equalTo: passwordContainerView.topAnchor),
            passwordTextField.bottomAnchor.constraint(equalTo: passwordContainerView.bottomAnchor),

            passwordToggleBtn.trailingAnchor.constraint(equalTo: passwordContainerView.trailingAnchor, constant: -14),
            passwordToggleBtn.centerYAnchor.constraint(equalTo: passwordContainerView.centerYAnchor),
            passwordToggleBtn.widthAnchor.constraint(equalToConstant: 24),
            passwordToggleBtn.heightAnchor.constraint(equalToConstant: 24),

            // Utility Row: Remember device & Forgot password
            rememberContainer.topAnchor.constraint(equalTo: passwordContainerView.bottomAnchor, constant: 16),
            rememberContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            rememberContainer.heightAnchor.constraint(equalToConstant: 28),

            rememberCheckboxBtn.leadingAnchor.constraint(equalTo: rememberContainer.leadingAnchor),
            rememberCheckboxBtn.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            rememberCheckboxBtn.widthAnchor.constraint(equalToConstant: 20),
            rememberCheckboxBtn.heightAnchor.constraint(equalToConstant: 20),

            rememberDeviceLabel.leadingAnchor.constraint(equalTo: rememberCheckboxBtn.trailingAnchor, constant: 10),
            rememberDeviceLabel.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            rememberDeviceLabel.trailingAnchor.constraint(equalTo: rememberContainer.trailingAnchor),

            forgotPasswordButton.centerYAnchor.constraint(equalTo: rememberContainer.centerYAnchor),
            forgotPasswordButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),

            // Sign In Button
            signInButton.topAnchor.constraint(equalTo: rememberContainer.bottomAnchor, constant: 24),
            signInButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            signInButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            signInButton.heightAnchor.constraint(equalToConstant: 52),

            signInButtonStack.centerXAnchor.constraint(equalTo: signInButton.centerXAnchor),
            signInButtonStack.centerYAnchor.constraint(equalTo: signInButton.centerYAnchor),

            signInSpinner.centerXAnchor.constraint(equalTo: signInButton.centerXAnchor),
            signInSpinner.centerYAnchor.constraint(equalTo: signInButton.centerYAnchor),

            // Footer
            footerLabel.topAnchor.constraint(equalTo: signInButton.bottomAnchor, constant: 28),
            footerLabel.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            footerLabel.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor, constant: -24)
        ])
    }

    @objc private func didTapSignIn() {
        view.endEditing(true)
        let email = emailTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let password = passwordTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !email.isEmpty else {
            emailContainerView.layer.borderColor = UIColor.systemRed.cgColor
            return
        }
        emailContainerView.layer.borderColor = SignInViewController.borderSlate.cgColor

        guard !password.isEmpty else {
            passwordContainerView.layer.borderColor = UIColor.systemRed.cgColor
            return
        }
        passwordContainerView.layer.borderColor = SignInViewController.borderSlate.cgColor

        // Set Loading State
        setLoading(true)

        AuthService.shared.login(email: email, password: password) { [weak self] result in
            guard let self = self else { return }
            self.setLoading(false)
            switch result {
            case .success:
                // Navigate into the main app Home screen
                let homeVC = HomeViewController()
                if let window = self.view.window ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow }) {
                    UIView.transition(with: window, duration: 0.35, options: .transitionCrossDissolve, animations: {
                        window.rootViewController = homeVC
                    }, completion: nil)
                } else {
                    homeVC.modalPresentationStyle = .fullScreen
                    homeVC.modalTransitionStyle = .crossDissolve
                    self.present(homeVC, animated: true, completion: nil)
                }

            case .failure(let error):
                let alert = UIAlertController(title: "Sign In Failed", message: error.localizedDescription, preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
                self.present(alert, animated: true, completion: nil)
            }
        }
    }

    private func setLoading(_ loading: Bool) {
        if loading {
            signInButtonStack.isHidden = true
            signInButton.isEnabled = false
            signInSpinner.startAnimating()
        } else {
            signInButtonStack.isHidden = false
            signInButton.isEnabled = true
            signInSpinner.stopAnimating()
        }
    }
}
