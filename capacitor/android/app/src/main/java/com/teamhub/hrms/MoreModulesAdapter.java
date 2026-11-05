package com.teamhub.hrms;

import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class MoreModulesAdapter extends RecyclerView.Adapter<MoreModulesAdapter.ViewHolder> {

    public interface OnModuleClickListener {
        void onModuleClick(MoreModule module);
    }

    private List<MoreModule> items = new ArrayList<>();
    private final OnModuleClickListener listener;

    public MoreModulesAdapter(List<MoreModule> items, OnModuleClickListener listener) {
        this.items = new ArrayList<>(items);
        this.listener = listener;
    }

    public void updateList(List<MoreModule> newItems) {
        this.items = new ArrayList<>(newItems);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_more_module, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        MoreModule item = items.get(position);
        holder.tvModuleName.setText(item.getTitle());
        holder.ivModuleIcon.setImageResource(item.getIconResId());

        if (item.getTintColor() != null) {
            holder.ivModuleIcon.setImageTintList(ColorStateList.valueOf(item.getTintColor()));
        } else {
            holder.ivModuleIcon.setImageTintList(null);
        }

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onModuleClick(item);
            }
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ImageView ivModuleIcon;
        final TextView tvModuleName;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            ivModuleIcon = itemView.findViewById(R.id.ivModuleIcon);
            tvModuleName = itemView.findViewById(R.id.tvModuleName);
        }
    }
}
