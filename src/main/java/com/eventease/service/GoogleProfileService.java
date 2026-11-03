package com.eventease.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;

@Service
public class GoogleProfileService {

    private final FirebaseAuth firebaseAuth;

    public GoogleProfileService(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    public String getDisplayName(String firebaseUid, String fallback) {
        if (firebaseUid == null || firebaseUid.isBlank()) {
            return fallback;
        }

        try {
            UserRecord record = firebaseAuth.getUser(firebaseUid);
            String name = record.getDisplayName();

            if (name != null && !name.isBlank()) {
                return name.trim();
            }
        } catch (Exception ignored) {
            // Use the existing username if the profile cannot be loaded.
        }

        return fallback;
    }
}