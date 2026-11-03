package com.eventease.repository;

import com.eventease.model.User;
import com.google.cloud.firestore.DocumentSnapshot;

import java.util.HashMap;
import java.util.Map;

public final class FirestoreUserMapper {

    private FirestoreUserMapper() {
    }

    public static User fromDocument(DocumentSnapshot document) {
        if (!document.exists()) {
            throw new IllegalArgumentException("User document not found.");
        }

        User user = new User();

        Long id = document.getLong("id");
        user.setId(id);

        user.setUsername(document.getString("username"));
        user.setEmail(document.getString("email"));
        user.setPassword(document.getString("password"));
        user.setRole(document.getString("role"));
        user.setFirebaseUid(document.getString("firebaseUid"));

        return user;
    }

    public static Map<String, Object> toDocument(User user) {
        Map<String, Object> data = new HashMap<>();

        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("email", user.getEmail());
        data.put("password", user.getPassword());
        data.put("role", user.getRole());
        data.put("firebaseUid", user.getFirebaseUid());

        return data;
    }
}