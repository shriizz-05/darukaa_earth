package com.darukaa.earth.auth;

import com.darukaa.earth.exception.DuplicateEmailException;
import com.darukaa.earth.user.User;
import com.darukaa.earth.user.UserRepository;
import com.darukaa.earth.user.UserRole;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!nodb")
@ConditionalOnBean(UserRepository.class)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }
        // Hackathon demo: every new account is ADMIN so later project APIs are usable without a
        // promote step.
        User user =
                new User(
                        email,
                        passwordEncoder.encode(request.getPassword()),
                        request.getName().trim(),
                        UserRole.ADMIN);
        return toAuthResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(
                                () -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user =
                userRepository
                        .findByEmail(normalizeEmail(email))
                        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toUserResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token =
                jwtService.createToken(
                        user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
        return new AuthResponse(
                token, "Bearer", jwtService.getExpirationMs(), toUserResponse(user));
    }

    private static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
