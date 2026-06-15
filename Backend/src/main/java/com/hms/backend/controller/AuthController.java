package com.hms.backend.controller;

import com.hms.backend.model.User;
import com.hms.backend.repository.UserRepository;
import com.hms.backend.security.JwtTokenProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")

public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Email Address already in use!");
        }

        User user = new User(
                null,
                signUpRequest.getUsername(),
                passwordEncoder.encode(signUpRequest.getPassword()),
                signUpRequest.getEmail(),
                User.Role.valueOf(signUpRequest.getRole().toUpperCase()),
                signUpRequest.getLinkedEntityId()
        );

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());
        if (userOpt.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        User user = userOpt.get();
        String jwt = tokenProvider.generateToken(user.getUsername(), user.getRole().name(), user.getLinkedEntityId());

        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, "Bearer", user.getUsername(), user.getRole().name(), user.getLinkedEntityId()));
    }

    public static class SignUpRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String role;
        private String linkedEntityId;

        public SignUpRequest() {}
        public SignUpRequest(String username, String email, String password, String role, String linkedEntityId) {
            this.username = username;
            this.email = email;
            this.password = password;
            this.role = role;
            this.linkedEntityId = linkedEntityId;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getLinkedEntityId() { return linkedEntityId; }
        public void setLinkedEntityId(String linkedEntityId) { this.linkedEntityId = linkedEntityId; }
    }

    public static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;

        public LoginRequest() {}
        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class JwtAuthenticationResponse {
        private String accessToken;
        private String tokenType = "Bearer";
        private String username;
        private String role;
        private String linkedEntityId;

        public JwtAuthenticationResponse() {}
        public JwtAuthenticationResponse(String accessToken, String tokenType, String username, String role, String linkedEntityId) {
            this.accessToken = accessToken;
            this.tokenType = tokenType;
            this.username = username;
            this.role = role;
            this.linkedEntityId = linkedEntityId;
        }

        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getLinkedEntityId() { return linkedEntityId; }
        public void setLinkedEntityId(String linkedEntityId) { this.linkedEntityId = linkedEntityId; }
    }
}
