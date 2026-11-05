package com.teamhub.hrms;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class OnboardingAdapter extends RecyclerView.Adapter<OnboardingAdapter.OnboardingViewHolder> {

    private final List<OnboardingItem> items;

    public OnboardingAdapter(List<OnboardingItem> items) {
        this.items = items;
    }

    @NonNull
    @Override
    public OnboardingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_onboarding_page, parent, false);
        return new OnboardingViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull OnboardingViewHolder holder, int position) {
        holder.bind(items.get(position));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class OnboardingViewHolder extends RecyclerView.ViewHolder {
        private final ImageView ivIllustration;
        private final TextView tvTitle;
        private final TextView tvSubtitle;

        OnboardingViewHolder(@NonNull View itemView) {
            super(itemView);
            ivIllustration = itemView.findViewById(R.id.ivIllustration);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvSubtitle = itemView.findViewById(R.id.tvSubtitle);
        }

        void bind(OnboardingItem item) {
            ivIllustration.setImageResource(item.getImageResId());
            tvTitle.setText(item.getTitle());
            tvSubtitle.setText(item.getSubtitle());
        }
    }
}
