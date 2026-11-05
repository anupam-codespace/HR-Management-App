package com.teamhub.hrms;

import android.content.Context;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;

/**
 * Helper to ensure professional layout scaling on Tablets, iPads/iPads Mini,
 * Foldables, and large screen devices by constraining content width to a clean,
 * readable max width (default 680dp, or 480dp for auth forms).
 */
public class TabletHelper {

    public static final int DEFAULT_MAX_WIDTH_DP = 680;
    public static final int AUTH_MAX_WIDTH_DP = 480;

    public static void applyTabletConstraint(View view) {
        applyTabletConstraint(view, DEFAULT_MAX_WIDTH_DP);
    }

    public static void applyTabletConstraint(View view, int maxWidthDp) {
        if (view == null) return;
        Context context = view.getContext();
        int screenWidthDp = context.getResources().getConfiguration().screenWidthDp;
        if (screenWidthDp > maxWidthDp) {
            int maxPx = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                maxWidthDp,
                context.getResources().getDisplayMetrics()
            );
            ViewGroup.LayoutParams lp = view.getLayoutParams();
            if (lp != null) {
                lp.width = maxPx;
                view.setLayoutParams(lp);
            }
        }
    }
}
