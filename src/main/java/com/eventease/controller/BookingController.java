package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.repository.UserRepository;
import com.eventease.service.BookingService;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(
            BookingService bookingService,
            UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
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
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() ->
                            new IllegalStateException("User not found."));

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
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() ->
                            new IllegalStateException("User not found."));

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
