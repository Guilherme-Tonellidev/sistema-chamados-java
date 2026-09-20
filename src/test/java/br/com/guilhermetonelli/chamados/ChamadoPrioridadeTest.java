package br.com.guilhermetonelli.chamados;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChamadoPrioridadeTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ChamadoService service;

    @PersistenceContext
    private EntityManager entityManager;

    private MockMvc mockMvc;

    @BeforeEach
    void configurarMockMvc() {
        mockMvc = MockMvcBuilders
    .webAppContextSetup(context)
    .defaultRequest(get("/")
        .with(user("teste@example.com"))
        .with(csrf()))
    .apply(springSecurity())
    .build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Baixa", "Normal", "Alta"})
    void deveCadastrarComPrioridadeInformada(String prioridade)
            throws Exception {

        String json = """
            {
                "titulo": "Teste de prioridade",
                "descricao": "Chamado com prioridade informada.",
                "prioridade": "%s"
            }
            """.formatted(prioridade);

        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.prioridade").value(prioridade))
            .andExpect(jsonPath("$.status").value("Aberto"));
    }

    @Test
    void deveUsarNormalQuandoPrioridadeNaoForInformada()
            throws Exception {

        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "titulo": "Cadastro compativel",
                        "descricao": "Requisicao sem prioridade."
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.prioridade").value("Normal"));
    }

    @Test
    void deveNormalizarPrioridade() throws Exception {
        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "titulo": "Normalizacao",
                        "descricao": "Aceitar espacos e diferenca de letras.",
                        "prioridade": "  aLtA  "
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.prioridade").value("Alta"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "Urgente"})
    void deveRejeitarPrioridadeInvalida(String prioridade)
            throws Exception {

        String json = """
            {
                "titulo": "Prioridade invalida",
                "descricao": "Requisicao que deve ser rejeitada.",
                "prioridade": "%s"
            }
            """.formatted(prioridade);

        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value(
                "Prioridade inválida. Use: Baixa, Normal ou Alta."
            ))
            .andExpect(jsonPath("$.caminho").value("/chamados"));
    }

    @Test
    void devePersistirPrioridadeEManterAoAlterarStatus() {
        Chamado criado = service.abrirChamado(
            "Prioridade persistida",
            "Preservar prioridade durante o atendimento.",
            "Alta"
        );

        Integer id = criado.getId();

        Chamado aberto = recarregar(id);
        assertEquals("Alta", aberto.getPrioridade());

        service.iniciarAtendimento(id);

        Chamado emAtendimento = recarregar(id);
        assertEquals("Em atendimento", emAtendimento.getStatus());
        assertEquals("Alta", emAtendimento.getPrioridade());

        service.resolverChamado(id);

        Chamado resolvido = recarregar(id);
        assertEquals("Resolvido", resolvido.getStatus());
        assertEquals("Alta", resolvido.getPrioridade());
    }

    private Chamado recarregar(Integer id) {
        entityManager.flush();
        entityManager.clear();
        return entityManager.find(Chamado.class, id);
    }
}