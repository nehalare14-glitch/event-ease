package com.eventease.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class FirestoreUserRepository {

    private final Firestore firestore;

    public FirestoreUserRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Optional<Map<String, Object>> findByUsername(String username)
            throws InterruptedException, ExecutionException {

        var results = firestore.collection("users")
                .whereEqualTo("username", username)
                .limit(1)
                .get()
                .get();

        if (results.isEmpty()) {
            return Optional.empty();
        }

        QueryDocumentSnapshot document = results.getDocuments().get(0);

        return Optional.of(document.getData());
    }

    public Optional<Map<String, Object>> findByFirebaseUid(String uid)
            throws InterruptedException, ExecutionException {

        var results = firestore.collection("users")
                .whereEqualTo("firebaseUid", uid)
                .limit(1)
                .get()
                .get();

        if (results.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(results.getDocuments().get(0).getData());
    }

    public void save(String documentId, Map<String, Object> userData)
            throws InterruptedException, ExecutionException {

        firestore.collection("users")
                .document(documentId)
                .set(userData, SetOptions.merge())
                .get();
    }
}