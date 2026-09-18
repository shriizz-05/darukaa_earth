package com.darukaa.earth.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

class UserEntityTest {

    @Test
    void toStringDoesNotIncludePasswordHash() {
        User user = new User("ada@darukaa.earth", "super-secret-hash-value", "Ada", UserRole.ADMIN);

        String text = user.toString();

        assertFalse(text.contains("super-secret-hash-value"));
        assertFalse(text.toLowerCase().contains("password"));
        assertEquals("ada@darukaa.earth", user.getEmail());
    }
}
