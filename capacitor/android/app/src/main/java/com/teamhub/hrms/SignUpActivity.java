package com.teamhub.hrms;

import android.animation.ObjectAnimator;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import android.app.ProgressDialog;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class SignUpActivity extends AppCompatActivity {

    public static final int STEP_COMPANY_DETAILS = 1;
    public static final int STEP_ADMIN_DETAILS = 2;
    public static final int STEP_COMPANY_SETTINGS = 3;
    public static final int STEP_HOLIDAY_CALENDAR = 4;
    public static final int STEP_DEPARTMENTS = 5;
    public static final int STEP_ROLES = 6;
    public static final int STEP_SALARY = 7;
    public static final int STEP_LEAVE = 8;
    public static final int STEP_SHIFTS = 9;
    public static final int STEP_BRANCHES = 10;
    public static final int STEP_INVITE = 11;

    private int currentStep = STEP_COMPANY_DETAILS;

    // Header views
    private TextView tvStepIndicator;
    private ProgressBar pbStep;
    private TextView tvWizardTitle;
    private TextView tvHeaderBack;
    private ScrollView scrollViewSignUp;

    // Step 1A: Company Details
    private LinearLayout layoutCompanyDetails;
    private EditText etCompanyName, etCompanyEmail, etCompanyPhone, etWebsite, etCompanySize;
    private TextView tvCompanyPhoneCode;
    private Button btnBackToSignIn, btnCompanyNext;

    // Step 1B: Admin Details
    private LinearLayout layoutAdminDetails;
    private EditText etAdminFirstName, etAdminLastName, etAdminEmail, etAdminPhone;
    private EditText etAdminPassword, etAdminConfirmPassword;
    private TextView tvAdminPhoneCode;
    private ImageView ivToggleAdminPassword, ivToggleAdminConfirmPassword;
    private boolean isAdminPasswordVisible = false;
    private boolean isAdminConfirmPasswordVisible = false;
    private Button btnAdminBack, btnAdminNext;

    // Step 2: Company Settings
    private LinearLayout layoutCompanySettings;
    private View layoutAttendanceDropdown;
    private TextView tvSelectedAttendance;
    private ImageView ivAttendanceDropdownArrow;
    private TextView tvShiftStartTime, tvShiftEndTime;
    private LinearLayout layoutWorkingDaysRow1, layoutWorkingDaysRow2;
    private Button btnSettingsBack, btnSettingsNext;
    private final Set<String> selectedWorkingDays = new HashSet<>();

    // Step 3: Holiday Calendar
    private LinearLayout layoutHolidayCalendar;
    private LinearLayout cardIndianHolidays, cardUsHolidays, cardCustomCalendar;
    private Button btnHolidaySkip, btnHolidayNext;
    private String selectedHolidayCalendar = "Indian";

    // Step 4: Departments
    private LinearLayout layoutDepartments;
    private LinearLayout layoutDepartmentItems;
    private Button btnDeptSkip, btnDeptNext;
    private final Set<String> selectedDepartments = new HashSet<>();

    // Step 5: Roles & Designations
    private LinearLayout layoutRoles;
    private LinearLayout layoutRoleItems;
    private Button btnRolesSkip, btnRolesNext;
    private final Set<String> selectedRoles = new HashSet<>();

    // Step 6: Salary Structure
    private LinearLayout layoutSalary;
    private LinearLayout layoutSalaryItems;
    private Button btnSalarySkip, btnSalaryNext;
    private final Set<String> selectedSalaryComponents = new HashSet<>();

    // Step 7: Leave Policies
    private LinearLayout layoutLeave;
    private LinearLayout layoutLeaveItems;
    private Button btnLeaveSkip, btnLeaveNext;
    private final Set<String> selectedLeavePolicies = new HashSet<>();

    // Step 8: Shifts
    private LinearLayout layoutShifts;
    private LinearLayout layoutShiftItems;
    private Button btnShiftsSkip, btnShiftsNext;
    private final Set<String> selectedShifts = new HashSet<>();

    // Step 9: Branches
    private LinearLayout layoutBranches;
    private LinearLayout layoutBranchItems;
    private Button btnBranchesSkip, btnBranchesNext;
    private final Set<String> selectedBranches = new HashSet<>();

    // Step 10: Invite Employees
    private LinearLayout layoutInvite;
    private EditText etInviteEmails;
    private Button btnInviteSkip, btnInviteNext;

    // International country codes
    private final String[] countryLabels = {
        "India (+91)", "United States (+1)", "United Kingdom (+44)",
        "United Arab Emirates (+971)", "Singapore (+65)", "Australia (+61)",
        "Germany (+49)", "Canada (+1)", "France (+33)", "Japan (+81)"
    };
    private final String[] countryCodes = {
        "IN +91 ▾", "US +1 ▾", "GB +44 ▾", "AE +971 ▾", "SG +65 ▾", "AU +61 ▾", "DE +49 ▾", "CA +1 ▾", "FR +33 ▾", "JP +81 ▾"
    };

    // Attendance Methods without emojis
    private final String[] attendanceMethods = {
        "Manual Punch", "GPS Location Tracking", "QR Code Scan",
        "Face Recognition", "Biometric Device", "RFID Card Access"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        initViews();
        setupCountryCodePickers();
        setupAttendanceDropdown();
        setupWorkingDayPills();
        setupHolidayCalendarCards();
        setupCapsuleGroups();
        setupNavigationButtons();

        showStep(STEP_COMPANY_DETAILS, false);
    }

    private void initViews() {
        tvStepIndicator = findViewById(R.id.tvStepIndicator);
        pbStep = findViewById(R.id.pbStep);
        tvWizardTitle = findViewById(R.id.tvWizardTitle);
        tvHeaderBack = findViewById(R.id.tvHeaderBack);
        scrollViewSignUp = findViewById(R.id.scrollViewSignUp);

        // Step 1A
        layoutCompanyDetails = findViewById(R.id.layoutCompanyDetails);
        etCompanyName = findViewById(R.id.etCompanyName);
        etCompanyEmail = findViewById(R.id.etCompanyEmail);
        etCompanyPhone = findViewById(R.id.etCompanyPhone);
        tvCompanyPhoneCode = findViewById(R.id.tvCompanyPhoneCode);
        etWebsite = findViewById(R.id.etWebsite);
        etCompanySize = findViewById(R.id.etCompanySize);
        btnBackToSignIn = findViewById(R.id.btnBackToSignIn);
        btnCompanyNext = findViewById(R.id.btnCompanyNext);

        // Step 1B
        layoutAdminDetails = findViewById(R.id.layoutAdminDetails);
        etAdminFirstName = findViewById(R.id.etAdminFirstName);
        etAdminLastName = findViewById(R.id.etAdminLastName);
        etAdminEmail = findViewById(R.id.etAdminEmail);
        etAdminPhone = findViewById(R.id.etAdminPhone);
        tvAdminPhoneCode = findViewById(R.id.tvAdminPhoneCode);
        etAdminPassword = findViewById(R.id.etAdminPassword);
        etAdminConfirmPassword = findViewById(R.id.etAdminConfirmPassword);
        ivToggleAdminPassword = findViewById(R.id.ivToggleAdminPassword);
        ivToggleAdminConfirmPassword = findViewById(R.id.ivToggleAdminConfirmPassword);
        btnAdminBack = findViewById(R.id.btnAdminBack);
        btnAdminNext = findViewById(R.id.btnAdminNext);

        // Step 2
        layoutCompanySettings = findViewById(R.id.layoutCompanySettings);
        layoutAttendanceDropdown = findViewById(R.id.layoutAttendanceDropdown);
        tvSelectedAttendance = findViewById(R.id.tvSelectedAttendance);
        ivAttendanceDropdownArrow = findViewById(R.id.ivAttendanceDropdownArrow);
        tvShiftStartTime = findViewById(R.id.tvShiftStartTime);
        tvShiftEndTime = findViewById(R.id.tvShiftEndTime);
        layoutWorkingDaysRow1 = findViewById(R.id.layoutWorkingDaysRow1);
        layoutWorkingDaysRow2 = findViewById(R.id.layoutWorkingDaysRow2);
        btnSettingsBack = findViewById(R.id.btnSettingsBack);
        btnSettingsNext = findViewById(R.id.btnSettingsNext);

        // Step 3
        layoutHolidayCalendar = findViewById(R.id.layoutHolidayCalendar);
        cardIndianHolidays = findViewById(R.id.cardIndianHolidays);
        cardUsHolidays = findViewById(R.id.cardUsHolidays);
        cardCustomCalendar = findViewById(R.id.cardCustomCalendar);
        btnHolidaySkip = findViewById(R.id.btnHolidaySkip);
        btnHolidayNext = findViewById(R.id.btnHolidayNext);

        // Step 4
        layoutDepartments = findViewById(R.id.layoutDepartments);
        layoutDepartmentItems = findViewById(R.id.layoutDepartmentItems);
        btnDeptSkip = findViewById(R.id.btnDeptSkip);
        btnDeptNext = findViewById(R.id.btnDeptNext);

        // Step 5
        layoutRoles = findViewById(R.id.layoutRoles);
        layoutRoleItems = findViewById(R.id.layoutRoleItems);
        btnRolesSkip = findViewById(R.id.btnRolesSkip);
        btnRolesNext = findViewById(R.id.btnRolesNext);

        // Step 6
        layoutSalary = findViewById(R.id.layoutSalary);
        layoutSalaryItems = findViewById(R.id.layoutSalaryItems);
        btnSalarySkip = findViewById(R.id.btnSalarySkip);
        btnSalaryNext = findViewById(R.id.btnSalaryNext);

        // Step 7
        layoutLeave = findViewById(R.id.layoutLeave);
        layoutLeaveItems = findViewById(R.id.layoutLeaveItems);
        btnLeaveSkip = findViewById(R.id.btnLeaveSkip);
        btnLeaveNext = findViewById(R.id.btnLeaveNext);

        // Step 8
        layoutShifts = findViewById(R.id.layoutShifts);
        layoutShiftItems = findViewById(R.id.layoutShiftItems);
        btnShiftsSkip = findViewById(R.id.btnShiftsSkip);
        btnShiftsNext = findViewById(R.id.btnShiftsNext);

        // Step 9
        layoutBranches = findViewById(R.id.layoutBranches);
        layoutBranchItems = findViewById(R.id.layoutBranchItems);
        btnBranchesSkip = findViewById(R.id.btnBranchesSkip);
        btnBranchesNext = findViewById(R.id.btnBranchesNext);

        // Step 10
        layoutInvite = findViewById(R.id.layoutInvite);
        etInviteEmails = findViewById(R.id.etInviteEmails);
        btnInviteSkip = findViewById(R.id.btnInviteSkip);
        btnInviteNext = findViewById(R.id.btnInviteNext);
    }

    private void setupCountryCodePickers() {
        View.OnClickListener listener = v -> {
            TextView target = (TextView) v;
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Select Country Code");
            builder.setItems(countryLabels, (dialog, which) -> target.setText(countryCodes[which]));
            builder.show();
        };

        tvCompanyPhoneCode.setOnClickListener(listener);
        tvAdminPhoneCode.setOnClickListener(listener);
    }

    private void setupAttendanceDropdown() {
        layoutAttendanceDropdown.setOnClickListener(v -> {
            ivAttendanceDropdownArrow.animate().rotation(180f).setDuration(200).start();
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Select Attendance Method");
            builder.setItems(attendanceMethods, (dialog, which) -> {
                tvSelectedAttendance.setText(attendanceMethods[which]);
                ivAttendanceDropdownArrow.animate().rotation(0f).setDuration(200).start();
            });
            builder.setOnCancelListener(dialog -> {
                ivAttendanceDropdownArrow.animate().rotation(0f).setDuration(200).start();
            });
            builder.show();
        });

        tvShiftStartTime.setOnClickListener(v -> showTimePicker(tvShiftStartTime, 9, 0));
        tvShiftEndTime.setOnClickListener(v -> showTimePicker(tvShiftEndTime, 18, 0));
    }

    private void showTimePicker(TextView target, int defaultHour, int defaultMinute) {
        TimePickerDialog tpd = new TimePickerDialog(this, (view, hourOfDay, minute) -> {
            String amPm = hourOfDay >= 12 ? "PM" : "AM";
            int hour12 = hourOfDay % 12;
            if (hour12 == 0) hour12 = 12;
            target.setText(String.format(Locale.getDefault(), "%02d:%02d %s", hour12, minute, amPm));
        }, defaultHour, defaultMinute, false);
        tpd.show();
    }

    private void setupWorkingDayPills() {
        selectedWorkingDays.add("Mon");
        selectedWorkingDays.add("Tue");
        selectedWorkingDays.add("Wed");
        selectedWorkingDays.add("Thu");
        selectedWorkingDays.add("Fri");

        String[] row1 = {"Mon", "Tue", "Wed", "Thu"};
        String[] row2 = {"Fri", "Sat", "Sun"};

        LayoutInflater inflater = getLayoutInflater();

        for (int i = 0; i < row1.length; i++) {
            final String day = row1[i];
            View dayView = inflater.inflate(R.layout.layout_day_capsule_item, layoutWorkingDaysRow1, false);
            bindDayPill(dayView, day);
            layoutWorkingDaysRow1.addView(dayView);
            if (i < row1.length - 1) {
                View spacer = new View(this);
                spacer.setLayoutParams(new LinearLayout.LayoutParams(dpToPx(8), dpToPx(0)));
                layoutWorkingDaysRow1.addView(spacer);
            }
        }

        for (int i = 0; i < row2.length; i++) {
            final String day = row2[i];
            View dayView = inflater.inflate(R.layout.layout_day_capsule_item, layoutWorkingDaysRow2, false);
            bindDayPill(dayView, day);
            layoutWorkingDaysRow2.addView(dayView);
            if (i < row2.length - 1) {
                View spacer = new View(this);
                spacer.setLayoutParams(new LinearLayout.LayoutParams(dpToPx(8), dpToPx(0)));
                layoutWorkingDaysRow2.addView(spacer);
            }
        }
    }

    private void bindDayPill(View view, String day) {
        View dot = view.findViewById(R.id.viewDayDot);
        TextView title = view.findViewById(R.id.tvDayTitle);
        title.setText(day);

        boolean active = selectedWorkingDays.contains(day);
        updateDayPillVisual(view, dot, title, active);

        view.setOnClickListener(v -> {
            boolean nowActive = !selectedWorkingDays.contains(day);
            if (nowActive) {
                selectedWorkingDays.add(day);
            } else {
                if (selectedWorkingDays.size() > 1) {
                    selectedWorkingDays.remove(day);
                } else {
                    Toast.makeText(this, "Select at least 1 working day", Toast.LENGTH_SHORT).show();
                    return;
                }
            }
            updateDayPillVisual(view, dot, title, nowActive);
        });
    }

    private void updateDayPillVisual(View root, View dot, TextView text, boolean active) {
        if (active) {
            root.setBackgroundResource(R.drawable.bg_capsule_selected);
            dot.setVisibility(View.VISIBLE);
            text.setTextColor(Color.parseColor("#0056fd"));
        } else {
            root.setBackgroundResource(R.drawable.bg_capsule_unselected);
            dot.setVisibility(View.INVISIBLE);
            text.setTextColor(Color.parseColor("#111827"));
        }
    }

    private void setupHolidayCalendarCards() {
        View.OnClickListener listener = v -> {
            if (v.getId() == R.id.cardIndianHolidays) {
                selectedHolidayCalendar = "Indian";
            } else if (v.getId() == R.id.cardUsHolidays) {
                selectedHolidayCalendar = "US";
            } else {
                selectedHolidayCalendar = "Custom";
            }
            updateHolidayCardsVisual();
        };

        cardIndianHolidays.setOnClickListener(listener);
        cardUsHolidays.setOnClickListener(listener);
        cardCustomCalendar.setOnClickListener(listener);
        updateHolidayCardsVisual();
    }

    private void updateHolidayCardsVisual() {
        cardIndianHolidays.setBackgroundResource("Indian".equals(selectedHolidayCalendar) ? R.drawable.bg_capsule_selected : R.drawable.bg_capsule_unselected);
        cardUsHolidays.setBackgroundResource("US".equals(selectedHolidayCalendar) ? R.drawable.bg_capsule_selected : R.drawable.bg_capsule_unselected);
        cardCustomCalendar.setBackgroundResource("Custom".equals(selectedHolidayCalendar) ? R.drawable.bg_capsule_selected : R.drawable.bg_capsule_unselected);
    }

    private void setupCapsuleGroups() {
        // Step 4: Departments
        String[] departments = {
            "Human Resources", "Finance", "Information Technology", "Marketing",
            "Operations", "Sales", "Customer Support", "Legal", "Product", "Engineering"
        };
        selectedDepartments.add("Human Resources");
        selectedDepartments.add("Engineering");
        selectedDepartments.add("Information Technology");
        buildCapsuleList(layoutDepartmentItems, departments, selectedDepartments);

        // Step 5: Roles
        String[] roles = {
            "Intern", "Junior Developer", "Developer", "Senior Developer",
            "Lead", "Manager", "Director", "HR Executive", "Sales Representative"
        };
        selectedRoles.add("Developer");
        selectedRoles.add("Senior Developer");
        selectedRoles.add("Manager");
        buildCapsuleList(layoutRoleItems, roles, selectedRoles);

        // Step 6: Salary Structure
        String[] salaryComponents = {
            "Basic", "HRA", "Medical", "Travel", "Special Allowance",
            "Bonus", "PF", "ESI", "Professional Tax"
        };
        selectedSalaryComponents.add("Basic");
        selectedSalaryComponents.add("HRA");
        selectedSalaryComponents.add("Special Allowance");
        selectedSalaryComponents.add("PF");
        buildCapsuleList(layoutSalaryItems, salaryComponents, selectedSalaryComponents);

        // Step 7: Leave Policies
        String[] leaves = {
            "Casual", "Earned", "Medical", "Maternity", "Paternity",
            "Unpaid", "Compensatory Off", "Bereavement"
        };
        selectedLeavePolicies.add("Casual");
        selectedLeavePolicies.add("Medical");
        selectedLeavePolicies.add("Earned");
        buildCapsuleList(layoutLeaveItems, leaves, selectedLeavePolicies);

        // Step 8: Shifts
        String[] shifts = {
            "Morning", "General", "Night", "Flexible", "Remote", "Rotational"
        };
        selectedShifts.add("General");
        selectedShifts.add("Flexible");
        selectedShifts.add("Remote");
        buildCapsuleList(layoutShiftItems, shifts, selectedShifts);

        // Step 9: Branches
        String[] branches = {
            "Head Office", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Remote"
        };
        selectedBranches.add("Head Office");
        selectedBranches.add("Remote");
        buildCapsuleList(layoutBranchItems, branches, selectedBranches);
    }

    private void buildCapsuleList(LinearLayout container, String[] items, Set<String> selectedSet) {
        container.removeAllViews();
        LayoutInflater inflater = getLayoutInflater();

        for (String item : items) {
            View capsule = inflater.inflate(R.layout.layout_capsule_item, container, false);
            View dot = capsule.findViewById(R.id.viewCapsuleDot);
            TextView text = capsule.findViewById(R.id.tvCapsuleTitle);
            text.setText(item);

            boolean isSelected = selectedSet.contains(item);
            updateCapsuleVisual(capsule, dot, text, isSelected);

            capsule.setOnClickListener(v -> {
                boolean nowSelected = !selectedSet.contains(item);
                if (nowSelected) {
                    selectedSet.add(item);
                } else {
                    if (selectedSet.size() > 1) {
                        selectedSet.remove(item);
                    } else {
                        Toast.makeText(this, "Select at least 1 item to continue", Toast.LENGTH_SHORT).show();
                        return;
                    }
                }
                updateCapsuleVisual(capsule, dot, text, nowSelected);
            });

            container.addView(capsule);
        }
    }

    private void updateCapsuleVisual(View root, View dot, TextView text, boolean selected) {
        if (selected) {
            root.setBackgroundResource(R.drawable.bg_capsule_selected);
            dot.setVisibility(View.VISIBLE);
            text.setTextColor(Color.parseColor("#0056fd"));
        } else {
            root.setBackgroundResource(R.drawable.bg_capsule_unselected);
            dot.setVisibility(View.INVISIBLE);
            text.setTextColor(Color.parseColor("#111827"));
        }
    }

    private void setupNavigationButtons() {
        // Step 1A
        btnBackToSignIn.setOnClickListener(v -> finish());
        btnCompanyNext.setOnClickListener(v -> {
            if (validateCompanyDetails()) {
                showStep(STEP_ADMIN_DETAILS, true);
            }
        });

        // Step 1B
        ivToggleAdminPassword.setOnClickListener(v -> toggleAdminPassword());
        ivToggleAdminConfirmPassword.setOnClickListener(v -> toggleAdminConfirmPassword());
        btnAdminBack.setOnClickListener(v -> showStep(STEP_COMPANY_DETAILS, true));
        btnAdminNext.setOnClickListener(v -> {
            if (validateAdminDetails()) {
                showStep(STEP_COMPANY_SETTINGS, true);
            }
        });

        // Step 2
        btnSettingsBack.setOnClickListener(v -> showStep(STEP_ADMIN_DETAILS, true));
        btnSettingsNext.setOnClickListener(v -> showStep(STEP_HOLIDAY_CALENDAR, true));

        // Step 3
        btnHolidaySkip.setOnClickListener(v -> showStep(STEP_DEPARTMENTS, true));
        btnHolidayNext.setOnClickListener(v -> showStep(STEP_DEPARTMENTS, true));

        // Step 4
        btnDeptSkip.setOnClickListener(v -> showStep(STEP_ROLES, true));
        btnDeptNext.setOnClickListener(v -> showStep(STEP_ROLES, true));

        // Step 5
        btnRolesSkip.setOnClickListener(v -> showStep(STEP_SALARY, true));
        btnRolesNext.setOnClickListener(v -> showStep(STEP_SALARY, true));

        // Step 6
        btnSalarySkip.setOnClickListener(v -> showStep(STEP_LEAVE, true));
        btnSalaryNext.setOnClickListener(v -> showStep(STEP_LEAVE, true));

        // Step 7
        btnLeaveSkip.setOnClickListener(v -> showStep(STEP_SHIFTS, true));
        btnLeaveNext.setOnClickListener(v -> showStep(STEP_SHIFTS, true));

        // Step 8
        btnShiftsSkip.setOnClickListener(v -> showStep(STEP_BRANCHES, true));
        btnShiftsNext.setOnClickListener(v -> showStep(STEP_BRANCHES, true));

        // Step 9
        btnBranchesSkip.setOnClickListener(v -> showStep(STEP_INVITE, true));
        btnBranchesNext.setOnClickListener(v -> showStep(STEP_INVITE, true));

        // Step 10
        btnInviteSkip.setOnClickListener(v -> completeRegistration());
        btnInviteNext.setOnClickListener(v -> completeRegistration());

        // Header Back (Visible only on steps 4 to 11)
        tvHeaderBack.setOnClickListener(v -> handleBack());
    }

    private void handleBack() {
        if (currentStep == STEP_INVITE) {
            showStep(STEP_BRANCHES, true);
        } else if (currentStep == STEP_BRANCHES) {
            showStep(STEP_SHIFTS, true);
        } else if (currentStep == STEP_SHIFTS) {
            showStep(STEP_LEAVE, true);
        } else if (currentStep == STEP_LEAVE) {
            showStep(STEP_SALARY, true);
        } else if (currentStep == STEP_SALARY) {
            showStep(STEP_ROLES, true);
        } else if (currentStep == STEP_ROLES) {
            showStep(STEP_DEPARTMENTS, true);
        } else if (currentStep == STEP_DEPARTMENTS) {
            showStep(STEP_HOLIDAY_CALENDAR, true);
        } else if (currentStep == STEP_HOLIDAY_CALENDAR) {
            showStep(STEP_COMPANY_SETTINGS, true);
        } else if (currentStep == STEP_COMPANY_SETTINGS) {
            showStep(STEP_ADMIN_DETAILS, true);
        } else if (currentStep == STEP_ADMIN_DETAILS) {
            showStep(STEP_COMPANY_DETAILS, true);
        }
    }

    private void completeRegistration() {
        final ProgressDialog progressDialog = new ProgressDialog(this);
        progressDialog.setMessage("Creating your company workspace... Please wait.");
        progressDialog.setCancelable(false);
        progressDialog.show();

        try {
            JSONObject payload = new JSONObject();

            // 1. Company Details
            String compName = etCompanyName.getText().toString().trim();
            if (compName.isEmpty()) compName = "My Company";
            payload.put("companyName", compName);

            String compEmail = etCompanyEmail.getText().toString().trim();
            if (compEmail.isEmpty()) {
                compEmail = "admin@" + compName.toLowerCase().replaceAll("[^a-z0-9]", "") + ".com";
            }
            payload.put("email", compEmail);

            String cCode = tvCompanyPhoneCode != null ? tvCompanyPhoneCode.getText().toString().replaceAll("[^0-9+]", "").trim() : "+91";
            String cPhone = etCompanyPhone.getText().toString().trim();
            payload.put("phone", cCode + " " + cPhone);

            String website = etWebsite.getText().toString().trim();
            if (!website.isEmpty()) payload.put("website", website);

            String cSize = etCompanySize.getText().toString().trim();
            if (!cSize.isEmpty()) payload.put("companySize", cSize);

            // 2. Admin Details
            String adminFirst = etAdminFirstName.getText().toString().trim();
            if (adminFirst.isEmpty()) adminFirst = "Admin";
            payload.put("adminFirstName", adminFirst);

            String adminLast = etAdminLastName.getText().toString().trim();
            if (adminLast.isEmpty()) adminLast = "User";
            payload.put("adminLastName", adminLast);

            final String adminEmail = etAdminEmail.getText().toString().trim();
            payload.put("adminEmail", adminEmail.isEmpty() ? compEmail : adminEmail);

            String aCode = tvAdminPhoneCode != null ? tvAdminPhoneCode.getText().toString().replaceAll("[^0-9+]", "").trim() : "+91";
            String aPhone = etAdminPhone.getText().toString().trim();
            if (!aPhone.isEmpty()) payload.put("adminPhone", aCode + " " + aPhone);

            String adminPass = etAdminPassword.getText().toString().trim();
            if (!adminPass.isEmpty()) payload.put("adminPassword", adminPass);

            // 3. Settings
            String attendance = tvSelectedAttendance != null ? tvSelectedAttendance.getText().toString().trim() : "Manual Punch";
            payload.put("attendanceMethod", attendance);
            payload.put("shiftStartTime", tvShiftStartTime != null ? tvShiftStartTime.getText().toString() : "09:00");
            payload.put("shiftEndTime", tvShiftEndTime != null ? tvShiftEndTime.getText().toString() : "18:00");

            JSONArray daysArr = new JSONArray();
            for (String day : selectedWorkingDays) daysArr.put(day);
            payload.put("workDays", daysArr);

            // 4. Holiday Calendar
            payload.put("holidayRegion", selectedHolidayCalendar);

            // 5. Lists
            JSONArray deptArr = new JSONArray();
            for (String d : selectedDepartments) deptArr.put(d);
            payload.put("departments", deptArr);

            JSONArray rolesArr = new JSONArray();
            for (String r : selectedRoles) rolesArr.put(r);
            payload.put("roles", rolesArr);

            JSONArray salaryArr = new JSONArray();
            for (String s : selectedSalaryComponents) salaryArr.put(s);
            payload.put("salaryComponents", salaryArr);

            JSONArray leaveArr = new JSONArray();
            for (String l : selectedLeavePolicies) leaveArr.put(l);
            payload.put("leavePolicies", leaveArr);

            JSONArray shiftArr = new JSONArray();
            for (String sh : selectedShifts) shiftArr.put(sh);
            payload.put("shifts", shiftArr);

            JSONArray branchArr = new JSONArray();
            for (String b : selectedBranches) branchArr.put(b);
            payload.put("branches", branchArr);

            // 6. Invites
            String invites = etInviteEmails != null ? etInviteEmails.getText().toString().trim() : "";
            if (!invites.isEmpty()) payload.put("inviteEmails", invites);

            ApiClient.getInstance(this).registerWizard(payload, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    progressDialog.dismiss();
                    String token = result.optString("access_token", "");
                    if (!token.isEmpty()) {
                        ApiClient.getInstance(SignUpActivity.this).saveToken(token, adminEmail, "SUPER_ADMIN");
                    }

                    new AlertDialog.Builder(SignUpActivity.this)
                            .setTitle("Workspace Configured!")
                            .setMessage("Your company workspace and organization have been created successfully in the live TeamHub database. Please sign in with your administrator credentials.")
                            .setPositiveButton("Go to Sign In", (dialog, which) -> {
                                Intent intent = new Intent(SignUpActivity.this, SignInActivity.class);
                                intent.putExtra(SignInActivity.EXTRA_PREFILL_EMAIL, adminEmail);
                                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                                finish();
                            })
                            .setCancelable(false)
                            .show();
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    progressDialog.dismiss();
                    new AlertDialog.Builder(SignUpActivity.this)
                            .setTitle(statusCode == 409 ? "Account Already Exists" : "Registration Failed")
                            .setMessage(errorMessage)
                            .setPositiveButton("OK", null)
                            .show();
                }
            });

        } catch (Exception e) {
            progressDialog.dismiss();
            Toast.makeText(this, "Error preparing registration: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void showStep(int step, boolean animate) {
        int oldProgress = pbStep.getProgress();
        int stepNumber = getVisibleStepNumber(step);
        int targetProgress = stepNumber;

        currentStep = step;

        tvStepIndicator.setText("Step " + stepNumber + " of 10");

        if (animate) {
            ObjectAnimator progressAnimator = ObjectAnimator.ofInt(pbStep, "progress", oldProgress, targetProgress);
            progressAnimator.setDuration(350);
            progressAnimator.setInterpolator(new DecelerateInterpolator());
            progressAnimator.start();
        } else {
            pbStep.setProgress(targetProgress);
        }

        tvWizardTitle.setText(getStepTitle(step));

        // Top Back button visible ONLY on steps with Skip button below (Steps 3 through 10)
        tvHeaderBack.setVisibility((step >= STEP_HOLIDAY_CALENDAR) ? View.VISIBLE : View.GONE);

        // Hide all step layouts
        layoutCompanyDetails.setVisibility(View.GONE);
        layoutAdminDetails.setVisibility(View.GONE);
        layoutCompanySettings.setVisibility(View.GONE);
        layoutHolidayCalendar.setVisibility(View.GONE);
        layoutDepartments.setVisibility(View.GONE);
        layoutRoles.setVisibility(View.GONE);
        layoutSalary.setVisibility(View.GONE);
        layoutLeave.setVisibility(View.GONE);
        layoutShifts.setVisibility(View.GONE);
        layoutBranches.setVisibility(View.GONE);
        layoutInvite.setVisibility(View.GONE);

        // Show active layout
        switch (step) {
            case STEP_COMPANY_DETAILS:
                layoutCompanyDetails.setVisibility(View.VISIBLE);
                break;
            case STEP_ADMIN_DETAILS:
                layoutAdminDetails.setVisibility(View.VISIBLE);
                break;
            case STEP_COMPANY_SETTINGS:
                layoutCompanySettings.setVisibility(View.VISIBLE);
                break;
            case STEP_HOLIDAY_CALENDAR:
                layoutHolidayCalendar.setVisibility(View.VISIBLE);
                break;
            case STEP_DEPARTMENTS:
                layoutDepartments.setVisibility(View.VISIBLE);
                break;
            case STEP_ROLES:
                layoutRoles.setVisibility(View.VISIBLE);
                break;
            case STEP_SALARY:
                layoutSalary.setVisibility(View.VISIBLE);
                break;
            case STEP_LEAVE:
                layoutLeave.setVisibility(View.VISIBLE);
                break;
            case STEP_SHIFTS:
                layoutShifts.setVisibility(View.VISIBLE);
                break;
            case STEP_BRANCHES:
                layoutBranches.setVisibility(View.VISIBLE);
                break;
            case STEP_INVITE:
                layoutInvite.setVisibility(View.VISIBLE);
                break;
        }

        scrollViewSignUp.smoothScrollTo(0, 0);
    }

    private int getVisibleStepNumber(int step) {
        switch (step) {
            case STEP_COMPANY_DETAILS:
            case STEP_ADMIN_DETAILS:
                return 1;
            case STEP_COMPANY_SETTINGS:
                return 2;
            case STEP_HOLIDAY_CALENDAR:
                return 3;
            case STEP_DEPARTMENTS:
                return 4;
            case STEP_ROLES:
                return 5;
            case STEP_SALARY:
                return 6;
            case STEP_LEAVE:
                return 7;
            case STEP_SHIFTS:
                return 8;
            case STEP_BRANCHES:
                return 9;
            case STEP_INVITE:
                return 10;
            default:
                return 1;
        }
    }

    private String getStepTitle(int step) {
        switch (step) {
            case STEP_COMPANY_DETAILS:
            case STEP_ADMIN_DETAILS:
                return "Company Information";
            case STEP_COMPANY_SETTINGS:
                return "Company Settings";
            case STEP_HOLIDAY_CALENDAR:
                return "Holiday Calendar";
            case STEP_DEPARTMENTS:
                return "Organization Structure";
            case STEP_ROLES:
                return "Designations & Roles";
            case STEP_SALARY:
                return "Salary Structure";
            case STEP_LEAVE:
                return "Leave Policies";
            case STEP_SHIFTS:
                return "Shift Types";
            case STEP_BRANCHES:
                return "Branches & Locations";
            case STEP_INVITE:
                return "Bring your team on board";
            default:
                return "Company Information";
        }
    }

    private boolean validateCompanyDetails() {
        if (etCompanyName.getText().toString().trim().isEmpty()) {
            etCompanyName.setError("Company name is required");
            etCompanyName.requestFocus();
            return false;
        }
        if (etCompanyEmail.getText().toString().trim().isEmpty()) {
            etCompanyEmail.setError("Company work email is required");
            etCompanyEmail.requestFocus();
            return false;
        }
        if (etCompanyPhone.getText().toString().trim().isEmpty()) {
            etCompanyPhone.setError("Company phone is required");
            etCompanyPhone.requestFocus();
            return false;
        }
        return true;
    }

    private boolean validateAdminDetails() {
        if (etAdminFirstName.getText().toString().trim().isEmpty()) {
            etAdminFirstName.setError("First name is required");
            etAdminFirstName.requestFocus();
            return false;
        }
        if (etAdminLastName.getText().toString().trim().isEmpty()) {
            etAdminLastName.setError("Last name is required");
            etAdminLastName.requestFocus();
            return false;
        }
        if (etAdminEmail.getText().toString().trim().isEmpty()) {
            etAdminEmail.setError("Admin email is required");
            etAdminEmail.requestFocus();
            return false;
        }
        if (etAdminPhone.getText().toString().trim().isEmpty()) {
            etAdminPhone.setError("Admin phone is required");
            etAdminPhone.requestFocus();
            return false;
        }
        String pass = etAdminPassword.getText().toString().trim();
        String confirm = etAdminConfirmPassword.getText().toString().trim();
        if (pass.isEmpty()) {
            etAdminPassword.setError("Password is required");
            etAdminPassword.requestFocus();
            return false;
        }
        if (pass.length() < 6) {
            etAdminPassword.setError("Password must be at least 6 characters");
            etAdminPassword.requestFocus();
            return false;
        }
        if (!pass.equals(confirm)) {
            etAdminConfirmPassword.setError("Passwords do not match");
            etAdminConfirmPassword.requestFocus();
            return false;
        }
        return true;
    }

    private void toggleAdminPassword() {
        isAdminPasswordVisible = !isAdminPasswordVisible;
        if (isAdminPasswordVisible) {
            etAdminPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
            ivToggleAdminPassword.setImageResource(R.drawable.ic_visibility);
        } else {
            etAdminPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            ivToggleAdminPassword.setImageResource(R.drawable.ic_visibility_off);
        }
        etAdminPassword.setSelection(etAdminPassword.getText().length());
    }

    private void toggleAdminConfirmPassword() {
        isAdminConfirmPasswordVisible = !isAdminConfirmPasswordVisible;
        if (isAdminConfirmPasswordVisible) {
            etAdminConfirmPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
            ivToggleAdminConfirmPassword.setImageResource(R.drawable.ic_visibility);
        } else {
            etAdminConfirmPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            ivToggleAdminConfirmPassword.setImageResource(R.drawable.ic_visibility_off);
        }
        etAdminConfirmPassword.setSelection(etAdminConfirmPassword.getText().length());
    }

    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }
}
