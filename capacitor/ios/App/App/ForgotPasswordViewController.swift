import UIKit
import Capacitor

class ForgotPasswordViewController: UIViewController {

    var userEmail: String?

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

    // MARK: - 1. Form Container (Email input only)
    private let formContainer: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private let titleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Reset your password"
        lbl.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        lbl.textColor = .black
        return lbl
    }()

    private let subtitleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Enter your registered email address and we'll send you a link to reset your password."
        lbl.font = UIFont.systemFont(ofSize: 15, weight: .regular)
        lbl.textColor = UIColor(red: 75/255, green: 85/255, blue: 99/255, alpha: 1.0)
        lbl.numberOfLines = 0
        return lbl
    }()

    private let emailTitleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Email address"
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        lbl.textColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0)
        return lbl
    }()

    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.placeholder = "you@company.com"
        tf.font = UIFont.systemFont(ofSize: 15)
        tf.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        tf.keyboardType = .emailAddress
        tf.autocapitalizationType = .none
        tf.autocorrectionType = .no
        tf.layer.cornerRadius = 8
        tf.layer.borderWidth = 1
        tf.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        tf.backgroundColor = .white

        let padding = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 52))
        tf.leftView = padding
        tf.leftViewMode = .always
        return tf
    }()

    private let errorLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        lbl.textColor = UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 1.0)
        lbl.numberOfLines = 0
        lbl.isHidden = true
        return lbl
    }()

    private let sendResetLinkButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Send Reset Link", for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        btn.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        btn.layer.cornerRadius = 8
        btn.clipsToBounds = true
        return btn
    }()

    private let loadingSpinner: UIActivityIndicatorView = {
        let spinner = UIActivityIndicatorView(style: .medium)
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.color = .white
        spinner.hidesWhenStopped = true
        return spinner
    }()

    private let backToSignInButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Back to Sign In", for: .normal)
        btn.setTitleColor(UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0), for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        return btn
    }()

    // MARK: - 2. Success Container (In-app confirmation matching web functionality)
    private let successContainer: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    private let successTitleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Check your email"
        lbl.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        lbl.textColor = .black
        return lbl
    }()

    private let successMessageLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
        lbl.font = UIFont.systemFont(ofSize: 15, weight: .regular)
        lbl.textColor = UIColor(red: 75/255, green: 85/255, blue: 99/255, alpha: 1.0)
        lbl.numberOfLines = 0
        return lbl
    }()

    private let returnToLoginButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Return to Login", for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        btn.backgroundColor = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
        btn.layer.cornerRadius = 8
        btn.clipsToBounds = true
        return btn
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        if let email = userEmail, !email.isEmpty {
            emailTextField.text = email
        }

        setupLayout()

        sendResetLinkButton.addTarget(self, action: #selector(didTapSendResetLink), for: .touchUpInside)
        backToSignInButton.addTarget(self, action: #selector(didTapBackToSignIn), for: .touchUpInside)
        returnToLoginButton.addTarget(self, action: #selector(didTapBackToSignIn), for: .touchUpInside)

        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        view.addGestureRecognizer(tap)
    }

    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }

    @objc private func didTapBackToSignIn() {
        dismiss(animated: true, completion: nil)
    }

    @objc private func didTapSendResetLink() {
        let email = emailTextField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !email.isEmpty else {
            emailTextField.layer.borderColor = UIColor.systemRed.cgColor
            errorLabel.text = "Please enter your email address"
            errorLabel.isHidden = false
            emailTextField.becomeFirstResponder()
            return
        }

        guard isValidEmail(email) else {
            emailTextField.layer.borderColor = UIColor.systemRed.cgColor
            errorLabel.text = "Please enter a valid email address"
            errorLabel.isHidden = false
            emailTextField.becomeFirstResponder()
            return
        }

        emailTextField.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        errorLabel.isHidden = true
        setLoading(true)

        AuthService.shared.forgotPassword(email: email) { [weak self] result in
            guard let self = self else { return }
            self.setLoading(false)

            switch result {
            case .success:
                // Show in-app confirmation matching web functionality
                self.formContainer.isHidden = true
                self.successContainer.isHidden = false

            case .failure(let error):
                self.errorLabel.text = error.localizedDescription
                self.errorLabel.isHidden = false
            }
        }
    }

    private func setLoading(_ loading: Bool) {
        if loading {
            sendResetLinkButton.setTitle("", for: .normal)
            sendResetLinkButton.isEnabled = false
            loadingSpinner.startAnimating()
        } else {
            sendResetLinkButton.setTitle("Send Reset Link", for: .normal)
            sendResetLinkButton.isEnabled = true
            loadingSpinner.stopAnimating()
        }
    }

    private func isValidEmail(_ email: String) -> Bool {
        let pattern = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let predicate = NSPredicate(format: "SELF MATCHES %@", pattern)
        return predicate.evaluate(with: email)
    }

    private func setupLayout() {
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        contentView.addSubview(logoImageView)
        contentView.addSubview(formContainer)
        contentView.addSubview(successContainer)

        // Subviews of formContainer
        formContainer.addSubview(titleLabel)
        formContainer.addSubview(subtitleLabel)
        formContainer.addSubview(emailTitleLabel)
        formContainer.addSubview(emailTextField)
        formContainer.addSubview(errorLabel)
        formContainer.addSubview(sendResetLinkButton)
        sendResetLinkButton.addSubview(loadingSpinner)
        formContainer.addSubview(backToSignInButton)

        // Subviews of successContainer
        successContainer.addSubview(successTitleLabel)
        successContainer.addSubview(successMessageLabel)
        successContainer.addSubview(returnToLoginButton)

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

            // Form Container
            formContainer.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 28),
            formContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            formContainer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            formContainer.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -32),

            titleLabel.topAnchor.constraint(equalTo: formContainer.topAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),

            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            subtitleLabel.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            subtitleLabel.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),

            emailTitleLabel.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 28),
            emailTitleLabel.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            emailTitleLabel.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),

            emailTextField.topAnchor.constraint(equalTo: emailTitleLabel.bottomAnchor, constant: 8),
            emailTextField.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            emailTextField.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),
            emailTextField.heightAnchor.constraint(equalToConstant: 52),

            errorLabel.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 8),
            errorLabel.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            errorLabel.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),

            sendResetLinkButton.topAnchor.constraint(equalTo: errorLabel.bottomAnchor, constant: 24),
            sendResetLinkButton.leadingAnchor.constraint(equalTo: formContainer.leadingAnchor),
            sendResetLinkButton.trailingAnchor.constraint(equalTo: formContainer.trailingAnchor),
            sendResetLinkButton.heightAnchor.constraint(equalToConstant: 52),

            loadingSpinner.centerXAnchor.constraint(equalTo: sendResetLinkButton.centerXAnchor),
            loadingSpinner.centerYAnchor.constraint(equalTo: sendResetLinkButton.centerYAnchor),

            backToSignInButton.topAnchor.constraint(equalTo: sendResetLinkButton.bottomAnchor, constant: 32),
            backToSignInButton.centerXAnchor.constraint(equalTo: formContainer.centerXAnchor),
            backToSignInButton.bottomAnchor.constraint(equalTo: formContainer.bottomAnchor, constant: -16),

            // Success Container
            successContainer.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 28),
            successContainer.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            successContainer.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            successContainer.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -32),

            successTitleLabel.topAnchor.constraint(equalTo: successContainer.topAnchor),
            successTitleLabel.leadingAnchor.constraint(equalTo: successContainer.leadingAnchor),
            successTitleLabel.trailingAnchor.constraint(equalTo: successContainer.trailingAnchor),

            successMessageLabel.topAnchor.constraint(equalTo: successTitleLabel.bottomAnchor, constant: 12),
            successMessageLabel.leadingAnchor.constraint(equalTo: successContainer.leadingAnchor),
            successMessageLabel.trailingAnchor.constraint(equalTo: successContainer.trailingAnchor),

            returnToLoginButton.topAnchor.constraint(equalTo: successMessageLabel.bottomAnchor, constant: 28),
            returnToLoginButton.leadingAnchor.constraint(equalTo: successContainer.leadingAnchor),
            returnToLoginButton.trailingAnchor.constraint(equalTo: successContainer.trailingAnchor),
            returnToLoginButton.heightAnchor.constraint(equalToConstant: 52),
            returnToLoginButton.bottomAnchor.constraint(lessThanOrEqualTo: successContainer.bottomAnchor, constant: -16)
        ])
    }
}
