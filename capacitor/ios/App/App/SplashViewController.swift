import UIKit
import AVFoundation
import Capacitor

class SplashViewController: UIViewController {

    // MARK: - Video Container & Player
    private let videoContainerView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.backgroundColor = UIColor(red: 5/255, green: 10/255, blue: 30/255, alpha: 1.0)
        return v
    }()

    private var player: AVQueuePlayer?
    private var playerLooper: AVPlayerLooper?
    private var playerLayer: AVPlayerLayer?

    private let gradientOverlay: CAGradientLayer = {
        let gl = CAGradientLayer()
        gl.colors = [
            UIColor(white: 0.0, alpha: 0.10).cgColor,
            UIColor(white: 0.0, alpha: 0.00).cgColor,
            UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 0.20).cgColor
        ]
        gl.locations = [0.0, 0.5, 1.0]
        return gl
    }()

    // MARK: - Center Branding (Clean, No Square Box, No Subtitle, No Progress Bar)
    private let brandingStack: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 18
        return stack
    }()

    private let logoBadgeView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .white
        view.layer.cornerRadius = 52
        view.layer.shadowColor = UIColor(red: 0/255, green: 102/255, blue: 255/255, alpha: 0.50).cgColor
        view.layer.shadowOpacity = 0.45
        view.layer.shadowRadius = 18
        view.layer.shadowOffset = CGSize(width: 0, height: 8)
        return view
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
        lbl.text = "TeamHub"
        // Uses the exact system bold font used across the app (matches employee dashboard hero greeting)
        lbl.font = UIFont.systemFont(ofSize: 32, weight: .bold)
        lbl.textColor = .white
        lbl.textAlignment = .center
        lbl.layer.shadowColor = UIColor.black.cgColor
        lbl.layer.shadowOpacity = 0.45
        lbl.layer.shadowRadius = 10
        lbl.layer.shadowOffset = CGSize(width: 0, height: 3)
        return lbl
    }()

    private var hasNavigated = false
    private let splashDuration: TimeInterval = 6.0

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 5/255, green: 10/255, blue: 30/255, alpha: 1.0)

        setupVideoBackground()
        setupUI()
        setupTapToSkip()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        playerLayer?.frame = videoContainerView.bounds
        gradientOverlay.frame = videoContainerView.bounds
        CATransaction.commit()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        player?.play()
        startAnimations()
        scheduleNavigation()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        player?.pause()
        NotificationCenter.default.removeObserver(self)
    }

    deinit {
        player?.pause()
        playerLooper = nil
        player = nil
    }

    // MARK: - Video Setup
    private func setupVideoBackground() {
        view.addSubview(videoContainerView)
        NSLayoutConstraint.activate([
            videoContainerView.topAnchor.constraint(equalTo: view.topAnchor),
            videoContainerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            videoContainerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            videoContainerView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        let videoURL: URL?
        if let localURL = Bundle.main.url(forResource: "bg_video", withExtension: "mp4") {
            videoURL = localURL
        } else if let publicURL = Bundle.main.url(forResource: "public/bg_video", withExtension: "mp4") {
            videoURL = publicURL
        } else {
            videoURL = URL(string: "https://v1.pinimg.com/videos/iht/expMp4/73/85/cf/7385cf9e80df8eb36661b7400684df1f_720w.mp4")
        }

        guard let targetURL = videoURL else { return }

        do {
            try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        }

        let asset = AVURLAsset(url: targetURL)
        let playerItem = AVPlayerItem(asset: asset)
        let queuePlayer = AVQueuePlayer(playerItem: playerItem)
        queuePlayer.isMuted = true
        self.playerLooper = AVPlayerLooper(player: queuePlayer, templateItem: playerItem)
        self.player = queuePlayer

        let layer = AVPlayerLayer(player: queuePlayer)
        layer.videoGravity = .resizeAspectFill
        layer.frame = view.bounds
        videoContainerView.layer.addSublayer(layer)
        videoContainerView.layer.addSublayer(gradientOverlay)
        self.playerLayer = layer

        queuePlayer.play()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
    }

    @objc private func appWillEnterForeground() {
        player?.play()
    }

    @objc private func appDidEnterBackground() {
        player?.pause()
    }

    // MARK: - UI Setup
    private func setupUI() {
        view.addSubview(brandingStack)
        brandingStack.addArrangedSubview(logoBadgeView)
        logoBadgeView.addSubview(logoImageView)
        brandingStack.addArrangedSubview(titleLabel)

        NSLayoutConstraint.activate([
            // Center Branding Stack (Floating cleanly in the center of the video)
            brandingStack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            brandingStack.centerYAnchor.constraint(equalTo: view.centerYAnchor),

            // Logo Badge (104x104, little bit big as requested)
            logoBadgeView.widthAnchor.constraint(equalToConstant: 104),
            logoBadgeView.heightAnchor.constraint(equalToConstant: 104),

            // Logo image inside badge (70x70)
            logoImageView.centerXAnchor.constraint(equalTo: logoBadgeView.centerXAnchor),
            logoImageView.centerYAnchor.constraint(equalTo: logoBadgeView.centerYAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 70),
            logoImageView.heightAnchor.constraint(equalToConstant: 70)
        ])

        view.bringSubviewToFront(brandingStack)
    }

    private func setupTapToSkip() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTapToSkip))
        view.addGestureRecognizer(tap)
    }

    @objc private func handleTapToSkip() {
        navigateToNextScreen()
    }

    // MARK: - Animations
    private func startAnimations() {
        brandingStack.alpha = 0.0
        brandingStack.transform = CGAffineTransform(scaleX: 0.88, y: 0.88)

        UIView.animate(withDuration: 0.8, delay: 0.15, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: .curveEaseOut, animations: {
            self.brandingStack.alpha = 1.0
            self.brandingStack.transform = .identity
        }, completion: nil)
    }

    // MARK: - Navigation
    private func scheduleNavigation() {
        DispatchQueue.main.asyncAfter(deadline: .now() + splashDuration) { [weak self] in
            self?.navigateToNextScreen()
        }
    }

    private func navigateToNextScreen() {
        guard !hasNavigated else { return }
        hasNavigated = true
        player?.pause()

        let nextVC: UIViewController
        #if targetEnvironment(simulator)
        if !AuthService.shared.isLoggedIn {
            AuthService.shared.saveAuth(token: AuthService.defaultValidToken, email: "alex.turner@globizhub.com", role: "EMPLOYEE")
            AuthService.shared.saveUserProfile(firstName: "Alex", designation: "Lead Product Designer", organization: "GlobizHub Technologies")
        }
        nextVC = HomeViewController()
        #else
        if AuthService.shared.isLoggedIn {
            nextVC = HomeViewController()
        } else if UserDefaults.standard.bool(forKey: "hasCompletedOnboarding") {
            nextVC = SignInViewController()
        } else {
            nextVC = OnboardingViewController()
        }
        #endif

        if let window = self.view.window ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow }) {
            UIView.transition(with: window, duration: 0.45, options: .transitionCrossDissolve, animations: {
                window.rootViewController = nextVC
            }, completion: nil)
        } else {
            nextVC.modalPresentationStyle = .fullScreen
            nextVC.modalTransitionStyle = .crossDissolve
            self.present(nextVC, animated: true, completion: nil)
        }
    }
}
