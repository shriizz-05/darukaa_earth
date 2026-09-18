package com.darukaa.earth.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.darukaa.earth.exception.DuplicateEmailException;
import com.darukaa.earth.user.User;
import com.darukaa.earth.user.UserRepository;
import com.darukaa.earth.user.UserRole;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;

    @Mock private JwtService jwtService;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(10);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registerHashesPasswordAndAssignsAdmin() {
        when(userRepository.existsByEmail("ada@darukaa.earth")).thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.createToken(any(), any(), any(), any())).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(86_400_000L);

        RegisterRequest request = new RegisterRequest();
        request.setName("Ada Lovelace");
        request.setEmail("  Ada@Darukaa.Earth ");
        request.setPassword("password1");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("ada@darukaa.earth", saved.getEmail());
        assertEquals(UserRole.ADMIN, saved.getRole());
        assertTrue(passwordEncoder.matches("password1", saved.getPasswordHash()));
        assertFalse(saved.toString().contains("password1"));
        assertEquals("jwt-token", response.getToken());
        assertEquals("ADMIN", response.getUser().getRole());
    }

    @Test
    void registerDuplicateEmailThrowsConflict() {
        when(userRepository.existsByEmail("ada@darukaa.earth")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setName("Ada");
        request.setEmail("ada@darukaa.earth");
        request.setPassword("password1");

        assertThrows(DuplicateEmailException.class, () -> authService.register(request));
    }

    @Test
    void loginRejectsWrongPassword() {
        User user =
                new User(
                        "ada@darukaa.earth",
                        passwordEncoder.encode("password1"),
                        "Ada",
                        UserRole.ADMIN);
        when(userRepository.findByEmail("ada@darukaa.earth")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("ada@darukaa.earth");
        request.setPassword("wrongpass");

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void loginAcceptsMatchingPassword() {
        User user =
                new User(
                        "ada@darukaa.earth",
                        passwordEncoder.encode("password1"),
                        "Ada",
                        UserRole.ADMIN);
        when(userRepository.findByEmail("ada@darukaa.earth")).thenReturn(Optional.of(user));
        when(jwtService.createToken(any(), any(), any(), any())).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(86_400_000L);

        LoginRequest request = new LoginRequest();
        request.setEmail("ada@darukaa.earth");
        request.setPassword("password1");

        AuthResponse response = authService.login(request);
        assertEquals("jwt-token", response.getToken());
        assertEquals("ada@darukaa.earth", response.getUser().getEmail());
    }
}
