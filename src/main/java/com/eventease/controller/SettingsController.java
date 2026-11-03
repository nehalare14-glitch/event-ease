package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.repository.UserRepository;
import com.eventease.service.FirestoreUserLookupService;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class SettingsController {

    private final UserRepository userRepository;
    private final FirestoreUserLookupService firestoreUserLookup;
    private final PasswordEncoder passwordEncoder;

    public SettingsController(
            UserRepository userRepository,
            FirestoreUserLookupService firestoreUserLookup,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.firestoreUserLookup = firestoreUserLookup;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/settings")
    public String settings(Authentication authentication, Model model) {

        User user;

        try {
            user = firestoreUserLookup
                    .findByUsername(authentication.getName())
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "User not found in Firestore."));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "User lookup interrupted.", e);
        } catch (java.util.concurrent.ExecutionException e) {
            throw new IllegalStateException(
                    "Firestore user lookup failed.", e);
        }

        model.addAttribute("user", user);
        return "settings";
    }

    @PostMapping("/settings/password")
    public String changePassword(
            Authentication authentication,
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            RedirectAttributes redirectAttributes) {

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException("User not found."));

        if (!passwordEncoder.matches(
                currentPassword, user.getPassword())) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage", "Current password is incorrect.");
            return "redirect:/settings";
        }

        if (newPassword.length() < 8) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    "New password must contain at least 8 characters.");
            return "redirect:/settings";
        }

        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage", "New passwords do not match.");
            return "redirect:/settings";
        }

        if (passwordEncoder.matches(
                newPassword, user.getPassword())) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    "Choose a password different from your current password.");
            return "redirect:/settings";
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        redirectAttributes.addFlashAttribute(
                "successMessage", "Password changed successfully.");

        return "redirect:/settings";
    }
}
