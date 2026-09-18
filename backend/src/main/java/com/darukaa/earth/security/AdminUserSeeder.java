package com.darukaa.earth.security;

import com.darukaa.earth.user.User;
import com.darukaa.earth.user.UserRepository;
import com.darukaa.earth.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DEV convenience only. Creates admin@darukaa.earth if missing. Disable with APP_ADMIN_SEED=false.
 * Change APP_ADMIN_PASSWORD before any shared deploy.
 */
@Component
@Profile("!nodb")
@ConditionalOnBean(UserRepository.class)
@ConditionalOnProperty(
        prefix = "app.admin",
        name = "seed",
        havingValue = "true",
        matchIfMissing = true)
public class AdminUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;

    public AdminUserSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:admin@darukaa.earth}") String email,
            @Value("${app.admin.password:ChangeMe_Admin_123!}") String password,
            @Value("${app.admin.name:Darukaa Admin}") String name) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.name = name;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        userRepository.save(
                new User(email, passwordEncoder.encode(password), name, UserRole.ADMIN));
        log.warn(
                "Seeded DEV admin user {}. Change APP_ADMIN_PASSWORD before sharing this environment.",
                email);
    }
}
