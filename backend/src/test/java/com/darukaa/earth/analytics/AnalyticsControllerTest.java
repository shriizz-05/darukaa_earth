package com.darukaa.earth.analytics;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.darukaa.earth.auth.JwtService;
import com.darukaa.earth.exception.GlobalExceptionHandler;
import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.security.AppUserDetails;
import com.darukaa.earth.security.JsonAccessDeniedHandler;
import com.darukaa.earth.security.JsonAuthenticationEntryPoint;
import com.darukaa.earth.security.JwtAuthenticationFilter;
import com.darukaa.earth.security.SecurityConfig;
import com.darukaa.earth.user.UserRole;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AnalyticsController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    JsonAuthenticationEntryPoint.class,
    JsonAccessDeniedHandler.class,
    GlobalExceptionHandler.class
})
class AnalyticsControllerTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private JwtService jwtService;

    @MockBean private AnalyticsService analyticsService;

    @MockBean private UserDetailsService userDetailsService;

    @Test
    void listWithoutJwtReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/sites/9/analytics")).andExpect(status().isUnauthorized());
    }

    @Test
    void listWithJwtReturnsSeriesFromService() throws Exception {
        when(analyticsService.listBySite(9L, null, null)).thenReturn(List.of(samplePoint()));
        stubAdmin();

        mockMvc.perform(get("/api/sites/9/analytics").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].siteId").value(9))
                .andExpect(jsonPath("$[0].metricDate").value("2025-10-01"))
                .andExpect(jsonPath("$[0].carbonValue").value(21.4))
                .andExpect(jsonPath("$[0].biodiversityScore").value(61.0))
                .andExpect(jsonPath("$[0].vegetationIndex").value(0.512))
                .andExpect(jsonPath("$[0].performanceScore").value(68.5));
    }

    @Test
    void listUnknownSiteReturnsNotFound() throws Exception {
        when(analyticsService.listBySite(99L, null, null))
                .thenThrow(new ResourceNotFoundException("Site", 99L));
        stubAdmin();

        mockMvc.perform(get("/api/sites/99/analytics").header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void summaryWithoutJwtReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")).andExpect(status().isUnauthorized());
    }

    private void stubAdmin() {
        when(userDetailsService.loadUserByUsername("ada@darukaa.earth"))
                .thenReturn(
                        new AppUserDetails(
                                1L, "ada@darukaa.earth", "hash", "Ada Lovelace", UserRole.ADMIN));
    }

    private String bearer() {
        return "Bearer " + jwtService.createToken(1L, "ada@darukaa.earth", "Ada Lovelace", "ADMIN");
    }

    private static AnalyticsResponse samplePoint() {
        return new AnalyticsResponse(
                4L,
                9L,
                LocalDate.of(2025, 10, 1),
                new BigDecimal("21.40"),
                new BigDecimal("61.0"),
                new BigDecimal("0.512"),
                new BigDecimal("68.5"));
    }
}
