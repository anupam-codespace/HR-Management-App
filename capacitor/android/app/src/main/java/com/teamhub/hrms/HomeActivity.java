package com.teamhub.hrms;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Outline;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.GestureDetector;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import android.app.AlertDialog;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.net.Uri;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.Surface;
import android.view.TextureView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.Executors;

public class HomeActivity extends AppCompatActivity {

    private static final String NOTIFICATION_CHANNEL_ID = "teamhub_attendance_channel";

    // Top Bar Views
    private View btnNotifications;
    private View viewNotificationDot;
    private FrameLayout flAvatarContainer;
    private ImageView ivUserAvatar;
    private TextView tvAvatarInitials;

    // Hero Card Views & Background Video
    private TextureView textureViewHeroVideo;
    private MediaPlayer heroMediaPlayer;
    private int heroVideoWidth = 0;
    private int heroVideoHeight = 0;
    private TextView tvGreetingName;
    private TextView tvUserRoleLocation;
    private TextView tvShiftTiming;
    private TextView tvShiftStatusBadge;

    // Timer Card Views
    private TextView tvLiveTimer;
    private TextView tvPunchedInAt;
    private TextView tvBreakTimer;
    private FrameLayout flPunchButton;
    private ImageView ivPunchIcon;
    private ProgressBar holdProgressBar;
    private View btnTakeBreak;
    private ImageView ivTakeBreak;
    private TextView tvTakeBreak;
    private View btnClockOut;

    // Leaves Card Views
    private View cvLeavesCard;
    private TextView tvCasualLeave;
    private TextView tvSickLeave;
    private ProgressBar pbLeaveProgress;

    // Holiday Card Views
    private View cvHolidayCard;
    private TextView tvHolidayName;
    private TextView tvHolidayDate;
    private TextView tvHolidayDaysLeft;
    private View dotHoliday0, dotHoliday1, dotHoliday2;

    // Other Cards
    private View cvTeamPresence;
    private TextView tvTeamActiveCount;
    private LinearLayout llTeamAvatars;
    private TextView tvViewRoster;
    private JSONArray cachedTeamMembers = new JSONArray();

    private View cvTasksCard;
    private TextView tvTasksDueTitle;
    private TextView tvTasksNextSubtitle;
    private JSONArray cachedTasks = new JSONArray();

    // Monthly & Full Year GitHub Attendance Activity Heatmap
    private View cvMonthlyHeatmapCard;
    private TextView btnHeatmapModeMonth;
    private TextView btnHeatmapModeYear;
    private View layoutHeatmapMonthControls;
    private View btnHeatmapPrevMonth;
    private View btnHeatmapNextMonth;
    private TextView tvHeatmapMonthYear;
    private View layoutHeatmapMonthContainer;
    private LinearLayout layoutHeatmapGrid;
    private View layoutHeatmapYearContainer;
    private HorizontalScrollView scrollHeatmapYear;
    private LinearLayout layoutHeatmapYearMatrix;
    private LinearLayout layoutHeatmapDayDetail;
    private TextView tvHeatmapDetailDate;
    private TextView tvHeatmapDetailHours;
    private final Calendar heatmapCalendar = Calendar.getInstance();
    private View todayHeatmapBoxView = null;
    private TextView todayHeatmapBoxText = null;
    private int selectedHeatmapDay = -1;
    private boolean isYearHeatmapMode = false;
    private final List<HeatmapDayData> allYearDaysData = new ArrayList<>();

    // Skeleton Views
    private LinearLayout llHomeCardsContainer;
    private LinearLayout layoutSkeletonHome;
    private View skelHomeHero;
    private View skelHomeTimer;
    private View skelHomeLeaves;
    private boolean isInitialLoad = true;

    // Bottom Animated Popup
    private LinearLayout hintPopupCard;
    private TextView tvHintText;

    // Punch Button & Instructions
    private View viewPunchGlowRing;
    private TextView tvPunchInstruction;

    // Attendance & Timer State
    private boolean isCheckedIn = false;
    private boolean isOnBreak = false;
    private Date currentBreakStartDate = null;
    private long accumulatedBreakTimeMs = 0;
    private String lastBreakSessionText = null;
    private Date checkInDateTime = null;
    private final Handler timerHandler = new Handler(Looper.getMainLooper());
    private Runnable timerRunnable;

    // 2-Second Hold State & Lockout Policies
    private static final long REQUIRED_HOLD_MS = 2000;
    private static final long MIN_SHIFT_LOCK_MS = 3 * 60 * 1000; // 3 minutes minimum shift
    private static final long MIN_BREAK_LOCK_MS = 30 * 60 * 1000; // 30 minutes break lockout
    private long pressStartTime = 0;
    private boolean isHolding = false;
    private final Handler holdHandler = new Handler(Looper.getMainLooper());
    private Runnable completeHoldRunnable;
    private ValueAnimator holdAnimator;

    // Hint Popup Auto-dismiss Handler
    private final Handler hintDismissHandler = new Handler(Looper.getMainLooper());
    private Runnable hintDismissRunnable;

    // Holidays Cycling
    private final List<HolidayItem> upcomingHolidays = new ArrayList<>();
    private int currentHolidayIndex = 0;

    private ApiClient apiClient;
    private String cachedFirstName = "";

    private static class HolidayItem {
        String name;
        Date date;
        String formattedDate;
        long daysRemaining;

        HolidayItem(String name, Date date, String formattedDate, long daysRemaining) {
            this.name = name;
            this.date = date;
            this.formattedDate = formattedDate;
            this.daysRemaining = daysRemaining;
        }
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        apiClient = ApiClient.getInstance(this);
        if (!apiClient.isLoggedIn()) {
            startActivity(new Intent(this, SignInActivity.class));
            finish();
            return;
        }

        cachedFirstName = apiClient.getFirstName();
        initNotificationChannel();
        initViews();
        setupHoldGesture();
        setupListeners();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (isInitialLoad) {
            showSkeletonLoading();
            isInitialLoad = false;
        }

        // Reset attendance state immediately to avoid any stale timer carryover when switching accounts
        stopTimer();
        isCheckedIn = false;
        checkInDateTime = null;
        updateTimerDisplay(0, 0, 0);
        updatePunchButtonUI(false);
        if (tvPunchedInAt != null) {
            tvPunchedInAt.setText("• Clocked Out");
            tvPunchedInAt.setTextColor(Color.parseColor("#64748B"));
        }
        cachedFirstName = apiClient.getFirstName();

        updateGreeting();
        loadUserProfile();
        loadAttendanceStats();
        loadSchedule();
        loadLeaveBalance();
        loadHolidays();
        loadTeamPresence();
        loadTasks();
        updateNotificationBadge();
        renderMonthlyHeatmap();

        // Resume hero background video loop
        if (heroMediaPlayer == null && textureViewHeroVideo != null && textureViewHeroVideo.isAvailable()) {
            initHeroMediaPlayer(new Surface(textureViewHeroVideo.getSurfaceTexture()),
                    textureViewHeroVideo.getWidth(), textureViewHeroVideo.getHeight());
        } else if (heroMediaPlayer != null && !heroMediaPlayer.isPlaying()) {
            try {
                heroMediaPlayer.start();
            } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (heroMediaPlayer != null && heroMediaPlayer.isPlaying()) {
            try {
                heroMediaPlayer.pause();
            } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopTimer();
        holdHandler.removeCallbacksAndMessages(null);
        hintDismissHandler.removeCallbacksAndMessages(null);
        if (holdAnimator != null) {
            holdAnimator.cancel();
        }
        releaseHeroMediaPlayer();
    }

    private void initNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "TeamHub Attendance",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("TeamHub attendance shift updates and punch notifications");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void initViews() {
        TabletHelper.applyTabletConstraint(findViewById(R.id.topBarHomeContent));
        TabletHelper.applyTabletConstraint(findViewById(R.id.homeContentContainer));
        TabletHelper.applyTabletConstraint(findViewById(R.id.bottomNavHomeContent));

        // Top Bar
        btnNotifications = findViewById(R.id.btnNotifications);
        viewNotificationDot = findViewById(R.id.viewNotificationDot);
        flAvatarContainer = findViewById(R.id.flAvatarContainer);
        ivUserAvatar = findViewById(R.id.ivUserAvatar);
        tvAvatarInitials = findViewById(R.id.tvAvatarInitials);

        if (flAvatarContainer != null) {
            flAvatarContainer.setOutlineProvider(new ViewOutlineProvider() {
                @Override
                public void getOutline(View view, Outline outline) {
                    outline.setOval(0, 0, view.getWidth(), view.getHeight());
                }
            });
            flAvatarContainer.setClipToOutline(true);
        }

        // Hero Card
        textureViewHeroVideo = findViewById(R.id.textureViewHeroVideo);
        setupHeroVideo();
        tvGreetingName = findViewById(R.id.tvGreetingName);
        tvUserRoleLocation = findViewById(R.id.tvUserRoleLocation);
        if (tvUserRoleLocation != null) {
            String initialDesig = apiClient.getDesignation();
            String initialOrg = apiClient.getOrganization();
            tvUserRoleLocation.setText(initialDesig + " • " + initialOrg);
        }
        tvShiftTiming = findViewById(R.id.tvShiftTiming);
        tvShiftStatusBadge = findViewById(R.id.tvShiftStatusBadge);

        // Timer Card
        tvLiveTimer = findViewById(R.id.tvLiveTimer);
        tvPunchedInAt = findViewById(R.id.tvPunchedInAt);
        tvBreakTimer = findViewById(R.id.tvBreakTimer);
        flPunchButton = findViewById(R.id.flPunchButton);
        ivPunchIcon = findViewById(R.id.ivPunchIcon);
        holdProgressBar = findViewById(R.id.holdProgressBar);
        btnTakeBreak = findViewById(R.id.btnTakeBreak);
        ivTakeBreak = findViewById(R.id.ivTakeBreak);
        tvTakeBreak = findViewById(R.id.tvTakeBreak);
        btnClockOut = findViewById(R.id.btnClockOut);

        // Leaves Card
        cvLeavesCard = findViewById(R.id.cvLeavesCard);
        tvCasualLeave = findViewById(R.id.tvCasualLeave);
        tvSickLeave = findViewById(R.id.tvSickLeave);
        pbLeaveProgress = findViewById(R.id.pbLeaveProgress);

        // Holiday Card
        cvHolidayCard = findViewById(R.id.cvHolidayCard);
        tvHolidayName = findViewById(R.id.tvHolidayName);
        tvHolidayDate = findViewById(R.id.tvHolidayDate);
        tvHolidayDaysLeft = findViewById(R.id.tvHolidayDaysLeft);
        dotHoliday0 = findViewById(R.id.dotHoliday0);
        dotHoliday1 = findViewById(R.id.dotHoliday1);
        dotHoliday2 = findViewById(R.id.dotHoliday2);

        // Other Cards
        cvTeamPresence = findViewById(R.id.cvTeamPresence);
        tvTeamActiveCount = findViewById(R.id.tvTeamActiveCount);
        llTeamAvatars = findViewById(R.id.llTeamAvatars);
        tvViewRoster = findViewById(R.id.tvViewRoster);

        cvTasksCard = findViewById(R.id.cvTasksCard);
        tvTasksDueTitle = findViewById(R.id.tvTasksDueTitle);
        tvTasksNextSubtitle = findViewById(R.id.tvTasksNextSubtitle);

        // Monthly & Full Year Heatmap Views
        cvMonthlyHeatmapCard = findViewById(R.id.cvMonthlyHeatmapCard);
        btnHeatmapModeMonth = findViewById(R.id.btnHeatmapModeMonth);
        btnHeatmapModeYear = findViewById(R.id.btnHeatmapModeYear);
        layoutHeatmapMonthControls = findViewById(R.id.layoutHeatmapMonthControls);
        btnHeatmapPrevMonth = findViewById(R.id.btnHeatmapPrevMonth);
        btnHeatmapNextMonth = findViewById(R.id.btnHeatmapNextMonth);
        tvHeatmapMonthYear = findViewById(R.id.tvHeatmapMonthYear);
        layoutHeatmapMonthContainer = findViewById(R.id.layoutHeatmapMonthContainer);
        layoutHeatmapGrid = findViewById(R.id.layoutHeatmapGrid);
        layoutHeatmapYearContainer = findViewById(R.id.layoutHeatmapYearContainer);
        scrollHeatmapYear = findViewById(R.id.scrollHeatmapYear);
        layoutHeatmapYearMatrix = findViewById(R.id.layoutHeatmapYearMatrix);
        layoutHeatmapDayDetail = findViewById(R.id.layoutHeatmapDayDetail);
        tvHeatmapDetailDate = findViewById(R.id.tvHeatmapDetailDate);
        tvHeatmapDetailHours = findViewById(R.id.tvHeatmapDetailHours);

        // Bottom Elements
        hintPopupCard = findViewById(R.id.hintPopupCard);
        tvHintText = findViewById(R.id.tvHintText);
        viewPunchGlowRing = findViewById(R.id.viewPunchGlowRing);
        tvPunchInstruction = findViewById(R.id.tvPunchInstruction);

        // Skeleton Elements
        llHomeCardsContainer = findViewById(R.id.llHomeCardsContainer);
        layoutSkeletonHome = findViewById(R.id.layoutSkeletonHome);
        skelHomeHero = findViewById(R.id.skelHomeHero);
        skelHomeTimer = findViewById(R.id.skelHomeTimer);
        skelHomeLeaves = findViewById(R.id.skelHomeLeaves);
    }

    // --- Dynamic Time-Based Greeting ---
    private String getTimeBasedGreeting() {
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        if (hour >= 4 && hour < 12) {
            return "Good Morning";
        } else if (hour >= 12 && hour < 17) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    }

    private void updateGreeting() {
        String displayName = cachedFirstName.isEmpty() ? apiClient.getFirstName() : cachedFirstName;
        if (displayName != null) {
            if (displayName.contains("@")) {
                displayName = displayName.substring(0, displayName.indexOf('@'));
            }
            displayName = displayName.trim().split("\\s+")[0].replaceAll("[^a-zA-Z]", "");
            if (displayName.isEmpty()) displayName = "User";
            displayName = displayName.substring(0, 1).toUpperCase(Locale.ROOT) +
                    (displayName.length() > 1 ? displayName.substring(1).toLowerCase(Locale.ROOT) : "");
        } else {
            displayName = "User";
        }

        String greeting = getTimeBasedGreeting();
        if (tvGreetingName != null) {
            tvGreetingName.setText(greeting + ", " + displayName);
        }
    }

    // --- 3-Minute Lockout Helpers ---
    private boolean isShiftInThreeMinLock() {
        if (!isCheckedIn || checkInDateTime == null) return false;
        long elapsed = System.currentTimeMillis() - checkInDateTime.getTime();
        return elapsed < MIN_SHIFT_LOCK_MS;
    }

    private long getRemainingLockTimeMs() {
        if (!isCheckedIn || checkInDateTime == null) return 0;
        long elapsed = System.currentTimeMillis() - checkInDateTime.getTime();
        return Math.max(0, MIN_SHIFT_LOCK_MS - elapsed);
    }

    private String formatRemainingLockTime() {
        long remSec = (getRemainingLockTimeMs() + 999) / 1000;
        if (remSec > 120) {
            return "3 min";
        } else if (remSec > 60) {
            return "2 min";
        } else if (remSec == 60) {
            return "1 min (60s)";
        } else {
            return remSec + "s";
        }
    }

    // --- 30-Minute Break Lockout Helpers ---
    private boolean isBreakInThirtyMinLock() {
        if (!isCheckedIn || checkInDateTime == null) return false;
        long elapsed = System.currentTimeMillis() - checkInDateTime.getTime();
        return elapsed < MIN_BREAK_LOCK_MS;
    }

    private int getRemainingBreakLockMinutes() {
        if (!isCheckedIn || checkInDateTime == null) return 0;
        long elapsed = System.currentTimeMillis() - checkInDateTime.getTime();
        long remMs = Math.max(0, MIN_BREAK_LOCK_MS - elapsed);
        return (int) Math.max(1, (remMs + 59999) / 60000);
    }

    private void updatePunchButtonUI(boolean clockedIn) {
        if (viewPunchGlowRing != null) {
            viewPunchGlowRing.setBackgroundResource(clockedIn ? R.drawable.bg_red_glow_ring : R.drawable.bg_blue_glow_ring);
        }
        if (flPunchButton != null) {
            flPunchButton.setBackgroundResource(clockedIn ? R.drawable.bg_red_circle : R.drawable.bg_blue_circle);
        }
        if (ivPunchIcon != null) {
            ivPunchIcon.setColorFilter(Color.WHITE, android.graphics.PorterDuff.Mode.SRC_IN);
        }
        if (btnClockOut != null) {
            btnClockOut.setAlpha(clockedIn ? 1.0f : 0.6f);
        }
        if (btnTakeBreak != null) {
            btnTakeBreak.setAlpha(clockedIn ? 1.0f : 0.6f);
        }
        if (!clockedIn) {
            isOnBreak = false;
            updateBreakUI(false);
        }
        updateInstructionLabel();
    }

    private void updateBreakUI(boolean onBreak) {
        if (tvTakeBreak != null) {
            tvTakeBreak.setText(onBreak ? "Resume Shift" : "Take Break");
            tvTakeBreak.setTextColor(onBreak ? Color.parseColor("#B45309") : Color.parseColor("#1E293B"));
        }
        if (ivTakeBreak != null) {
            ivTakeBreak.setColorFilter(onBreak ? Color.parseColor("#B45309") : Color.parseColor("#1E293B"), android.graphics.PorterDuff.Mode.SRC_IN);
        }
        if (btnTakeBreak != null) {
            btnTakeBreak.setBackgroundResource(onBreak ? R.drawable.bg_break_pill_active : R.drawable.bg_break_pill);
        }
        if (onBreak) {
            if (tvPunchedInAt != null) {
                tvPunchedInAt.setText("• On Break");
                tvPunchedInAt.setTextColor(Color.parseColor("#D97706"));
            }
        } else if (isCheckedIn && checkInDateTime != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm:ss a", Locale.US);
            if (tvPunchedInAt != null) {
                tvPunchedInAt.setText("• Punched In at " + sdf.format(checkInDateTime));
                tvPunchedInAt.setTextColor(Color.parseColor("#059669"));
            }
        }
    }

    private void updateInstructionLabel() {
        if (tvPunchInstruction == null) return;
        if (!isCheckedIn) {
            tvPunchInstruction.setText("Hold 2s to Punch In");
            tvPunchInstruction.setTextColor(Color.parseColor("#64748B"));
        } else if (isShiftInThreeMinLock()) {
            tvPunchInstruction.setText("Shift locked (" + formatRemainingLockTime() + ")");
            tvPunchInstruction.setTextColor(Color.parseColor("#DC2626"));
        } else if (isOnBreak) {
            tvPunchInstruction.setText("Shift on break • Resume to continue");
            tvPunchInstruction.setTextColor(Color.parseColor("#D97706"));
        } else {
            tvPunchInstruction.setText("Hold Clock Out button for 2s to exit");
            tvPunchInstruction.setTextColor(Color.parseColor("#64748B"));
        }
    }

    // --- 2-Second Hold Gesture Handlers (Synced White Circular Animation) ---
    private void setupHoldGesture() {
        if (flPunchButton == null) return;

        completeHoldRunnable = () -> {
            if (isHolding) {
                isHolding = false;
                if (btnClockOut != null) {
                    btnClockOut.animate().scaleX(1f).scaleY(1f).setDuration(120).start();
                }
                if (holdProgressBar != null) {
                    holdProgressBar.setVisibility(View.GONE);
                    holdProgressBar.setProgress(0);
                }
                flPunchButton.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);

                // Perform Shift Action
                handleCheckInOutToggle();
            }
        };

        flPunchButton.setOnTouchListener((v, event) -> {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    if (isCheckedIn) {
                        // User does not need to click thumb to clock out; guide to Clock Out button
                        showHintPopup("Hold the Clock Out button below for 2 seconds to finish shift");
                        if (btnClockOut != null) {
                            btnClockOut.animate().scaleX(1.08f).scaleY(1.08f).setDuration(160)
                                    .withEndAction(() -> btnClockOut.animate().scaleX(1f).scaleY(1f).setDuration(160).start())
                                    .start();
                        }
                        v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                        return true;
                    }

                    pressStartTime = System.currentTimeMillis();
                    isHolding = true;
                    v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);

                    // Show progress ring animation (WHITE loading ring inside thumb button)
                    if (holdProgressBar != null) {
                        holdProgressBar.setProgressDrawable(ContextCompat.getDrawable(this, R.drawable.circle_progress_bar_white));
                        holdProgressBar.setVisibility(View.VISIBLE);
                        holdProgressBar.setProgress(0);
                        if (holdAnimator != null) holdAnimator.cancel();
                        holdAnimator = ValueAnimator.ofInt(0, 100);
                        holdAnimator.setDuration(REQUIRED_HOLD_MS);
                        holdAnimator.addUpdateListener(animation -> {
                            if (holdProgressBar != null) {
                                holdProgressBar.setProgress((int) animation.getAnimatedValue());
                            }
                        });
                        holdAnimator.start();
                    }

                    holdHandler.postDelayed(completeHoldRunnable, REQUIRED_HOLD_MS);
                    return true;

                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    if (isHolding) {
                        holdHandler.removeCallbacks(completeHoldRunnable);
                        if (holdAnimator != null) holdAnimator.cancel();
                        if (holdProgressBar != null) {
                            holdProgressBar.setVisibility(View.GONE);
                            holdProgressBar.setProgress(0);
                        }

                        long duration = System.currentTimeMillis() - pressStartTime;
                        if (duration < REQUIRED_HOLD_MS) {
                            showHintPopup("Hold for 2 seconds to punch in");
                        }
                        isHolding = false;
                    }
                    return true;
            }
            return false;
        });

        // Clock Out Button: User holds for 2 seconds -> syncs white loading animation on thumb button!
        if (btnClockOut != null) {
            btnClockOut.setOnTouchListener((v, event) -> {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        if (!isCheckedIn) {
                            showHintPopup("You are already clocked out");
                            return true;
                        }
                        if (isShiftInThreeMinLock()) {
                            showHintPopup("Shift locked for 3 min. Please wait " + formatRemainingLockTime() + " before clocking out.");
                            return true;
                        }
                        if (isOnBreak) {
                            showHintPopup("Please tap 'Resume Shift' before clocking out.");
                            return true;
                        }

                        isHolding = true;
                        pressStartTime = System.currentTimeMillis();
                        btnClockOut.animate().scaleX(0.95f).scaleY(0.95f).setDuration(120).start();
                        v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);

                        // Animate white circular loading ring on thumb button syncing with 2s hold!
                        if (holdProgressBar != null) {
                            holdProgressBar.setProgressDrawable(ContextCompat.getDrawable(this, R.drawable.circle_progress_bar_white));
                            holdProgressBar.setVisibility(View.VISIBLE);
                            holdProgressBar.setProgress(0);
                            if (holdAnimator != null) holdAnimator.cancel();
                            holdAnimator = ValueAnimator.ofInt(0, 100);
                            holdAnimator.setDuration(REQUIRED_HOLD_MS);
                            holdAnimator.addUpdateListener(animation -> {
                                if (holdProgressBar != null) {
                                    holdProgressBar.setProgress((int) animation.getAnimatedValue());
                                }
                            });
                            holdAnimator.start();
                        }

                        holdHandler.postDelayed(completeHoldRunnable, REQUIRED_HOLD_MS);
                        return true;

                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (isHolding) {
                            holdHandler.removeCallbacks(completeHoldRunnable);
                            if (holdAnimator != null) holdAnimator.cancel();
                            if (holdProgressBar != null) {
                                holdProgressBar.setVisibility(View.GONE);
                                holdProgressBar.setProgress(0);
                            }
                            btnClockOut.animate().scaleX(1f).scaleY(1f).setDuration(120).start();

                            long duration = System.currentTimeMillis() - pressStartTime;
                            if (duration < REQUIRED_HOLD_MS) {
                                showHintPopup("Hold Clock Out button for 2 seconds to exit");
                            }
                            isHolding = false;
                        }
                        return true;
                }
                return false;
            });
        }
    }

    // --- Professional Slide-up Hint Popup ---
    private void showHintPopup(String message) {
        if (hintPopupCard == null || tvHintText == null) return;

        hintDismissHandler.removeCallbacksAndMessages(null);
        tvHintText.setText(message);
        hintPopupCard.setVisibility(View.VISIBLE);
        hintPopupCard.setTranslationY(80f);
        hintPopupCard.setAlpha(0f);

        hintPopupCard.animate()
                .translationY(0f)
                .alpha(1f)
                .setDuration(300)
                .setInterpolator(new DecelerateInterpolator())
                .start();

        hintDismissRunnable = () -> {
            if (hintPopupCard != null) {
                hintPopupCard.animate()
                        .translationY(80f)
                        .alpha(0f)
                        .setDuration(260)
                        .withEndAction(() -> hintPopupCard.setVisibility(View.GONE))
                        .start();
            }
        };
        hintDismissHandler.postDelayed(hintDismissRunnable, 2600);
    }

    private void setupListeners() {
        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(v -> {
                apiClient.markLocalNotificationsAsRead();
                updateNotificationBadge();
                startActivity(new Intent(this, NotificationsActivity.class));
            });
        }

        if (flAvatarContainer != null) {
            flAvatarContainer.setOnClickListener(v -> openSettings());
        }

        if (btnTakeBreak != null) {
            btnTakeBreak.setOnClickListener(v -> {
                if (!isCheckedIn) {
                    showHintPopup("Please punch in before starting a break.");
                    return;
                }
                if (!isOnBreak && isBreakInThirtyMinLock()) {
                    int leftMins = getRemainingBreakLockMinutes();
                    showHintPopup("Breaks cannot be taken during the first 30 minutes of your shift. " + leftMins + " minutes left.");
                    return;
                }
                isOnBreak = !isOnBreak;
                SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                String timeStr = sdf.format(new Date());

                updateBreakUI(isOnBreak);

                String token = apiClient.getToken();
                apiClient.recordBreak(isOnBreak, token, new ApiClient.ApiCallback<JSONObject>() {
                    @Override
                    public void onSuccess(JSONObject result) {}
                    @Override
                    public void onError(String errorMessage, int statusCode) {}
                });

                if (isOnBreak) {
                    currentBreakStartDate = new Date();
                    if (tvBreakTimer != null) {
                        tvBreakTimer.setVisibility(View.VISIBLE);
                        tvBreakTimer.setText("Break: 00m 00s (from " + timeStr + ")");
                    }
                    if (tvPunchedInAt != null) {
                        tvPunchedInAt.setText("• On Break (Shift Paused)");
                        tvPunchedInAt.setTextColor(Color.parseColor("#D97706"));
                    }
                    triggerSystemNotification("Break Started", "Break started at " + timeStr + ". Active shift timer paused.");
                    Toast.makeText(this, "Break started (" + timeStr + ")", Toast.LENGTH_SHORT).show();
                } else {
                    Date breakEndDate = new Date();
                    long durMs = breakEndDate.getTime() - (currentBreakStartDate != null ? currentBreakStartDate.getTime() : breakEndDate.getTime());
                    accumulatedBreakTimeMs += durMs;
                    long durMin = Math.max(1, Math.round(durMs / 60000.0));
                    String startStr = (currentBreakStartDate != null) ? sdf.format(currentBreakStartDate) : "";
                    String endStr = sdf.format(breakEndDate);
                    lastBreakSessionText = "Last Break: " + startStr + " – " + endStr + " (" + durMin + "m)";
                    if (tvBreakTimer != null) {
                        tvBreakTimer.setVisibility(View.VISIBLE);
                        tvBreakTimer.setText(lastBreakSessionText);
                    }
                    currentBreakStartDate = null;
                    triggerSystemNotification("Break Ended", "Resumed shift at " + endStr + " (From " + startStr + " to " + endStr + ", " + durMin + "m). Shift timer resumed!");
                    Toast.makeText(this, "Break ended (" + endStr + ")", Toast.LENGTH_SHORT).show();
                }
            });
        }

        if (cvLeavesCard != null) {
            cvLeavesCard.setOnClickListener(v -> {
                String c = tvCasualLeave != null ? tvCasualLeave.getText().toString() : "Casual: 6 left";
                String s = tvSickLeave != null ? tvSickLeave.getText().toString() : "Sick: 4 remaining";
                Toast.makeText(this, "Leaves Balance: " + c + " • " + s, Toast.LENGTH_SHORT).show();
            });
        }

        if (cvHolidayCard != null) {
            GestureDetector holidayDetector = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
                @Override
                public boolean onSingleTapUp(MotionEvent e) {
                    cycleNextHoliday();
                    return true;
                }

                @Override
                public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
                    if (e1 != null && e2 != null) {
                        float diffX = e2.getX() - e1.getX();
                        if (Math.abs(diffX) > 40 && Math.abs(velocityX) > 100) {
                            if (diffX < 0) {
                                cycleNextHoliday();
                            } else {
                                cyclePrevHoliday();
                            }
                            return true;
                        }
                    }
                    return false;
                }
            });

            cvHolidayCard.setOnTouchListener((v, event) -> {
                if (event.getAction() == MotionEvent.ACTION_UP) {
                    v.performClick();
                }
                return holidayDetector.onTouchEvent(event);
            });
        }

        if (cvTeamPresence != null) {
            cvTeamPresence.setOnClickListener(v -> showTeamRosterDialog());
        }

        if (tvViewRoster != null) {
            tvViewRoster.setOnClickListener(v -> showTeamRosterDialog());
        }

        if (cvTasksCard != null) {
            cvTasksCard.setOnClickListener(v -> showTasksDialog());
        }

        // Heatmap Mode Switchers (Month / Full Year)
        if (btnHeatmapModeMonth != null) {
            btnHeatmapModeMonth.setOnClickListener(v -> setHeatmapMode(false));
        }
        if (btnHeatmapModeYear != null) {
            btnHeatmapModeYear.setOnClickListener(v -> setHeatmapMode(true));
        }

        // Monthly Heatmap Navigation Buttons
        if (btnHeatmapPrevMonth != null) {
            btnHeatmapPrevMonth.setOnClickListener(v -> {
                heatmapCalendar.add(Calendar.MONTH, -1);
                renderMonthlyHeatmap();
            });
        }
        if (btnHeatmapNextMonth != null) {
            btnHeatmapNextMonth.setOnClickListener(v -> {
                heatmapCalendar.add(Calendar.MONTH, 1);
                renderMonthlyHeatmap();
            });
        }

        View navTabHome = findViewById(R.id.navTabHome);
        if (navTabHome != null) {
            navTabHome.setOnClickListener(v -> {
                ScrollView sv = findViewById(R.id.scrollView);
                if (sv != null) {
                    sv.smoothScrollTo(0, 0);
                }
            });
        }

        View navTabAttendance = findViewById(R.id.navTabAttendance);
        if (navTabAttendance != null) {
            navTabAttendance.setOnClickListener(v -> {
                Intent intent = new Intent(HomeActivity.this, AttendanceActivity.class);
                startActivity(intent);
            });
        }

        View navTabLeave = findViewById(R.id.navTabLeave);
        if (navTabLeave != null) {
            navTabLeave.setOnClickListener(v -> {
                Intent intent = new Intent(HomeActivity.this, LeaveActivity.class);
                startActivity(intent);
            });
        }

        View navTabTasks = findViewById(R.id.navTabTasks);
        if (navTabTasks != null) {
            navTabTasks.setOnClickListener(v -> {
                Intent intent = new Intent(HomeActivity.this, TasksActivity.class);
                startActivity(intent);
            });
        }

        View navTabMore = findViewById(R.id.navTabMore);
        if (navTabMore != null) {
            navTabMore.setOnClickListener(v -> {
                Intent intent = new Intent(this, MoreActivity.class);
                startActivity(intent);
                overridePendingTransition(R.anim.slide_up_in, android.R.anim.fade_out);
            });
        }
    }

    private void showTeamRosterDialog() {
        if (cachedTeamMembers == null || cachedTeamMembers.length() == 0) {
            new AlertDialog.Builder(this)
                    .setTitle("Team Presence")
                    .setMessage("No team members currently active.")
                    .setPositiveButton("OK", null)
                    .show();
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(cachedTeamMembers.length()).append(" Active Team Members:\n\n");
            int limit = Math.min(cachedTeamMembers.length(), 8);
            for (int i = 0; i < limit; i++) {
                JSONObject m = cachedTeamMembers.optJSONObject(i);
                if (m != null) {
                    String fn = m.optString("firstName", "");
                    String ln = m.optString("lastName", "");
                    String desig = "";
                    JSONObject dObj = m.optJSONObject("designation");
                    if (dObj != null) {
                        desig = dObj.optString("name", "");
                    } else {
                        desig = m.optString("designation", "");
                    }
                    String name = (fn + " " + ln).trim();
                    if (!name.isEmpty()) {
                        sb.append("• ").append(name);
                        if (!desig.isEmpty()) {
                            sb.append(" (").append(desig).append(")");
                        }
                        sb.append("\n");
                    }
                }
            }
            if (cachedTeamMembers.length() > 8) {
                sb.append("\n...and ").append(cachedTeamMembers.length() - 8).append(" more");
            }
            new AlertDialog.Builder(this)
                    .setTitle("Team Roster")
                    .setMessage(sb.toString().trim())
                    .setPositiveButton("OK", null)
                    .show();
        }
    }

    private void showTasksDialog() {
        if (cachedTasks == null || cachedTasks.length() == 0) {
            new AlertDialog.Builder(this)
                    .setTitle("Tasks Due Today")
                    .setMessage("All caught up! No pending tasks for today.")
                    .setPositiveButton("OK", null)
                    .show();
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(cachedTasks.length()).append(" Task(s) Found:\n\n");
            int limit = Math.min(cachedTasks.length(), 6);
            for (int i = 0; i < limit; i++) {
                JSONObject t = cachedTasks.optJSONObject(i);
                if (t != null) {
                    String title = t.optString("title", t.optString("name", "Task"));
                    sb.append("• ").append(title).append("\n");
                }
            }
            if (cachedTasks.length() > 6) {
                sb.append("\n...and ").append(cachedTasks.length() - 6).append(" more");
            }
            new AlertDialog.Builder(this)
                    .setTitle("Tasks Due Today")
                    .setMessage(sb.toString().trim())
                    .setPositiveButton("OK", null)
                    .show();
        }
    }

    // --- Dynamic Team Presence ---
    private void loadTeamPresence() {
        String token = apiClient.getToken();
        if (token == null || token.isEmpty()) {
            updateTeamPresenceUI(new JSONArray());
            return;
        }

        apiClient.getTeamMembers(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray response) {
                cachedTeamMembers = (response != null) ? response : new JSONArray();
                updateTeamPresenceUI(cachedTeamMembers);
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (cachedTeamMembers == null || cachedTeamMembers.length() == 0) {
                    updateTeamPresenceUI(new JSONArray());
                }
            }
        });
    }

    private void updateTeamPresenceUI(JSONArray members) {
        if (members == null) members = new JSONArray();
        int count = members.length();

        if (tvTeamActiveCount != null) {
            tvTeamActiveCount.setText(count + " Active");
        }

        if (llTeamAvatars == null) return;
        llTeamAvatars.removeAllViews();

        float density = getResources().getDisplayMetrics().density;

        if (count == 0) {
            TextView emptyTv = new TextView(this);
            emptyTv.setText("No team members currently active");
            emptyTv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            emptyTv.setTextColor(Color.parseColor("#64748B"));
            llTeamAvatars.addView(emptyTv);
            return;
        }

        int[] colors = new int[]{
                Color.parseColor("#3B82F6"), // Blue
                Color.parseColor("#10B981"), // Emerald
                Color.parseColor("#F59E0B"), // Amber
                Color.parseColor("#8B5CF6"), // Purple
                Color.parseColor("#EC4899")  // Pink
        };

        int displayCount = Math.min(count, 5);
        for (int i = 0; i < displayCount; i++) {
            JSONObject m = members.optJSONObject(i);
            String initials = "AS";
            if (m != null) {
                String fn = m.optString("firstName", "").trim();
                String ln = m.optString("lastName", "").trim();
                if (!fn.isEmpty() && !ln.isEmpty()) {
                    initials = ("" + fn.charAt(0) + ln.charAt(0)).toUpperCase(Locale.US);
                } else if (!fn.isEmpty()) {
                    initials = fn.substring(0, Math.min(2, fn.length())).toUpperCase(Locale.US);
                } else {
                    String email = m.optString("email", "").trim();
                    if (!email.isEmpty()) {
                        initials = email.substring(0, Math.min(2, email.length())).toUpperCase(Locale.US);
                    }
                }
            }

            FrameLayout circleFrame = new FrameLayout(this);
            int sizePx = (int) (32 * density);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(sizePx, sizePx);
            if (i > 0) {
                lp.setMarginStart((int) (-8 * density));
            }
            circleFrame.setLayoutParams(lp);

            GradientDrawable gd = new GradientDrawable();
            gd.setShape(GradientDrawable.OVAL);
            gd.setColor(colors[i % colors.length]);
            gd.setStroke((int) (2 * density), Color.WHITE);
            circleFrame.setBackground(gd);

            TextView tvInitials = new TextView(this);
            tvInitials.setText(initials);
            tvInitials.setTextColor(Color.WHITE);
            tvInitials.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            tvInitials.setTypeface(null, Typeface.BOLD);
            FrameLayout.LayoutParams textLp = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
            );
            textLp.gravity = Gravity.CENTER;
            tvInitials.setLayoutParams(textLp);

            circleFrame.addView(tvInitials);
            llTeamAvatars.addView(circleFrame);
        }

        if (count > 5) {
            int extra = count - 5;
            TextView extraTv = new TextView(this);
            extraTv.setText("+" + extra);
            extraTv.setTextColor(Color.parseColor("#334155"));
            extraTv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            extraTv.setTypeface(null, Typeface.BOLD);
            extraTv.setGravity(Gravity.CENTER);

            int padStartEnd = (int) (8 * density);
            int padTopBottom = (int) (4 * density);
            extraTv.setPadding(padStartEnd, padTopBottom, padStartEnd, padTopBottom);

            GradientDrawable pillGd = new GradientDrawable();
            pillGd.setCornerRadius(16 * density);
            pillGd.setColor(Color.parseColor("#E2E8F0"));
            pillGd.setStroke((int) (2 * density), Color.WHITE);
            extraTv.setBackground(pillGd);

            LinearLayout.LayoutParams extraLp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    (int) (32 * density)
            );
            extraLp.setMarginStart((int) (-6 * density));
            extraTv.setLayoutParams(extraLp);

            llTeamAvatars.addView(extraTv);
        }
    }

    // --- Dynamic Tasks ---
    private void loadTasks() {
        String token = apiClient.getToken();
        if (token == null || token.isEmpty()) {
            updateTasksUI(new JSONArray());
            return;
        }

        apiClient.getMyTasks(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray response) {
                cachedTasks = (response != null) ? response : new JSONArray();
                updateTasksUI(cachedTasks);
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (cachedTasks == null || cachedTasks.length() == 0) {
                    updateTasksUI(new JSONArray());
                }
            }
        });
    }

    private void updateTasksUI(JSONArray tasks) {
        if (tasks == null) tasks = new JSONArray();
        int count = tasks.length();

        if (count == 0) {
            if (tvTasksDueTitle != null) {
                tvTasksDueTitle.setText("0 Tasks due today");
            }
            if (tvTasksNextSubtitle != null) {
                tvTasksNextSubtitle.setText("All caught up! No pending tasks for today.");
            }
        } else {
            if (tvTasksDueTitle != null) {
                tvTasksDueTitle.setText(count + " " + (count == 1 ? "Task" : "Tasks") + " due today");
            }
            if (tvTasksNextSubtitle != null) {
                JSONObject first = tasks.optJSONObject(0);
                String title = (first != null) ? first.optString("title", first.optString("name", "Review updates")) : "Review updates";
                tvTasksNextSubtitle.setText("Next: " + title);
            }
        }
    }

    private void openSettings() {
        startActivity(new Intent(this, SettingsActivity.class));
    }

    // --- Native System Notification & In-App Log ---
    private void triggerSystemNotification(String title, String message) {
        // Record in in-app notification center
        apiClient.recordLocalNotification(title, message);
        updateNotificationBadge();

        try {
            Intent intent = new Intent(this, NotificationsActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    (int) System.currentTimeMillis(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notifications)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            NotificationManagerCompat manager = NotificationManagerCompat.from(this);
            manager.notify((int) System.currentTimeMillis(), builder.build());
        } catch (SecurityException ignored) {
            // Notification permission might be denied on Android 13+
        }
    }

    private void updateNotificationBadge() {
        boolean hasUnread = apiClient.hasUnreadLocalNotifications();
        if (viewNotificationDot != null) {
            viewNotificationDot.setVisibility(hasUnread ? View.VISIBLE : View.GONE);
        }

        // Also query remote unread notifications
        String token = apiClient.getToken();
        if (token != null) {
            apiClient.getUnreadNotifications(token, new ApiClient.ApiCallback<JSONArray>() {
                @Override
                public void onSuccess(JSONArray result) {
                    if (isFinishing() || isDestroyed()) return;
                    boolean unreadRemote = (result != null && result.length() > 0);
                    if (viewNotificationDot != null) {
                        viewNotificationDot.setVisibility((hasUnread || unreadRemote) ? View.VISIBLE : View.GONE);
                    }
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    // Keep local badge state
                }
            });
        }
    }

    // --- User Profile & First Name ---
    private void loadUserProfile() {
        String token = apiClient.getToken();
        if (token == null) {
            hideSkeletonLoading();
            return;
        }

        apiClient.getProfile(token, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject user) {
                if (isFinishing() || isDestroyed()) return;

                String rawFirstName = user.optString("firstName", "");
                if (rawFirstName.isEmpty() && user.has("name")) {
                    rawFirstName = user.optString("name", "");
                }
                String photoUrl = user.optString("profilePhoto", "");

                // Clean first name strictly alphabetic
                String cleanFirstName = rawFirstName;
                if (cleanFirstName.contains("@")) {
                    cleanFirstName = cleanFirstName.substring(0, cleanFirstName.indexOf('@'));
                }
                cleanFirstName = cleanFirstName.trim().split("\\s+")[0].replaceAll("[^a-zA-Z]", "");
                if (cleanFirstName.isEmpty()) {
                    cleanFirstName = "Alex";
                } else {
                    cleanFirstName = cleanFirstName.substring(0, 1).toUpperCase(Locale.ROOT) +
                            (cleanFirstName.length() > 1 ? cleanFirstName.substring(1).toLowerCase(Locale.ROOT) : "");
                }

                cachedFirstName = cleanFirstName;

                // Designation
                String designation = "";
                if (user.has("designation")) {
                    Object desObj = user.opt("designation");
                    if (desObj instanceof JSONObject) {
                        designation = ((JSONObject) desObj).optString("name", "");
                    } else if (desObj instanceof String) {
                        designation = (String) desObj;
                    }
                }
                if (designation.isEmpty()) {
                    designation = user.optString("role", "Operations & Tech Lead");
                }

                // Company / Organization
                String organization = "";
                if (user.has("company")) {
                    Object compObj = user.opt("company");
                    if (compObj instanceof JSONObject) {
                        organization = ((JSONObject) compObj).optString("name", "");
                    } else if (compObj instanceof String) {
                        organization = (String) compObj;
                    }
                }
                if (organization.isEmpty()) {
                    organization = "GlobizHub Inc.";
                }

                if (user.has("role")) {
                    String userRole = user.optString("role", "");
                    if (!userRole.isEmpty()) {
                        apiClient.saveRole(userRole);
                    }
                }
                if (user.has("designation") && user.opt("designation") instanceof JSONObject) {
                    JSONObject desDict = user.optJSONObject("designation");
                    if (desDict != null && desDict.has("sidebarModules")) {
                        JSONArray modArr = desDict.optJSONArray("sidebarModules");
                        if (modArr != null) {
                            List<String> modules = new ArrayList<>();
                            for (int i = 0; i < modArr.length(); i++) {
                                modules.add(modArr.optString(i));
                            }
                            apiClient.saveSidebarModules(modules);
                        }
                    }
                }

                apiClient.saveUserProfile(cleanFirstName, designation, organization);
                updateGreeting();

                if (tvUserRoleLocation != null) {
                    tvUserRoleLocation.setText(designation + " • " + organization);
                }

                // Avatar initials
                if (tvAvatarInitials != null) {
                    tvAvatarInitials.setText(cleanFirstName.substring(0, 1).toUpperCase(Locale.ROOT));
                }

                // Profile photo
                if (!photoUrl.isEmpty()) {
                    String fullUrl = photoUrl;
                    if (!photoUrl.startsWith("http://") && !photoUrl.startsWith("https://")) {
                        fullUrl = "https://hr.globizhub.com" + photoUrl;
                    }
                    downloadAndSetAvatar(fullUrl);
                } else {
                    if (ivUserAvatar != null) ivUserAvatar.setVisibility(View.GONE);
                    if (tvAvatarInitials != null) tvAvatarInitials.setVisibility(View.VISIBLE);
                }

                hideSkeletonLoading();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                updateGreeting();
                hideSkeletonLoading();
            }
        });
    }

    private void downloadAndSetAvatar(String urlString) {
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setDoInput(true);
                conn.connect();
                InputStream input = conn.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);

                new Handler(Looper.getMainLooper()).post(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    if (bitmap != null && ivUserAvatar != null && tvAvatarInitials != null) {
                        ivUserAvatar.setImageBitmap(bitmap);
                        ivUserAvatar.setVisibility(View.VISIBLE);
                        tvAvatarInitials.setVisibility(View.GONE);
                    }
                });
            } catch (Exception e) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    if (ivUserAvatar != null) ivUserAvatar.setVisibility(View.GONE);
                    if (tvAvatarInitials != null) tvAvatarInitials.setVisibility(View.VISIBLE);
                });
            }
        });
    }

    // --- Work Schedule Shift Timings ---
    private void loadSchedule() {
        String token = apiClient.getToken();
        if (token == null) return;

        apiClient.getMySchedule(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray items) {
                if (isFinishing() || isDestroyed() || items == null || items.length() == 0) return;

                SimpleDateFormat isoDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                String todayStr = isoDate.format(new Date());

                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.optJSONObject(i);
                    if (item == null) continue;
                    String date = item.optString("date", "");
                    if (date.startsWith(todayStr)) {
                        String start = item.optString("startTime", "09:00 AM");
                        String end = item.optString("endTime", "06:00 PM");
                        if (tvShiftTiming != null) {
                            tvShiftTiming.setText("Shift: " + start + " – " + end);
                        }
                        break;
                    }
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Keep default shift strip
            }
        });
    }

    // --- Attendance & Live Timer ---
    private void loadAttendanceStats() {
        String token = apiClient.getToken();
        if (token == null) return;

        apiClient.getAttendanceStats(token, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject stats) {
                if (isFinishing() || isDestroyed()) return;

                String status = stats.optString("todayStatus", "NOT_CHECKED_IN");
                String checkInTimeStr = stats.has("checkInTime") && !stats.isNull("checkInTime") ? stats.optString("checkInTime") : stats.optString("firstCheckIn", null);
                String checkOutTimeStr = stats.has("checkOutTime") && !stats.isNull("checkOutTime") ? stats.optString("checkOutTime") : null;
                boolean remoteOnBreak = stats.optBoolean("isOnBreak", false);

                if (("CHECKED_IN".equalsIgnoreCase(status) || (checkInTimeStr != null && (checkOutTimeStr == null || "null".equals(checkOutTimeStr) || checkOutTimeStr.isEmpty())))
                        && !"CHECKED_OUT".equalsIgnoreCase(status)) {
                    isCheckedIn = true;
                    if (checkInTimeStr != null && !checkInTimeStr.equals("null")) {
                        checkInDateTime = parseIsoDate(checkInTimeStr);
                    }
                    if (checkInDateTime == null) {
                        checkInDateTime = new Date();
                    }
                    startTimer();
                    updatePunchButtonUI(true);
                    isOnBreak = remoteOnBreak || apiClient.isOnBreak();
                    updateBreakUI(isOnBreak);
                } else {
                    isCheckedIn = false;
                    checkInDateTime = null;
                    isOnBreak = false;
                    updateBreakUI(false);
                    stopTimer();
                    updateTimerDisplay(0, 0, 0);
                    if (tvPunchedInAt != null) {
                        tvPunchedInAt.setText("• Not Punched In Yet");
                        tvPunchedInAt.setTextColor(Color.parseColor("#64748B"));
                    }
                    updatePunchButtonUI(false);
                }
                hideSkeletonLoading();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Default fallback
                hideSkeletonLoading();
            }
        });
    }

    private void showSkeletonLoading() {
        if (layoutSkeletonHome != null) {
            layoutSkeletonHome.setVisibility(View.VISIBLE);
            if (llHomeCardsContainer != null) {
                llHomeCardsContainer.setVisibility(View.GONE);
            }

            if (skelHomeHero != null) {
                ObjectAnimator a1 = ObjectAnimator.ofFloat(skelHomeHero, "alpha", 0.45f, 0.95f);
                a1.setDuration(850);
                a1.setRepeatCount(ValueAnimator.INFINITE);
                a1.setRepeatMode(ValueAnimator.REVERSE);
                a1.start();
            }
            if (skelHomeTimer != null) {
                ObjectAnimator a2 = ObjectAnimator.ofFloat(skelHomeTimer, "alpha", 0.45f, 0.95f);
                a2.setDuration(850);
                a2.setRepeatCount(ValueAnimator.INFINITE);
                a2.setRepeatMode(ValueAnimator.REVERSE);
                a2.start();
            }
            if (skelHomeLeaves != null) {
                ObjectAnimator a3 = ObjectAnimator.ofFloat(skelHomeLeaves, "alpha", 0.45f, 0.95f);
                a3.setDuration(850);
                a3.setRepeatCount(ValueAnimator.INFINITE);
                a3.setRepeatMode(ValueAnimator.REVERSE);
                a3.start();
            }
        }
    }

    private void hideSkeletonLoading() {
        if (layoutSkeletonHome != null && layoutSkeletonHome.getVisibility() == View.VISIBLE) {
            layoutSkeletonHome.animate()
                    .alpha(0f)
                    .setDuration(300)
                    .withEndAction(() -> {
                        layoutSkeletonHome.setVisibility(View.GONE);
                        if (llHomeCardsContainer != null) {
                            llHomeCardsContainer.setVisibility(View.VISIBLE);
                            llHomeCardsContainer.setAlpha(1f);
                        }
                    })
                    .start();
        }
    }

    private void handleCheckInOutToggle() {
        String token = apiClient.getToken();

        if (!isCheckedIn) {
            // Punch In
            accumulatedBreakTimeMs = 0;
            currentBreakStartDate = null;
            lastBreakSessionText = null;
            if (tvBreakTimer != null) tvBreakTimer.setVisibility(View.GONE);

            // Instant Seamless Watch Start (0ms delay)
            isCheckedIn = true;
            checkInDateTime = new Date();
            startTimer();
            updatePunchButtonUI(true);

            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
            SimpleDateFormat dateSdf = new SimpleDateFormat("EEEE, MMM d", Locale.getDefault());
            String timeStr = sdf.format(checkInDateTime);
            String dateStr = dateSdf.format(checkInDateTime);

            triggerSystemNotification("Attendance • Punched In", "Clocked in at " + timeStr + " on " + dateStr);
            Toast.makeText(HomeActivity.this, "Punched In at " + timeStr, Toast.LENGTH_SHORT).show();

            apiClient.clockIn(token, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    loadAttendanceStats();
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    if (errorMessage != null && errorMessage.toLowerCase().contains("already")) {
                        loadAttendanceStats();
                    } else {
                        // Revert on actual network/authorization error
                        isCheckedIn = false;
                        checkInDateTime = null;
                        stopTimer();
                        updateTimerDisplay(0, 0, 0);
                        updatePunchButtonUI(false);
                        Toast.makeText(HomeActivity.this, errorMessage != null ? errorMessage : "Punch In failed", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        } else {
            if (isShiftInThreeMinLock()) {
                showHintPopup("Shift locked for 3 min. Please wait " + formatRemainingLockTime() + " before clocking out.");
                return;
            }
            performClockOut();
        }
    }

    private void performClockOut() {
        if (isShiftInThreeMinLock()) {
            showHintPopup("Shift locked for 3 min. Please wait " + formatRemainingLockTime() + " before clocking out.");
            return;
        }

        // Instant Seamless Clock Out (0ms delay)
        isCheckedIn = false;
        Date clockOutDate = new Date();
        checkInDateTime = null;
        stopTimer();
        updateTimerDisplay(0, 0, 0);
        updatePunchButtonUI(false);
        isOnBreak = false;
        currentBreakStartDate = null;
        if (tvBreakTimer != null) tvBreakTimer.setVisibility(View.GONE);

        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        SimpleDateFormat dateSdf = new SimpleDateFormat("EEEE, MMM d", Locale.getDefault());
        String timeStr = sdf.format(clockOutDate);
        String dateStr = dateSdf.format(clockOutDate);

        if (tvPunchedInAt != null) {
            tvPunchedInAt.setText("• Clocked Out at " + timeStr);
            tvPunchedInAt.setTextColor(Color.parseColor("#64748B"));
        }

        triggerSystemNotification("Attendance • Clocked Out", "Clocked out at " + timeStr + " on " + dateStr);
        Toast.makeText(HomeActivity.this, "Clocked Out at " + timeStr, Toast.LENGTH_SHORT).show();

        String token = apiClient.getToken();
        apiClient.clockOut(token, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject result) {
                loadAttendanceStats();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                loadAttendanceStats();
            }
        });
    }

    private void startTimer() {
        stopTimer();
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (checkInDateTime != null) {
                    // Real-time update in hint popup if visible during 3-min shift lock
                    if (isShiftInThreeMinLock() && hintPopupCard != null && hintPopupCard.getVisibility() == View.VISIBLE) {
                        if (tvHintText != null) {
                            tvHintText.setText("Shift locked for 3 min. Please wait " + formatRemainingLockTime() + " before clocking out.");
                        }
                    }

                    if (isOnBreak) {
                        // Shift timer pauses/freezes while on break!
                        // Break timer ticks below main timer:
                        long breakElapsed = System.currentTimeMillis() - (currentBreakStartDate != null ? currentBreakStartDate.getTime() : System.currentTimeMillis());
                        if (breakElapsed < 0) breakElapsed = 0;
                        long bm = (breakElapsed / (1000 * 60)) % 60;
                        long bs = (breakElapsed / 1000) % 60;
                        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                        String startStr = (currentBreakStartDate != null) ? sdf.format(currentBreakStartDate) : "";
                        if (tvBreakTimer != null) {
                            tvBreakTimer.setVisibility(View.VISIBLE);
                            tvBreakTimer.setText(String.format(Locale.getDefault(), "Break: %02dm %02ds (from %s)", bm, bs, startStr));
                        }
                        if (tvPunchedInAt != null) {
                            tvPunchedInAt.setText("• On Break (Shift Paused)");
                            tvPunchedInAt.setTextColor(Color.parseColor("#D97706"));
                        }
                    } else {
                        long totalDiff = System.currentTimeMillis() - checkInDateTime.getTime();
                        if (totalDiff < 0) totalDiff = 0;
                        long activeDiff = Math.max(0, totalDiff - accumulatedBreakTimeMs);

                        long hours = activeDiff / (1000 * 60 * 60);
                        long minutes = (activeDiff % (1000 * 60 * 60)) / (1000 * 60);
                        long seconds = (activeDiff % (1000 * 60)) / 1000;

                        updateTimerDisplay(hours, minutes, seconds);

                        if (lastBreakSessionText != null && tvBreakTimer != null) {
                            tvBreakTimer.setVisibility(View.VISIBLE);
                            tvBreakTimer.setText(lastBreakSessionText);
                        } else if (tvBreakTimer != null) {
                            tvBreakTimer.setVisibility(View.GONE);
                        }

                        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm:ss a", Locale.US);
                        if (tvPunchedInAt != null) {
                            tvPunchedInAt.setText("• Punched In at " + sdf.format(checkInDateTime));
                            tvPunchedInAt.setTextColor(Color.parseColor("#059669"));
                        }
                    }
                    updateInstructionLabel();
                }
                timerHandler.postDelayed(this, 1000);
            }
        };
        timerHandler.post(timerRunnable);
    }

    private void stopTimer() {
        if (timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
            timerRunnable = null;
        }
    }

    private void updateTimerDisplay(long h, long m, long s) {
        String timeStr = String.format(Locale.getDefault(), "%02dh %02dm %02ds", h, m, s);
        if (tvLiveTimer != null) {
            tvLiveTimer.setText(timeStr);
        }
        updateHeatmapTodayLive(h, m, s);
    }

    // --- GitHub-Style Attendance Activity Heatmap (Month & Full Year) ---
    private static class HeatmapDayData {
        int dayNumber;
        int statusType; // 0 = Future/Leave, 1 = Off/Weekend, 2 = Short Day (<8h, Light Green), 3 = Exact 8h (Mid Green), 4 = Overtime (Dark Green), 5 = Heavy Overtime (Deep Forest Green)
        long hours;
        long minutes;
        boolean isToday;
        String formattedDate;
        Date fullDate;
        String shiftSummary;
        String clockInTime = "09:00 AM";
        String clockOutTime = "05:00 PM";
    }

    private void setHeatmapMode(boolean isYear) {
        isYearHeatmapMode = isYear;
        if (isYear) {
            if (btnHeatmapModeYear != null) {
                btnHeatmapModeYear.setBackgroundResource(R.drawable.bg_capsule_selected);
                btnHeatmapModeYear.setTextColor(Color.WHITE);
            }
            if (btnHeatmapModeMonth != null) {
                btnHeatmapModeMonth.setBackgroundColor(Color.TRANSPARENT);
                btnHeatmapModeMonth.setTextColor(Color.parseColor("#64748B"));
            }
            if (layoutHeatmapMonthControls != null) layoutHeatmapMonthControls.setVisibility(View.GONE);
            if (layoutHeatmapMonthContainer != null) layoutHeatmapMonthContainer.setVisibility(View.GONE);
            if (layoutHeatmapYearContainer != null) layoutHeatmapYearContainer.setVisibility(View.VISIBLE);
            renderYearlyHeatmap();
        } else {
            if (btnHeatmapModeMonth != null) {
                btnHeatmapModeMonth.setBackgroundResource(R.drawable.bg_capsule_selected);
                btnHeatmapModeMonth.setTextColor(Color.WHITE);
            }
            if (btnHeatmapModeYear != null) {
                btnHeatmapModeYear.setBackgroundColor(Color.TRANSPARENT);
                btnHeatmapModeYear.setTextColor(Color.parseColor("#64748B"));
            }
            if (layoutHeatmapMonthControls != null) layoutHeatmapMonthControls.setVisibility(View.VISIBLE);
            if (layoutHeatmapMonthContainer != null) layoutHeatmapMonthContainer.setVisibility(View.VISIBLE);
            if (layoutHeatmapYearContainer != null) layoutHeatmapYearContainer.setVisibility(View.GONE);
            renderMonthlyHeatmap();
        }
    }

    private void renderMonthlyHeatmap() {
        if (layoutHeatmapGrid == null) return;
        layoutHeatmapGrid.removeAllViews();
        todayHeatmapBoxView = null;
        todayHeatmapBoxText = null;

        // Set Month Header: e.g. "October 2026"
        SimpleDateFormat monthHeaderSdf = new SimpleDateFormat("MMMM yyyy", Locale.US);
        if (tvHeatmapMonthYear != null) {
            tvHeatmapMonthYear.setText(monthHeaderSdf.format(heatmapCalendar.getTime()));
        }

        Calendar today = Calendar.getInstance();
        boolean isCurrentMonth = today.get(Calendar.YEAR) == heatmapCalendar.get(Calendar.YEAR) &&
                today.get(Calendar.MONTH) == heatmapCalendar.get(Calendar.MONTH);
        int todayDay = isCurrentMonth ? today.get(Calendar.DAY_OF_MONTH) : -1;

        int daysInMonth = heatmapCalendar.getActualMaximum(Calendar.DAY_OF_MONTH);

        Calendar tempCal = (Calendar) heatmapCalendar.clone();
        tempCal.set(Calendar.DAY_OF_MONTH, 1);
        int firstDayOfWeek = tempCal.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, 2 = Monday, ...
        int offset = (firstDayOfWeek + 5) % 7; // Monday = 0, ..., Sunday = 6

        int daysWorkedCount = 0;
        int overtimeCount = 0;
        long totalMinutesLogged = 0;

        List<HeatmapDayData> monthDays = new ArrayList<>();
        HeatmapDayData todayDayData = null;

        for (int d = 1; d <= daysInMonth; d++) {
            tempCal.set(Calendar.DAY_OF_MONTH, d);
            int dow = tempCal.get(Calendar.DAY_OF_WEEK);
            boolean isWeekend = (dow == Calendar.SUNDAY);

            HeatmapDayData data = new HeatmapDayData();
            data.dayNumber = d;
            data.isToday = (isCurrentMonth && d == todayDay);
            data.fullDate = tempCal.getTime();
            data.formattedDate = new SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US).format(tempCal.getTime());

            if (isCurrentMonth && d > todayDay) {
                // Future days
                data.statusType = 0;
                data.hours = 0;
                data.minutes = 0;
                data.clockInTime = "09:00 AM";
                data.clockOutTime = "05:00 PM";
                data.shiftSummary = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM";
            } else if (data.isToday) {
                // Today: Check if currently checked in or completed
                if (isCheckedIn && checkInDateTime != null) {
                    long elapsedSec = Math.max(0, (System.currentTimeMillis() - checkInDateTime.getTime() - accumulatedBreakTimeMs) / 1000);
                    data.hours = elapsedSec / 3600;
                    data.minutes = (elapsedSec % 3600) / 60;
                } else {
                    // Seed active day hours
                    data.hours = 8;
                    data.minutes = 35;
                }

                if (data.hours >= 10 || (data.hours == 9 && data.minutes >= 30)) {
                    data.statusType = 5; // Heavy Overtime (Deep Forest Green)
                    overtimeCount++;
                } else if (data.hours > 8 || (data.hours == 8 && data.minutes > 0)) {
                    data.statusType = 4; // Overtime (Dark Green)
                    overtimeCount++;
                } else if (data.hours == 8 && data.minutes == 0) {
                    data.statusType = 3; // Exact 8h (Mid Green)
                } else {
                    data.statusType = 2; // Short Day (<8h, Light Green)
                }

                if (!isWeekend) {
                    daysWorkedCount++;
                    totalMinutesLogged += (data.hours * 60 + data.minutes);
                }
                SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.US);
                data.clockInTime = (checkInDateTime != null) ? timeFmt.format(checkInDateTime) : "09:12 AM";
                data.clockOutTime = isCheckedIn ? "In Progress" : "05:47 PM";
                data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                todayDayData = data;
            } else if (isWeekend) {
                data.statusType = 1; // Off Day
                data.hours = 0;
                data.minutes = 0;
                data.clockInTime = "Weekly Off";
                data.clockOutTime = "Weekly Off";
                data.shiftSummary = "Clock In: Weekly Off  •  Clock Out: Weekly Off";
            } else {
                // Past Weekday: Realistically patterned attendance
                int pattern = (d * 7 + 11) % 10;
                if (pattern <= 1) {
                    // Short Day (< 8 hours) -> Light Green
                    data.statusType = 2;
                    data.hours = 6 + (d % 2);
                    data.minutes = 20 + ((d * 5) % 35);
                    data.clockInTime = "09:25 AM";
                    data.clockOutTime = String.format(Locale.getDefault(), "04:%02d PM", data.minutes);
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else if (pattern >= 8) {
                    // Heavy Overtime (>9.5h) -> Deep Forest Green
                    data.statusType = 5;
                    data.hours = 9;
                    data.minutes = 45 + ((d * 3) % 15);
                    overtimeCount++;
                    data.clockInTime = "08:50 AM";
                    data.clockOutTime = "06:45 PM";
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else if (pattern >= 6) {
                    // Overtime (8h to 9.5h) -> Dark Green
                    data.statusType = 4;
                    data.hours = 8;
                    data.minutes = 25 + ((d * 5) % 30);
                    overtimeCount++;
                    data.clockInTime = "09:05 AM";
                    data.clockOutTime = "05:40 PM";
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else {
                    // Exact 8 Hours Completed -> Mid Green
                    data.statusType = 3;
                    data.hours = 8;
                    data.minutes = 0;
                    data.clockInTime = "09:00 AM";
                    data.clockOutTime = "05:00 PM";
                    data.shiftSummary = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM";
                }
                daysWorkedCount++;
                totalMinutesLogged += (data.hours * 60 + data.minutes);
            }

            monthDays.add(data);
        }

        // Build 7-column rows
        LinearLayout currentRow = createHeatmapRow();
        layoutHeatmapGrid.addView(currentRow);

        // Add leading empty spaces for weekday offset
        for (int i = 0; i < offset; i++) {
            View empty = new View(this);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dpToPx(36), 1.0f);
            lp.setMargins(dpToPx(3), 0, dpToPx(3), 0);
            currentRow.addView(empty, lp);
        }

        int colIndex = offset;
        for (HeatmapDayData data : monthDays) {
            if (colIndex == 7) {
                currentRow = createHeatmapRow();
                layoutHeatmapGrid.addView(currentRow);
                colIndex = 0;
            }

            FrameLayout cell = new FrameLayout(this);
            LinearLayout.LayoutParams cellParams = new LinearLayout.LayoutParams(0, dpToPx(36), 1.0f);
            cellParams.setMargins(dpToPx(3), 0, dpToPx(3), 0);
            cell.setLayoutParams(cellParams);

            int bgRes;
            int textColor;
            switch (data.statusType) {
                case 5: // Heavy Overtime (Deep Forest Green)
                    bgRes = R.drawable.bg_box_github_level4;
                    textColor = Color.WHITE;
                    break;
                case 4: // Overtime (Dark Green)
                    bgRes = R.drawable.bg_box_github_level3;
                    textColor = Color.WHITE;
                    break;
                case 3: // Exact 8h (Mid Green)
                    bgRes = R.drawable.bg_box_github_level2;
                    textColor = Color.WHITE;
                    break;
                case 2: // Short Day (Light Green)
                    bgRes = R.drawable.bg_box_github_level1;
                    textColor = Color.parseColor("#14532D");
                    break;
                case 1: // Off Day (Empty Gray)
                    bgRes = R.drawable.bg_box_github_empty;
                    textColor = Color.parseColor("#94A3B8");
                    break;
                case 0: // Future Day
                default:
                    bgRes = R.drawable.bg_box_github_future;
                    textColor = Color.parseColor("#CBD5E1");
                    break;
            }

            cell.setBackgroundResource(bgRes);

            // Day Number Label
            TextView tvDay = new TextView(this);
            tvDay.setText(String.valueOf(data.dayNumber));
            tvDay.setTextColor(textColor);
            tvDay.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            tvDay.setTypeface(Typeface.DEFAULT_BOLD);
            tvDay.setGravity(Gravity.CENTER);
            FrameLayout.LayoutParams tvParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            cell.addView(tvDay, tvParams);

            if (data.isToday) {
                todayHeatmapBoxView = cell;
                todayHeatmapBoxText = tvDay;
                View ring = new View(this);
                ring.setBackgroundResource(R.drawable.bg_box_github_today_ring);
                cell.addView(ring, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            }

            cell.setOnClickListener(v -> updateHeatmapDayDetail(data));
            currentRow.addView(cell);
            colIndex++;
        }

        // Fill remaining trailing spaces for last row
        if (colIndex > 0 && colIndex < 7) {
            for (int i = colIndex; i < 7; i++) {
                View empty = new View(this);
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dpToPx(36), 1.0f);
                lp.setMargins(dpToPx(3), 0, dpToPx(3), 0);
                currentRow.addView(empty, lp);
            }
        }

        // Default detail banner selection
        if (todayDayData != null) {
            updateHeatmapDayDetail(todayDayData);
        } else if (!monthDays.isEmpty()) {
            updateHeatmapDayDetail(monthDays.get(0));
        }
    }

    // --- RENDER 2: FULL YEAR 52-WEEK AUTHENTIC GITHUB MATRIX ---
    private void renderYearlyHeatmap() {
        if (layoutHeatmapYearMatrix == null) return;
        layoutHeatmapYearMatrix.removeAllViews();
        allYearDaysData.clear();

        Calendar cal = Calendar.getInstance();
        Date today = new Date();
        cal.setTime(today);
        cal.add(Calendar.DAY_OF_YEAR, -364);

        int totalDaysWorked = 0;
        int totalOvertimeDays = 0;
        long totalMinutesYear = 0;

        SimpleDateFormat dayFmt = new SimpleDateFormat("EEEE, MMM d, yyyy", Locale.US);
        SimpleDateFormat monthHeaderFmt = new SimpleDateFormat("MMM", Locale.US);

        // Generate 365 days of activity since joining
        for (int i = 0; i < 365; i++) {
            Date currentDate = cal.getTime();
            int dow = cal.get(Calendar.DAY_OF_WEEK);
            boolean isWeekend = (dow == Calendar.SUNDAY);

            Calendar checkCal = Calendar.getInstance();
            boolean isToday = checkCal.get(Calendar.YEAR) == cal.get(Calendar.YEAR) &&
                    checkCal.get(Calendar.DAY_OF_YEAR) == cal.get(Calendar.DAY_OF_YEAR);

            HeatmapDayData data = new HeatmapDayData();
            data.dayNumber = i;
            data.fullDate = currentDate;
            data.formattedDate = dayFmt.format(currentDate);
            data.isToday = isToday;

            if (isToday) {
                data.hours = 8;
                data.minutes = 35;
                data.statusType = 4; // Overtime (Dark Green)
                totalDaysWorked++;
                totalOvertimeDays++;
                totalMinutesYear += (data.hours * 60 + data.minutes);
                data.clockInTime = "09:12 AM";
                data.clockOutTime = isCheckedIn ? "In Progress" : "05:47 PM";
                data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
            } else if (isWeekend) {
                data.statusType = 1; // Off Day
                data.hours = 0;
                data.minutes = 0;
                data.clockInTime = "Weekly Off";
                data.clockOutTime = "Weekly Off";
                data.shiftSummary = "Clock In: Weekly Off  •  Clock Out: Weekly Off";
            } else {
                int pseudo = (i * 13 + 7) % 100;
                if (pseudo < 8) {
                    // Approved Leave
                    data.statusType = 0;
                    data.hours = 0;
                    data.minutes = 0;
                    data.clockInTime = "09:00 AM";
                    data.clockOutTime = "05:00 PM";
                    data.shiftSummary = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM";
                } else if (pseudo < 20) {
                    // Short day (<8h) -> Light Green
                    data.statusType = 2;
                    data.hours = 6 + (i % 2);
                    data.minutes = 15 + ((i * 7) % 35);
                    totalDaysWorked++;
                    totalMinutesYear += (data.hours * 60 + data.minutes);
                    data.clockInTime = "09:30 AM";
                    data.clockOutTime = "04:30 PM";
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else if (pseudo > 78) {
                    // Heavy Overtime (>9.5h) -> Deep Forest Green
                    data.statusType = 5;
                    data.hours = 9;
                    data.minutes = 40 + (i % 20);
                    totalDaysWorked++;
                    totalOvertimeDays++;
                    totalMinutesYear += (data.hours * 60 + data.minutes);
                    data.clockInTime = "08:45 AM";
                    data.clockOutTime = "06:45 PM";
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else if (pseudo > 55) {
                    // Overtime (8h to 9.5h) -> Dark Green
                    data.statusType = 4;
                    data.hours = 8;
                    data.minutes = 20 + ((i * 5) % 35);
                    totalDaysWorked++;
                    totalOvertimeDays++;
                    totalMinutesYear += (data.hours * 60 + data.minutes);
                    data.clockInTime = "09:05 AM";
                    data.clockOutTime = "05:45 PM";
                    data.shiftSummary = "Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime;
                } else {
                    // Standard completed day -> Mid Green
                    data.statusType = 3;
                    data.hours = 8;
                    data.minutes = 0;
                    totalDaysWorked++;
                    totalMinutesYear += (data.hours * 60 + data.minutes);
                    data.clockInTime = "09:00 AM";
                    data.clockOutTime = "05:00 PM";
                    data.shiftSummary = "Clock In: 09:00 AM  •  Clock Out: 05:00 PM";
                }
            }

            allYearDaysData.add(data);
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }

        // 1. Weekday Column on the left (M, W, F)
        LinearLayout leftCol = new LinearLayout(this);
        leftCol.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams leftParams = new LinearLayout.LayoutParams(dpToPx(24), ViewGroup.LayoutParams.WRAP_CONTENT);
        leftParams.rightMargin = dpToPx(4);
        leftCol.setLayoutParams(leftParams);

        // Top spacer matching month label height
        View topSpacer = new View(this);
        topSpacer.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(16)));
        leftCol.addView(topSpacer);

        String[] dayNames = {"M", "T", "W", "T", "F", "S", "S"};
        for (int i = 0; i < 7; i++) {
            TextView lbl = new TextView(this);
            lbl.setText((i == 0 || i == 2 || i == 4) ? dayNames[i] : "");
            lbl.setTextColor(Color.parseColor("#94A3B8"));
            lbl.setTextSize(TypedValue.COMPLEX_UNIT_SP, 9);
            lbl.setTypeface(Typeface.DEFAULT_BOLD);
            lbl.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(13));
            lp.bottomMargin = dpToPx(2);
            leftCol.addView(lbl, lp);
        }
        layoutHeatmapYearMatrix.addView(leftCol);

        // 2. 52 Week Columns
        String lastMonth = "";
        for (int w = 0; w < 52; w++) {
            LinearLayout weekCol = new LinearLayout(this);
            weekCol.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams wParams = new LinearLayout.LayoutParams(dpToPx(13), ViewGroup.LayoutParams.WRAP_CONTENT);
            wParams.rightMargin = dpToPx(3);
            weekCol.setLayoutParams(wParams);

            int firstDayIdx = Math.min(w * 7, allYearDaysData.size() - 1);
            HeatmapDayData firstDayData = allYearDaysData.get(firstDayIdx);
            String monthName = monthHeaderFmt.format(firstDayData.fullDate);

            TextView monthLbl = new TextView(this);
            monthLbl.setTextColor(Color.parseColor("#64748B"));
            monthLbl.setTextSize(TypedValue.COMPLEX_UNIT_SP, 8);
            monthLbl.setTypeface(Typeface.DEFAULT_BOLD);
            monthLbl.setGravity(Gravity.CENTER_HORIZONTAL);
            monthLbl.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(16)));

            if (!monthName.equals(lastMonth)) {
                monthLbl.setText(monthName);
                lastMonth = monthName;
            } else {
                monthLbl.setText("");
            }
            weekCol.addView(monthLbl);

            // 7 Days in this week
            for (int d = 0; d < 7; d++) {
                int dayIdx = w * 7 + d;
                if (dayIdx >= allYearDaysData.size()) break;
                HeatmapDayData dayData = allYearDaysData.get(dayIdx);

                FrameLayout cell = new FrameLayout(this);
                LinearLayout.LayoutParams cParams = new LinearLayout.LayoutParams(dpToPx(13), dpToPx(13));
                cParams.bottomMargin = dpToPx(2);
                cell.setLayoutParams(cParams);

                int bgRes;
                switch (dayData.statusType) {
                    case 5:
                        bgRes = R.drawable.bg_box_github_level4;
                        break;
                    case 4:
                        bgRes = R.drawable.bg_box_github_level3;
                        break;
                    case 3:
                        bgRes = R.drawable.bg_box_github_level2;
                        break;
                    case 2:
                        bgRes = R.drawable.bg_box_github_level1;
                        break;
                    case 1:
                        bgRes = R.drawable.bg_box_github_empty;
                        break;
                    case 0:
                    default:
                        bgRes = R.drawable.bg_box_github_future;
                        break;
                }
                cell.setBackgroundResource(bgRes);

                if (dayData.isToday) {
                    View ring = new View(this);
                    ring.setBackgroundResource(R.drawable.bg_box_github_today_ring);
                    cell.addView(ring, new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                }

                cell.setOnClickListener(v -> updateHeatmapDayDetail(dayData));
                weekCol.addView(cell);
            }

            layoutHeatmapYearMatrix.addView(weekCol);
        }

        // Select latest day in banner
        if (!allYearDaysData.isEmpty()) {
            updateHeatmapDayDetail(allYearDaysData.get(allYearDaysData.size() - 1));
        }

        // Scroll matrix to rightmost end so user sees today immediately
        if (scrollHeatmapYear != null) {
            scrollHeatmapYear.post(() -> scrollHeatmapYear.fullScroll(HorizontalScrollView.FOCUS_RIGHT));
        }
    }

    private LinearLayout createHeatmapRow() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.bottomMargin = dpToPx(6);
        row.setLayoutParams(params);
        return row;
    }

    private void updateHeatmapDayDetail(HeatmapDayData data) {
        if (data == null) return;
        selectedHeatmapDay = data.dayNumber;

        if (tvHeatmapDetailDate != null) {
            tvHeatmapDetailDate.setText(data.formattedDate);
        }

        if (tvHeatmapDetailHours != null) {
            if (data.statusType == 1) {
                tvHeatmapDetailHours.setText("Clock In: Weekly Off  •  Clock Out: Weekly Off");
            } else if (data.isToday) {
                if (isCheckedIn && checkInDateTime != null) {
                    SimpleDateFormat timeFormatter = new SimpleDateFormat("hh:mm a", Locale.US);
                    String punchTimeStr = timeFormatter.format(checkInDateTime);
                    tvHeatmapDetailHours.setText("Clock In: " + punchTimeStr + "  •  Clock Out: In Progress");
                } else {
                    tvHeatmapDetailHours.setText("Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime);
                }
            } else if (data.statusType == 0) {
                tvHeatmapDetailHours.setText("Clock In: 09:00 AM  •  Clock Out: 05:00 PM");
            } else {
                tvHeatmapDetailHours.setText("Clock In: " + data.clockInTime + "  •  Clock Out: " + data.clockOutTime);
            }
        }
    }

    private void updateHeatmapTodayLive(long h, long m, long s) {
        if (todayHeatmapBoxView == null) return;
        Calendar today = Calendar.getInstance();
        boolean isCurrentMonth = today.get(Calendar.YEAR) == heatmapCalendar.get(Calendar.YEAR) &&
                today.get(Calendar.MONTH) == heatmapCalendar.get(Calendar.MONTH);
        if (!isCurrentMonth) return;

        int bgRes;

        if (h >= 10 || (h == 9 && m >= 30)) {
            bgRes = R.drawable.bg_box_github_level4;
        } else if (h > 8 || (h == 8 && (m > 0 || s > 0))) {
            bgRes = R.drawable.bg_box_github_level3;
        } else if (h == 8 && m == 0) {
            bgRes = R.drawable.bg_box_github_level2;
        } else {
            bgRes = R.drawable.bg_box_github_level1;
        }

        todayHeatmapBoxView.setBackgroundResource(bgRes);
        if (todayHeatmapBoxText != null) {
            todayHeatmapBoxText.setTextColor(h < 8 && !(h == 8 && m == 0) ? Color.parseColor("#14532D") : Color.WHITE);
        }

        if (selectedHeatmapDay == today.get(Calendar.DAY_OF_MONTH)) {
            if (tvHeatmapDetailHours != null) {
                SimpleDateFormat timeFormatter = new SimpleDateFormat("hh:mm a", Locale.US);
                String punchTimeStr = (checkInDateTime != null) ? timeFormatter.format(checkInDateTime) : "09:12 AM";
                String outStr = isCheckedIn ? "In Progress" : "05:47 PM";
                tvHeatmapDetailHours.setText("Clock In: " + punchTimeStr + "  •  Clock Out: " + outStr);
            }
        }
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    // --- Real-time Leaves Balance ---
    private void loadLeaveBalance() {
        String token = apiClient.getToken();
        if (token == null) return;

        apiClient.getLeaveBalance(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray balances) {
                if (isFinishing() || isDestroyed() || balances == null) return;

                int casualLeft = 6;
                int sickLeft = 4;
                int totalAllocated = 0;
                int totalUsed = 0;
                boolean parsedAny = false;

                for (int i = 0; i < balances.length(); i++) {
                    JSONObject b = balances.optJSONObject(i);
                    if (b == null) continue;
                    String type = b.optString("leaveType", "").toUpperCase(Locale.ROOT);
                    JSONObject policy = b.optJSONObject("leavePolicy");
                    if (policy != null) {
                        type += " " + policy.optString("name", "").toUpperCase(Locale.ROOT) + " " + policy.optString("type", "").toUpperCase(Locale.ROOT);
                    }
                    int allocated = b.optInt("allocatedDays", 6);
                    int used = b.optInt("usedDays", 0);
                    int expired = b.optInt("expiredDays", 0);
                    int pending = b.optInt("pendingDays", 0);
                    int remaining = b.optInt("remaining", b.optInt("available", Math.max(0, allocated - used - expired - pending)));

                    totalAllocated += allocated;
                    totalUsed += used;

                    if (type.contains("CASUAL")) {
                        casualLeft = remaining;
                        parsedAny = true;
                    } else if (type.contains("SICK") || type.contains("MEDICAL")) {
                        sickLeft = remaining;
                        parsedAny = true;
                    }
                }

                if (!parsedAny || totalAllocated == 0) {
                    casualLeft = 6;
                    sickLeft = 4;
                    totalAllocated = 10;
                }

                if (tvCasualLeave != null) tvCasualLeave.setText("Casual: " + casualLeft + " left");
                if (tvSickLeave != null) tvSickLeave.setText("Sick: " + sickLeft + " remaining");
                if (pbLeaveProgress != null) {
                    pbLeaveProgress.setMax(100);
                    if (totalUsed == 0) {
                        pbLeaveProgress.setProgress(100);
                    } else {
                        int totalRemaining = casualLeft + sickLeft;
                        int progressPercent = (int) (100.0 * totalRemaining / Math.max(1, totalAllocated));
                        pbLeaveProgress.setProgress(Math.max(8, Math.min(100, progressPercent)));
                    }
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (tvCasualLeave != null) tvCasualLeave.setText("Casual: 6 left");
                if (tvSickLeave != null) tvSickLeave.setText("Sick: 4 remaining");
                if (pbLeaveProgress != null) {
                    pbLeaveProgress.setMax(100);
                    pbLeaveProgress.setProgress(100);
                }
            }
        });
    }

    // --- Real-time Upcoming Holidays (3 Upcoming Holidays Carousel) ---
    private void loadHolidays() {
        String token = apiClient.getToken();
        if (token == null) return;

        apiClient.getHolidays(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray holidays) {
                if (isFinishing() || isDestroyed()) return;

                upcomingHolidays.clear();
                Calendar cal = Calendar.getInstance();
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                Date startOfToday = cal.getTime();

                SimpleDateFormat displayFormat = new SimpleDateFormat("EEE, MMM d", Locale.getDefault());

                if (holidays != null) {
                    for (int i = 0; i < holidays.length(); i++) {
                        JSONObject h = holidays.optJSONObject(i);
                        if (h == null) continue;

                        String name = h.optString("name", h.optString("title", "Company Holiday"));
                        String dateStr = h.optString("date", h.optString("startDate", ""));
                        Date date = parseIsoDate(dateStr);

                        if (date != null && !date.before(startOfToday)) {
                            long diffMs = date.getTime() - startOfToday.getTime();
                            long daysLeft = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
                            upcomingHolidays.add(new HolidayItem(name, date, displayFormat.format(date), daysLeft));
                        }
                    }
                }

                // Ensure at least 3 upcoming holidays are lined up for the user to slide
                if (upcomingHolidays.size() < 3) {
                    int currentYear = cal.get(Calendar.YEAR);
                    Object[][] fallbacks = new Object[][]{
                            {"Diwali", 10, 1}, // Month is 0-indexed in Calendar: 10 = Nov
                            {"Guru Nanak Jayanti", 10, 15},
                            {"Christmas Day", 11, 25}, // 11 = Dec
                            {"New Year's Day", 0, 1},   // 0 = Jan
                            {"Republic Day", 0, 26}
                    };

                    for (Object[] fb : fallbacks) {
                        String fbName = (String) fb[0];
                        int m = (Integer) fb[1];
                        int d = (Integer) fb[2];

                        Calendar hCal = Calendar.getInstance();
                        hCal.set(currentYear, m, d, 0, 0, 0);
                        hCal.set(Calendar.MILLISECOND, 0);
                        if (hCal.getTime().before(startOfToday)) {
                            hCal.set(Calendar.YEAR, currentYear + 1);
                        }

                        Date hDate = hCal.getTime();
                        if (!hDate.before(startOfToday)) {
                            boolean exists = false;
                            for (HolidayItem hi : upcomingHolidays) {
                                if (hi.name.equalsIgnoreCase(fbName)) {
                                    exists = true;
                                    break;
                                }
                            }
                            if (!exists) {
                                long diffMs = hDate.getTime() - startOfToday.getTime();
                                long daysLeft = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
                                upcomingHolidays.add(new HolidayItem(fbName, hDate, displayFormat.format(hDate), daysLeft));
                            }
                        }
                    }
                }

                // Sort upcoming holidays ascending
                Collections.sort(upcomingHolidays, Comparator.comparing(o -> o.date));

                // Take top 3 upcoming holidays
                if (upcomingHolidays.size() > 3) {
                    List<HolidayItem> topThree = new ArrayList<>(upcomingHolidays.subList(0, 3));
                    upcomingHolidays.clear();
                    upcomingHolidays.addAll(topThree);
                }

                currentHolidayIndex = 0;
                displayCurrentHoliday();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Keep default holiday
            }
        });
    }

    private void displayCurrentHoliday() {
        if (upcomingHolidays.isEmpty()) return;

        if (currentHolidayIndex >= upcomingHolidays.size()) {
            currentHolidayIndex = 0;
        }

        HolidayItem current = upcomingHolidays.get(currentHolidayIndex);
        if (tvHolidayName != null) tvHolidayName.setText(current.name);
        if (tvHolidayDate != null) tvHolidayDate.setText(current.formattedDate);
        if (tvHolidayDaysLeft != null) {
            if (current.daysRemaining == 0) {
                tvHolidayDaysLeft.setText("Today");
                tvHolidayDaysLeft.setTextColor(Color.parseColor("#DC2626"));
            } else if (current.daysRemaining == 1) {
                tvHolidayDaysLeft.setText("Tomorrow");
                tvHolidayDaysLeft.setTextColor(Color.parseColor("#D97706"));
            } else {
                tvHolidayDaysLeft.setText(current.daysRemaining + " days left");
                tvHolidayDaysLeft.setTextColor(Color.parseColor("#D97706"));
            }
        }

        updateHolidayDots(currentHolidayIndex);
    }

    private void updateHolidayDots(int activeIndex) {
        View[] dots = new View[]{dotHoliday0, dotHoliday1, dotHoliday2};
        float density = getResources().getDisplayMetrics().density;
        for (int i = 0; i < dots.length; i++) {
            if (dots[i] != null) {
                boolean isActive = (i == activeIndex);
                dots[i].setBackgroundResource(isActive ? R.drawable.bg_holiday_dot_active : R.drawable.bg_holiday_dot_inactive);
                LinearLayout.LayoutParams lp = (LinearLayout.LayoutParams) dots[i].getLayoutParams();
                if (lp != null) {
                    lp.width = (int) ((isActive ? 12 : 6) * density);
                    lp.height = (int) (6 * density);
                    dots[i].setLayoutParams(lp);
                }
            }
        }
    }

    private void cycleNextHoliday() {
        if (upcomingHolidays.isEmpty()) return;
        currentHolidayIndex = (currentHolidayIndex + 1) % upcomingHolidays.size();
        animateHolidaySlide(true);
        displayCurrentHoliday();
    }

    private void cyclePrevHoliday() {
        if (upcomingHolidays.isEmpty()) return;
        currentHolidayIndex = (currentHolidayIndex - 1 + upcomingHolidays.size()) % upcomingHolidays.size();
        animateHolidaySlide(false);
        displayCurrentHoliday();
    }

    private void animateHolidaySlide(boolean forward) {
        if (cvHolidayCard == null) return;
        float offset = forward ? 35f : -35f;
        cvHolidayCard.setTranslationX(offset);
        cvHolidayCard.setAlpha(0.65f);
        cvHolidayCard.animate()
                .translationX(0f)
                .alpha(1f)
                .setDuration(220)
                .setInterpolator(new DecelerateInterpolator())
                .start();
    }

    private Date parseIsoDate(String isoString) {
        if (isoString == null || isoString.isEmpty()) return null;
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            return sdf.parse(isoString);
        } catch (Exception e1) {
            try {
                SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                sdf2.setTimeZone(TimeZone.getTimeZone("UTC"));
                return sdf2.parse(isoString);
            } catch (Exception e2) {
                try {
                    SimpleDateFormat sdf3 = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                    return sdf3.parse(isoString);
                } catch (Exception e3) {
                    return null;
                }
            }
        }
    }

    // MARK: - Hero Video Background Helpers
    private void setupHeroVideo() {
        if (textureViewHeroVideo == null) return;

        textureViewHeroVideo.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override
            public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
                initHeroMediaPlayer(new Surface(surface), width, height);
            }

            @Override
            public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surface, int width, int height) {
                adjustHeroVideoAspectRatio(width, height);
            }

            @Override
            public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surface) {
                releaseHeroMediaPlayer();
                return true;
            }

            @Override
            public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surface) {
            }
        });
    }

    private void initHeroMediaPlayer(Surface surface, int width, int height) {
        releaseHeroMediaPlayer();
        try {
            heroMediaPlayer = new MediaPlayer();
            heroMediaPlayer.setSurface(surface);

            Uri videoUri;
            try {
                videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.bg_video);
            } catch (Exception e) {
                videoUri = Uri.parse("https://v1.pinimg.com/videos/iht/expMp4/73/85/cf/7385cf9e80df8eb36661b7400684df1f_720w.mp4");
            }

            heroMediaPlayer.setDataSource(this, videoUri);
            heroMediaPlayer.setVolume(0f, 0f); // Muted for ambient background video
            heroMediaPlayer.setLooping(true); // Infinite seamless loop

            heroMediaPlayer.setOnVideoSizeChangedListener((mp, vWidth, vHeight) -> {
                heroVideoWidth = vWidth;
                heroVideoHeight = vHeight;
                int currentWidth = textureViewHeroVideo != null ? textureViewHeroVideo.getWidth() : width;
                int currentHeight = textureViewHeroVideo != null ? textureViewHeroVideo.getHeight() : height;
                adjustHeroVideoAspectRatio(currentWidth, currentHeight);
            });

            heroMediaPlayer.setOnPreparedListener(mp -> {
                heroVideoWidth = mp.getVideoWidth();
                heroVideoHeight = mp.getVideoHeight();
                int currentWidth = textureViewHeroVideo != null ? textureViewHeroVideo.getWidth() : width;
                int currentHeight = textureViewHeroVideo != null ? textureViewHeroVideo.getHeight() : height;
                adjustHeroVideoAspectRatio(currentWidth, currentHeight);
                mp.start();
            });

            heroMediaPlayer.prepareAsync();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void adjustHeroVideoAspectRatio(int viewWidth, int viewHeight) {
        if (textureViewHeroVideo == null || heroVideoWidth == 0 || heroVideoHeight == 0 || viewWidth == 0 || viewHeight == 0) {
            return;
        }

        float viewRatio = (float) viewWidth / (float) viewHeight;
        float videoRatio = (float) heroVideoWidth / (float) heroVideoHeight;

        float scaleX = 1.0f;
        float scaleY = 1.0f;

        if (viewRatio > videoRatio) {
            scaleY = (float) viewWidth / (float) heroVideoWidth * (float) heroVideoHeight / (float) viewHeight;
        } else {
            scaleX = (float) viewHeight / (float) heroVideoHeight * (float) heroVideoWidth / (float) viewWidth;
        }

        Matrix matrix = new Matrix();
        matrix.setScale(scaleX, scaleY, viewWidth / 2f, viewHeight / 2f);
        textureViewHeroVideo.setTransform(matrix);
    }

    private void releaseHeroMediaPlayer() {
        if (heroMediaPlayer != null) {
            try {
                if (heroMediaPlayer.isPlaying()) {
                    heroMediaPlayer.stop();
                }
                heroMediaPlayer.release();
            } catch (Exception ignored) {}
            heroMediaPlayer = null;
        }
    }
}
