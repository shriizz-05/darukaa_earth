package com.darukaa.earth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("nodb")
class DarukaaEarthApplicationTests {

    @Test
    void contextLoadsWithoutDatabase() {
        // nodb profile skips JPA/Flyway/auth services. Security still permits /api/health.
    }
}
