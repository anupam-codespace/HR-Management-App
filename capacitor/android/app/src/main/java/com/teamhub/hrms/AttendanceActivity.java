package com.teamhub.hrms;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.teamhub.hrms.network.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class AttendanceActivity extends AppCompatActivity {

    // Attendance Status constants
    private static final String STATUS_PRESENT = "PRESENT";
    private static final String STATUS_LATE = "LATE";
    private static final String STATUS_ABSENT = "ABSENT";

    // Top Bar Views
    private View btnNotifications;
    private View viewNotificationDot;
    private FrameLayout flAvatarContainer;
    private ImageView ivUserAvatar;
    private TextView tvAvatarInitials;

    // Capsule Switcher
    private FrameLayout capsuleContainer;
    private View viewSlidingThumb;
    private TextView btnTabMyAttendance;
    private TextView btnTabRegularization;
    private boolean isRegularizationActive = false;

    // Containers
    private LinearLayout llAttendanceCardsContainer;
    private LinearLayout llRegularizationContainer;
    private View btnSubmitNewRegularization;

    // Skeleton Layout
    private LinearLayout layoutSkeletonAttendance;
    private View skelCard1;
    private View skelCard2;
    private View skelCard3;

    // Calendar Header Views
    private View llMonthYearHeader;
    private TextView tvMonthYear;
    private ImageView btnPrevMonth;
    private ImageView btnNextMonth;
    private LinearLayout llCalendarDaysGrid;

    // Selected Record Card Views
    private TextView tvSelectedRecordDate;
    private TextView badgeShiftType;
    private TextView tvClockInTime;
    private TextView tvClockInLocation;
    private TextView tvClockOutTime;
    private TextView tvClockOutLocation;
    private TextView tvTotalDurationLogged;
    private View pillOvertime;
    private TextView tvOvertimeBadge;

    // Timeline & Sync
    private LinearLayout llWeeklyTimelineRows;
    private TextView tvAccumulatedHours;
    private TextView tvQuotaStatus;
    private TextView tvVerifiedLocation;
    private View btnRequestRegularization;

    private Handler liveTickerHandler = new Handler(Looper.getMainLooper());
    private final Runnable liveTickerRunnable = new Runnable() {
        @Override
        public void run() {
            ApiClient client = ApiClient.getInstance(AttendanceActivity.this);
            String status = client.getLocalAttendanceStatus();
            if ("CHECKED_IN".equalsIgnoreCase(status) || "CLOCKED_IN".equalsIgnoreCase(status)) {
                updateSelectedRecordCard();
                updateWeeklyTimeline();
            }
            liveTickerHandler.postDelayed(this, 1000);
        }
    };

    // Bottom Navigation
    private View navTabHome;
    private View navTabAttendance;
    private View navTabLeave;
    private View navTabTasks;
    private View navTabMore;

    // State Variables
    private Calendar currentDisplayCalendar;
    private Calendar selectedCalendarDate;
    private Map<String, AttendanceRecord> attendanceHistoryMap = new HashMap<>();

    // Record model
    private static class AttendanceRecord {
        String dateStr; // yyyy-MM-dd
        String status;  // PRESENT, LATE, ABSENT
        String clockIn;
        String clockOut;
        String duration;
        String overtime;
        String inLocation;
        String outLocation;

        AttendanceRecord(String dateStr, String status, String clockIn, String clockOut, String duration, String overtime, String inLocation, String outLocation) {
            this.dateStr = dateStr;
            this.status = status;
            this.clockIn = clockIn;
            this.clockOut = clockOut;
            this.duration = duration;
            this.overtime = overtime;
            this.inLocation = inLocation;
            this.outLocation = outLocation;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            getWindow().setStatusBarColor(Color.WHITE);
        }
        setContentView(R.layout.activity_attendance);

        currentDisplayCalendar = Calendar.getInstance();
        selectedCalendarDate = Calendar.getInstance();

        initViews();
        setupTopBar();
        setupTabs();
        setupCalendarNavigation();
        setupBottomNavigation();
        setupMockData();
        showSkeletonLoading();
        loadUserProfile();
        loadAttendanceHistoryFromApi();

        renderCalendar();
        updateSelectedRecordCard();
        updateWeeklyTimeline();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(notifReceiver, new android.content.IntentFilter(AppNotificationManager.ACTION_NOTIFICATION_RECEIVED), Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(notifReceiver, new android.content.IntentFilter(AppNotificationManager.ACTION_NOTIFICATION_RECEIVED));
            }
        } catch (Exception ignored) {}
    }

    private final android.content.BroadcastReceiver notifReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (viewNotificationDot != null) {
                viewNotificationDot.setVisibility(ApiClient.getInstance(context).hasUnreadLocalNotifications() ? View.VISIBLE : View.GONE);
            }
        }
    };

    @Override
    protected void onPause() {
        super.onPause();
        liveTickerHandler.removeCallbacks(liveTickerRunnable);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        liveTickerHandler.removeCallbacks(liveTickerRunnable);
        try {
            unregisterReceiver(notifReceiver);
        } catch (Exception ignored) {}
    }

    private void initViews() {
        TabletHelper.applyTabletConstraint(findViewById(R.id.topBarContent));
        TabletHelper.applyTabletConstraint(findViewById(R.id.attendanceContentContainer));
        TabletHelper.applyTabletConstraint(findViewById(R.id.bottomNavContent));

        btnNotifications = findViewById(R.id.btnNotifications);
        viewNotificationDot = findViewById(R.id.viewNotificationDot);
        flAvatarContainer = findViewById(R.id.flAvatarContainer);
        ivUserAvatar = findViewById(R.id.ivUserAvatar);
        tvAvatarInitials = findViewById(R.id.tvAvatarInitials);

        capsuleContainer = findViewById(R.id.capsuleContainer);
        viewSlidingThumb = findViewById(R.id.viewSlidingThumb);
        btnTabMyAttendance = findViewById(R.id.btnTabMyAttendance);
        btnTabRegularization = findViewById(R.id.btnTabRegularization);

        llAttendanceCardsContainer = findViewById(R.id.llAttendanceCardsContainer);
        llRegularizationContainer = findViewById(R.id.llRegularizationContainer);
        btnSubmitNewRegularization = findViewById(R.id.btnSubmitNewRegularization);

        layoutSkeletonAttendance = findViewById(R.id.layoutSkeletonAttendance);
        skelCard1 = findViewById(R.id.skelCard1);
        skelCard2 = findViewById(R.id.skelCard2);
        skelCard3 = findViewById(R.id.skelCard3);

        llMonthYearHeader = findViewById(R.id.llMonthYearHeader);
        tvMonthYear = findViewById(R.id.tvMonthYear);
        btnPrevMonth = findViewById(R.id.btnPrevMonth);
        btnNextMonth = findViewById(R.id.btnNextMonth);
        llCalendarDaysGrid = findViewById(R.id.llCalendarDaysGrid);

        tvSelectedRecordDate = findViewById(R.id.tvSelectedRecordDate);
        badgeShiftType = findViewById(R.id.badgeShiftType);
        tvClockInTime = findViewById(R.id.tvClockInTime);
        tvClockInLocation = findViewById(R.id.tvClockInLocation);
        tvClockOutTime = findViewById(R.id.tvClockOutTime);
        tvClockOutLocation = findViewById(R.id.tvClockOutLocation);
        tvTotalDurationLogged = findViewById(R.id.tvTotalDurationLogged);
        pillOvertime = findViewById(R.id.pillOvertime);
        tvOvertimeBadge = findViewById(R.id.tvOvertimeBadge);

        llWeeklyTimelineRows = findViewById(R.id.llWeeklyTimelineRows);
        tvAccumulatedHours = findViewById(R.id.tvAccumulatedHours);
        tvQuotaStatus = findViewById(R.id.tvQuotaStatus);
        tvVerifiedLocation = findViewById(R.id.tvVerifiedLocation);
        btnRequestRegularization = findViewById(R.id.btnRequestRegularization);

        navTabHome = findViewById(R.id.navTabHome);
        navTabAttendance = findViewById(R.id.navTabAttendance);
        navTabLeave = findViewById(R.id.navTabLeave);
        navTabTasks = findViewById(R.id.navTabTasks);
        navTabMore = findViewById(R.id.navTabMore);
    }

    private void setupTopBar() {
        ApiClient client = ApiClient.getInstance(this);
        String firstName = client.getFirstName();
        if (firstName != null && !firstName.isEmpty()) {
            tvAvatarInitials.setText(firstName.substring(0, 1).toUpperCase(Locale.ROOT));
        }

        boolean hasUnread = client.hasUnreadLocalNotifications();
        viewNotificationDot.setVisibility(hasUnread ? View.VISIBLE : View.GONE);

        btnNotifications.setOnClickListener(v -> {
            client.markLocalNotificationsAsRead();
            viewNotificationDot.setVisibility(View.GONE);
            Intent intent = new Intent(this, NotificationsActivity.class);
            startActivity(intent);
        });

        flAvatarContainer.setOnClickListener(v -> {
            Intent intent = new Intent(this, SettingsActivity.class);
            startActivity(intent);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        ApiClient client = ApiClient.getInstance(this);
        if (viewNotificationDot != null) {
            boolean hasUnread = client.hasUnreadLocalNotifications();
            viewNotificationDot.setVisibility(hasUnread ? View.VISIBLE : View.GONE);
        }
        if (tvAvatarInitials != null) {
            String firstName = client.getFirstName();
            if (firstName != null && !firstName.isEmpty()) {
                tvAvatarInitials.setText(firstName.substring(0, 1).toUpperCase(Locale.ROOT));
            }
        }
        updateSelectedRecordCard();
        updateWeeklyTimeline();
        liveTickerHandler.removeCallbacks(liveTickerRunnable);
        liveTickerHandler.post(liveTickerRunnable);
    }

    private void setupTabs() {
        if (capsuleContainer != null && viewSlidingThumb != null) {
            capsuleContainer.post(() -> {
                int containerWidth = capsuleContainer.getWidth();
                int padding = (int) (4 * getResources().getDisplayMetrics().density);
                int availableWidth = containerWidth - (padding * 2);
                int thumbWidth = availableWidth / 2;
                FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) viewSlidingThumb.getLayoutParams();
                lp.width = thumbWidth;
                viewSlidingThumb.setLayoutParams(lp);
            });
        }

        btnTabMyAttendance.setOnClickListener(v -> {
            if (!isRegularizationActive) return;
            isRegularizationActive = false;

            if (viewSlidingThumb != null) {
                viewSlidingThumb.animate()
                        .translationX(0f)
                        .setDuration(260)
                        .setInterpolator(new AccelerateDecelerateInterpolator())
                        .start();
            }

            btnTabMyAttendance.setTextColor(Color.WHITE);
            btnTabRegularization.setTextColor(Color.parseColor("#64748B"));

            if (llAttendanceCardsContainer != null) {
                llAttendanceCardsContainer.setVisibility(View.VISIBLE);
                llAttendanceCardsContainer.setAlpha(0f);
                llAttendanceCardsContainer.animate().alpha(1f).setDuration(200).start();
            }

            if (llRegularizationContainer != null) {
                llRegularizationContainer.animate().alpha(0f).setDuration(150).withEndAction(() -> {
                    llRegularizationContainer.setVisibility(View.GONE);
                }).start();
            }
        });

        btnTabRegularization.setOnClickListener(v -> {
            if (isRegularizationActive) return;
            isRegularizationActive = true;

            int padding = (int) (4 * getResources().getDisplayMetrics().density);
            int thumbWidth = (capsuleContainer.getWidth() - (padding * 2)) / 2;

            if (viewSlidingThumb != null) {
                viewSlidingThumb.animate()
                        .translationX(thumbWidth)
                        .setDuration(260)
                        .setInterpolator(new AccelerateDecelerateInterpolator())
                        .start();
            }

            btnTabRegularization.setTextColor(Color.WHITE);
            btnTabMyAttendance.setTextColor(Color.parseColor("#64748B"));

            if (llRegularizationContainer != null) {
                llRegularizationContainer.setVisibility(View.VISIBLE);
                llRegularizationContainer.setAlpha(0f);
                llRegularizationContainer.animate().alpha(1f).setDuration(200).start();
            }

            if (llAttendanceCardsContainer != null) {
                llAttendanceCardsContainer.animate().alpha(0f).setDuration(150).withEndAction(() -> {
                    llAttendanceCardsContainer.setVisibility(View.GONE);
                }).start();
            }
        });

        btnRequestRegularization.setOnClickListener(v -> openRequestRegularizationSheet());
        if (btnSubmitNewRegularization != null) {
            btnSubmitNewRegularization.setOnClickListener(v -> openRequestRegularizationSheet());
        }
    }

    private void setupCalendarNavigation() {
        btnPrevMonth.setOnClickListener(v -> {
            currentDisplayCalendar.add(Calendar.DAY_OF_MONTH, -7);
            renderCalendar();
            updateWeeklyTimeline();
        });

        btnNextMonth.setOnClickListener(v -> {
            currentDisplayCalendar.add(Calendar.DAY_OF_MONTH, 7);
            renderCalendar();
            updateWeeklyTimeline();
        });

        // Year & Month quick jumper (supports decades: 1990 to 2050+)
        llMonthYearHeader.setOnClickListener(v -> showYearMonthPickerDialog());
    }

    private void showYearMonthPickerDialog() {
        int currentYear = currentDisplayCalendar.get(Calendar.YEAR);
        int currentMonth = currentDisplayCalendar.get(Calendar.MONTH);

        String[] months = new String[]{"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
        int startYear = 1990;
        int endYear = 2050;
        String[] years = new String[endYear - startYear + 1];
        for (int i = 0; i < years.length; i++) {
            years[i] = String.valueOf(startYear + i);
        }

        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_month_year_picker, null, false);
        Spinner spMonth = dialogView.findViewById(R.id.spMonthPicker);
        Spinner spYear = dialogView.findViewById(R.id.spYearPicker);

        if (spMonth != null && spYear != null) {
            ArrayAdapter<String> monthAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, months);
            spMonth.setAdapter(monthAdapter);
            spMonth.setSelection(currentMonth);

            ArrayAdapter<String> yearAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, years);
            spYear.setAdapter(yearAdapter);
            int yearIndex = currentYear - startYear;
            if (yearIndex >= 0 && yearIndex < years.length) {
                spYear.setSelection(yearIndex);
            }

            new AlertDialog.Builder(this)
                    .setTitle("Select Month & Year")
                    .setView(dialogView)
                    .setPositiveButton("Apply", (dialog, which) -> {
                        int selMonth = spMonth.getSelectedItemPosition();
                        int selYear = startYear + spYear.getSelectedItemPosition();
                        currentDisplayCalendar.set(Calendar.YEAR, selYear);
                        currentDisplayCalendar.set(Calendar.MONTH, selMonth);
                        renderCalendar();
                        updateWeeklyTimeline();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        } else {
            // Fallback list of years
            new AlertDialog.Builder(this)
                    .setTitle("Select Year")
                    .setItems(years, (dialog, which) -> {
                        int selYear = startYear + which;
                        currentDisplayCalendar.set(Calendar.YEAR, selYear);
                        renderCalendar();
                        updateWeeklyTimeline();
                    })
                    .show();
        }
    }

    private Calendar getShiftWeekMonday(Calendar date) {
        Calendar cal = (Calendar) date.clone();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        int dow = cal.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        if (dow == Calendar.SUNDAY) {
            // Sunday: week has concluded, next shift starts on Monday (+1 day)
            cal.add(Calendar.DAY_OF_MONTH, 1);
        } else {
            // Monday is 2. Subtract (dow - Calendar.MONDAY) days to get Monday
            int diff = dow - Calendar.MONDAY;
            cal.add(Calendar.DAY_OF_MONTH, -diff);
        }
        return cal;
    }

    private void renderCalendar() {
        Calendar monday = getShiftWeekMonday(currentDisplayCalendar);
        Calendar saturday = (Calendar) monday.clone();
        saturday.add(Calendar.DAY_OF_MONTH, 5);

        SimpleDateFormat startFmt = new SimpleDateFormat("MMM d", Locale.getDefault());
        SimpleDateFormat endFmt = new SimpleDateFormat("MMM d, yyyy", Locale.getDefault());
        tvMonthYear.setText(startFmt.format(monday.getTime()) + " – " + endFmt.format(saturday.getTime()));

        llCalendarDaysGrid.removeAllViews();

        LinearLayout rowLayout = new LinearLayout(this);
        rowLayout.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
        rowLayout.setOrientation(LinearLayout.HORIZONTAL);
        rowLayout.setGravity(Gravity.CENTER_VERTICAL);
        rowLayout.setPadding(0, dpToPx(4), 0, dpToPx(4));

        Calendar today = Calendar.getInstance();
        SimpleDateFormat dayKeyFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

        for (int i = 0; i < 6; i++) {
            Calendar cellDate = (Calendar) monday.clone();
            cellDate.add(Calendar.DAY_OF_MONTH, i);
            String dateKey = dayKeyFmt.format(cellDate.getTime());
            final int dayNum = cellDate.get(Calendar.DAY_OF_MONTH);

            FrameLayout cellView = new FrameLayout(this);
            LinearLayout.LayoutParams cellParams = new LinearLayout.LayoutParams(
                    0,
                    dpToPx(44),
                    1.0f);
            cellView.setLayoutParams(cellParams);

            LinearLayout contentStack = new LinearLayout(this);
            FrameLayout.LayoutParams stackParams = new FrameLayout.LayoutParams(
                    dpToPx(38),
                    dpToPx(38),
                    Gravity.CENTER);
            contentStack.setLayoutParams(stackParams);
            contentStack.setOrientation(LinearLayout.VERTICAL);
            contentStack.setGravity(Gravity.CENTER);

            TextView tvDayNumber = new TextView(this);
            tvDayNumber.setTextSize(13);
            tvDayNumber.setGravity(Gravity.CENTER);
            tvDayNumber.setText(String.valueOf(dayNum));

            View dotIndicator = new View(this);
            LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(
                    dpToPx(4),
                    dpToPx(4));
            dotParams.gravity = Gravity.CENTER_HORIZONTAL;
            dotParams.topMargin = dpToPx(2);
            dotIndicator.setLayoutParams(dotParams);
            dotIndicator.setVisibility(View.INVISIBLE);

            boolean isSelected = isSameDay(cellDate, selectedCalendarDate);
            boolean isDayToday = isSameDay(cellDate, today);

            if (isSelected) {
                contentStack.setBackgroundResource(R.drawable.bg_date_selected);
                tvDayNumber.setTextColor(Color.WHITE);
                tvDayNumber.setTypeface(null, android.graphics.Typeface.BOLD);

                dotIndicator.setBackgroundResource(R.drawable.bg_avatar_circle);
                dotIndicator.setVisibility(View.VISIBLE);
            } else {
                if (isDayToday) {
                    tvDayNumber.setTextColor(Color.parseColor("#0057FF"));
                } else {
                    tvDayNumber.setTextColor(Color.parseColor("#0F172A"));
                }
                tvDayNumber.setTypeface(null, android.graphics.Typeface.BOLD);

                AttendanceRecord record = attendanceHistoryMap.get(dateKey);
                if (record != null) {
                    dotIndicator.setVisibility(View.VISIBLE);
                    if (STATUS_PRESENT.equalsIgnoreCase(record.status)) {
                        dotIndicator.setBackgroundResource(R.drawable.dot_present);
                    } else if (STATUS_LATE.equalsIgnoreCase(record.status)) {
                        dotIndicator.setBackgroundResource(R.drawable.dot_late);
                    } else if (STATUS_ABSENT.equalsIgnoreCase(record.status)) {
                        dotIndicator.setBackgroundResource(R.drawable.dot_absent);
                    }
                } else if (isDayToday) {
                    ApiClient client = ApiClient.getInstance(this);
                    String localStatus = client.getLocalAttendanceStatus();
                    if ("CHECKED_IN".equalsIgnoreCase(localStatus) || "CLOCKED_IN".equalsIgnoreCase(localStatus)) {
                        dotIndicator.setVisibility(View.VISIBLE);
                        dotIndicator.setBackgroundResource(R.drawable.dot_present);
                    }
                }
            }

            final Calendar clickedDate = (Calendar) cellDate.clone();
            cellView.setClickable(true);
            cellView.setOnClickListener(v -> {
                selectedCalendarDate = (Calendar) clickedDate.clone();
                renderCalendar();
                updateSelectedRecordCard();
            });

            contentStack.addView(tvDayNumber);
            contentStack.addView(dotIndicator);
            cellView.addView(contentStack);
            rowLayout.addView(cellView);
        }

        llCalendarDaysGrid.addView(rowLayout);
    }

    private void updateSelectedRecordCard() {
        Calendar today = Calendar.getInstance();
        boolean isToday = isSameDay(selectedCalendarDate, today);

        SimpleDateFormat displayFmt;
        String prefix;
        if (isToday) {
            displayFmt = new SimpleDateFormat("MMM d, yyyy", Locale.getDefault());
            prefix = "Today, ";
        } else {
            displayFmt = new SimpleDateFormat("EEE, MMM d, yyyy", Locale.getDefault());
            prefix = "";
        }
        tvSelectedRecordDate.setText(prefix + displayFmt.format(selectedCalendarDate.getTime()));

        SimpleDateFormat keyFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String dateKey = keyFmt.format(selectedCalendarDate.getTime());

        int dayOfWeek = selectedCalendarDate.get(Calendar.DAY_OF_WEEK);
        boolean isSunday = (dayOfWeek == Calendar.SUNDAY);

        if (isSunday) {
            badgeShiftType.setText("Weekend");
            badgeShiftType.setBackgroundResource(R.drawable.bg_pill_switcher);
            badgeShiftType.setTextColor(Color.parseColor("#64748B"));
            tvClockInTime.setText("--:--");
            tvClockInLocation.setText("Weekend / Off Day");
            tvClockOutTime.setText("--:--");
            tvClockOutLocation.setText("No punch recorded");
            tvTotalDurationLogged.setText("0h 00m");
            pillOvertime.setVisibility(View.GONE);
            return;
        }

        badgeShiftType.setText("Regular Shift");
        badgeShiftType.setBackgroundResource(R.drawable.bg_mint_pill);
        badgeShiftType.setTextColor(Color.parseColor("#059669"));

        AttendanceRecord record = attendanceHistoryMap.get(dateKey);
        ApiClient client = ApiClient.getInstance(this);
        String localStatus = client.getLocalAttendanceStatus();
        boolean isClockedIn = "CHECKED_IN".equalsIgnoreCase(localStatus) || "CLOCKED_IN".equalsIgnoreCase(localStatus);

        if (isToday && isClockedIn) {
            badgeShiftType.setText("Active Shift");
            badgeShiftType.setBackgroundResource(R.drawable.bg_mint_pill);
            badgeShiftType.setTextColor(Color.parseColor("#059669"));

            String inIso = client.getLocalCheckInIso();
            String displayInTime = "09:00 AM";
            long elapsedSeconds = 0;
            if (inIso != null) {
                try {
                    SimpleDateFormat isoFmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                    Date inD = isoFmt.parse(inIso);
                    if (inD != null) {
                        SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                        displayInTime = timeFmt.format(inD);
                        elapsedSeconds = Math.max(0, (System.currentTimeMillis() - inD.getTime()) / 1000);
                    }
                } catch (Exception ignored) {}
            }
            tvClockInTime.setText(displayInTime);
            tvClockInLocation.setText("Office Biometric A");
            tvClockOutTime.setText("--:--");
            tvClockOutLocation.setText("In Progress");

            long hrs = elapsedSeconds / 3600;
            long mins = (elapsedSeconds % 3600) / 60;
            tvTotalDurationLogged.setText(String.format(Locale.getDefault(), "%dh %02dm", hrs, mins));
            pillOvertime.setVisibility(View.GONE);
        } else if (record != null) {
            tvClockInTime.setText(record.clockIn);
            tvClockInLocation.setText(record.inLocation);
            tvClockOutTime.setText(record.clockOut);
            tvClockOutLocation.setText(record.outLocation);
            tvTotalDurationLogged.setText(record.duration);

            if (record.overtime != null && !record.overtime.isEmpty()) {
                pillOvertime.setVisibility(View.VISIBLE);
                tvOvertimeBadge.setText(record.overtime);
            } else {
                pillOvertime.setVisibility(View.GONE);
            }
        } else {
            long nowTime = System.currentTimeMillis();
            long selectedTime = selectedCalendarDate.getTimeInMillis();
            if (selectedTime > nowTime && !isToday) {
                badgeShiftType.setText("Scheduled");
                badgeShiftType.setBackgroundResource(R.drawable.bg_pill_switcher);
                badgeShiftType.setTextColor(Color.parseColor("#64748B"));
                tvClockInTime.setText("--:--");
                tvClockInLocation.setText("Shift: 09:00 AM - 06:00 PM");
                tvClockOutTime.setText("--:--");
                tvClockOutLocation.setText("Scheduled shift");
                tvTotalDurationLogged.setText("0h 00m");
                pillOvertime.setVisibility(View.GONE);
            } else if (isToday) {
                badgeShiftType.setText("Active Day");
                badgeShiftType.setBackgroundResource(R.drawable.bg_pill_switcher);
                badgeShiftType.setTextColor(Color.parseColor("#64748B"));
                tvClockInTime.setText("--:--");
                tvClockInLocation.setText("Awaiting biometric punch");
                tvClockOutTime.setText("--:--");
                tvClockOutLocation.setText("No punch recorded");
                tvTotalDurationLogged.setText("0h 00m");
                pillOvertime.setVisibility(View.GONE);
            } else {
                badgeShiftType.setText("No Records");
                badgeShiftType.setBackgroundResource(R.drawable.bg_pill_switcher);
                badgeShiftType.setTextColor(Color.parseColor("#64748B"));
                tvClockInTime.setText("--:--");
                tvClockInLocation.setText("No biometric entry");
                tvClockOutTime.setText("--:--");
                tvClockOutLocation.setText("No biometric exit");
                tvTotalDurationLogged.setText("0h 00m");
                pillOvertime.setVisibility(View.GONE);
            }
        }
    }

    private double parseDurationToHours(String duration) {
        if (duration == null || duration.isEmpty()) return 0.0;
        double hours = 0.0;
        String[] parts = duration.trim().split("\\s+");
        for (String part : parts) {
            try {
                if (part.endsWith("h")) {
                    hours += Double.parseDouble(part.replace("h", ""));
                } else if (part.endsWith("m")) {
                    hours += Double.parseDouble(part.replace("m", "")) / 60.0;
                }
            } catch (Exception ignored) {}
        }
        return hours;
    }

    private void updateWeeklyTimeline() {
        if (llWeeklyTimelineRows == null) return;
        llWeeklyTimelineRows.removeAllViews();

        String[] dayNames = new String[]{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        Calendar weekMonday = getShiftWeekMonday(currentDisplayCalendar);
        Calendar today = Calendar.getInstance();
        SimpleDateFormat keyFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

        ApiClient client = ApiClient.getInstance(this);
        String localStatus = client.getLocalAttendanceStatus();
        boolean isUserClockedIn = "CHECKED_IN".equalsIgnoreCase(localStatus) || "CLOCKED_IN".equalsIgnoreCase(localStatus);
        String inIso = client.getLocalCheckInIso();

        int totalMinutesWorked = 0;

        for (int i = 0; i < 7; i++) {
            Calendar dayDate = (Calendar) weekMonday.clone();
            dayDate.add(Calendar.DAY_OF_MONTH, i);
            String dayName = dayNames[i];
            String dateKey = keyFmt.format(dayDate.getTime());
            boolean isDayToday = isSameDay(dayDate, today);

            double hoursVal = 0.0;
            String timeDisplayText = "--";
            boolean hasActivity = false;

            if (isDayToday && isUserClockedIn && inIso != null) {
                try {
                    SimpleDateFormat isoFmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                    Date inD = isoFmt.parse(inIso);
                    if (inD != null) {
                        hasActivity = true;
                        long elapsedSec = Math.max(0, (System.currentTimeMillis() - inD.getTime()) / 1000);
                        long h = elapsedSec / 3600;
                        long m = (elapsedSec % 3600) / 60;
                        hoursVal = elapsedSec / 3600.0;
                        timeDisplayText = String.format(Locale.getDefault(), "%dh %02dm", h, m);
                        totalMinutesWorked += (int) (h * 60 + m);
                    }
                } catch (Exception ignored) {}
            } else if (attendanceHistoryMap.containsKey(dateKey)) {
                AttendanceRecord rec = attendanceHistoryMap.get(dateKey);
                if (rec != null && rec.duration != null) {
                    double parsed = parseDurationToHours(rec.duration);
                    if (parsed > 0.05) {
                        hasActivity = true;
                        hoursVal = parsed;
                        timeDisplayText = rec.duration;
                        int h = (int) parsed;
                        int m = (int) Math.round((parsed - h) * 60);
                        totalMinutesWorked += (h * 60 + m);
                    } else if (isDayToday) {
                        timeDisplayText = "0h 00m";
                    } else {
                        timeDisplayText = "--";
                    }
                }
            } else {
                timeDisplayText = isDayToday ? "0h 00m" : "--";
                hoursVal = 0.0;
                hasActivity = false;
            }

            float ratio = hasActivity ? (float) Math.min(1.0, Math.max(0.0, hoursVal / 8.0)) : 0.0f;

            LinearLayout row = new LinearLayout(this);
            row.setLayoutParams(new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT));
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(0, dpToPx(6), 0, dpToPx(6));

            TextView tvDay = new TextView(this);
            LinearLayout.LayoutParams dayParams = new LinearLayout.LayoutParams(
                    dpToPx(38),
                    LinearLayout.LayoutParams.WRAP_CONTENT);
            tvDay.setLayoutParams(dayParams);
            tvDay.setText(dayName);
            tvDay.setTextSize(13);
            tvDay.setTypeface(null, isDayToday ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
            tvDay.setTextColor(isDayToday ? Color.parseColor("#0057FF") : Color.parseColor("#0F172A"));
            row.addView(tvDay);

            FrameLayout track = new FrameLayout(this);
            LinearLayout.LayoutParams trackParams = new LinearLayout.LayoutParams(
                    0,
                    dpToPx(9),
                    1.0f);
            trackParams.leftMargin = dpToPx(8);
            trackParams.rightMargin = dpToPx(8);
            track.setLayoutParams(trackParams);
            track.setBackgroundResource(R.drawable.bg_timeline_track);

            if (hasActivity && ratio > 0.01f) {
                LinearLayout fillWrapper = new LinearLayout(this);
                fillWrapper.setLayoutParams(new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT));
                fillWrapper.setOrientation(LinearLayout.HORIZONTAL);

                View coloredFill = new View(this);
                LinearLayout.LayoutParams fillParams = new LinearLayout.LayoutParams(
                        0,
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        ratio);
                coloredFill.setLayoutParams(fillParams);
                coloredFill.setBackgroundResource(R.drawable.bg_timeline_fill);
                fillWrapper.addView(coloredFill);

                View emptySpace = new View(this);
                LinearLayout.LayoutParams spaceParams = new LinearLayout.LayoutParams(
                        0,
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        1.0f - ratio);
                emptySpace.setLayoutParams(spaceParams);
                fillWrapper.addView(emptySpace);

                track.addView(fillWrapper);
            }
            row.addView(track);

            TextView tvTime = new TextView(this);
            LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(
                    dpToPx(64),
                    LinearLayout.LayoutParams.WRAP_CONTENT);
            tvTime.setLayoutParams(timeParams);
            tvTime.setGravity(Gravity.END);
            tvTime.setText(timeDisplayText);
            tvTime.setTextSize(13);
            tvTime.setTypeface(null, isDayToday ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
            if (isDayToday && hasActivity) {
                tvTime.setTextColor(Color.parseColor("#0057FF"));
            } else if (hasActivity) {
                tvTime.setTextColor(Color.parseColor("#0F172A"));
            } else {
                tvTime.setTextColor(Color.parseColor("#94A3B8"));
            }
            row.addView(tvTime);

            llWeeklyTimelineRows.addView(row);
        }

        int totH = totalMinutesWorked / 60;
        int totM = totalMinutesWorked % 60;
        if (tvAccumulatedHours != null) {
            tvAccumulatedHours.setText(String.format(Locale.getDefault(), "Accumulated: %dh %02dm", totH, totM));
        }
        if (tvQuotaStatus != null) {
            if (totH >= 40) {
                tvQuotaStatus.setText("Quota Achieved");
                tvQuotaStatus.setTextColor(Color.parseColor("#059669"));
            } else {
                tvQuotaStatus.setText("Target: 40h/wk");
                tvQuotaStatus.setTextColor(Color.parseColor("#64748B"));
            }
        }
    }

    private void setupMockData() {
        // Pre-populate representative logs corresponding to the UI reference
        attendanceHistoryMap.put("2026-10-01", new AttendanceRecord("2026-10-01", STATUS_PRESENT, "08:58 AM", "06:05 PM", "8h 07m", null, "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-02", new AttendanceRecord("2026-10-02", STATUS_PRESENT, "09:05 AM", "06:10 PM", "8h 05m", null, "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-05", new AttendanceRecord("2026-10-05", STATUS_PRESENT, "08:55 AM", "06:15 PM", "8h 20m", "+15 mins Overtime", "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-06", new AttendanceRecord("2026-10-06", STATUS_LATE, "09:42 AM", "06:30 PM", "7h 48m", null, "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-07", new AttendanceRecord("2026-10-07", STATUS_PRESENT, "09:00 AM", "06:00 PM", "8h 00m", null, "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-08", new AttendanceRecord("2026-10-08", STATUS_PRESENT, "08:50 AM", "06:12 PM", "8h 22m", "+20 mins Overtime", "Office Biometric A", "Office Biometric B"));
        attendanceHistoryMap.put("2026-10-09", new AttendanceRecord("2026-10-09", STATUS_ABSENT, "--:--", "--:--", "0h 00m", null, "N/A", "N/A"));
        attendanceHistoryMap.put("2026-10-24", new AttendanceRecord("2026-10-24", STATUS_PRESENT, "09:02 AM", "06:14 PM", "8h 27m", "+45 mins Overtime", "Office Biometric A", "Office Biometric B"));
    }

    private void showSkeletonLoading() {
        if (layoutSkeletonAttendance != null) {
            layoutSkeletonAttendance.setVisibility(View.VISIBLE);
            if (llAttendanceCardsContainer != null) {
                llAttendanceCardsContainer.setVisibility(View.GONE);
            }

            if (skelCard1 != null) {
                ObjectAnimator a1 = ObjectAnimator.ofFloat(skelCard1, "alpha", 0.45f, 0.95f);
                a1.setDuration(850);
                a1.setRepeatCount(ValueAnimator.INFINITE);
                a1.setRepeatMode(ValueAnimator.REVERSE);
                a1.start();
            }
            if (skelCard2 != null) {
                ObjectAnimator a2 = ObjectAnimator.ofFloat(skelCard2, "alpha", 0.45f, 0.95f);
                a2.setDuration(850);
                a2.setRepeatCount(ValueAnimator.INFINITE);
                a2.setRepeatMode(ValueAnimator.REVERSE);
                a2.start();
            }
            if (skelCard3 != null) {
                ObjectAnimator a3 = ObjectAnimator.ofFloat(skelCard3, "alpha", 0.45f, 0.95f);
                a3.setDuration(850);
                a3.setRepeatCount(ValueAnimator.INFINITE);
                a3.setRepeatMode(ValueAnimator.REVERSE);
                a3.start();
            }
        }
    }

    private void hideSkeletonLoading() {
        if (layoutSkeletonAttendance != null && layoutSkeletonAttendance.getVisibility() == View.VISIBLE) {
            layoutSkeletonAttendance.animate()
                    .alpha(0f)
                    .setDuration(300)
                    .withEndAction(() -> {
                        layoutSkeletonAttendance.setVisibility(View.GONE);
                        if (!isRegularizationActive && llAttendanceCardsContainer != null) {
                            llAttendanceCardsContainer.setVisibility(View.VISIBLE);
                            llAttendanceCardsContainer.setAlpha(1f);
                        }
                    })
                    .start();
        }
    }

    private void loadUserProfile() {
        ApiClient client = ApiClient.getInstance(this);
        String token = client.getToken();
        if (token == null || token.isEmpty()) return;

        client.getProfile(token, new ApiClient.ApiCallback<JSONObject>() {
            @Override
            public void onSuccess(JSONObject user) {
                if (user == null) return;
                String firstName = user.optString("firstName", "");
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
                String company = "GlobizHub Inc.";
                if (user.has("company")) {
                    JSONObject c = user.optJSONObject("company");
                    if (c != null && c.has("name")) company = c.optString("name", company);
                } else if (user.has("organization")) {
                    company = user.optString("organization", company);
                }

                client.saveUserProfile(firstName, designation, company);
                String initial = client.getFirstName().substring(0, 1).toUpperCase(Locale.ROOT);
                runOnUiThread(() -> {
                    if (tvAvatarInitials != null) tvAvatarInitials.setText(initial);
                });
            }

            @Override
            public void onError(String errorMessage, int statusCode) {}
        });
    }

    private void loadAttendanceHistoryFromApi() {
        ApiClient client = ApiClient.getInstance(this);
        String token = client.getToken();
        if (token == null || token.isEmpty()) {
            new Handler(Looper.getMainLooper()).postDelayed(this::hideSkeletonLoading, 600);
            return;
        }

        // Safety timeout so skeleton never hangs
        new Handler(Looper.getMainLooper()).postDelayed(this::hideSkeletonLoading, 1200);

        client.getMyAttendanceHistory(token, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray response) {
                if (response != null && response.length() > 0) {
                    SimpleDateFormat apiDateFmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                    SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                    SimpleDateFormat keyFmt = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

                    for (int i = 0; i < response.length(); i++) {
                        try {
                            JSONObject obj = response.getJSONObject(i);
                            String clockInRaw = obj.optString("clockIn", null);
                            String clockOutRaw = obj.optString("clockOut", null);
                            String status = obj.optString("status", STATUS_PRESENT);

                            if (clockInRaw != null) {
                                Date inDate = apiDateFmt.parse(clockInRaw);
                                if (inDate != null) {
                                    String dateKey = keyFmt.format(inDate);
                                    String inTime = timeFmt.format(inDate);
                                    String outTime = "--:--";
                                    String duration = "In Progress";
                                    if (clockOutRaw != null) {
                                        Date outDate = apiDateFmt.parse(clockOutRaw);
                                        if (outDate != null) {
                                            outTime = timeFmt.format(outDate);
                                            long diffMs = outDate.getTime() - inDate.getTime();
                                            long hrs = diffMs / (1000 * 60 * 60);
                                            long mins = (diffMs / (1000 * 60)) % 60;
                                            duration = hrs + "h " + mins + "m";
                                        }
                                    }
                                    attendanceHistoryMap.put(dateKey, new AttendanceRecord(dateKey, status, inTime, outTime, duration, null, "Office Biometric A", "Office Biometric B"));
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    runOnUiThread(() -> {
                        renderCalendar();
                        updateSelectedRecordCard();
                        updateWeeklyTimeline();
                        hideSkeletonLoading();
                    });
                } else {
                    runOnUiThread(() -> hideSkeletonLoading());
                }
            }

            @Override
            public void onError(String error, int statusCode) {
                runOnUiThread(() -> hideSkeletonLoading());
            }
        });
    }

    private void openRequestRegularizationSheet() {
        BottomSheetDialog dialog = new BottomSheetDialog(this);
        View sheet = LayoutInflater.from(this).inflate(R.layout.dialog_request_regularization, null, false);
        dialog.setContentView(sheet);

        TextView tvRegularizeDate = sheet.findViewById(R.id.tvRegularizeDate);
        EditText etReason = sheet.findViewById(R.id.etRegularizationReason);
        View btnSubmit = sheet.findViewById(R.id.btnSubmitRegularization);
        View btnCancel = sheet.findViewById(R.id.btnCancelRegularization);

        SimpleDateFormat fmt = new SimpleDateFormat("MMMM dd, yyyy", Locale.getDefault());
        if (tvRegularizeDate != null) {
            tvRegularizeDate.setText("Date: " + fmt.format(selectedCalendarDate.getTime()));
        }

        if (btnSubmit != null) {
            btnSubmit.setOnClickListener(v -> {
                String reason = (etReason != null) ? etReason.getText().toString().trim() : "";
                if (reason.isEmpty()) {
                    Toast.makeText(this, "Please enter a reason for regularization.", Toast.LENGTH_SHORT).show();
                    return;
                }
                dialog.dismiss();
                AppNotificationManager.sendNotification(
                        AttendanceActivity.this,
                        "Regularization Request Submitted",
                        "Your attendance regularization for " + fmt.format(selectedCalendarDate.getTime()) + " has been submitted for approval."
                );
                if (viewNotificationDot != null) {
                    viewNotificationDot.setVisibility(View.VISIBLE);
                }
                Toast.makeText(this, "Regularization request submitted successfully!", Toast.LENGTH_LONG).show();
            });
        }

        if (btnCancel != null) {
            btnCancel.setOnClickListener(v -> dialog.dismiss());
        }

        dialog.show();
    }

    private void setupBottomNavigation() {
        navTabHome.setOnClickListener(v -> {
            Intent intent = new Intent(this, HomeActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
        });

        navTabAttendance.setOnClickListener(v -> {
            // Already here
        });

        navTabLeave.setOnClickListener(v -> {
            Intent intent = new Intent(this, LeaveActivity.class);
            startActivity(intent);
        });

        navTabTasks.setOnClickListener(v -> {
            Intent intent = new Intent(this, TasksActivity.class);
            startActivity(intent);
        });

        navTabMore.setOnClickListener(v -> {
            Intent intent = new Intent(this, MoreActivity.class);
            startActivity(intent);
        });
    }

    private boolean isSameDay(Calendar cal1, Calendar cal2) {
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }
}
