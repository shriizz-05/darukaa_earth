package com.darukaa.earth.site;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.darukaa.earth.auth.JwtService;
import com.darukaa.earth.exception.GlobalExceptionHandler;
import com.darukaa.earth.exception.InvalidPolygonException;
import com.darukaa.earth.exception.ResourceNotFoundException;
import com.darukaa.earth.security.AppUserDetails;
import com.darukaa.earth.security.JsonAccessDeniedHandler;
import com.darukaa.earth.security.JsonAuthenticationEntryPoint;
import com.darukaa.earth.security.JwtAuthenticationFilter;
import com.darukaa.earth.security.SecurityConfig;
import com.darukaa.earth.user.UserRole;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = SiteController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    JsonAuthenticationEntryPoint.class,
    JsonAccessDeniedHandler.class,
    GlobalExceptionHandler.class
})
class SiteControllerTest {

    private static final String VALID_BODY =
            """
            {
              "name": "Nilgiri plot A",
              "description": "Montane shola fragment",
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[77.0,11.0],[77.2,11.0],[77.2,11.2],[77.0,11.2],[77.0,11.0]]]
              }
            }
            """;

    @Autowired private MockMvc mockMvc;

    @Autowired private JwtService jwtService;

    @MockBean private SiteService siteService;

    @MockBean private UserDetailsService userDetailsService;

    @Test
    void createWithoutJwtReturnsUnauthorized() throws Exception {
        mockMvc.perform(
                        post("/api/projects/1/sites")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(VALID_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createValidGeoJsonReturnsCreated() throws Exception {
        when(siteService.create(eq(1L), any())).thenReturn(sampleSite());
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects/1/sites")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/sites/9"))
                .andExpect(jsonPath("$.id").value(9))
                .andExpect(jsonPath("$.name").value("Nilgiri plot A"))
                .andExpect(jsonPath("$.geometry.type").value("Polygon"));
    }

    @Test
    void createTwoPointPolygonReturnsBadRequest() throws Exception {
        when(siteService.create(eq(1L), any()))
                .thenThrow(
                        new InvalidPolygonException(
                                "Polygon ring must have at least 4 positions including the closing vertex"));
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects/1/sites")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"name":"Bad","geometry":{"type":"Polygon","coordinates":[[[0,0],[1,1]]]}}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createUnclosedPolygonReturnsBadRequest() throws Exception {
        when(siteService.create(eq(1L), any()))
                .thenThrow(
                        new InvalidPolygonException(
                                "Polygon ring must be closed (first position equals last)"));
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects/1/sites")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"name":"Bad","geometry":{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1]]]}}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createPointGeometryReturnsBadRequest() throws Exception {
        when(siteService.create(eq(1L), any()))
                .thenThrow(
                        new InvalidPolygonException(
                                "Only GeoJSON Polygon is supported, not Point"));
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects/1/sites")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"name":"Bad","geometry":{"type":"Point","coordinates":[77.0,11.0]}}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getUnknownSiteReturnsNotFound() throws Exception {
        when(siteService.getById(99L)).thenThrow(new ResourceNotFoundException("Site", 99L));
        stubAdmin();

        mockMvc.perform(get("/api/sites/99").header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteReturnsNoContent() throws Exception {
        doNothing().when(siteService).delete(9L);
        stubAdmin();

        mockMvc.perform(delete("/api/sites/9").header("Authorization", bearer()))
                .andExpect(status().isNoContent());
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

    private static SiteResponse sampleSite() {
        GeoJsonPolygon geometry =
                new GeoJsonPolygon(
                        List.of(
                                List.of(
                                        List.of(77.0, 11.0),
                                        List.of(77.2, 11.0),
                                        List.of(77.2, 11.2),
                                        List.of(77.0, 11.2),
                                        List.of(77.0, 11.0))));
        return new SiteResponse(
                9L,
                1L,
                "Nilgiri plot A",
                "Montane shola fragment",
                geometry,
                BigDecimal.valueOf(11.1),
                BigDecimal.valueOf(77.1),
                BigDecimal.valueOf(1.2),
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z"));
    }
}
