package com.eventease.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreBookingService {

    private final Firestore firestore;

    public FirestoreBookingService(Firestore firestore) {
        this.firestore = firestore;
    }

    public String createBooking(
            Long eventId,
            String customerName,
            String customerEmail,
            int numberOfTickets) throws Exception {

        if (eventId == null || numberOfTickets <= 0) {
            throw new IllegalArgumentException(
                    "A valid event and ticket quantity are required.");
        }

        if (customerName == null || customerName.isBlank()
                || customerEmail == null || customerEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Customer name and email are required.");
        }

        String email = customerEmail.trim()
                .toLowerCase(Locale.ROOT);

        DocumentReference eventRef = firestore.collection("events")
                .document(eventId.toString());

        String bookingId = UUID.randomUUID().toString();

        DocumentReference bookingRef = firestore.collection("bookings")
                .document(bookingId);

        return firestore.runTransaction(transaction -> {

            DocumentSnapshot event = transaction.get(eventRef).get();

            if (!event.exists()) {
                throw new IllegalArgumentException("Event not found.");
            }

            Long seats = event.getLong("availableSeats");
            Double price = event.getDouble("ticketPrice");

            if (seats == null || price == null) {
                throw new IllegalStateException(
                        "Event seat or price information is missing.");
            }

            if (seats < numberOfTickets) {
                throw new IllegalArgumentException(
                        "Not enough seats available.");
            }

            Map<String, Object> booking = new HashMap<>();
            booking.put("eventId", eventId);
            booking.put("customerName", customerName.trim());
            booking.put("customerEmail", email);
            booking.put("customerEmailNormalized", email);
            booking.put("numberOfTickets", numberOfTickets);
            booking.put("totalAmount", price * numberOfTickets);
            booking.put("bookingDate",
                    com.google.cloud.Timestamp.now());
            booking.put("cancelled", false);

            transaction.update(
                    eventRef,
                    "availableSeats",
                    seats - numberOfTickets
            );

            transaction.create(bookingRef, booking);

            return bookingId;

        }).get();
    }

    public void cancelBooking(
            String bookingId,
            String customerEmail,
            boolean isAdmin) throws Exception {

        if (bookingId == null || bookingId.isBlank()) {
            throw new IllegalArgumentException(
                    "Booking ID is required.");
        }

        if (!isAdmin && (customerEmail == null
                || customerEmail.isBlank())) {
            throw new IllegalArgumentException(
                    "Customer email is required.");
        }

        DocumentReference bookingRef = firestore
                .collection("bookings")
                .document(bookingId);

        firestore.runTransaction(transaction -> {

            DocumentSnapshot booking =
                    transaction.get(bookingRef).get();

            if (!booking.exists()) {
                throw new IllegalArgumentException(
                        "Booking not found.");
            }

            String ownerEmail =
                    booking.getString("customerEmailNormalized");

            if (ownerEmail == null) {
                ownerEmail = booking.getString("customerEmail");
            }

            if (!isAdmin && (ownerEmail == null
                    || !ownerEmail.equalsIgnoreCase(
                            customerEmail.trim()))) {
                throw new IllegalArgumentException(
                        "You cannot cancel this booking.");
            }

            if (Boolean.TRUE.equals(
                    booking.getBoolean("cancelled"))) {
                throw new IllegalArgumentException(
                        "Booking is already cancelled.");
            }

            Object eventId = booking.get("eventId");

            if (eventId == null) {
                throw new IllegalStateException(
                        "Booking has no event ID.");
            }

            DocumentReference eventRef = firestore
                    .collection("events")
                    .document(eventId.toString());

            DocumentSnapshot event =
                    transaction.get(eventRef).get();

            if (!event.exists()) {
                throw new IllegalStateException(
                        "Associated event no longer exists.");
            }

            Long seats = event.getLong("availableSeats");
            Long tickets = booking.getLong("numberOfTickets");

            if (seats == null || tickets == null || tickets <= 0) {
                throw new IllegalStateException(
                        "Invalid seat or ticket information.");
            }

            transaction.update(
                    eventRef,
                    "availableSeats",
                    Math.addExact(seats, tickets)
            );

            transaction.update(
                    bookingRef,
                    "cancelled",
                    true
            );

            return null;

        }).get();
    }
}