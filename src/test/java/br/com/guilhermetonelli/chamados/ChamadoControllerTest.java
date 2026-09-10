package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ChamadoControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        ChamadoService service = new ChamadoService();
        ChamadoController controller = new ChamadoController(service);

        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .build();
    }

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
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(
                jsonPath("$.titulo").value("Computador sem internet")
            )
            .andExpect(
                jsonPath("$.descricao")
                    .value("O computador perdeu a conexao.")
            )
            .andExpect(jsonPath("$.status").value("Aberto"));

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(
                jsonPath("$[0].titulo").value("Computador sem internet")
            )
            .andExpect(jsonPath("$[0].status").value("Aberto"));
    }

    @Test
    void deveRecusarTituloVazioComStatus400() throws Exception {
        String dados = """
            {
                "titulo": "   ",
                "descricao": "Descricao valida."
            }
            """;

        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dados)
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
        String dados = """
            {
                "titulo": "Problema no teclado",
                "descricao": ""
            }
            """;

        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dados)
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
        String dados = "{\"titulo\":";

        mockMvc.perform(
                post("/chamados")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dados)
            )
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/chamados"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }
}