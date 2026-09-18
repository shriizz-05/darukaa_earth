package com.darukaa.earth.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.darukaa.earth.exception.DuplicateEmailException;
import com.darukaa.earth.exception.GlobalExceptionHandler;
import com.darukaa.earth.health.HealthController;
import com.darukaa.earth.security.AppUserDetails;
import com.darukaa.earth.security.JsonAccessDeniedHandler;
import com.darukaa.earth.security.JsonAuthenticationEntryPoint;
import com.darukaa.earth.security.JwtAuthenticationFilter;
import com.darukaa.earth.security.SecurityConfig;
import com.darukaa.earth.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {AuthController.class, HealthController.class})
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    JsonAuthenticationEntryPoint.class,
    JsonAccessDeniedHandler.class,
    GlobalExceptionHandler.class
})
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private JwtService jwtService;

    @MockBean private AuthService authService;

    @MockBean private UserDetailsService userDetailsService;

    @Test
    void registerReturnsCreatedTokenWithoutPassword() throws Exception {
        when(authService.register(any())).thenReturn(sampleAuth());

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"name":"Ada Lovelace","email":"ada@darukaa.earth","password":"password1"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("test-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("ada@darukaa.earth"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void registerDuplicateEmailReturnsConflict() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateEmailException());

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"name":"Ada Lovelace","email":"ada@darukaa.earth","password":"password1"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void loginReturnsToken() throws Exception {
        when(authService.login(any())).thenReturn(sampleAuth());

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"email":"ada@darukaa.earth","password":"password1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-token"))
                .andExpect(jsonPath("$.user.email").value("ada@darukaa.earth"));
    }

    @Test
    void loginBadPasswordReturnsUnauthorized() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("bad"));

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"email":"ada@darukaa.earth","password":"wrongpass"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void healthRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void meWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void meWithInvalidTokenReturnsUnauthorizedJson() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication is required"))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void meWithValidTokenReturnsCurrentUser() throws Exception {
        String token = jwtService.createToken(1L, "ada@darukaa.earth", "Ada Lovelace", "ADMIN");
        when(userDetailsService.loadUserByUsername("ada@darukaa.earth"))
                .thenReturn(
                        new AppUserDetails(
                                1L, "ada@darukaa.earth", "hash", "Ada Lovelace", UserRole.ADMIN));
        when(authService.getCurrentUser("ada@darukaa.earth"))
                .thenReturn(new UserResponse(1L, "Ada Lovelace", "ada@darukaa.earth", "ADMIN"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@darukaa.earth"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    private static AuthResponse sampleAuth() {
        return new AuthResponse(
                "test-token",
                "Bearer",
                86_400_000L,
                new UserResponse(1L, "Ada Lovelace", "ada@darukaa.earth", "ADMIN"));
    }
}
