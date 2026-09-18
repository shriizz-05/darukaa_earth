package com.darukaa.earth.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void createAndParseToken() {
        JwtService jwtService = new JwtService("unit-test-secret", 86_400_000L, false);

        String token = jwtService.createToken(42L, "ada@darukaa.earth", "Ada Lovelace", "ADMIN");

        assertEquals("ada@darukaa.earth", jwtService.extractEmail(token));
        assertEquals(42L, jwtService.extractUserId(token));
        assertEquals("ADMIN", jwtService.parseClaims(token).get("role", String.class));
        assertEquals("Ada Lovelace", jwtService.parseClaims(token).get("name", String.class));
        assertTrue(jwtService.isValid(token));
        assertFalse(token.contains("password"));
    }

    @Test
    void expiredTokenIsInvalid() throws InterruptedException {
        JwtService jwtService = new JwtService("unit-test-secret", 1L, false);
        String token = jwtService.createToken(1L, "ada@darukaa.earth", "Ada", "ADMIN");
        Thread.sleep(20);
        assertFalse(jwtService.isValid(token));
    }

    @Test
    void rejectsDefaultSecretWhenFailFastEnabled() {
        assertThrows(
                IllegalStateException.class,
                () -> new JwtService(JwtService.DEFAULT_SECRET, 1000L, true));
    }

    @Test
    void allowsDefaultSecretForLocalDevelopment() {
        JwtService jwtService = new JwtService(JwtService.DEFAULT_SECRET, 1000L, false);
        assertTrue(
                jwtService.isValid(
                        jwtService.createToken(1L, "local@darukaa.earth", "Local", "ADMIN")));
    }
}
