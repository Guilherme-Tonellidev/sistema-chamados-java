package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@Transactional
class ChamadoSegurancaTest extends BaseIntegracaoTest {

    private static final String CADASTRO = """
        {
            "titulo": "Teste de acesso",
            "descricao": "Chamado para verificar a seguranca.",
            "prioridade": "Normal"
        }
        """;

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvcSeguranca;

    @BeforeEach
    void prepararCenariosDeSeguranca() {
        // A classe base criou o atendente no banco.
        // Aqui removemos a autenticação para testar cada cenário.
        TestSecurityContextHolder.clearContext();

        // Sem usuário ou CSRF padrão.
        mockMvcSeguranca = MockMvcBuilders
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

            mockMvcSeguranca.perform(get(caminho))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value(
                    "Autenticação necessária."
                ));
        }
    }

    @Test
    void deveRejeitarEscritaAnonimaMesmoComCsrf() throws Exception {
        mockMvcSeguranca.perform(post("/chamados")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isUnauthorized());

        for (String acao : new String[] {"atendimento", "resolucao"}) {
            mockMvcSeguranca.perform(
                    patch("/chamados/1/" + acao)
                        .with(csrf())
                )
                .andExpect(status().isUnauthorized());
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarEscritaAutenticadaSemCsrf() throws Exception {
        mockMvcSeguranca.perform(post("/chamados")
                .with(user(usuarioTeste.getEmail()).roles("ATENDENTE"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isForbidden());

        for (String acao : new String[] {"atendimento", "resolucao"}) {
            mockMvcSeguranca.perform(
                    patch("/chamados/1/" + acao)
                        .with(
                            user(usuarioTeste.getEmail())
                                .roles("ATENDENTE")
                        )
                )
                .andExpect(status().isForbidden());
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void devePermitirCadastroAutenticadoComCsrf() throws Exception {
        Usuario solicitante = criarSolicitante();

        mockMvcSeguranca.perform(post("/chamados")
                .with(user(solicitante.getEmail()).roles("SOLICITANTE"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CADASTRO))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("Aberto"))
            .andExpect(
                jsonPath("$.solicitanteId").value(solicitante.getId())
            );

        assertEquals(1L, repository.count());
        assertEquals(
            solicitante.getId(),
            repository.findAll().getFirst().getSolicitanteId()
        );

        mockMvcSeguranca.perform(get("/chamados")
                .with(user(solicitante.getEmail()).roles("SOLICITANTE")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void devePermitirTransicoesAutenticadasComCsrf() throws Exception {
        Usuario solicitante = criarSolicitante();

        Chamado chamado = repository.saveAndFlush(
            new Chamado(
                "Chamado de seguranca",
                "Verifica atendimento de um chamado de outro usuario.",
                "Normal",
                solicitante.getId()
            )
        );

        Integer id = chamado.getId();

        mockMvcSeguranca.perform(
                patch("/chamados/" + id + "/atendimento")
                    .with(
                        user(usuarioTeste.getEmail()).roles("ATENDENTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Em atendimento"));

        mockMvcSeguranca.perform(
                patch("/chamados/" + id + "/resolucao")
                    .with(
                        user(usuarioTeste.getEmail()).roles("ATENDENTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));

        Chamado salvo = repository.findById(id).orElseThrow();

        assertEquals("Resolvido", salvo.getStatus());
        assertEquals(solicitante.getId(), salvo.getSolicitanteId());
    }

    @Test
    void solicitanteNaoDeveIniciarAtendimentoMesmoComCsrf()
            throws Exception {

        Usuario solicitante = criarSolicitante();

        Chamado chamado = repository.saveAndFlush(
            new Chamado(
                "Chamado do solicitante",
                "Solicitante nao pode iniciar atendimento.",
                "Normal",
                solicitante.getId()
            )
        );

        mockMvcSeguranca.perform(
                patch("/chamados/" + chamado.getId() + "/atendimento")
                    .with(
                        user(solicitante.getEmail()).roles("SOLICITANTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isForbidden());

        Chamado salvo = repository.findById(chamado.getId())
            .orElseThrow();

        assertEquals("Aberto", salvo.getStatus());
        assertNull(salvo.getDataInicioAtendimento());
    }

    @Test
    void solicitanteNaoDeveResolverChamadoMesmoComCsrf()
            throws Exception {

        Usuario solicitante = criarSolicitante();

        Chamado chamado = new Chamado(
            "Chamado em atendimento",
            "Solicitante nao pode resolver o chamado.",
            "Normal",
            solicitante.getId()
        );

        // Prepara o estado inicial do cenário diretamente na entidade.
        chamado.iniciarAtendimento();
        repository.saveAndFlush(chamado);

        mockMvcSeguranca.perform(
                patch("/chamados/" + chamado.getId() + "/resolucao")
                    .with(
                        user(solicitante.getEmail()).roles("SOLICITANTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isForbidden());

        Chamado salvo = repository.findById(chamado.getId())
            .orElseThrow();

        assertEquals("Em atendimento", salvo.getStatus());
        assertNull(salvo.getDataResolucao());
    }
}