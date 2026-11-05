package com.teamhub.hrms;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class TabManager {

    private static final String PREF_NAME = "TeamHub_Tabs_Config";
    private static final String KEY_TABS = "saved_tabs_json";

    public static class TabItem implements Serializable {
        private String id;
        private String title;
        private boolean isLocked;
        private boolean isEnabled;

        public TabItem(String id, String title, boolean isLocked, boolean isEnabled) {
            this.id = id;
            this.title = title;
            this.isLocked = isLocked;
            this.isEnabled = isEnabled;
        }

        public String getId() { return id; }
        public String getTitle() { return title; }
        public boolean isLocked() { return isLocked; }
        public boolean isEnabled() { return isEnabled; }
        public void setEnabled(boolean enabled) { this.isEnabled = enabled; }

        public JSONObject toJson() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("id", id);
                obj.put("title", title);
                obj.put("isLocked", isLocked);
                obj.put("isEnabled", isEnabled);
                return obj;
            } catch (Exception e) {
                return new JSONObject();
            }
        }

        public static TabItem fromJson(JSONObject obj) {
            return new TabItem(
                    obj.optString("id", ""),
                    obj.optString("title", ""),
                    obj.optBoolean("isLocked", false),
                    obj.optBoolean("isEnabled", true)
            );
        }
    }

    public static List<TabItem> getDefaultTabs() {
        List<TabItem> list = new ArrayList<>();
        list.add(new TabItem("activities", "Activities", true, true));
        list.add(new TabItem("dashboard", "Dashboard", true, true));
        list.add(new TabItem("feeds", "Feeds", false, true));
        list.add(new TabItem("profile", "Profile", false, true));
        list.add(new TabItem("approvals", "Approvals", false, true));
        list.add(new TabItem("leave", "Leave", false, true));
        list.add(new TabItem("attendance", "Attendance", false, true));
        list.add(new TabItem("timelogs", "Time Logs", false, true));
        list.add(new TabItem("timesheets", "Timesheets", false, true));
        list.add(new TabItem("jobs", "Jobs", false, true));
        list.add(new TabItem("career", "Career History", false, true));
        list.add(new TabItem("files", "Files", false, true));
        list.add(new TabItem("goals", "Goals", false, true));
        list.add(new TabItem("feedback", "Feedback", false, true));
        list.add(new TabItem("related", "Related Data", false, true));
        return list;
    }

    public static List<TabItem> getTabs(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String jsonStr = prefs.getString(KEY_TABS, null);

        if (jsonStr == null || jsonStr.trim().isEmpty()) {
            return getDefaultTabs();
        }

        try {
            JSONArray arr = new JSONArray(jsonStr);
            List<TabItem> tabs = new ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                TabItem item = TabItem.fromJson(obj);
                // Ensure first 2 are always locked
                if (item.getId().equals("activities") || item.getId().equals("dashboard")) {
                    item = new TabItem(item.getId(), item.getTitle(), true, true);
                }
                tabs.add(item);
            }
            return tabs;
        } catch (Exception e) {
            return getDefaultTabs();
        }
    }

    public static void saveTabs(Context context, List<TabItem> tabs) {
        JSONArray arr = new JSONArray();
        for (TabItem item : tabs) {
            arr.put(item.toJson());
        }

        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_TABS, arr.toString()).apply();
    }

    public static List<TabItem> getEnabledTabs(Context context) {
        List<TabItem> all = getTabs(context);
        List<TabItem> enabled = new ArrayList<>();
        for (TabItem item : all) {
            if (item.isEnabled()) {
                enabled.add(item);
            }
        }
        return enabled;
    }
}
