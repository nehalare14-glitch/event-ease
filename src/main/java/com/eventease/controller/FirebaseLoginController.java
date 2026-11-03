package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.repository.UserRepository;
import com.eventease.service.CustomUserDetailsService;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Controller
public class FirebaseLoginController {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final FirebaseAuth firebaseAuth;

    private final SecurityContextRepository contextRepository =
            new HttpSessionSecurityContextRepository();

    public FirebaseLoginController(
            UserRepository userRepository,
            CustomUserDetailsService userDetailsService,
            FirebaseApp firebaseApp) {

        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.firebaseAuth = FirebaseAuth.getInstance(firebaseApp);
    }

    @PostMapping("/auth/firebase/google")
    @ResponseBody
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response) {

        String idToken = body.get("idToken");

        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing Firebase ID token"));
        }

        try {
            FirebaseToken token =
                    firebaseAuth.verifyIdToken(idToken, true);

            String uid = token.getUid();
            String email = token.getEmail();

            if (email == null || email.isBlank()
                    || !token.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Verified email required"));
            }

            Object firebaseClaim =
                    token.getClaims().get("firebase");

            if (!(firebaseClaim instanceof Map<?, ?> claims)
                    || !"google.com".equals(
                            claims.get("sign_in_provider"))) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Google login required"));
            }

            User user = userRepository.findByFirebaseUid(uid)
                    .orElse(null);

            if (user == null) {

                if (userRepository.existsByEmail(email)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of(
                                    "error",
                                    "An EventEase account already uses this email. " +
                                    "Please sign in with your existing account."
                            ));
                }

                user = new User();

                user.setFirebaseUid(uid);
                user.setEmail(email);
                user.setUsername("google_" + uid);
                user.setPassword(UUID.randomUUID().toString());
                user.setRole("USER");

                user = userRepository.saveAndFlush(user);
            }

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(
                            user.getUsername()
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            request.changeSessionId();

            contextRepository.saveContext(
                    context,
                    request,
                    response
            );

            return ResponseEntity.ok(
                    Map.of("redirect", "/")
            );

        } catch (FirebaseAuthException ex) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid Firebase token"));
        }
    }
}