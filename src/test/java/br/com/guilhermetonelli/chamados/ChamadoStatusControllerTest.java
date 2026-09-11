package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ChamadoStatusControllerTest {

    private MockMvc mockMvc;
    private int id;

    @BeforeEach
    void preparar() {
        ChamadoService service = new ChamadoService();

        Chamado chamado = service.abrirChamado(
            "Problema no teclado",
            "Algumas teclas não funcionam."
        );

        id = chamado.getId();

        mockMvc = MockMvcBuilders
            .standaloneSetup(new ChamadoController(service))
            .build();
    }

    @Test
    void deveBuscarChamadoPeloNumero() throws Exception {
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
        mockMvc.perform(get("/chamados/999"))
            .andExpect(status().isNotFound())
            .andExpect(
                jsonPath("$.erro").value("Chamado não encontrado.")
            );

        mockMvc.perform(patch("/chamados/999/atendimento"))
            .andExpect(status().isNotFound());

        mockMvc.perform(patch("/chamados/999/resolucao"))
            .andExpect(status().isNotFound());
    }

    @Test
    void deveIniciarAtendimentoEResolverChamado() throws Exception {
        mockMvc.perform(
                patch("/chamados/{id}/atendimento", id)
            )
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.status").value("Em atendimento")
            );

        mockMvc.perform(
                patch("/chamados/{id}/resolucao", id)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));
    }

    @Test
    void deveRecusarResolucaoDiretaSemAlterarStatus() throws Exception {
        mockMvc.perform(
                patch("/chamados/{id}/resolucao", id)
            )
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
        mockMvc.perform(
                patch("/chamados/{id}/atendimento", id)
            )
            .andExpect(status().isOk());

        mockMvc.perform(
                patch("/chamados/{id}/resolucao", id)
            )
            .andExpect(status().isOk());

        mockMvc.perform(
                patch("/chamados/{id}/atendimento", id)
            )
            .andExpect(status().isConflict());

        mockMvc.perform(get("/chamados/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Resolvido"));
    }
}