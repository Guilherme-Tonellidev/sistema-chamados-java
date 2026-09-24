package br.com.guilhermetonelli.chamados;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class ChamadoPaginacaoPermissoesTest extends BaseIntegracaoTest {

    private Usuario solicitante;

    private Integer idPrimeiro;
    private Integer idSegundo;
    private Integer idOutroUsuario;
    private Integer idLegado;

    @BeforeEach
    void prepararChamados() {
        solicitante = criarSolicitante();
        Usuario outro = criarSolicitante();

        autenticarComo(solicitante);

        idPrimeiro = service.abrirChamado(
            "Primeiro chamado proprio",
            "Prioridade alta e status aberto.",
            "Alta"
        ).getId();

        // Intercala um chamado de outro usuário na ordem dos IDs.
        autenticarComo(outro);

        idOutroUsuario = service.abrirChamado(
            "Chamado de outro usuario",
            "Tambem possui prioridade alta e status aberto.",
            "Alta"
        ).getId();

        autenticarComo(solicitante);

        idSegundo = service.abrirChamado(
            "Segundo chamado proprio",
            "Prioridade alta e status aberto.",
            "Alta"
        ).getId();

        service.abrirChamado(
            "Chamado proprio de prioridade baixa",
            "Nao deve aparecer no filtro de prioridade alta.",
            "Baixa"
        );

        Integer idResolvido = service.abrirChamado(
            "Chamado proprio resolvido",
            "Nao deve aparecer no filtro de chamados abertos.",
            "Alta"
        ).getId();

        autenticarComo(usuarioTeste);
        service.iniciarAtendimento(idResolvido);
        service.resolverChamado(idResolvido);

        Chamado legado = repository.saveAndFlush(
            new Chamado(
                "Chamado antigo sem proprietario",
                "Visivel somente para atendentes.",
                "Alta"
            )
        );

        idLegado = legado.getId();
    }

    @Test
    void deveAplicarProprietarioEFiltrosAntesDePaginarEContar()
            throws Exception {

        autenticarComo(solicitante);

        // Existem seis chamados no banco, mas apenas quatro são próprios.
        mockMvc.perform(get("/chamados/paginados")
                .param("tamanho", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(4))
            .andExpect(jsonPath("$.totalElementos").value(4))
            .andExpect(jsonPath("$.totalPaginas").value(1));

        // Apenas dois chamados próprios são abertos e de prioridade alta.
        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Aberto")
                .param("prioridade", "Alta")
                .param("pagina", "0")
                .param("tamanho", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(1))
            .andExpect(jsonPath("$.chamados[0].id").value(idPrimeiro))
            .andExpect(
                jsonPath("$.chamados[0].solicitanteId")
                    .value(solicitante.getId())
            )
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
            .andExpect(jsonPath("$.chamados[0].id").value(idSegundo))
            .andExpect(
                jsonPath("$.chamados[0].solicitanteId")
                    .value(solicitante.getId())
            )
            .andExpect(jsonPath("$.totalElementos").value(2))
            .andExpect(jsonPath("$.totalPaginas").value(2))
            .andExpect(jsonPath("$.pagina").value(1))
            .andExpect(jsonPath("$.temProxima").value(false));

        // Uma página além do final não pode revelar chamados de terceiros.
        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Aberto")
                .param("prioridade", "Alta")
                .param("pagina", "2")
                .param("tamanho", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(0))
            .andExpect(jsonPath("$.totalElementos").value(2))
            .andExpect(jsonPath("$.totalPaginas").value(2))
            .andExpect(jsonPath("$.temProxima").value(false));
    }

    @Test
    void atendenteDeveConsultarTodosIncluindoLegados()
            throws Exception {

        autenticarComo(usuarioTeste);

        mockMvc.perform(get("/chamados/paginados")
                .param("tamanho", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(6))
            .andExpect(jsonPath("$.totalElementos").value(6))
            .andExpect(
                jsonPath("$.chamados[*].id")
                    .value(hasItems(idOutroUsuario, idLegado))
            );

        // O atendente também utiliza os filtros normalmente.
        mockMvc.perform(get("/chamados/paginados")
                .param("status", "Aberto")
                .param("prioridade", "Alta")
                .param("tamanho", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(4))
            .andExpect(jsonPath("$.totalElementos").value(4))
            .andExpect(
                jsonPath("$.chamados[*].id").value(
                    hasItems(
                        idPrimeiro,
                        idSegundo,
                        idOutroUsuario,
                        idLegado
                    )
                )
            );
    }

    @Test
    void solicitanteSemChamadosDeveReceberPaginaVazia()
            throws Exception {

        Usuario semChamados = criarSolicitante();
        autenticarComo(semChamados);

        mockMvc.perform(get("/chamados/paginados"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chamados.length()").value(0))
            .andExpect(jsonPath("$.totalElementos").value(0))
            .andExpect(jsonPath("$.totalPaginas").value(0))
            .andExpect(jsonPath("$.temProxima").value(false));
    }
}