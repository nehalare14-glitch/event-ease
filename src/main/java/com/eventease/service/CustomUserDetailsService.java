package com.eventease.service;

import com.eventease.model.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final FirestoreUserLookupService firestoreUserLookupService;

    public CustomUserDetailsService(
            FirestoreUserLookupService firestoreUserLookupService) {
        this.firestoreUserLookupService = firestoreUserLookupService;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user;

        try {
            user = firestoreUserLookupService.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found: " + username));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AuthenticationServiceException(
                    "Firestore lookup interrupted", e);

        } catch (ExecutionException e) {
            throw new AuthenticationServiceException(
                    "Firestore lookup failed", e);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(
                        "ROLE_" + user.getRole()))
        );
    }
}