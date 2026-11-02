package com.eventease.config;

import com.eventease.model.User;
import com.eventease.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    public CommandLineRunner createAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:admin}") String username,
            @Value("${app.admin.email:admin@eventease.com}") String email,
            @Value("${app.admin.password:}") String password) {

        return args -> {
            if (password.isBlank()) {
                System.out.println(
                    "Admin not created: set EVENTEASE_ADMIN_PASSWORD.");
                return;
            }

            if (!userRepository.existsByUsername(username)
                    && !userRepository.existsByEmail(email)) {

                User admin = new User();
                admin.setUsername(username);
                admin.setEmail(email);
                admin.setPassword(passwordEncoder.encode(password));
                admin.setRole("ADMIN");

                userRepository.save(admin);

                System.out.println("EventEase admin account created.");
            }
        };
    }
}
