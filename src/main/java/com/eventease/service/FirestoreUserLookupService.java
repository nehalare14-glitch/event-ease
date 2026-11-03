package com.eventease.service;

import com.eventease.model.User;
import com.eventease.repository.FirestoreUserMapper;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreUserLookupService {

    private final Firestore firestore;

    public FirestoreUserLookupService(Firestore firestore) {
        this.firestore = firestore;
    }

    public Optional<User> findByUsername(String username)
            throws InterruptedException, ExecutionException {

        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        var results = firestore.collection("users")
                .whereEqualTo("username", username.trim())
                .limit(1)
                .get()
                .get();

        return firstUser(results.getDocuments());
    }

    public Optional<User> findByEmail(String email)
            throws InterruptedException, ExecutionException {

        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        String normalizedEmail = email.trim()
                .toLowerCase(Locale.ROOT);

        var results = firestore.collection("users")
                .whereEqualTo("email", normalizedEmail)
                .limit(1)
                .get()
                .get();

        return firstUser(results.getDocuments());
    }

    public Optional<User> findByFirebaseUid(String firebaseUid)
            throws InterruptedException, ExecutionException {

        if (firebaseUid == null || firebaseUid.isBlank()) {
            return Optional.empty();
        }

        var results = firestore.collection("users")
                .whereEqualTo("firebaseUid", firebaseUid)
                .limit(1)
                .get()
                .get();

        return firstUser(results.getDocuments());
    }

    private Optional<User> firstUser(
            java.util.List<QueryDocumentSnapshot> documents) {

        if (documents.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(
                FirestoreUserMapper.fromDocument(documents.get(0))
        );
    }
}