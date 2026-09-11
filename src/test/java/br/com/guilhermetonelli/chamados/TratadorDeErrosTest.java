package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class TratadorDeErrosTest extends BaseIntegracaoTest {

    @Test
    void devePadronizarErroDeChamadoNaoEncontrado() throws Exception {
        mockMvc.perform(get("/chamados/-1"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.erro").value("Chamado não encontrado."))
            .andExpect(jsonPath("$.caminho").value("/chamados/-1"));
    }

    @Test
    void devePadronizarErroDeCadastroInvalido() throws Exception {
        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "titulo": "",
                        "descricao": "Computador sem acesso à rede."
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value("O título não pode ficar vazio."))
            .andExpect(jsonPath("$.caminho").value("/chamados"));
    }

    @Test
    void devePadronizarErroDeJsonMalformado() throws Exception {
        mockMvc.perform(post("/chamados")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value(
                "O corpo da requisição deve conter um JSON válido."
            ))
            .andExpect(jsonPath("$.caminho").value("/chamados"));
    }

    @Test
    void devePadronizarErroDeIdNaoNumerico() throws Exception {
        mockMvc.perform(get("/chamados/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value(
                "O parâmetro 'id' deve ser um número inteiro válido."
            ))
            .andExpect(jsonPath("$.caminho").value("/chamados/abc"));
    }

    @Test
    void devePadronizarErroDeTransicaoDeStatus() throws Exception {
        Chamado chamado = service.abrirChamado(
            "Falha no monitor",
            "O monitor não apresenta imagem."
        );

        String caminho = "/chamados/" + chamado.getId() + "/resolucao";

        mockMvc.perform(patch(caminho))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.erro").value(
                "O chamado precisa estar em atendimento antes de ser resolvido."
            ))
            .andExpect(jsonPath("$.caminho").value(caminho));
    }
}