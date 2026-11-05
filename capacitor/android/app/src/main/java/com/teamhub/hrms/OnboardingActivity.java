package com.teamhub.hrms;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.viewpager2.widget.ViewPager2;
import java.util.ArrayList;
import java.util.List;

public class OnboardingActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private LinearLayout layoutDots;
    private Button btnSignIn;
    private TextView tvSignUpPrompt;
    private TextView tvTroublePrompt;

    private final int totalDots = 7; // Matching the reference image dot count

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);
        TabletHelper.applyTabletConstraint(findViewById(R.id.bottomContainer), TabletHelper.AUTH_MAX_WIDTH_DP);

        viewPager = findViewById(R.id.viewPagerOnboarding);
        layoutDots = findViewById(R.id.layoutDots);
        btnSignIn = findViewById(R.id.btnSignIn);
        tvSignUpPrompt = findViewById(R.id.tvSignUpPrompt);
        tvTroublePrompt = findViewById(R.id.tvTroublePrompt);

        setupViewPager();
        setupDots(0);
        setupLinks();

        btnSignIn.setOnClickListener(v -> {
            Intent intent = new Intent(OnboardingActivity.this, SignInActivity.class);
            startActivity(intent);
        });
    }

    private void setupViewPager() {
        List<OnboardingItem> items = new ArrayList<>();
        items.add(new OnboardingItem(
                R.drawable.onboarding_shifts,
                "Shift schedules",
                "Efficiently manage employee shifts and attendance reports"
        ));
        items.add(new OnboardingItem(
                R.drawable.onboarding_face,
                "Facial recognition",
                "Smile and snap a picture to mark attendance"
        ));
        items.add(new OnboardingItem(
                R.drawable.onboarding_leave,
                "Leave tracker",
                "An intuitive leave management tool your team will love"
        ));
        items.add(new OnboardingItem(
                R.drawable.onboarding_performance,
                "Performance tracking",
                "Measure goals, KRAs, and skills. Share feedback and run accurate appraisals"
        ));

        OnboardingAdapter adapter = new OnboardingAdapter(items);
        viewPager.setAdapter(adapter);

        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                setupDots(position);
            }
        });
    }

    private void setupDots(int activeIndex) {
        layoutDots.removeAllViews();
        for (int i = 0; i < totalDots; i++) {
            ImageView dot = new ImageView(this);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            params.setMargins(6, 0, 6, 0);
            dot.setLayoutParams(params);

            if (i == activeIndex) {
                dot.setImageDrawable(ContextCompat.getDrawable(this, R.drawable.dot_active));
            } else {
                dot.setImageDrawable(ContextCompat.getDrawable(this, R.drawable.dot_inactive));
            }
            layoutDots.addView(dot);
        }
    }

    private void setupLinks() {
        // "Don't have an account? Sign Up" with blue "Sign Up"
        String signUpText = "Don't have an account? Sign Up";
        SpannableString ssSignUp = new SpannableString(signUpText);
        int signUpStart = signUpText.indexOf("Sign Up");
        if (signUpStart != -1) {
            ssSignUp.setSpan(
                    new ForegroundColorSpan(Color.parseColor("#2563EB")),
                    signUpStart,
                    signUpStart + "Sign Up".length(),
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            );
        }
        tvSignUpPrompt.setText(ssSignUp);

        // "Have trouble signing in? Contact us" with blue "Contact us"
        String troubleText = "Have trouble signing in? Contact us";
        SpannableString ssTrouble = new SpannableString(troubleText);
        int contactStart = troubleText.indexOf("Contact us");
        if (contactStart != -1) {
            ssTrouble.setSpan(
                    new ForegroundColorSpan(Color.parseColor("#2563EB")),
                    contactStart,
                    contactStart + "Contact us".length(),
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            );
        }
        tvTroublePrompt.setText(ssTrouble);
    }
}
