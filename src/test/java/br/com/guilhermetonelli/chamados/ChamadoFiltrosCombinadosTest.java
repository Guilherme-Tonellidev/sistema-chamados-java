package br.com.guilhermetonelli.chamados;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class ChamadoFiltrosCombinadosTest extends BaseIntegracaoTest {

    private Integer idAltaAberta1;
    private Integer idAltaAberta2;
    private Integer idAltaResolvida;

    @BeforeEach
    void prepararChamados() {
        // A classe base já preparou o banco e autenticou o atendente.
        idAltaAberta1 = service.abrirChamado(
            "Alta aberta 1",
            "Primeiro chamado de prioridade alta.",
            "Alta"
        ).getId();

        service.abrirChamado(
            "Baixa aberta",
            "Chamado de prioridade baixa.",
            "Baixa"
        );

        idAltaAberta2 = service.abrirChamado(
            "Alta aberta 2",
            "Segundo chamado de prioridade alta.",
            "Alta"
        ).getId();

        idAltaResolvida = service.abrirChamado(
            "Alta resolvida",
            "Chamado de prioridade alta ja resolvido.",
            "Alta"
        ).getId();

        service.iniciarAtendimento(idAltaResolvida);
        service.resolverChamado(idAltaResolvida);

        service.abrirChamado(
            "Normal aberta",
            "Chamado de prioridade normal.",
            "Normal"
        );

        repository.flush();
    }

    @Test
    void deveFiltrarSomentePorPrioridade() throws Exception {
        mockMvc.perform(get("/chamados")
                .param("prioridade", "Alta"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].id").value(idAltaAberta1))
            .andExpect(jsonPath("$[1].id").value(idAltaAberta2))
            .andExpect(jsonPath("$[2].id").value(idAltaResolvida));
    }

    @Test
    void deveCombinarStatusEPrioridade() throws Exception {
        mockMvc.perform(get("/chamados")
                .param("status", "Aberto")
                .param("prioridade", "Alta"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(idAltaAberta1))
            .andExpect(jsonPath("$[1].id").value(idAltaAberta2));
    }

    @Test
    void devePaginarComOsDoisFiltrosEManterOrdenacao() throws Exception {
        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Aberto")
                .param("prioridade", "Alta")
                .param("pagina", "0")
                .param("tamanho", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(idAltaAberta1))
            .andExpect(jsonPath("$.totalElementos").value(2))
            .andExpect(jsonPath("$.totalPaginas").value(2))
            .andExpect(jsonPath("$.pagina").value(0))
            .andExpect(jsonPath("$.temProxima").value(true));

        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Aberto")
                .param("prioridade", "Alta")
                .param("pagina", "1")
                .param("tamanho", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(idAltaAberta2))
            .andExpect(jsonPath("$.totalElementos").value(2))
            .andExpect(jsonPath("$.pagina").value(1))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void deveRetornarPaginaVaziaParaCombinacaoSemResultados()
            throws Exception {

        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Resolvido")
                .param("prioridade", "Baixa"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(0))
            .andExpect(jsonPath("$.totalElementos").value(0))
            .andExpect(jsonPath("$.totalPaginas").value(0))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void deveRejeitarPrioridadeInvalidaNosDoisEndpoints()
            throws Exception {

        for (String caminho : new String[] {
                "/chamados", "/chamados/paginados"}) {

            mockMvc.perform(get(caminho)
                    .param("prioridade", "Urgente"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(
                    "Prioridade inválida. Use: Baixa, Normal ou Alta."
                ))
                .andExpect(jsonPath("$.caminho").value(caminho));
        }
    }

    @Test
    void deveNormalizarPrioridadeNaConsultaPaginada()
            throws Exception {

        mockMvc.perform(get("/chamados/paginados")
                .param("prioridade", "  aLtA  "))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElementos").value(3))
            .andExpect(jsonPath("$.chamados[0].id").value(idAltaAberta1))
            .andExpect(jsonPath("$.chamados[1].id").value(idAltaAberta2))
            .andExpect(jsonPath("$.chamados[2].id").value(idAltaResolvida));
    }
}