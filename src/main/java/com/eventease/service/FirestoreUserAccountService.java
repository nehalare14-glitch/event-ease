package com.eventease.service;

import com.eventease.model.User;
import com.eventease.repository.FirestoreUserMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
public class FirestoreUserAccountService {

    private final Firestore firestore;

    public FirestoreUserAccountService(Firestore firestore) {
        this.firestore = firestore;
    }

    public String createUser(User user) throws Exception {

        if (user == null ||
                user.getUsername() == null ||
                user.getEmail() == null ||
                user.getPassword() == null) {
            throw new IllegalArgumentException(
                    "Username, email and password are required.");
        }

        String username = user.getUsername().trim();
        String email = user.getEmail().trim()
                .toLowerCase(Locale.ROOT);

        if (username.length() < 3 || username.length() > 50 ||
                email.isBlank()) {
            throw new IllegalArgumentException(
                    "Invalid username or email.");
        }

        if (!"CUSTOMER".equals(user.getRole())) {
            throw new IllegalArgumentException(
                    "Only customer accounts can be created here.");
        }

        if (user.getFirebaseUid() != null) {
            throw new IllegalArgumentException(
                    "Google accounts require a separate verified login flow.");
        }

        String userId = UUID.randomUUID().toString();

        DocumentReference userRef = firestore
                .collection("users").document(userId);

        DocumentReference usernameRef = firestore
                .collection("unique_usernames")
                .document(key(username.toLowerCase(Locale.ROOT)));

        DocumentReference emailRef = firestore
                .collection("unique_emails")
                .document(key(email));

        return firestore.runTransaction(transaction -> {

            DocumentSnapshot usernameDoc =
                    transaction.get(usernameRef).get();

            DocumentSnapshot emailDoc =
                    transaction.get(emailRef).get();

            if (usernameDoc.exists() || emailDoc.exists()) {
                throw new IllegalArgumentException(
                        "Username or email already registered.");
            }

            var userData = FirestoreUserMapper.toDocument(user);
            userData.remove("id");
            userData.put("username", username);
            userData.put("email", email);

            transaction.create(userRef, userData);
            transaction.create(usernameRef,
                    java.util.Map.of("userId", userId));
            transaction.create(emailRef,
                    java.util.Map.of("userId", userId));

            return userId;

        }).get();
    }

    private static String key(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Cannot generate account lookup key.", e);
        }
    }
}