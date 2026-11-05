package com.teamhub.hrms;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class LeaveActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_leave);

        // Unified TeamHub Header
        AppHeaderHelper.setupHeader(this, "Leaves", false);

        setupBottomNav();
        setupListeners();
    }

    @Override
    protected void onResume() {
        super.onResume();
        AppHeaderHelper.refreshHeaderState(this);
    }

    private void setupListeners() {
        View btnApplyLeave = findViewById(R.id.btnApplyLeave);
        if (btnApplyLeave != null) {
            btnApplyLeave.setOnClickListener(v -> showApplyLeaveDialog());
        }
    }

    private void showApplyLeaveDialog() {
        String[] leaveTypes = {"Casual Leave (10 days left)", "Sick Leave (6 days left)", "Earned Leave (15 days left)"};
        new AlertDialog.Builder(this)
                .setTitle("Apply for Leave")
                .setItems(leaveTypes, (dialog, which) -> {
                    Toast.makeText(this, "Leave application submitted successfully for review.", Toast.LENGTH_LONG).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void setupBottomNav() {
        View navTabHome = findViewById(R.id.navTabHome);
        if (navTabHome != null) {
            navTabHome.setOnClickListener(v -> {
                Intent intent = new Intent(this, HomeActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(intent);
                finish();
            });
        }

        View navTabAttendance = findViewById(R.id.navTabAttendance);
        if (navTabAttendance != null) {
            navTabAttendance.setOnClickListener(v -> {
                Intent intent = new Intent(this, AttendanceActivity.class);
                startActivity(intent);
                finish();
            });
        }

        View navTabLeave = findViewById(R.id.navTabLeave);
        if (navTabLeave != null) {
            navTabLeave.setOnClickListener(v -> {
                ScrollView sv = findViewById(R.id.scrollView);
                if (sv != null) sv.smoothScrollTo(0, 0);
            });
        }

        View navTabTasks = findViewById(R.id.navTabTasks);
        if (navTabTasks != null) {
            navTabTasks.setOnClickListener(v -> {
                Intent intent = new Intent(this, TasksActivity.class);
                startActivity(intent);
                finish();
            });
        }

        View navTabMore = findViewById(R.id.navTabMore);
        if (navTabMore != null) {
            navTabMore.setOnClickListener(v -> {
                Intent intent = new Intent(this, MoreActivity.class);
                startActivity(intent);
            });
        }
    }
}
