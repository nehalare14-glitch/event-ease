package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.service.FirestoreUserLookupService;
import com.eventease.service.GoogleProfileService;

import org.springframework.security.core.Authentication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Locale;

@ControllerAdvice
public class ProfileModelAdvice {

    private final FirestoreUserLookupService userLookup;
    private final GoogleProfileService googleProfileService;

    public ProfileModelAdvice(
            FirestoreUserLookupService userLookup,
            GoogleProfileService googleProfileService) {
        this.userLookup = userLookup;
        this.googleProfileService = googleProfileService;
    }

    @ModelAttribute
    public void addProfile(Model model, Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return;
        }

        String username = authentication.getName();
        String displayName = username;

        try {
            User user = userLookup.findByUsername(username).orElse(null);

            if (user != null) {
                displayName = googleProfileService.getDisplayName(
                        user.getFirebaseUid(), username);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            // Fall back to the authenticated username.
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = "User";
        }

        displayName = displayName.trim();

        String initial = displayName.substring(
                0, displayName.offsetByCodePoints(0, 1))
                .toUpperCase(Locale.ROOT);

        model.addAttribute("profileDisplayName", displayName);
        model.addAttribute("profileInitial", initial);
    }
}