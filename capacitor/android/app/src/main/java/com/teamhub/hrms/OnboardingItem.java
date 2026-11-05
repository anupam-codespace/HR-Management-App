package com.teamhub.hrms;

public class OnboardingItem {
    private final int imageResId;
    private final String title;
    private final String subtitle;

    public OnboardingItem(int imageResId, String title, String subtitle) {
        this.imageResId = imageResId;
        this.title = title;
        this.subtitle = subtitle;
    }

    public int getImageResId() {
        return imageResId;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }
}
