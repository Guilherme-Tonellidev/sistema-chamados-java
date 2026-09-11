package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ChamadoControllerTest extends BaseIntegracaoTest {

    @Test
    void deveRetornarListaVaziaComStatus200() throws Exception {
        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(
                content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)
            )
            .andExpect(content().json("[]"));
    }

    @Test
    void deveCadastrarEListarChamado() throws Exception {
        String dados = """
            {
                "titulo": "Computador sem internet",
                "descricao": "O computador perdeu a conexao."
            }
            """;

        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dados)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(
                jsonPath("$.titulo").value("Computador sem internet")
            )
            .andExpect(
                jsonPath("$.descricao")
                    .value("O computador perdeu a conexao.")
            )
            .andExpect(jsonPath("$.status").value("Aberto"));

        int id = service.listarChamados().get(0).getId();

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(id))
            .andExpect(
                jsonPath("$[0].titulo").value("Computador sem internet")
            )
            .andExpect(jsonPath("$[0].status").value("Aberto"));
    }

    @Test
    void deveRecusarTituloVazioComStatus400() throws Exception {
        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                            "titulo": "   ",
                            "descricao": "Descricao valida."
                        }
                        """)
            )
            .andExpect(status().isBadRequest())
            .andExpect(
                jsonPath("$.erro").value("O título não pode ficar vazio.")
            );

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    @Test
    void deveRecusarDescricaoVaziaComStatus400() throws Exception {
        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                            "titulo": "Problema no teclado",
                            "descricao": ""
                        }
                        """)
            )
            .andExpect(status().isBadRequest())
            .andExpect(
                jsonPath("$.erro")
                    .value("A descrição não pode ficar vazia.")
            );

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    @Test
    void deveRecusarJsonIncompletoComStatus400() throws Exception {
        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"titulo\":")
            )
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }
}