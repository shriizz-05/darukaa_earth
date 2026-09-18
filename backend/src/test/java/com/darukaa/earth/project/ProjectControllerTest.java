package com.darukaa.earth.project;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ProjectController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    JsonAuthenticationEntryPoint.class,
    JsonAccessDeniedHandler.class,
    GlobalExceptionHandler.class
})
class ProjectControllerTest {

    private static final String BODY =
            """
            {
              "name": "Western Ghats Reforestation",
              "description": "Forest restoration and biodiversity monitoring project",
              "projectType": "BIODIVERSITY",
              "status": "ACTIVE",
              "startDate": "2026-01-01",
              "endDate": "2030-01-01"
            }
            """;

    @Autowired private MockMvc mockMvc;

    @Autowired private JwtService jwtService;

    @MockBean private ProjectService projectService;

    @MockBean private UserDetailsService userDetailsService;

    @Test
    void createWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createWithJwtReturnsCreated() throws Exception {
        when(projectService.create(any())).thenReturn(sampleProject());
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/projects/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Western Ghats Reforestation"))
                .andExpect(jsonPath("$.projectType").value("BIODIVERSITY"))
                .andExpect(jsonPath("$.siteCount").value(0));
    }

    @Test
    void listWithJwtReturnsOk() throws Exception {
        when(projectService.list(eq(ProjectStatus.ACTIVE), eq(ProjectType.BIODIVERSITY), eq(null)))
                .thenReturn(List.of(sampleProject()));
        stubAdmin();

        mockMvc.perform(
                        get("/api/projects")
                                .param("status", "ACTIVE")
                                .param("projectType", "BIODIVERSITY")
                                .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void createBlankNameReturnsFieldErrors() throws Exception {
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "name": "",
                                  "projectType": "BIODIVERSITY",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void createUnknownProjectTypeReturnsBadRequest() throws Exception {
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "name": "Western Ghats Reforestation",
                                  "projectType": "NOT_A_REAL_TYPE",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(
                        jsonPath("$.message")
                                .value("Request body is invalid or uses an unknown value"));
    }

    @Test
    void createMalformedJsonReturnsBadRequest() throws Exception {
        stubAdmin();

        mockMvc.perform(
                        post("/api/projects")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(
                        jsonPath("$.message")
                                .value("Request body is invalid or uses an unknown value"));
    }

    @Test
    void getUnknownIdReturnsNotFound() throws Exception {
        when(projectService.getById(99L)).thenThrow(new ResourceNotFoundException("Project", 99L));
        stubAdmin();

        mockMvc.perform(get("/api/projects/99").header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateWithJwtReturnsOk() throws Exception {
        when(projectService.update(eq(1L), any())).thenReturn(sampleProject());
        stubAdmin();

        mockMvc.perform(
                        put("/api/projects/1")
                                .header("Authorization", bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void deleteWithJwtReturnsNoContent() throws Exception {
        doNothing().when(projectService).delete(1L);
        stubAdmin();

        mockMvc.perform(delete("/api/projects/1").header("Authorization", bearer()))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteUnknownIdReturnsNotFound() throws Exception {
        doThrow(new ResourceNotFoundException("Project", 99L)).when(projectService).delete(99L);
        stubAdmin();

        mockMvc.perform(delete("/api/projects/99").header("Authorization", bearer()))
                .andExpect(status().isNotFound());
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

    private static ProjectResponse sampleProject() {
        return new ProjectResponse(
                1L,
                "Western Ghats Reforestation",
                "Forest restoration and biodiversity monitoring project",
                ProjectType.BIODIVERSITY,
                ProjectStatus.ACTIVE,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2030, 1, 1),
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z"),
                0L);
    }
}
