package com.teamhub.hrms;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class CustomizeTabsActivity extends AppCompatActivity {

    private RecyclerView rvCustomizeTabs;
    private LinearLayout llUpdateToast;
    private CustomizeTabsAdapter adapter;
    private ItemTouchHelper itemTouchHelper;

    private final Handler toastHandler = new Handler(Looper.getMainLooper());
    private Runnable hideToastRunnable;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_customize_tabs);

        AppHeaderHelper.setupHeader(this, "Customize Tabs", true);
        View btnBack = findViewById(R.id.btnCustomizeBack);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> finish());
        }
        llUpdateToast = findViewById(R.id.llUpdateToast);
        rvCustomizeTabs = findViewById(R.id.rvCustomizeTabs);

        setupRecyclerView();
    }

    @Override
    protected void onResume() {
        super.onResume();
        AppHeaderHelper.refreshHeaderState(this);
    }

    private void setupRecyclerView() {
        List<TabManager.TabItem> tabList = TabManager.getTabs(this);

        adapter = new CustomizeTabsAdapter(
                tabList,
                viewHolder -> {
                    if (itemTouchHelper != null && viewHolder.getAdapterPosition() >= 2) {
                        itemTouchHelper.startDrag(viewHolder);
                    }
                },
                () -> {
                    // Auto-save changes immediately
                    TabManager.saveTabs(this, adapter.getTabs());
                    showUpdateToast();
                }
        );

        rvCustomizeTabs.setLayoutManager(new LinearLayoutManager(this));
        rvCustomizeTabs.setAdapter(adapter);

        ItemTouchHelper.SimpleCallback callback = new ItemTouchHelper.SimpleCallback(
                ItemTouchHelper.UP | ItemTouchHelper.DOWN, 0) {

            @Override
            public boolean onMove(@NonNull RecyclerView recyclerView,
                                  @NonNull RecyclerView.ViewHolder viewHolder,
                                  @NonNull RecyclerView.ViewHolder target) {
                int fromPos = viewHolder.getAdapterPosition();
                int toPos = target.getAdapterPosition();

                if (fromPos < 2 || toPos < 2) {
                    return false;
                }
                return adapter.onItemMove(fromPos, toPos);
            }

            @Override
            public void onSwiped(@NonNull RecyclerView.ViewHolder viewHolder, int direction) {
                // No swiping needed
            }

            @Override
            public int getMovementFlags(@NonNull RecyclerView recyclerView,
                                        @NonNull RecyclerView.ViewHolder viewHolder) {
                // First 2 items are locked
                if (viewHolder.getAdapterPosition() < 2) {
                    return makeMovementFlags(0, 0);
                }
                return makeMovementFlags(ItemTouchHelper.UP | ItemTouchHelper.DOWN, 0);
            }

            @Override
            public boolean isLongPressDragEnabled() {
                return true;
            }
        };

        itemTouchHelper = new ItemTouchHelper(callback);
        itemTouchHelper.attachToRecyclerView(rvCustomizeTabs);
    }

    private void showUpdateToast() {
        if (hideToastRunnable != null) {
            toastHandler.removeCallbacks(hideToastRunnable);
        }

        llUpdateToast.setAlpha(0f);
        llUpdateToast.setVisibility(View.VISIBLE);
        llUpdateToast.animate()
                .alpha(1f)
                .setDuration(200)
                .start();

        hideToastRunnable = () -> {
            llUpdateToast.animate()
                    .alpha(0f)
                    .setDuration(300)
                    .withEndAction(() -> llUpdateToast.setVisibility(View.GONE))
                    .start();
        };

        toastHandler.postDelayed(hideToastRunnable, 2500);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (hideToastRunnable != null) {
            toastHandler.removeCallbacks(hideToastRunnable);
        }
    }
}
