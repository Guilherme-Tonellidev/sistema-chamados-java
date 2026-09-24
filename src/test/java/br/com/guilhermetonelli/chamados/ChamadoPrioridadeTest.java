package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Transactional
class ChamadoPrioridadeTest extends BaseIntegracaoTest {

    @PersistenceContext
    private EntityManager entityManager;

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