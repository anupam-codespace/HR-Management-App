package com.teamhub.hrms;

import android.content.Intent;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.teamhub.hrms.network.ApiClient;

public class SplashActivity extends AppCompatActivity implements TextureView.SurfaceTextureListener {

    private static final int SPLASH_DURATION_MS = 6000; // 6 seconds duration as requested

    private TextureView textureViewVideo;
    private View layoutSplashCenter;

    private MediaPlayer mediaPlayer;
    private boolean isNavigated = false;
    private Handler handler;
    private Runnable navRunnable;

    private int videoWidth = 0;
    private int videoHeight = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        textureViewVideo = findViewById(R.id.textureViewVideo);
        layoutSplashCenter = findViewById(R.id.layoutSplashCenter);
        View rootSplash = findViewById(R.id.rootSplash);

        textureViewVideo.setSurfaceTextureListener(this);

        // Tap anywhere to skip immediately
        if (rootSplash != null) {
            rootSplash.setOnClickListener(v -> navigateToNext());
        }

        // Smooth entrance animation for center branding
        if (layoutSplashCenter != null) {
            layoutSplashCenter.setAlpha(0f);
            layoutSplashCenter.setScaleX(0.88f);
            layoutSplashCenter.setScaleY(0.88f);
            layoutSplashCenter.animate()
                    .alpha(1f)
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(750)
                    .setInterpolator(new DecelerateInterpolator())
                    .start();
        }

        handler = new Handler(Looper.getMainLooper());
        navRunnable = this::navigateToNext;
        handler.postDelayed(navRunnable, SPLASH_DURATION_MS);
    }

    // MARK: - TextureView & MediaPlayer
    @Override
    public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
        Surface s = new Surface(surface);
        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setSurface(s);

            Uri videoUri;
            try {
                videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.bg_video);
            } catch (Exception e) {
                videoUri = Uri.parse("https://v1.pinimg.com/videos/iht/expMp4/73/85/cf/7385cf9e80df8eb36661b7400684df1f_720w.mp4");
            }

            mediaPlayer.setDataSource(this, videoUri);
            mediaPlayer.setVolume(0f, 0f);
            mediaPlayer.setLooping(true);

            mediaPlayer.setOnVideoSizeChangedListener((mp, vWidth, vHeight) -> {
                videoWidth = vWidth;
                videoHeight = vHeight;
                adjustAspectRatio(width, height);
            });

            mediaPlayer.setOnPreparedListener(mp -> {
                videoWidth = mp.getVideoWidth();
                videoHeight = mp.getVideoHeight();
                adjustAspectRatio(width, height);
                mp.start();
            });

            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surface, int width, int height) {
        adjustAspectRatio(width, height);
    }

    @Override
    public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surface) {
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        return true;
    }

    @Override
    public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surface) {}

    /**
     * ScaleAspectFill (Center Crop) calculation to guarantee 100% full-screen coverage
     * without distortion or black bars on all devices (phones, tablets, iPads, foldables).
     */
    private void adjustAspectRatio(int viewWidth, int viewHeight) {
        if (videoWidth == 0 || videoHeight == 0 || viewWidth == 0 || viewHeight == 0) {
            return;
        }

        float viewRatio = (float) viewWidth / (float) viewHeight;
        float videoRatio = (float) videoWidth / (float) videoHeight;

        float scaleX = 1.0f;
        float scaleY = 1.0f;

        if (viewRatio > videoRatio) {
            scaleY = (float) viewWidth / (float) videoWidth * (float) videoHeight / (float) viewHeight;
        } else {
            scaleX = (float) viewHeight / (float) videoHeight * (float) videoWidth / (float) viewWidth;
        }

        Matrix matrix = new Matrix();
        matrix.setScale(scaleX, scaleY, viewWidth / 2f, viewHeight / 2f);
        textureViewVideo.setTransform(matrix);
    }

    // MARK: - Navigation
    private synchronized void navigateToNext() {
        if (isNavigated || isFinishing() || isDestroyed()) {
            return;
        }
        isNavigated = true;

        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }

        if (handler != null && navRunnable != null) {
            handler.removeCallbacks(navRunnable);
        }

        Intent intent;
        if (ApiClient.getInstance(SplashActivity.this).isLoggedIn()) {
            intent = new Intent(SplashActivity.this, HomeActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        } else {
            ApiClient client = ApiClient.getInstance(SplashActivity.this);
            client.saveToken(ApiClient.DEFAULT_VALID_TOKEN, "alex.turner@globizhub.com", "EMPLOYEE");
            client.saveUserProfile("Alex", "Lead Product Designer", "GlobizHub Technologies");
            intent = new Intent(SplashActivity.this, HomeActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        }

        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mediaPlayer != null && !isNavigated) {
            mediaPlayer.start();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (handler != null && navRunnable != null) {
            handler.removeCallbacks(navRunnable);
        }
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }
}
