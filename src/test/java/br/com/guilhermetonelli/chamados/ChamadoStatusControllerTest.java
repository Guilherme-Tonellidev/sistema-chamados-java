package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ChamadoStatusControllerTest extends BaseIntegracaoTest {

    private int criarChamado() {
        return service.abrirChamado(
            "Problema no teclado",
            "Algumas teclas não funcionam."
        ).getId();
    }

    @Test
    void deveBuscarChamadoPeloNumero() throws Exception {
        int id = criarChamado();

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(
                jsonPath("$.titulo").value("Problema no teclado")
            )
            .andExpect(jsonPath("$.status").value("Aberto"));
    }

    @Test
    void deveRetornar404ParaChamadoInexistente() throws Exception {
        mockMvc.perform(get("/chamados/-1"))
            .andExpect(status().isNotFound())
            .andExpect(
                jsonPath("$.erro").value("Chamado não encontrado.")
            );

        mockMvc.perform(patch("/chamados/-1/atendimento"))
            .andExpect(status().isNotFound());

        mockMvc.perform(patch("/chamados/-1/resolucao"))
            .andExpect(status().isNotFound());
    }

    @Test
    void deveIniciarAtendimentoEResolverChamado() throws Exception {
        int id = criarChamado();

        mockMvc.perform(patch("/chamados/{id}/atendimento", id))
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.status").value("Em atendimento")
            );

        mockMvc.perform(patch("/chamados/{id}/resolucao", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));
    }

    @Test
    void deveRecusarResolucaoDiretaSemAlterarStatus() throws Exception {
        int id = criarChamado();

        mockMvc.perform(patch("/chamados/{id}/resolucao", id))
            .andExpect(status().isConflict())
            .andExpect(
                jsonPath("$.erro").value(
                    "O chamado precisa estar em atendimento antes de ser resolvido."
                )
            );

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Aberto"));
    }

    @Test
    void deveImpedirReinicioDeChamadoResolvido() throws Exception {
        int id = criarChamado();

        mockMvc.perform(patch("/chamados/{id}/atendimento", id))
            .andExpect(status().isOk());

        mockMvc.perform(patch("/chamados/{id}/resolucao", id))
            .andExpect(status().isOk());

        mockMvc.perform(patch("/chamados/{id}/atendimento", id))
            .andExpect(status().isConflict());

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));
    }
}