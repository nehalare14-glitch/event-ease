package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.service.BookingService;
import com.eventease.service.FirestoreUserLookupService;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class BookingController {

    private final BookingService bookingService;
    private final FirestoreUserLookupService firestoreUserLookup;

    public BookingController(
            BookingService bookingService,
            FirestoreUserLookupService firestoreUserLookup) {
        this.bookingService = bookingService;
        this.firestoreUserLookup = firestoreUserLookup;
    }

    @PostMapping("/bookings/create")
    public String createBooking(
            @RequestParam Long eventId,
            @RequestParam String customerName,
            @RequestParam String customerEmail,
            @RequestParam int numberOfTickets,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        try {
            User user;
            try {
                user = firestoreUserLookup
                        .findByUsername(authentication.getName())
                        .orElseThrow(() ->
                                new IllegalStateException("User not found in Firestore."));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("User lookup interrupted.", e);
            } catch (java.util.concurrent.ExecutionException e) {
                throw new IllegalStateException("Firestore lookup failed.", e);
            }

            if (!user.getEmail().equalsIgnoreCase(customerEmail.trim())) {
                throw new IllegalArgumentException(
                        "Use the email address registered to your account.");
            }

            bookingService.createBooking(
                    eventId,
                    customerName,
                    customerEmail,
                    numberOfTickets
            );

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Your tickets have been booked successfully!"
            );

        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage", e.getMessage()
            );
        }

        return "redirect:/";
    }

    @PostMapping("/bookings/cancel/{id}")
    public String cancelBooking(
            @PathVariable Long id,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        try {
            User user;
            try {
                user = firestoreUserLookup
                        .findByUsername(authentication.getName())
                        .orElseThrow(() ->
                                new IllegalStateException("User not found in Firestore."));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("User lookup interrupted.", e);
            } catch (java.util.concurrent.ExecutionException e) {
                throw new IllegalStateException("Firestore lookup failed.", e);
            }

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            bookingService.cancelBooking(id, user.getEmail(), isAdmin);

            redirectAttributes.addFlashAttribute(
                    "successMessage", "Booking cancelled successfully."
            );

        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage", e.getMessage()
            );
        }

        return "redirect:/bookings";
    }
}
