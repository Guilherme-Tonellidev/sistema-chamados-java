package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ChamadoFiltroControllerTest extends BaseIntegracaoTest {

    @Test
    void deveListarTodosSemFiltroEmOrdemDeId() throws Exception {
        Chamado aberto = criarChamado("Aberto");
        Chamado emAtendimento = criarChamado("Em atendimento");
        Chamado resolvido = criarChamado("Resolvido");

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].id").value(aberto.getId()))
            .andExpect(jsonPath("$[1].id").value(emAtendimento.getId()))
            .andExpect(jsonPath("$[2].id").value(resolvido.getId()));
    }

    @Test
    void deveFiltrarAbertosEmOrdemDeId() throws Exception {
        Chamado primeiro = criarChamado("Aberto");
        criarChamado("Em atendimento");
        criarChamado("Resolvido");
        Chamado segundo = criarChamado("Aberto");

        mockMvc.perform(get("/chamados").param("status", "Aberto"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(primeiro.getId()))
            .andExpect(jsonPath("$[0].status").value("Aberto"))
            .andExpect(jsonPath("$[1].id").value(segundo.getId()))
            .andExpect(jsonPath("$[1].status").value("Aberto"));
    }

    @Test
    void deveFiltrarEmAtendimento() throws Exception {
        criarChamado("Aberto");
        Chamado esperado = criarChamado("Em atendimento");
        criarChamado("Resolvido");

        mockMvc.perform(get("/chamados").param("status", "Em atendimento"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(esperado.getId()))
            .andExpect(jsonPath("$[0].status").value("Em atendimento"));
    }

    @Test
    void deveFiltrarResolvidos() throws Exception {
        criarChamado("Aberto");
        criarChamado("Em atendimento");
        Chamado esperado = criarChamado("Resolvido");

        mockMvc.perform(get("/chamados").param("status", "Resolvido"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(esperado.getId()))
            .andExpect(jsonPath("$[0].status").value("Resolvido"));
    }

    @Test
    void deveAceitarMaiusculasEEspacosNasPontas() throws Exception {
        criarChamado("Aberto");
        Chamado esperado = criarChamado("Em atendimento");

        mockMvc.perform(get("/chamados").param("status", "  EM ATENDIMENTO  "))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(esperado.getId()))
            .andExpect(jsonPath("$[0].status").value("Em atendimento"));
    }

    @Test
    void deveRetornarListaVaziaQuandoNaoHaCorrespondencias() throws Exception {
        criarChamado("Aberto");

        mockMvc.perform(get("/chamados").param("status", "Resolvido"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deveRejeitarStatusDesconhecido() throws Exception {
        verificarStatusInvalido("Cancelado");
    }

    @Test
    void deveRejeitarStatusVazioOuSomenteEspacos() throws Exception {
        verificarStatusInvalido("");
        verificarStatusInvalido("   ");
    }

    private void verificarStatusInvalido(String filtro) throws Exception {
        mockMvc.perform(get("/chamados").param("status", filtro))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value(
                "Status inválido. Use: Aberto, Em atendimento ou Resolvido."
            ))
            .andExpect(jsonPath("$.caminho").value("/chamados"));
    }

    private Chamado criarChamado(String statusDesejado) {
        Chamado chamado = service.abrirChamado(
            "Chamado de teste",
            "Descrição do chamado de teste."
        );

        if (!statusDesejado.equals("Aberto")) {
            service.iniciarAtendimento(chamado.getId());
        }

        if (statusDesejado.equals("Resolvido")) {
            service.resolverChamado(chamado.getId());
        }

        return service.buscarChamadoPorId(chamado.getId());
    }
}