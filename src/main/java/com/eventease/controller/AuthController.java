package com.eventease.controller;

import com.eventease.model.User;
import com.eventease.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @PostMapping("/register")
    public String createAccount(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            Model model) {

        username = username.trim();
        email = email.trim().toLowerCase();

        if (username.length() < 3 || username.length() > 50) {
            model.addAttribute("errorMessage",
                    "Username must contain 3 to 50 characters.");
            return "register";
        }

        if (password.length() < 8) {
            model.addAttribute("errorMessage",
                    "Password must contain at least 8 characters.");
            return "register";
        }

        if (userRepository.existsByUsername(username)
                || userRepository.existsByEmail(email)) {
            model.addAttribute("errorMessage",
                    "Username or email already registered.");
            return "register";
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("CUSTOMER");

        userRepository.save(user);

        return "redirect:/login?registered";
    }
}
