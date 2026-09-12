package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ChamadoPaginacaoControllerTest extends BaseIntegracaoTest {

    private static final String ROTA = "/chamados/paginados";

    @Test
    void deveUsarPrimeiraPaginaComDezItensPorPadrao() throws Exception {
        for (int i = 1; i <= 11; i++) {
            criarChamado("Chamado " + i);
        }

        mockMvc.perform(get(ROTA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(10))
            .andExpect(jsonPath("$.pagina").value(0))
            .andExpect(jsonPath("$.tamanho").value(10))
            .andExpect(jsonPath("$.totalElementos").value(11))
            .andExpect(jsonPath("$.totalPaginas").value(2))
            .andExpect(jsonPath("$.temProxima").value(true));
    }

    @Test
    void deveSepararPaginasEmOrdemDeIdSemRepetirChamados() throws Exception {
        Chamado primeiro = criarChamado("Primeiro");
        Chamado segundo = criarChamado("Segundo");
        Chamado terceiro = criarChamado("Terceiro");

        mockMvc.perform(get(ROTA)
                .param("pagina", "0")
                .param("tamanho", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(2))
            .andExpect(jsonPath("$.chamados[0].id").value(primeiro.getId()))
            .andExpect(jsonPath("$.chamados[1].id").value(segundo.getId()))
            .andExpect(jsonPath("$.totalElementos").value(3))
            .andExpect(jsonPath("$.totalPaginas").value(2))
            .andExpect(jsonPath("$.temProxima").value(true));

        mockMvc.perform(get(ROTA)
                .param("pagina", "1")
                .param("tamanho", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(terceiro.getId()))
            .andExpect(jsonPath("$.pagina").value(1))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void deveFiltrarAntesDePaginarEContar() throws Exception {
        Chamado primeiro = criarChamado("Aberto 1");
        Chamado emAtendimento = criarChamado("Em atendimento");
        service.iniciarAtendimento(emAtendimento.getId());
        Chamado segundo = criarChamado("Aberto 2");

        mockMvc.perform(get(ROTA)
                .param("status", "  ABERTO  ")
                .param("tamanho", "1")
                .param("pagina", "0"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(primeiro.getId()))
            .andExpect(jsonPath("$.totalElementos").value(2))
            .andExpect(jsonPath("$.totalPaginas").value(2));

        mockMvc.perform(get(ROTA)
                .param("status", "Aberto")
                .param("tamanho", "1")
                .param("pagina", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(segundo.getId()))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void deveRetornarPaginaVaziaSemResultadosOuAlemDoFinal() throws Exception {
        mockMvc.perform(get(ROTA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(0))
            .andExpect(jsonPath("$.totalElementos").value(0))
            .andExpect(jsonPath("$.totalPaginas").value(0))
            .andExpect(jsonPath("$.temProxima").value(false));

        criarChamado("Único chamado");

        mockMvc.perform(get(ROTA).param("pagina", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(0))
            .andExpect(jsonPath("$.pagina").value(5))
            .andExpect(jsonPath("$.totalElementos").value(1))
            .andExpect(jsonPath("$.totalPaginas").value(1))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void deveRejeitarLimitesInvalidos() throws Exception {
        verificarErro("pagina", "-1",
            "A página deve ser maior ou igual a zero.");

        verificarErro("tamanho", "0",
            "O tamanho da página deve estar entre 1 e 100.");

        verificarErro("tamanho", "-1",
            "O tamanho da página deve estar entre 1 e 100.");

        verificarErro("tamanho", "101",
            "O tamanho da página deve estar entre 1 e 100.");

        verificarErro("pagina", "2147483647",
            "A página solicitada excede o limite permitido.");
    }

    @Test
    void deveRejeitarParametrosNaoNumericos() throws Exception {
        verificarErro("pagina", "abc",
            "O parâmetro 'pagina' deve ser um número inteiro válido.");

        verificarErro("tamanho", "abc",
            "O parâmetro 'tamanho' deve ser um número inteiro válido.");
    }

    @Test
    void deveRejeitarStatusInvalidoNaRotaPaginada() throws Exception {
        verificarErro("status", "Cancelado",
            "Status inválido. Use: Aberto, Em atendimento ou Resolvido.");

        verificarErro("status", "",
            "Status inválido. Use: Aberto, Em atendimento ou Resolvido.");
    }

    private void verificarErro(
            String parametro, String valor, String mensagem) throws Exception {

        mockMvc.perform(get(ROTA).param(parametro, valor))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value(mensagem))
            .andExpect(jsonPath("$.caminho").value(ROTA));
    }

    private Chamado criarChamado(String titulo) {
        return service.abrirChamado(
            titulo,
            "Descrição do chamado de teste."
        );
    }
}