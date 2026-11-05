package com.teamhub.hrms;

import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.Collections;
import java.util.List;

public class CustomizeTabsAdapter extends RecyclerView.Adapter<CustomizeTabsAdapter.TabViewHolder> {

    public interface OnStartDragListener {
        void onStartDrag(RecyclerView.ViewHolder viewHolder);
    }

    public interface OnTabChangeListener {
        void onTabChanged();
    }

    private final List<TabManager.TabItem> tabs;
    private final OnStartDragListener dragListener;
    private final OnTabChangeListener changeListener;

    public CustomizeTabsAdapter(List<TabManager.TabItem> tabs,
                                OnStartDragListener dragListener,
                                OnTabChangeListener changeListener) {
        this.tabs = tabs;
        this.dragListener = dragListener;
        this.changeListener = changeListener;
    }

    @NonNull
    @Override
    public TabViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_customize_tab, parent, false);
        return new TabViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull TabViewHolder holder, int position) {
        TabManager.TabItem item = tabs.get(position);
        holder.tvTabTitle.setText(item.getTitle());

        if (item.isLocked()) {
            holder.ivLockedIcon.setVisibility(View.VISIBLE);
            holder.llCustomControls.setVisibility(View.GONE);
        } else {
            holder.ivLockedIcon.setVisibility(View.GONE);
            holder.llCustomControls.setVisibility(View.VISIBLE);

            // Avoid triggering listener during bind
            holder.swTabToggle.setOnCheckedChangeListener(null);
            holder.swTabToggle.setChecked(item.isEnabled());

            holder.swTabToggle.setOnCheckedChangeListener((buttonView, isChecked) -> {
                item.setEnabled(isChecked);
                if (changeListener != null) {
                    changeListener.onTabChanged();
                }
            });

            holder.ivDragHandle.setOnTouchListener((v, event) -> {
                if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                    if (dragListener != null) {
                        dragListener.onStartDrag(holder);
                    }
                }
                return false;
            });
        }
    }

    @Override
    public int getItemCount() {
        return tabs.size();
    }

    public boolean onItemMove(int fromPosition, int toPosition) {
        // First 2 items (Activities, Dashboard) are permanently locked and cannot be moved or replaced
        if (fromPosition < 2 || toPosition < 2) {
            return false;
        }

        if (fromPosition < toPosition) {
            for (int i = fromPosition; i < toPosition; i++) {
                Collections.swap(tabs, i, i + 1);
            }
        } else {
            for (int i = fromPosition; i > toPosition; i--) {
                Collections.swap(tabs, i, i - 1);
            }
        }

        notifyItemMoved(fromPosition, toPosition);

        if (changeListener != null) {
            changeListener.onTabChanged();
        }
        return true;
    }

    public List<TabManager.TabItem> getTabs() {
        return tabs;
    }

    static class TabViewHolder extends RecyclerView.ViewHolder {
        TextView tvTabTitle;
        ImageView ivLockedIcon;
        LinearLayout llCustomControls;
        Switch swTabToggle;
        ImageView ivDragHandle;

        public TabViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTabTitle = itemView.findViewById(R.id.tvTabTitle);
            ivLockedIcon = itemView.findViewById(R.id.ivLockedIcon);
            llCustomControls = itemView.findViewById(R.id.llCustomControls);
            swTabToggle = itemView.findViewById(R.id.swTabToggle);
            ivDragHandle = itemView.findViewById(R.id.ivDragHandle);
        }
    }
}
