package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AutenticacaoHttpTest {

    private static final String EMAIL = "sessao@example.com";
    private static final String SENHA = "SenhaDeTeste-2026!";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(springSecurity())
            .build();

        repository.deleteAll();
        repository.flush();

        repository.saveAndFlush(new Usuario(
            "Usuario Sessao",
            EMAIL,
            passwordEncoder.encode(SENHA)
        ));
    }

    @Test
    void deveAutenticarConsultarSessaoERealizarLogout() throws Exception {
        TokenSessao inicial = obterCsrf(new MockHttpSession());
        String idAntesDoLogin = inicial.sessao().getId();

        MvcResult login = enviarLogin(inicial, EMAIL, SENHA)
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession sessaoAutenticada =
            (MockHttpSession) login.getRequest().getSession(false);

        assertNotNull(sessaoAutenticada);
        assertNotEquals(idAntesDoLogin, sessaoAutenticada.getId());

        mockMvc.perform(get("/auth/me").session(sessaoAutenticada))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nome").value("Usuario Sessao"))
            .andExpect(jsonPath("$.email").value(EMAIL))
            .andExpect(jsonPath("$.ativo").value(true))
            .andExpect(jsonPath("$.senha").doesNotExist())
            .andExpect(jsonPath("$.senhaHash").doesNotExist())
            .andExpect(jsonPath("$.senha_hash").doesNotExist());

        // O token anterior ao login não deve autorizar o logout.
        mockMvc.perform(post("/auth/logout")
                .session(sessaoAutenticada)
                .header(inicial.headerName(), inicial.token()))
            .andExpect(status().isForbidden());

        TokenSessao atualizado = obterCsrf(sessaoAutenticada);

        mockMvc.perform(post("/auth/logout")
                .session(atualizado.sessao())
                .header(atualizado.headerName(), atualizado.token()))
            .andExpect(status().isNoContent());

        assertTrue(sessaoAutenticada.isInvalid());

        mockMvc.perform(get("/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRejeitarConsultaSemAutenticacao() throws Exception {
        mockMvc.perform(get("/auth/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.erro").value(
                "Autenticação necessária."
            ));
    }

    @Test
    void deveRejeitarLoginSemCsrf() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("email", EMAIL)
                .param("senha", SENHA))
            .andExpect(status().isForbidden());
    }

    @Test
    void deveRejeitarLoginComCsrfInvalido() throws Exception {
        TokenSessao csrf = obterCsrf(new MockHttpSession());

        mockMvc.perform(post("/auth/login")
                .session(csrf.sessao())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .header(csrf.headerName(), "token-invalido")
                .param("email", EMAIL)
                .param("senha", SENHA))
            .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornarMesmoErroParaSenhaErradaEUsuarioInexistente()
            throws Exception {

        for (String email : new String[] {
                EMAIL, "ausente@example.com" }) {

            TokenSessao csrf = obterCsrf(new MockHttpSession());

            enviarLogin(csrf, email, "OutraSenhaDeTeste-2026!")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value(
                    "E-mail ou senha inválidos."
                ));

            mockMvc.perform(get("/auth/me").session(csrf.sessao()))
                .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void deveRejeitarContaInativaSemExporMotivo() throws Exception {
        Usuario usuario = repository.findByEmail(EMAIL).orElseThrow();

        ReflectionTestUtils.setField(usuario, "ativo", false);
        repository.saveAndFlush(usuario);

        TokenSessao csrf = obterCsrf(new MockHttpSession());

        enviarLogin(csrf, EMAIL, SENHA)
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.erro").value(
                "E-mail ou senha inválidos."
            ));
    }

    private ResultActions enviarLogin(
            TokenSessao csrf,
            String email,
            String senha) throws Exception {

        return mockMvc.perform(post("/auth/login")
            .session(csrf.sessao())
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .header(csrf.headerName(), csrf.token())
            .param("email", email)
            .param("senha", senha));
    }

    private TokenSessao obterCsrf(MockHttpSession sessao) throws Exception {
        MvcResult resultado = mockMvc.perform(
                get("/auth/csrf").session(sessao))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.headerName").isNotEmpty())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn();

        AutenticacaoController.CsrfResposta dados = objectMapper.readValue(
            resultado.getResponse().getContentAsString(),
            AutenticacaoController.CsrfResposta.class
        );

        return new TokenSessao(
            (MockHttpSession) resultado.getRequest().getSession(false),
            dados.headerName(),
            dados.token()
        );
    }

    private record TokenSessao(
        MockHttpSession sessao,
        String headerName,
        String token
    ) {
    }
}