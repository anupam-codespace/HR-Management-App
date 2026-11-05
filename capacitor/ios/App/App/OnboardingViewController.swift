import UIKit
import Capacitor

struct OnboardingSlide {
    let imageName: String
    let title: String
    let subtitle: String
}

class OnboardingViewController: UIViewController, UIScrollViewDelegate {

    private let slides: [OnboardingSlide] = [
        OnboardingSlide(
            imageName: "onboarding_shifts",
            title: "Shift schedules",
            subtitle: "Efficiently manage employee shifts and attendance reports"
        ),
        OnboardingSlide(
            imageName: "onboarding_face",
            title: "Facial recognition",
            subtitle: "Smile and snap a picture to mark attendance"
        ),
        OnboardingSlide(
            imageName: "onboarding_leave",
            title: "Leave tracker",
            subtitle: "An intuitive leave management tool your team will love"
        ),
        OnboardingSlide(
            imageName: "onboarding_performance",
            title: "Performance tracking",
            subtitle: "Measure goals, KRAs, and skills. Share feedback and run accurate appraisals"
        )
    ]

    private let scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        sv.isPagingEnabled = true
        sv.showsHorizontalScrollIndicator = false
        sv.showsVerticalScrollIndicator = false
        sv.bounces = false
        return sv
    }()

    private let pageControl: UIPageControl = {
        let pc = UIPageControl()
        pc.translatesAutoresizingMaskIntoConstraints = false
        pc.numberOfPages = 7 // Matches reference image dot count
        pc.currentPage = 0
        pc.currentPageIndicatorTintColor = UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0)
        pc.pageIndicatorTintColor = UIColor(red: 209/255, green: 213/255, blue: 219/255, alpha: 1.0)
        return pc
    }()

    private let signInButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Sign In", for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .bold)
        btn.backgroundColor = .black
        btn.layer.cornerRadius = 27
        btn.clipsToBounds = true
        return btn
    }()

    private let signUpLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.textAlignment = .center
        lbl.font = UIFont.systemFont(ofSize: 14)
        lbl.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)

        let fullText = "Don't have an account? Sign Up"
        let attributedString = NSMutableAttributedString(string: fullText)
        if let range = fullText.range(of: "Sign Up") {
            let nsRange = NSRange(range, in: fullText)
            attributedString.addAttribute(.foregroundColor, value: UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0), range: nsRange)
        }
        lbl.attributedText = attributedString
        return lbl
    }()

    private let contactLabel: UILabel = {
        let lbl = UILabel()
        lbl.translatesAutoresizingMaskIntoConstraints = false
        lbl.textAlignment = .center
        lbl.font = UIFont.systemFont(ofSize: 14)
        lbl.textColor = UIColor(red: 31/255, green: 41/255, blue: 55/255, alpha: 1.0)

        let fullText = "Have trouble signing in? Contact us"
        let attributedString = NSMutableAttributedString(string: fullText)
        if let range = fullText.range(of: "Contact us") {
            let nsRange = NSRange(range, in: fullText)
            attributedString.addAttribute(.foregroundColor, value: UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0), range: nsRange)
        }
        lbl.attributedText = attributedString
        return lbl
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        scrollView.delegate = self
        setupViews()
        signInButton.addTarget(self, action: #selector(didTapSignIn), for: .touchUpInside)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        setupSlidePages()
    }

    private func setupViews() {
        view.addSubview(scrollView)
        view.addSubview(pageControl)
        view.addSubview(signInButton)
        view.addSubview(signUpLabel)
        view.addSubview(contactLabel)

        let safeArea = view.safeAreaLayoutGuide

        NSLayoutConstraint.activate([
            // ScrollView for slides
            scrollView.topAnchor.constraint(equalTo: safeArea.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: pageControl.topAnchor, constant: -16),

            // Page indicator dots
            pageControl.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            pageControl.bottomAnchor.constraint(equalTo: signInButton.topAnchor, constant: -28),
            pageControl.heightAnchor.constraint(equalToConstant: 20),

            // Sign In Button
            signInButton.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 28),
            signInButton.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -28),
            signInButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            signInButton.widthAnchor.constraint(lessThanOrEqualToConstant: 440),
            signInButton.bottomAnchor.constraint(equalTo: signUpLabel.topAnchor, constant: -20),
            signInButton.heightAnchor.constraint(equalToConstant: 54),

            // Sign Up Label
            signUpLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            signUpLabel.bottomAnchor.constraint(equalTo: contactLabel.topAnchor, constant: -8),

            // Contact Us Label
            contactLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            contactLabel.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor, constant: -16)
        ])
    }

    private var pagesConfigured = false
    private func setupSlidePages() {
        guard !pagesConfigured, scrollView.frame.width > 0 else { return }
        pagesConfigured = true

        let width = scrollView.frame.width
        let height = scrollView.frame.height
        scrollView.contentSize = CGSize(width: width * CGFloat(slides.count), height: height)

        for (index, slide) in slides.enumerated() {
            let slideView = UIView(frame: CGRect(x: CGFloat(index) * width, y: 0, width: width, height: height))

            let imageView = UIImageView()
            imageView.translatesAutoresizingMaskIntoConstraints = false
            imageView.contentMode = .scaleAspectFit
            imageView.image = UIImage(named: slide.imageName)

            let titleLabel = UILabel()
            titleLabel.translatesAutoresizingMaskIntoConstraints = false
            titleLabel.text = slide.title
            titleLabel.textColor = .black
            titleLabel.font = UIFont.systemFont(ofSize: 28, weight: .bold)
            titleLabel.textAlignment = .center

            let subtitleLabel = UILabel()
            subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
            subtitleLabel.text = slide.subtitle
            subtitleLabel.textColor = UIColor(red: 55/255, green: 65/255, blue: 81/255, alpha: 1.0)
            subtitleLabel.font = UIFont.systemFont(ofSize: 16, weight: .regular)
            subtitleLabel.textAlignment = .center
            subtitleLabel.numberOfLines = 2

            slideView.addSubview(imageView)
            slideView.addSubview(titleLabel)
            slideView.addSubview(subtitleLabel)

            NSLayoutConstraint.activate([
                imageView.topAnchor.constraint(equalTo: slideView.topAnchor, constant: 40),
                imageView.centerXAnchor.constraint(equalTo: slideView.centerXAnchor),
                imageView.widthAnchor.constraint(equalToConstant: 260),
                imageView.heightAnchor.constraint(equalToConstant: 230),

                titleLabel.topAnchor.constraint(equalTo: imageView.bottomAnchor, constant: 36),
                titleLabel.leadingAnchor.constraint(equalTo: slideView.leadingAnchor, constant: 24),
                titleLabel.trailingAnchor.constraint(equalTo: slideView.trailingAnchor, constant: -24),

                subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 14),
                subtitleLabel.leadingAnchor.constraint(equalTo: slideView.leadingAnchor, constant: 28),
                subtitleLabel.trailingAnchor.constraint(equalTo: slideView.trailingAnchor, constant: -28)
            ])

            scrollView.addSubview(slideView)
        }
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let page = Int(round(scrollView.contentOffset.x / scrollView.frame.width))
        pageControl.currentPage = page
    }

    @objc private func didTapSignIn() {
        let signInVC = SignInViewController()
        signInVC.modalPresentationStyle = .fullScreen
        signInVC.modalTransitionStyle = .crossDissolve
        present(signInVC, animated: true, completion: nil)
    }
}
