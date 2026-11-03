package com.eventease.repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Repository
public class FirestoreBookingRepository {

    private final Firestore firestore;

    public FirestoreBookingRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Map<String, Object>> findAll()
            throws InterruptedException, ExecutionException {

        List<Map<String, Object>> bookings = new ArrayList<>();

        for (QueryDocumentSnapshot doc : firestore
                .collection("bookings")
                .get()
                .get()
                .getDocuments()) {

            Map<String, Object> booking = new HashMap<>(doc.getData());
            booking.put("id", doc.getId());
            bookings.add(booking);
        }

        return bookings;
    }

    public List<Map<String, Object>> findByCustomerEmail(String email)
            throws InterruptedException, ExecutionException {

        List<Map<String, Object>> bookings = new ArrayList<>();

        for (QueryDocumentSnapshot doc : firestore
                .collection("bookings")
                .whereEqualTo("customerEmailNormalized",
                        email.trim().toLowerCase(java.util.Locale.ROOT))
                .get()
                .get()
                .getDocuments()) {

            Map<String, Object> booking = new HashMap<>(doc.getData());
            booking.put("id", doc.getId());
            bookings.add(booking);
        }

        return bookings;
    }

    public long count()
            throws InterruptedException, ExecutionException {

        return firestore.collection("bookings")
                .get()
                .get()
                .size();
    }

    public double getTotalRevenue()
            throws InterruptedException, ExecutionException {

        double total = 0;

        for (Map<String, Object> booking : findAll()) {
            if (!Boolean.TRUE.equals(booking.get("cancelled"))) {
                Object amount = booking.get("totalAmount");

                if (amount instanceof Number number) {
                    total += number.doubleValue();
                }
            }
        }

        return total;
    }

    public long getTotalTicketsSold()
            throws InterruptedException, ExecutionException {

        long total = 0;

        for (Map<String, Object> booking : findAll()) {
            if (!Boolean.TRUE.equals(booking.get("cancelled"))) {
                Object tickets = booking.get("numberOfTickets");

                if (tickets instanceof Number number) {
                    total += number.longValue();
                }
            }
        }

        return total;
    }
}