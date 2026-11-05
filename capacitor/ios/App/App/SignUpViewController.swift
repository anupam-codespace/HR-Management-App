import UIKit
import Capacitor

class SignUpViewController: UIViewController, UITextFieldDelegate {

    private enum Step: Int, CaseIterable {
        case companyDetails = 1
        case adminDetails = 2
        case companySettings = 3
        case holidayCalendar = 4
        case departments = 5
        case roles = 6
        case salary = 7
        case leave = 8
        case shifts = 9
        case branches = 10
        case invite = 11

        var visibleStepNumber: Int {
            switch self {
            case .companyDetails, .adminDetails: return 1
            case .companySettings: return 2
            case .holidayCalendar: return 3
            case .departments: return 4
            case .roles: return 5
            case .salary: return 6
            case .leave: return 7
            case .shifts: return 8
            case .branches: return 9
            case .invite: return 10
            }
        }

        var title: String {
            switch self {
            case .companyDetails, .adminDetails: return "Company Information"
            case .companySettings: return "Company Settings"
            case .holidayCalendar: return "Holiday Calendar"
            case .departments: return "Organization Structure"
            case .roles: return "Designations & Roles"
            case .salary: return "Salary Structure"
            case .leave: return "Leave Policies"
            case .shifts: return "Shift Types"
            case .branches: return "Branches & Locations"
            case .invite: return "Bring your team on board"
            }
        }
    }

    private var currentStep: Step = .companyDetails

    // Brand color: TeamHub vibrant blue #0056fd
    static let brandBlue = UIColor(red: 0/255, green: 86/255, blue: 253/255, alpha: 1.0)
    static let brandBlueSecondary = UIColor(red: 0/255, green: 93/255, blue: 253/255, alpha: 1.0)
    static let brandGradientEnd = UIColor(red: 1/255, green: 116/255, blue: 255/255, alpha: 1.0)

    // MARK: - FIXED / CONSTANT TOP HEADER (Stays pinned, never scrolls)
    private let fixedHeaderView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        return view
    }()

    private let stepLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Step 1 of 10"
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        lbl.textColor = SignUpViewController.brandBlue
        return lbl
    }()

    private let progressView: UIProgressView = {
        let pv = UIProgressView(progressViewStyle: .default)
        pv.translatesAutoresizingMaskIntoConstraints = false
        pv.progress = 0.1
        pv.progressTintColor = SignUpViewController.brandBlue
        pv.trackTintColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
        pv.layer.cornerRadius = 2
        pv.clipsToBounds = true
        return pv
    }()

    // MARK: - SCROLLABLE CONTENT
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

    // Title & Top Back Button
    private let titleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = "Company Information"
        lbl.font = UIFont.systemFont(ofSize: 26, weight: .bold)
        lbl.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        return lbl
    }()

    // Top Back Button: visible ONLY on steps with Skip button below (Steps 3-10)
    private let topBackButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Back", for: .normal)
        btn.setTitleColor(SignUpViewController.brandBlue, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        btn.isHidden = true
        return btn
    }()

    // MARK: - Container StackView (Collapses hidden steps with zero vertical gaps)
    private let stepContainersStackView: UIStackView = {
        let sv = UIStackView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        sv.axis = .vertical
        sv.alignment = .fill
        sv.distribution = .fill
        sv.spacing = 0
        return sv
    }()

    // MARK: - Country Code Options (Clean Professional ISO Codes)
    private let countryOptions: [(name: String, code: String)] = [
        ("India (+91)", "IN +91 ▾"),
        ("United States (+1)", "US +1 ▾"),
        ("United Kingdom (+44)", "GB +44 ▾"),
        ("UAE (+971)", "AE +971 ▾"),
        ("Singapore (+65)", "SG +65 ▾"),
        ("Australia (+61)", "AU +61 ▾"),
        ("Canada (+1)", "CA +1 ▾"),
        ("Germany (+49)", "DE +49 ▾"),
        ("France (+33)", "FR +33 ▾"),
        ("Japan (+81)", "JP +81 ▾")
    ]

    // Attendance Methods (Clean Text)
    private let attendanceMethods = [
        "Manual Punch",
        "GPS Location Tracking",
        "QR Code Scan",
        "Face Recognition",
        "Biometric Device",
        "RFID Card Access"
    ]

    // MARK: - Step Containers
    private let companyDetailsContainer = UIView()
    private let adminDetailsContainer = UIView()
    private let companySettingsContainer = UIView()
    private let holidayCalendarContainer = UIView()
    private let departmentsContainer = UIView()
    private let rolesContainer = UIView()
    private let salaryContainer = UIView()
    private let leaveContainer = UIView()
    private let shiftsContainer = UIView()
    private let branchesContainer = UIView()
    private let inviteContainer = UIView()

    // Step 1A Inputs
    private let companyNameField = SignUpViewController.makeInputField(placeholder: "Acme Corporation")
    private let companyEmailField = SignUpViewController.makeInputField(placeholder: "contact@acmecorp.com", keyboardType: .emailAddress)
    private let companyPhoneField = SignUpViewController.makeInputField(placeholder: "98765 43210", keyboardType: .phonePad)
    private var companyPhoneCodeButton: UIButton!
    private let websiteField = SignUpViewController.makeInputField(placeholder: "https://acmecorp.com", keyboardType: .URL)
    private let companySizeField = SignUpViewController.makeInputField(placeholder: "10-50")
    private let backToLoginButton = SignUpViewController.makeSecondaryButton(title: "Back to Login")
    private let companyNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 1B Inputs
    private let adminFirstNameField = SignUpViewController.makeInputField(placeholder: "John")
    private let adminLastNameField = SignUpViewController.makeInputField(placeholder: "Doe")
    private let adminEmailField = SignUpViewController.makeInputField(placeholder: "john.doe@acmecorp.com", keyboardType: .emailAddress)
    private let adminPhoneField = SignUpViewController.makeInputField(placeholder: "98765 43210", keyboardType: .phonePad)
    private var adminPhoneCodeButton: UIButton!
    private let adminPasswordField = SignUpViewController.makeInputField(placeholder: "••••••••", isSecure: true)
    private let adminConfirmPasswordField = SignUpViewController.makeInputField(placeholder: "••••••••", isSecure: true)
    private let adminBackButton = SignUpViewController.makeSecondaryButton(title: "Back")
    private let adminNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 2 Inputs
    private var attendanceMethodButton: UIButton!
    private var selectedAttendanceMethod = "Manual Punch"
    private var shiftStartTime = "09:00 AM"
    private var shiftEndTime = "06:00 PM"
    private var shiftStartButton: UIButton!
    private var shiftEndButton: UIButton!
    private var selectedWorkingDays: Set<String> = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    private let settingsBackButton = SignUpViewController.makeSecondaryButton(title: "Back")
    private let settingsNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 3 Cards
    private var selectedHolidayCalendar = "Indian"
    private var indianHolidaysCard: UIView!
    private var usHolidaysCard: UIView!
    private var customCalendarCard: UIView!
    private let holidaySkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let holidayNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 4 Departments
    private var selectedDepartments: Set<String> = ["Human Resources", "Engineering", "Information Technology"]
    private let deptSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let deptNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 5 Roles
    private var selectedRoles: Set<String> = ["Developer", "Senior Developer", "Manager"]
    private let rolesSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let rolesNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 6 Salary
    private var selectedSalary: Set<String> = ["Basic", "HRA", "Special Allowance", "PF"]
    private let salarySkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let salaryNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 7 Leave
    private var selectedLeave: Set<String> = ["Casual", "Medical", "Earned"]
    private let leaveSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let leaveNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 8 Shifts
    private var selectedShifts: Set<String> = ["General", "Flexible", "Remote"]
    private let shiftsSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let shiftsNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 9 Branches
    private var selectedBranches: Set<String> = ["Head Office", "Remote"]
    private let branchesSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let branchesNextButton = SignUpViewController.makePrimaryButton(title: "Next Step")

    // Step 10 Invite
    private let inviteEmailsTextView: UITextView = {
        let tv = UITextView()
        tv.translatesAutoresizingMaskIntoConstraints = false
        tv.font = UIFont.systemFont(ofSize: 14)
        tv.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        tv.layer.cornerRadius = 8
        tv.layer.borderWidth = 1
        tv.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        tv.backgroundColor = .white
        tv.textContainerInset = UIEdgeInsets(top: 12, left: 10, bottom: 12, right: 10)
        return tv
    }()
    private let inviteSkipButton = SignUpViewController.makeSecondaryButton(title: "Skip Step")
    private let inviteCompleteButton = SignUpViewController.makePrimaryButton(title: "Complete Setup")

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        companyPhoneField.delegate = self
        adminPhoneField.delegate = self

        setupLayout()
        setupActions()
        showStep(.companyDetails, animated: false)

        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        view.addGestureRecognizer(tap)
    }

    // MARK: - Numeric Input Restriction for Phone Fields
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        if textField == companyPhoneField || textField == adminPhoneField {
            let allowed = CharacterSet.decimalDigits
            let characterSet = CharacterSet(charactersIn: string)
            return allowed.isSuperset(of: characterSet)
        }
        return true
    }

    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }

    private func setupActions() {
        // Step 1A
        backToLoginButton.addTarget(self, action: #selector(didTapBackToLogin), for: .touchUpInside)
        companyNextButton.addTarget(self, action: #selector(didTapCompanyNext), for: .touchUpInside)

        // Step 1B
        adminBackButton.addTarget(self, action: #selector(didTapAdminBack), for: .touchUpInside)
        adminNextButton.addTarget(self, action: #selector(didTapAdminNext), for: .touchUpInside)

        // Step 2
        settingsBackButton.addTarget(self, action: #selector(didTapSettingsBack), for: .touchUpInside)
        settingsNextButton.addTarget(self, action: #selector(didTapSettingsNext), for: .touchUpInside)

        // Step 3
        holidaySkipButton.addTarget(self, action: #selector(didTapHolidayNext), for: .touchUpInside)
        holidayNextButton.addTarget(self, action: #selector(didTapHolidayNext), for: .touchUpInside)

        // Step 4
        deptSkipButton.addTarget(self, action: #selector(didTapDeptNext), for: .touchUpInside)
        deptNextButton.addTarget(self, action: #selector(didTapDeptNext), for: .touchUpInside)

        // Step 5
        rolesSkipButton.addTarget(self, action: #selector(didTapRolesNext), for: .touchUpInside)
        rolesNextButton.addTarget(self, action: #selector(didTapRolesNext), for: .touchUpInside)

        // Step 6
        salarySkipButton.addTarget(self, action: #selector(didTapSalaryNext), for: .touchUpInside)
        salaryNextButton.addTarget(self, action: #selector(didTapSalaryNext), for: .touchUpInside)

        // Step 7
        leaveSkipButton.addTarget(self, action: #selector(didTapLeaveNext), for: .touchUpInside)
        leaveNextButton.addTarget(self, action: #selector(didTapLeaveNext), for: .touchUpInside)

        // Step 8
        shiftsSkipButton.addTarget(self, action: #selector(didTapShiftsNext), for: .touchUpInside)
        shiftsNextButton.addTarget(self, action: #selector(didTapShiftsNext), for: .touchUpInside)

        // Step 9
        branchesSkipButton.addTarget(self, action: #selector(didTapBranchesNext), for: .touchUpInside)
        branchesNextButton.addTarget(self, action: #selector(didTapBranchesNext), for: .touchUpInside)

        // Step 10
        inviteSkipButton.addTarget(self, action: #selector(didCompleteRegistration), for: .touchUpInside)
        inviteCompleteButton.addTarget(self, action: #selector(didCompleteRegistration), for: .touchUpInside)

        // Top Back Button
        topBackButton.addTarget(self, action: #selector(didTapBack), for: .touchUpInside)
    }

    @objc private func didTapBackToLogin() {
        dismiss(animated: true, completion: nil)
    }

    @objc private func didTapCompanyNext() {
        let name = companyNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let email = companyEmailField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let phone = companyPhoneField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !name.isEmpty else { companyNameField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard !email.isEmpty else { companyEmailField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard !phone.isEmpty else { companyPhoneField.layer.borderColor = UIColor.systemRed.cgColor; return }

        showStep(.adminDetails, animated: true)
    }

    @objc private func didTapAdminBack() {
        showStep(.companyDetails, animated: true)
    }

    @objc private func didTapAdminNext() {
        let fn = adminFirstNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let ln = adminLastNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let email = adminEmailField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let phone = adminPhoneField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let pass = adminPasswordField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let cpass = adminConfirmPasswordField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !fn.isEmpty else { adminFirstNameField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard !ln.isEmpty else { adminLastNameField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard !email.isEmpty else { adminEmailField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard !phone.isEmpty else { adminPhoneField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard pass.count >= 6 else { adminPasswordField.layer.borderColor = UIColor.systemRed.cgColor; return }
        guard pass == cpass else { adminConfirmPasswordField.layer.borderColor = UIColor.systemRed.cgColor; return }

        showStep(.companySettings, animated: true)
    }

    @objc private func didTapSettingsBack() {
        showStep(.adminDetails, animated: true)
    }

    @objc private func didTapSettingsNext() {
        showStep(.holidayCalendar, animated: true)
    }

    @objc private func didTapHolidayNext() {
        showStep(.departments, animated: true)
    }

    @objc private func didTapDeptNext() {
        showStep(.roles, animated: true)
    }

    @objc private func didTapRolesNext() {
        showStep(.salary, animated: true)
    }

    @objc private func didTapSalaryNext() {
        showStep(.leave, animated: true)
    }

    @objc private func didTapLeaveNext() {
        showStep(.shifts, animated: true)
    }

    @objc private func didTapShiftsNext() {
        showStep(.branches, animated: true)
    }

    @objc private func didTapBranchesNext() {
        showStep(.invite, animated: true)
    }

    @objc private func didCompleteRegistration() {
        view.endEditing(true)

        let compName = companyNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let finalCompName = compName.isEmpty ? "My Company" : compName

        let compEmail = companyEmailField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let finalCompEmail = compEmail.isEmpty ? "admin@\(finalCompName.lowercased().filter { $0.isLetter || $0.isNumber }).com" : compEmail

        let cCode = (companyPhoneCodeButton?.title(for: .normal) ?? "+91")
            .replacingOccurrences(of: "▾", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let cPhone = companyPhoneField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let fullCompanyPhone = "\(cCode) \(cPhone)"

        let website = websiteField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let companySize = companySizeField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        let adminFirst = adminFirstNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let finalAdminFirst = adminFirst.isEmpty ? "Admin" : adminFirst

        let adminLast = adminLastNameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let finalAdminLast = adminLast.isEmpty ? "User" : adminLast

        let adminEmail = adminEmailField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let finalAdminEmail = adminEmail.isEmpty ? finalCompEmail : adminEmail

        let aCode = (adminPhoneCodeButton?.title(for: .normal) ?? "+91")
            .replacingOccurrences(of: "▾", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let aPhone = adminPhoneField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let fullAdminPhone = "\(aCode) \(aPhone)"

        let adminPass = adminPasswordField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        var payload: [String: Any] = [
            "companyName": finalCompName,
            "email": finalCompEmail,
            "phone": fullCompanyPhone,
            "adminFirstName": finalAdminFirst,
            "adminLastName": finalAdminLast,
            "adminEmail": finalAdminEmail,
            "attendanceMethod": selectedAttendanceMethod,
            "shiftStartTime": shiftStartTime,
            "shiftEndTime": shiftEndTime,
            "workDays": Array(selectedWorkingDays),
            "holidayRegion": selectedHolidayCalendar,
            "departments": Array(selectedDepartments),
            "roles": Array(selectedRoles),
            "salaryComponents": Array(selectedSalary),
            "leavePolicies": Array(selectedLeave),
            "shifts": Array(selectedShifts),
            "branches": Array(selectedBranches)
        ]

        if !website.isEmpty { payload["website"] = website }
        if !companySize.isEmpty { payload["companySize"] = companySize }
        if !aPhone.isEmpty { payload["adminPhone"] = fullAdminPhone }
        if !adminPass.isEmpty { payload["adminPassword"] = adminPass }

        let invites = inviteEmailsTextView.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !invites.isEmpty { payload["inviteEmails"] = invites }

        // Show Loading Alert
        let loadingAlert = UIAlertController(title: "Configuring Workspace", message: "Creating company and organization in TeamHub database...", preferredStyle: .alert)
        present(loadingAlert, animated: true, completion: nil)

        AuthService.shared.registerWizard(payload: payload) { [weak self] result in
            guard let self = self else { return }
            loadingAlert.dismiss(animated: true) {
                switch result {
                case .success:
                    let alert = UIAlertController(
                        title: "Workspace Configured!",
                        message: "Your company workspace and organization have been created successfully in the live TeamHub database. Please sign in with your administrator credentials.",
                        preferredStyle: .alert
                    )
                    alert.addAction(UIAlertAction(title: "Go to Sign In", style: .default, handler: { [weak self] _ in
                        guard let self = self else { return }
                        if let presenting = self.presentingViewController as? SignInViewController {
                            presenting.prefillEmail = finalAdminEmail
                        }
                        self.dismiss(animated: true, completion: nil)
                    }))
                    self.present(alert, animated: true, completion: nil)

                case .failure(let error):
                    let alert = UIAlertController(title: "Registration Failed", message: error.localizedDescription, preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
                    self.present(alert, animated: true, completion: nil)
                }
            }
        }
    }

    @objc private func didTapBack() {
        switch currentStep {
        case .companyDetails: break
        case .adminDetails: showStep(.companyDetails, animated: true)
        case .companySettings: showStep(.adminDetails, animated: true)
        case .holidayCalendar: showStep(.companySettings, animated: true)
        case .departments: showStep(.holidayCalendar, animated: true)
        case .roles: showStep(.departments, animated: true)
        case .salary: showStep(.roles, animated: true)
        case .leave: showStep(.salary, animated: true)
        case .shifts: showStep(.leave, animated: true)
        case .branches: showStep(.shifts, animated: true)
        case .invite: showStep(.branches, animated: true)
        }
    }

    private func showStep(_ step: Step, animated: Bool) {
        currentStep = step

        stepLabel.text = "Step \(step.visibleStepNumber) of 10"
        let progress = Float(step.visibleStepNumber) / 10.0
        progressView.setProgress(progress, animated: animated)
        titleLabel.text = step.title

        // Top Back button visible ONLY on steps that have a Skip button below (Steps 3 through 10)
        topBackButton.isHidden = (step.rawValue < Step.holidayCalendar.rawValue)

        // Toggle container visibilities (UIStackView automatically collapses hidden arranged views with 0 height)
        companyDetailsContainer.isHidden = (step != .companyDetails)
        adminDetailsContainer.isHidden = (step != .adminDetails)
        companySettingsContainer.isHidden = (step != .companySettings)
        holidayCalendarContainer.isHidden = (step != .holidayCalendar)
        departmentsContainer.isHidden = (step != .departments)
        rolesContainer.isHidden = (step != .roles)
        salaryContainer.isHidden = (step != .salary)
        leaveContainer.isHidden = (step != .leave)
        shiftsContainer.isHidden = (step != .shifts)
        branchesContainer.isHidden = (step != .branches)
        inviteContainer.isHidden = (step != .invite)

        scrollView.setContentOffset(.zero, animated: animated)
    }

    // MARK: - UI Construction
    private func setupLayout() {
        view.addSubview(fixedHeaderView)
        fixedHeaderView.addSubview(stepLabel)
        fixedHeaderView.addSubview(progressView)

        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        contentView.addSubview(titleLabel)
        contentView.addSubview(topBackButton)
        contentView.addSubview(stepContainersStackView)

        // Setup individual steps
        setupStep1A()
        setupStep1B()
        setupStep2()
        setupStep3()
        setupStep4()
        setupStep5()
        setupStep6()
        setupStep7()
        setupStep8()
        setupStep9()
        setupStep10()

        // Add all step containers into the managing UIStackView
        stepContainersStackView.addArrangedSubview(companyDetailsContainer)
        stepContainersStackView.addArrangedSubview(adminDetailsContainer)
        stepContainersStackView.addArrangedSubview(companySettingsContainer)
        stepContainersStackView.addArrangedSubview(holidayCalendarContainer)
        stepContainersStackView.addArrangedSubview(departmentsContainer)
        stepContainersStackView.addArrangedSubview(rolesContainer)
        stepContainersStackView.addArrangedSubview(salaryContainer)
        stepContainersStackView.addArrangedSubview(leaveContainer)
        stepContainersStackView.addArrangedSubview(shiftsContainer)
        stepContainersStackView.addArrangedSubview(branchesContainer)
        stepContainersStackView.addArrangedSubview(inviteContainer)

        let safeArea = view.safeAreaLayoutGuide

        NSLayoutConstraint.activate([
            // Fixed Header
            fixedHeaderView.topAnchor.constraint(equalTo: safeArea.topAnchor),
            fixedHeaderView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            fixedHeaderView.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            stepLabel.topAnchor.constraint(equalTo: fixedHeaderView.topAnchor, constant: 16),
            stepLabel.leadingAnchor.constraint(equalTo: fixedHeaderView.leadingAnchor, constant: 24),

            progressView.topAnchor.constraint(equalTo: stepLabel.bottomAnchor, constant: 8),
            progressView.leadingAnchor.constraint(equalTo: fixedHeaderView.leadingAnchor, constant: 24),
            progressView.trailingAnchor.constraint(equalTo: fixedHeaderView.trailingAnchor, constant: -24),
            progressView.heightAnchor.constraint(equalToConstant: 4),
            progressView.bottomAnchor.constraint(equalTo: fixedHeaderView.bottomAnchor, constant: -12),

            // Scroll View
            scrollView.topAnchor.constraint(equalTo: fixedHeaderView.bottomAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor),

            // Title & Top Back Button
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),

            topBackButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor),
            topBackButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: topBackButton.leadingAnchor, constant: -8),

            // Step Containers UIStackView (Pivotal: tightly hugs active step with zero conflicts)
            stepContainersStackView.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16),
            stepContainersStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            stepContainersStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            stepContainersStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -32)
        ])
    }

    private func setupStep1A() {
        companyDetailsContainer.translatesAutoresizingMaskIntoConstraints = false

        companyPhoneCodeButton = makeCountryCodeButton()
        let phoneRow = makePhoneInputRow(codeButton: companyPhoneCodeButton, textField: companyPhoneField)

        let subtitle = makeSectionHeader("Company Details")
        let nameLabel = makeFieldLabel("Company Name *")
        let emailLabel = makeFieldLabel("Work Email *")
        let phoneLabel = makeFieldLabel("Phone Number *")
        let websiteLabel = makeFieldLabel("Website (Optional)")
        let sizeLabel = makeFieldLabel("Company Size")

        let buttonRow = UIStackView(arrangedSubviews: [backToLoginButton, companyNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let stack = UIStackView(arrangedSubviews: [
            subtitle,
            nameLabel, companyNameField,
            emailLabel, companyEmailField,
            phoneLabel, phoneRow,
            websiteLabel, websiteField,
            sizeLabel, companySizeField,
            buttonRow
        ])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 8
        stack.setCustomSpacing(16, after: subtitle)
        stack.setCustomSpacing(14, after: companyNameField)
        stack.setCustomSpacing(14, after: companyEmailField)
        stack.setCustomSpacing(14, after: phoneRow)
        stack.setCustomSpacing(14, after: websiteField)
        stack.setCustomSpacing(28, after: companySizeField)

        companyDetailsContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: companyDetailsContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: companyDetailsContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: companyDetailsContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: companyDetailsContainer.bottomAnchor),

            companyNameField.heightAnchor.constraint(equalToConstant: 48),
            companyEmailField.heightAnchor.constraint(equalToConstant: 48),
            phoneRow.heightAnchor.constraint(equalToConstant: 48),
            websiteField.heightAnchor.constraint(equalToConstant: 48),
            companySizeField.heightAnchor.constraint(equalToConstant: 48),
            backToLoginButton.heightAnchor.constraint(equalToConstant: 50),
            companyNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep1B() {
        adminDetailsContainer.translatesAutoresizingMaskIntoConstraints = false

        adminPhoneCodeButton = makeCountryCodeButton()
        let phoneRow = makePhoneInputRow(codeButton: adminPhoneCodeButton, textField: adminPhoneField)

        let subtitle = makeSectionHeader("Administrator Details")
        let fnLabel = makeFieldLabel("Admin First Name *")
        let lnLabel = makeFieldLabel("Admin Last Name *")
        let emailLabel = makeFieldLabel("Admin Work Email *")
        let phoneLabel = makeFieldLabel("Admin Phone *")
        let passLabel = makeFieldLabel("Admin Password *")
        let cpassLabel = makeFieldLabel("Confirm Password *")

        let buttonRow = UIStackView(arrangedSubviews: [adminBackButton, adminNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let stack = UIStackView(arrangedSubviews: [
            subtitle,
            fnLabel, adminFirstNameField,
            lnLabel, adminLastNameField,
            emailLabel, adminEmailField,
            phoneLabel, phoneRow,
            passLabel, adminPasswordField,
            cpassLabel, adminConfirmPasswordField,
            buttonRow
        ])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 8
        stack.setCustomSpacing(16, after: subtitle)
        stack.setCustomSpacing(14, after: adminFirstNameField)
        stack.setCustomSpacing(14, after: adminLastNameField)
        stack.setCustomSpacing(14, after: adminEmailField)
        stack.setCustomSpacing(14, after: phoneRow)
        stack.setCustomSpacing(14, after: adminPasswordField)
        stack.setCustomSpacing(28, after: adminConfirmPasswordField)

        adminDetailsContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: adminDetailsContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: adminDetailsContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: adminDetailsContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: adminDetailsContainer.bottomAnchor),

            adminFirstNameField.heightAnchor.constraint(equalToConstant: 48),
            adminLastNameField.heightAnchor.constraint(equalToConstant: 48),
            adminEmailField.heightAnchor.constraint(equalToConstant: 48),
            phoneRow.heightAnchor.constraint(equalToConstant: 48),
            adminPasswordField.heightAnchor.constraint(equalToConstant: 48),
            adminConfirmPasswordField.heightAnchor.constraint(equalToConstant: 48),
            adminBackButton.heightAnchor.constraint(equalToConstant: 50),
            adminNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep2() {
        companySettingsContainer.translatesAutoresizingMaskIntoConstraints = false

        let attLabel = makeFieldLabel("Default Attendance Method")
        attendanceMethodButton = makeAttendanceDropdownButton()

        let shiftRow = makeShiftTimeRow()
        let daysView = makeWorkingDaysPillView()

        let buttonRow = UIStackView(arrangedSubviews: [settingsBackButton, settingsNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let stack = UIStackView(arrangedSubviews: [
            attLabel, attendanceMethodButton,
            shiftRow,
            daysView,
            buttonRow
        ])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 12
        stack.setCustomSpacing(16, after: attendanceMethodButton)
        stack.setCustomSpacing(16, after: shiftRow)
        stack.setCustomSpacing(28, after: daysView)

        companySettingsContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: companySettingsContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: companySettingsContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: companySettingsContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: companySettingsContainer.bottomAnchor),

            attendanceMethodButton.heightAnchor.constraint(equalToConstant: 48),
            settingsBackButton.heightAnchor.constraint(equalToConstant: 50),
            settingsNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep3() {
        holidayCalendarContainer.translatesAutoresizingMaskIntoConstraints = false

        indianHolidaysCard = makeHolidayCard(
            title: "Indian National Holidays",
            subtitle: "Republic Day, Independence Day, Gandhi Jayanti, Diwali, and more.",
            type: "Indian"
        )
        usHolidaysCard = makeHolidayCard(
            title: "US Federal Holidays",
            subtitle: "New Year's Day, Memorial Day, Juneteenth, Independence Day, etc.",
            type: "US"
        )
        customCalendarCard = makeHolidayCard(
            title: "Custom Holiday Calendar",
            subtitle: "Start with a blank calendar and add holidays manually.",
            type: "Custom"
        )

        let buttonRow = UIStackView(arrangedSubviews: [holidaySkipButton, holidayNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let stack = UIStackView(arrangedSubviews: [
            indianHolidaysCard,
            usHolidaysCard,
            customCalendarCard,
            buttonRow
        ])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 12
        stack.setCustomSpacing(28, after: customCalendarCard)

        holidayCalendarContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: holidayCalendarContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: holidayCalendarContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: holidayCalendarContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: holidayCalendarContainer.bottomAnchor),

            holidaySkipButton.heightAnchor.constraint(equalToConstant: 50),
            holidayNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep4() {
        departmentsContainer.translatesAutoresizingMaskIntoConstraints = false

        let departments = [
            "Human Resources", "Finance", "Information Technology", "Marketing",
            "Operations", "Sales", "Customer Support", "Legal", "Product", "Engineering"
        ]

        let listStack = makeCapsuleList(items: departments, selectedSet: selectedDepartments) { [weak self] item in
            guard let self = self else { return }
            if self.selectedDepartments.contains(item) {
                if self.selectedDepartments.count > 1 { self.selectedDepartments.remove(item) }
            } else {
                self.selectedDepartments.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [deptSkipButton, deptNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Standard Departments")
        let desc = makeSectionSubHeader("Select the core departments for your company.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        departmentsContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: departmentsContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: departmentsContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: departmentsContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: departmentsContainer.bottomAnchor),

            deptSkipButton.heightAnchor.constraint(equalToConstant: 50),
            deptNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep5() {
        rolesContainer.translatesAutoresizingMaskIntoConstraints = false

        let roles = [
            "Intern", "Junior Developer", "Developer", "Senior Developer",
            "Lead", "Manager", "Director", "HR Executive", "Sales Representative"
        ]

        let listStack = makeCapsuleList(items: roles, selectedSet: selectedRoles) { [weak self] item in
            guard let self = self else { return }
            if self.selectedRoles.contains(item) {
                if self.selectedRoles.count > 1 { self.selectedRoles.remove(item) }
            } else {
                self.selectedRoles.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [rolesSkipButton, rolesNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Standard Designations")
        let desc = makeSectionSubHeader("Select the job titles used in your organization.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        rolesContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: rolesContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: rolesContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: rolesContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: rolesContainer.bottomAnchor),

            rolesSkipButton.heightAnchor.constraint(equalToConstant: 50),
            rolesNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep6() {
        salaryContainer.translatesAutoresizingMaskIntoConstraints = false

        let components = [
            "Basic", "HRA", "Medical", "Travel", "Special Allowance",
            "Bonus", "PF", "ESI", "Professional Tax"
        ]

        let listStack = makeCapsuleList(items: components, selectedSet: selectedSalary) { [weak self] item in
            guard let self = self else { return }
            if self.selectedSalary.contains(item) {
                if self.selectedSalary.count > 1 { self.selectedSalary.remove(item) }
            } else {
                self.selectedSalary.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [salarySkipButton, salaryNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Payroll Components")
        let desc = makeSectionSubHeader("Select the standard earnings and deductions for your salary structure.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        salaryContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: salaryContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: salaryContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: salaryContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: salaryContainer.bottomAnchor),

            salarySkipButton.heightAnchor.constraint(equalToConstant: 50),
            salaryNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep7() {
        leaveContainer.translatesAutoresizingMaskIntoConstraints = false

        let leaves = [
            "Casual", "Earned", "Medical", "Maternity", "Paternity",
            "Unpaid", "Compensatory Off", "Bereavement"
        ]

        let listStack = makeCapsuleList(items: leaves, selectedSet: selectedLeave) { [weak self] item in
            guard let self = self else { return }
            if self.selectedLeave.contains(item) {
                if self.selectedLeave.count > 1 { self.selectedLeave.remove(item) }
            } else {
                self.selectedLeave.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [leaveSkipButton, leaveNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Standard Leave Policies")
        let desc = makeSectionSubHeader("Select the types of time-off you want to offer to your employees.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        leaveContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: leaveContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: leaveContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: leaveContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: leaveContainer.bottomAnchor),

            leaveSkipButton.heightAnchor.constraint(equalToConstant: 50),
            leaveNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep8() {
        shiftsContainer.translatesAutoresizingMaskIntoConstraints = false

        let shifts = ["Morning", "General", "Night", "Flexible", "Remote", "Rotational"]

        let listStack = makeCapsuleList(items: shifts, selectedSet: selectedShifts) { [weak self] item in
            guard let self = self else { return }
            if self.selectedShifts.contains(item) {
                if self.selectedShifts.count > 1 { self.selectedShifts.remove(item) }
            } else {
                self.selectedShifts.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [shiftsSkipButton, shiftsNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Shift Management")
        let desc = makeSectionSubHeader("Select the standard shift types your employees work.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        shiftsContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: shiftsContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: shiftsContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: shiftsContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: shiftsContainer.bottomAnchor),

            shiftsSkipButton.heightAnchor.constraint(equalToConstant: 50),
            shiftsNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep9() {
        branchesContainer.translatesAutoresizingMaskIntoConstraints = false

        let branches = ["Head Office", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Remote"]

        let listStack = makeCapsuleList(items: branches, selectedSet: selectedBranches) { [weak self] item in
            guard let self = self else { return }
            if self.selectedBranches.contains(item) {
                if self.selectedBranches.count > 1 { self.selectedBranches.remove(item) }
            } else {
                self.selectedBranches.insert(item)
            }
        }

        let buttonRow = UIStackView(arrangedSubviews: [branchesSkipButton, branchesNextButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let header = makeSectionHeader("Office Locations")
        let desc = makeSectionSubHeader("Select the standard locations where your employees operate.")

        let stack = UIStackView(arrangedSubviews: [header, desc, listStack, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(28, after: listStack)

        branchesContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: branchesContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: branchesContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: branchesContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: branchesContainer.bottomAnchor),

            branchesSkipButton.heightAnchor.constraint(equalToConstant: 50),
            branchesNextButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    private func setupStep10() {
        inviteContainer.translatesAutoresizingMaskIntoConstraints = false

        let header = makeSectionHeader("Invite Employees")
        let desc = makeSectionSubHeader("Invite your employees now, or skip this step and add them later from the dashboard.")
        let emailLabel = makeFieldLabel("Employee Email Addresses (comma-separated)")

        let helperCard = UIView()
        helperCard.translatesAutoresizingMaskIntoConstraints = false
        helperCard.backgroundColor = UIColor(red: 243/255, green: 244/255, blue: 246/255, alpha: 1.0)
        helperCard.layer.cornerRadius = 16
        helperCard.layer.borderWidth = 1
        helperCard.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor

        let cardTitle = UILabel()
        cardTitle.translatesAutoresizingMaskIntoConstraints = false
        cardTitle.text = "Bulk Invitation"
        cardTitle.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        cardTitle.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)

        let cardDesc = UILabel()
        cardDesc.translatesAutoresizingMaskIntoConstraints = false
        cardDesc.text = "Directory invitations and employee logins can also be uploaded via CSV or Excel anytime from your TeamHub Admin Console."
        cardDesc.font = UIFont.systemFont(ofSize: 12)
        cardDesc.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        cardDesc.numberOfLines = 0

        let cardStack = UIStackView(arrangedSubviews: [cardTitle, cardDesc])
        cardStack.translatesAutoresizingMaskIntoConstraints = false
        cardStack.axis = .vertical
        cardStack.spacing = 4

        helperCard.addSubview(cardStack)
        NSLayoutConstraint.activate([
            cardStack.topAnchor.constraint(equalTo: helperCard.topAnchor, constant: 14),
            cardStack.leadingAnchor.constraint(equalTo: helperCard.leadingAnchor, constant: 16),
            cardStack.trailingAnchor.constraint(equalTo: helperCard.trailingAnchor, constant: -16),
            cardStack.bottomAnchor.constraint(equalTo: helperCard.bottomAnchor, constant: -14)
        ])

        let buttonRow = UIStackView(arrangedSubviews: [inviteSkipButton, inviteCompleteButton])
        buttonRow.translatesAutoresizingMaskIntoConstraints = false
        buttonRow.axis = .horizontal
        buttonRow.spacing = 12
        buttonRow.distribution = .fillEqually

        let stack = UIStackView(arrangedSubviews: [header, desc, emailLabel, inviteEmailsTextView, helperCard, buttonRow])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        stack.setCustomSpacing(4, after: header)
        stack.setCustomSpacing(16, after: desc)
        stack.setCustomSpacing(16, after: inviteEmailsTextView)
        stack.setCustomSpacing(28, after: helperCard)

        inviteContainer.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: inviteContainer.topAnchor),
            stack.leadingAnchor.constraint(equalTo: inviteContainer.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: inviteContainer.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: inviteContainer.bottomAnchor),

            inviteEmailsTextView.heightAnchor.constraint(equalToConstant: 110),
            inviteSkipButton.heightAnchor.constraint(equalToConstant: 50),
            inviteCompleteButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }

    // MARK: - Helper Components
    private func makeCountryCodeButton() -> UIButton {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("IN +91 ▾", for: .normal)
        btn.setTitleColor(UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0), for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)

        if #available(iOS 14.0, *) {
            let actions = countryOptions.map { opt in
                UIAction(title: opt.name) { [weak btn] _ in
                    btn?.setTitle(opt.code, for: .normal)
                }
            }
            btn.menu = UIMenu(title: "Select Country Code", children: actions)
            btn.showsMenuAsPrimaryAction = true
        }
        return btn
    }

    private func makePhoneInputRow(codeButton: UIButton, textField: UITextField) -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false
        container.layer.cornerRadius = 6
        container.layer.borderWidth = 1
        container.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        container.backgroundColor = .white

        let divider = UIView()
        divider.translatesAutoresizingMaskIntoConstraints = false
        divider.backgroundColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0)

        textField.layer.borderWidth = 0

        container.addSubview(codeButton)
        container.addSubview(divider)
        container.addSubview(textField)

        NSLayoutConstraint.activate([
            codeButton.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 6),
            codeButton.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            codeButton.widthAnchor.constraint(equalToConstant: 88),

            divider.leadingAnchor.constraint(equalTo: codeButton.trailingAnchor, constant: 2),
            divider.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            divider.widthAnchor.constraint(equalToConstant: 1),
            divider.heightAnchor.constraint(equalToConstant: 24),

            textField.leadingAnchor.constraint(equalTo: divider.trailingAnchor, constant: 8),
            textField.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -8),
            textField.topAnchor.constraint(equalTo: container.topAnchor),
            textField.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
        return container
    }

    private func makeAttendanceDropdownButton() -> UIButton {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Manual Punch", for: .normal)
        btn.setTitleColor(UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0), for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        btn.contentHorizontalAlignment = .left
        btn.titleEdgeInsets = UIEdgeInsets(top: 0, left: 14, bottom: 0, right: 36)
        btn.layer.cornerRadius = 6
        btn.layer.borderWidth = 1
        btn.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        btn.backgroundColor = .white

        let chevron = UIImageView(image: UIImage(systemName: "chevron.down"))
        chevron.translatesAutoresizingMaskIntoConstraints = false
        chevron.tintColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        btn.addSubview(chevron)
        NSLayoutConstraint.activate([
            chevron.trailingAnchor.constraint(equalTo: btn.trailingAnchor, constant: -14),
            chevron.centerYAnchor.constraint(equalTo: btn.centerYAnchor),
            chevron.widthAnchor.constraint(equalToConstant: 14),
            chevron.heightAnchor.constraint(equalToConstant: 14)
        ])

        if #available(iOS 14.0, *) {
            let actions = attendanceMethods.map { method in
                UIAction(title: method) { [weak self, weak btn] _ in
                    self?.selectedAttendanceMethod = method
                    btn?.setTitle(method, for: .normal)
                }
            }
            btn.menu = UIMenu(title: "Select Attendance Method", children: actions)
            btn.showsMenuAsPrimaryAction = true
        }
        return btn
    }

    private func makeShiftTimeRow() -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false

        let startCol = UIView()
        startCol.translatesAutoresizingMaskIntoConstraints = false
        let startLabel = makeFieldLabel("Standard Shift Start Time")
        shiftStartButton = makeTimeButton(time: "09:00 AM")
        startCol.addSubview(startLabel)
        startCol.addSubview(shiftStartButton)

        let endCol = UIView()
        endCol.translatesAutoresizingMaskIntoConstraints = false
        let endLabel = makeFieldLabel("Standard Shift End Time")
        shiftEndButton = makeTimeButton(time: "06:00 PM")
        endCol.addSubview(endLabel)
        endCol.addSubview(shiftEndButton)

        let stack = UIStackView(arrangedSubviews: [startCol, endCol])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.spacing = 12
        stack.distribution = .fillEqually

        container.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: container.topAnchor),
            stack.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: container.bottomAnchor),

            startLabel.topAnchor.constraint(equalTo: startCol.topAnchor),
            startLabel.leadingAnchor.constraint(equalTo: startCol.leadingAnchor),
            startLabel.trailingAnchor.constraint(equalTo: startCol.trailingAnchor),

            shiftStartButton.topAnchor.constraint(equalTo: startLabel.bottomAnchor, constant: 6),
            shiftStartButton.leadingAnchor.constraint(equalTo: startCol.leadingAnchor),
            shiftStartButton.trailingAnchor.constraint(equalTo: startCol.trailingAnchor),
            shiftStartButton.bottomAnchor.constraint(equalTo: startCol.bottomAnchor),
            shiftStartButton.heightAnchor.constraint(equalToConstant: 48),

            endLabel.topAnchor.constraint(equalTo: endCol.topAnchor),
            endLabel.leadingAnchor.constraint(equalTo: endCol.leadingAnchor),
            endLabel.trailingAnchor.constraint(equalTo: endCol.trailingAnchor),

            shiftEndButton.topAnchor.constraint(equalTo: endLabel.bottomAnchor, constant: 6),
            shiftEndButton.leadingAnchor.constraint(equalTo: endCol.leadingAnchor),
            shiftEndButton.trailingAnchor.constraint(equalTo: endCol.trailingAnchor),
            shiftEndButton.bottomAnchor.constraint(equalTo: endCol.bottomAnchor),
            shiftEndButton.heightAnchor.constraint(equalToConstant: 48)
        ])
        return container
    }

    private func makeTimeButton(time: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle(time, for: .normal)
        btn.setTitleColor(UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0), for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        btn.layer.cornerRadius = 6
        btn.layer.borderWidth = 1
        btn.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        btn.backgroundColor = .white
        return btn
    }

    private func makeWorkingDaysPillView() -> UIView {
        let container = UIView()
        container.translatesAutoresizingMaskIntoConstraints = false

        let header = makeFieldLabel("Working Days")
        let sub = makeSectionSubHeader("Tap the days your organization operates on.")

        let row1Days = ["Mon", "Tue", "Wed", "Thu"]
        let row2Days = ["Fri", "Sat", "Sun"]

        let row1Views = row1Days.map { day -> DayCapsuleItemView in
            let pill = DayCapsuleItemView(day: day, isSelected: selectedWorkingDays.contains(day))
            pill.onTapped = { [weak self, weak pill] in
                guard let self = self, let pill = pill else { return }
                if self.selectedWorkingDays.contains(day) {
                    if self.selectedWorkingDays.count > 1 {
                        self.selectedWorkingDays.remove(day)
                        pill.isSelectedState = false
                    }
                } else {
                    self.selectedWorkingDays.insert(day)
                    pill.isSelectedState = true
                }
            }
            return pill
        }

        let row2Views = row2Days.map { day -> DayCapsuleItemView in
            let pill = DayCapsuleItemView(day: day, isSelected: selectedWorkingDays.contains(day))
            pill.onTapped = { [weak self, weak pill] in
                guard let self = self, let pill = pill else { return }
                if self.selectedWorkingDays.contains(day) {
                    if self.selectedWorkingDays.count > 1 {
                        self.selectedWorkingDays.remove(day)
                        pill.isSelectedState = false
                    }
                } else {
                    self.selectedWorkingDays.insert(day)
                    pill.isSelectedState = true
                }
            }
            return pill
        }

        let row1Stack = UIStackView(arrangedSubviews: row1Views)
        row1Stack.axis = .horizontal
        row1Stack.spacing = 8
        row1Stack.distribution = .fillEqually

        let row2Stack = UIStackView(arrangedSubviews: row2Views)
        row2Stack.axis = .horizontal
        row2Stack.spacing = 8
        row2Stack.distribution = .fillEqually

        let mainStack = UIStackView(arrangedSubviews: [header, sub, row1Stack, row2Stack])
        mainStack.translatesAutoresizingMaskIntoConstraints = false
        mainStack.axis = .vertical
        mainStack.spacing = 8
        mainStack.setCustomSpacing(2, after: header)
        mainStack.setCustomSpacing(12, after: sub)

        container.addSubview(mainStack)
        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: container.topAnchor),
            mainStack.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            mainStack.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            mainStack.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
        return container
    }

    private func makeHolidayCard(title: String, subtitle: String, type: String) -> UIView {
        let card = UIView()
        card.translatesAutoresizingMaskIntoConstraints = false
        card.layer.cornerRadius = 24
        card.clipsToBounds = true

        let isSelected = (selectedHolidayCalendar == type)
        if isSelected {
            card.backgroundColor = .white
            card.layer.borderWidth = 2
            card.layer.borderColor = SignUpViewController.brandBlue.cgColor
        } else {
            card.backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
            card.layer.borderWidth = 1.5
            card.layer.borderColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0).cgColor
        }

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = title
        titleLabel.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        titleLabel.textColor = isSelected ? SignUpViewController.brandBlue : UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)

        let subtitleLabel = UILabel()
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.text = subtitle
        subtitleLabel.font = UIFont.systemFont(ofSize: 12)
        subtitleLabel.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        subtitleLabel.numberOfLines = 0

        let stack = UIStackView(arrangedSubviews: [titleLabel, subtitleLabel])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 4

        card.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 14),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -14)
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(didTapHolidayCard(_:)))
        card.addGestureRecognizer(tap)
        card.isUserInteractionEnabled = true
        card.accessibilityIdentifier = type
        return card
    }

    @objc private func didTapHolidayCard(_ gesture: UITapGestureRecognizer) {
        guard let view = gesture.view, let type = view.accessibilityIdentifier else { return }
        selectedHolidayCalendar = type
        updateHolidayCards()
    }

    private func updateHolidayCards() {
        let cards = [
            ("Indian", indianHolidaysCard),
            ("US", usHolidaysCard),
            ("Custom", customCalendarCard)
        ]
        for (type, card) in cards {
            guard let card = card else { continue }
            let isSelected = (selectedHolidayCalendar == type)
            if isSelected {
                card.backgroundColor = .white
                card.layer.borderWidth = 2
                card.layer.borderColor = SignUpViewController.brandBlue.cgColor
            } else {
                card.backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
                card.layer.borderWidth = 1.5
                card.layer.borderColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0).cgColor
            }
            if let stack = card.subviews.first as? UIStackView,
               let titleLbl = stack.arrangedSubviews.first as? UILabel {
                titleLbl.textColor = isSelected ? SignUpViewController.brandBlue : UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
            }
        }
    }

    private func makeCapsuleList(items: [String], selectedSet: Set<String>, onToggle: @escaping (String) -> Void) -> UIStackView {
        let views = items.map { item -> CapsuleItemView in
            let capsule = CapsuleItemView(title: item, isSelected: selectedSet.contains(item))
            capsule.onTapped = { [weak capsule] in
                guard let capsule = capsule else { return }
                capsule.isSelectedState = !capsule.isSelectedState
                onToggle(item)
            }
            return capsule
        }

        let stack = UIStackView(arrangedSubviews: views)
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 10
        return stack
    }

    // MARK: - Factory Helpers
    private static func makeInputField(placeholder: String, keyboardType: UIKeyboardType = .default, isSecure: Bool = false) -> UITextField {
        let tf = UITextField()
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.placeholder = placeholder
        tf.font = UIFont.systemFont(ofSize: 14)
        tf.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        tf.layer.cornerRadius = 6
        tf.layer.borderWidth = 1
        tf.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        tf.backgroundColor = .white
        tf.keyboardType = keyboardType
        tf.isSecureTextEntry = isSecure
        tf.autocapitalizationType = .none
        tf.autocorrectionType = .no

        let padding = UIView(frame: CGRect(x: 0, y: 0, width: 14, height: 48))
        tf.leftView = padding
        tf.leftViewMode = .always
        return tf
    }

    static func makePrimaryButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        btn.backgroundColor = SignUpViewController.brandBlue
        btn.layer.cornerRadius = 8
        btn.clipsToBounds = true
        return btn
    }

    static func makeSecondaryButton(title: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0), for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        btn.backgroundColor = UIColor(red: 243/255, green: 244/255, blue: 246/255, alpha: 1.0)
        btn.layer.cornerRadius = 8
        btn.layer.borderWidth = 1
        btn.layer.borderColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0).cgColor
        btn.clipsToBounds = true
        return btn
    }

    private func makeFieldLabel(_ text: String) -> UILabel {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = text
        lbl.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        lbl.textColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0)
        return lbl
    }

    private func makeSectionHeader(_ text: String) -> UILabel {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = text
        lbl.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        lbl.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        return lbl
    }

    private func makeSectionSubHeader(_ text: String) -> UILabel {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.text = text
        lbl.font = UIFont.systemFont(ofSize: 13)
        lbl.textColor = UIColor(red: 107/255, green: 114/255, blue: 128/255, alpha: 1.0)
        return lbl
    }
}

// MARK: - Capsule Item View (Canva Reference Implementation)
class CapsuleItemView: UIView {
    private let dotView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.backgroundColor = SignUpViewController.brandBlue
        v.layer.cornerRadius = 8
        v.clipsToBounds = true
        return v
    }()

    private let titleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.font = UIFont.systemFont(ofSize: 14, weight: .bold)
        lbl.textAlignment = .center
        return lbl
    }()

    private let rightSpacer: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    var isSelectedState: Bool = false {
        didSet { updateVisual() }
    }

    var onTapped: (() -> Void)?

    init(title: String, isSelected: Bool = false) {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        layer.cornerRadius = 24
        clipsToBounds = true
        titleLabel.text = title
        self.isSelectedState = isSelected

        addSubview(dotView)
        addSubview(titleLabel)
        addSubview(rightSpacer)

        NSLayoutConstraint.activate([
            heightAnchor.constraint(equalToConstant: 48),

            dotView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            dotView.centerYAnchor.constraint(equalTo: centerYAnchor),
            dotView.widthAnchor.constraint(equalToConstant: 16),
            dotView.heightAnchor.constraint(equalToConstant: 16),

            rightSpacer.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            rightSpacer.centerYAnchor.constraint(equalTo: centerYAnchor),
            rightSpacer.widthAnchor.constraint(equalToConstant: 16),
            rightSpacer.heightAnchor.constraint(equalToConstant: 16),

            titleLabel.leadingAnchor.constraint(equalTo: dotView.trailingAnchor, constant: 8),
            titleLabel.trailingAnchor.constraint(equalTo: rightSpacer.leadingAnchor, constant: -8),
            titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])

        updateVisual()

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(tap)
        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func handleTap() {
        onTapped?()
    }

    private func updateVisual() {
        if isSelectedState {
            backgroundColor = .white
            layer.borderWidth = 2
            layer.borderColor = SignUpViewController.brandBlue.cgColor
            dotView.isHidden = false
            titleLabel.textColor = SignUpViewController.brandBlue
        } else {
            backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
            layer.borderWidth = 1.5
            layer.borderColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0).cgColor
            dotView.isHidden = true
            titleLabel.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        }
    }
}

// MARK: - Day Capsule Item View
class DayCapsuleItemView: UIView {
    private let dotView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.backgroundColor = SignUpViewController.brandBlue
        v.layer.cornerRadius = 5
        v.clipsToBounds = true
        return v
    }()

    private let titleLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        lbl.textAlignment = .center
        return lbl
    }()

    var isSelectedState: Bool = false {
        didSet { updateVisual() }
    }
    var onTapped: (() -> Void)?

    init(day: String, isSelected: Bool) {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        layer.cornerRadius = 22
        clipsToBounds = true
        titleLabel.text = day
        self.isSelectedState = isSelected

        let stack = UIStackView(arrangedSubviews: [dotView, titleLabel])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.spacing = 6
        stack.alignment = .center
        addSubview(stack)

        NSLayoutConstraint.activate([
            heightAnchor.constraint(equalToConstant: 44),
            dotView.widthAnchor.constraint(equalToConstant: 10),
            dotView.heightAnchor.constraint(equalToConstant: 10),
            stack.centerXAnchor.constraint(equalTo: centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])

        updateVisual()
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(tap)
        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func handleTap() {
        onTapped?()
    }

    private func updateVisual() {
        if isSelectedState {
            backgroundColor = .white
            layer.borderWidth = 2
            layer.borderColor = SignUpViewController.brandBlue.cgColor
            dotView.isHidden = false
            titleLabel.textColor = SignUpViewController.brandBlue
        } else {
            backgroundColor = UIColor(red: 229/255, green: 231/255, blue: 235/255, alpha: 1.0)
            layer.borderWidth = 1.5
            layer.borderColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0).cgColor
            dotView.isHidden = true
            titleLabel.textColor = UIColor(red: 17/255, green: 24/255, blue: 39/255, alpha: 1.0)
        }
    }
}
