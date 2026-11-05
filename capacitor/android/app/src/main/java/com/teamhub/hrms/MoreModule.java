package com.teamhub.hrms;

import java.util.Arrays;
import java.util.List;

public class MoreModule {
    private final String id;
    private final String title;
    private final int iconResId;
    private final Integer tintColor;
    private final List<String> allowedRoles;

    public MoreModule(String id, String title, int iconResId, Integer tintColor, String... allowedRoles) {
        this.id = id;
        this.title = title;
        this.iconResId = iconResId;
        this.tintColor = tintColor;
        this.allowedRoles = Arrays.asList(allowedRoles);
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public int getIconResId() {
        return iconResId;
    }

    public Integer getTintColor() {
        return tintColor;
    }

    public boolean isAllowedForRole(String role) {
        return isAllowedForRoleAndModules(role, null);
    }

    public boolean isAllowedForRoleAndModules(String role, List<String> sidebarModules) {
        if (role == null) role = "";
        String upperRole = role.toUpperCase();

        if (upperRole.equals("ADMIN") || upperRole.equals("SUPER_ADMIN") || upperRole.equals("OWNER")) {
            return true;
        }

        if (sidebarModules != null && !sidebarModules.isEmpty()) {
            return sidebarModules.contains(id);
        }

        if (allowedRoles.contains("ALL")) return true;
        if (upperRole.isEmpty()) return true;

        return allowedRoles.contains(upperRole);
    }
}
