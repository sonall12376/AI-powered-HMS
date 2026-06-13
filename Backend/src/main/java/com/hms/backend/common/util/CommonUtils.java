package com.hms.backend.common.util;

import java.util.UUID;

public class CommonUtils {

    public static String generateUniqueId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Prevent instantiation
    private CommonUtils() {}
}
