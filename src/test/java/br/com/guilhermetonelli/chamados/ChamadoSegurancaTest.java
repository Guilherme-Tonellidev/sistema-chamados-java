package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChamadoSegurancaTest {

    private static final String CADASTRO = """
        {
            "titulo": "Teste de acesso",
            "descricao": "Chamado para verificar a seguranca.",
            "prioridade": "Normal"
        }
        """;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ChamadoRepository repository;

    @Autowired
    private ChamadoService service;

    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        repository.deleteAll();
        repository.flush();

        // Sem usuário ou CSRF padrão: cada cenário informa o necessário.
        mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(springSecurity())
            .build();
    }

    @Test
    void deveExigirAutenticacaoNasConsultas() throws Exception {
        for (String caminho : new String[] {
                "/chamados",
                "/chamados/paginados",
                "/chamados/1"}) {

            mockMvc.perform(get(caminho))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value(
                    "Autenticação necessária."
                ));
        }
    }

    @Test
    void deveRejeitarEscritaAnonimaMesmoComCsrf() throws Exception {
        mockMvc.perform(post("/chamados")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isUnauthorized());

        for (String acao : new String[] {"atendimento", "resolucao"}) {
            mockMvc.perform(patch("/chamados/1/" + acao)
                    .with(csrf()))
                .andExpect(status().isUnauthorized());
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarEscritaAutenticadaSemCsrf() throws Exception {
        mockMvc.perform(post("/chamados")
                .with(user("teste@example.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isForbidden());

        for (String acao : new String[] {"atendimento", "resolucao"}) {
            mockMvc.perform(patch("/chamados/1/" + acao)
                    .with(user("teste@example.com")))
                .andExpect(status().isForbidden());
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void devePermitirCadastroAutenticadoComCsrf() throws Exception {
        mockMvc.perform(post("/chamados")
                .with(user("teste@example.com"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("Aberto"));

        assertEquals(1L, repository.count());

        mockMvc.perform(get("/chamados")
                .with(user("teste@example.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void devePermitirTransicoesAutenticadasComCsrf() throws Exception {
        Integer id = service.abrirChamado(
            "Chamado de seguranca",
            "Verifica as transicoes autenticadas.",
            "Normal"
        ).getId();

        mockMvc.perform(patch("/chamados/" + id + "/atendimento")
                .with(user("teste@example.com"))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Em atendimento"));

        mockMvc.perform(patch("/chamados/" + id + "/resolucao")
                .with(user("teste@example.com"))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));

        assertEquals(
            "Resolvido",
            service.buscarChamadoPorId(id).getStatus()
        );
    }
}