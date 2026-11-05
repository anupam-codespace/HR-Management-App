package com.teamhub.hrms;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ScrollView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class TasksActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_tasks);

        // Unified TeamHub Header
        AppHeaderHelper.setupHeader(this, "Tasks", false);

        setupBottomNav();
        setupListeners();
    }

    @Override
    protected void onResume() {
        super.onResume();
        AppHeaderHelper.refreshHeaderState(this);
    }

    private void setupListeners() {
        View btnNewTask = findViewById(R.id.btnNewTask);
        if (btnNewTask != null) {
            btnNewTask.setOnClickListener(v -> showCreateTaskDialog());
        }
    }

    private void showCreateTaskDialog() {
        final EditText input = new EditText(this);
        input.setHint("Enter task title...");
        input.setPadding(40, 40, 40, 40);

        new AlertDialog.Builder(this)
                .setTitle("Create New Task")
                .setView(input)
                .setPositiveButton("Create", (dialog, which) -> {
                    String taskTitle = input.getText().toString().trim();
                    if (!taskTitle.isEmpty()) {
                        Toast.makeText(this, "Task '" + taskTitle + "' created successfully.", Toast.LENGTH_SHORT).show();
                    }
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
                Intent intent = new Intent(this, LeaveActivity.class);
                startActivity(intent);
                finish();
            });
        }

        View navTabTasks = findViewById(R.id.navTabTasks);
        if (navTabTasks != null) {
            navTabTasks.setOnClickListener(v -> {
                ScrollView sv = findViewById(R.id.scrollView);
                if (sv != null) sv.smoothScrollTo(0, 0);
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
