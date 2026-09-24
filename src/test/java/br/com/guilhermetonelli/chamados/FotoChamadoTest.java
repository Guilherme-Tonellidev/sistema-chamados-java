package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.IntStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Transactional
class FotoChamadoTest extends BaseIntegracaoTest {

    @Autowired
    private FotoChamadoService fotos;

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvcFotos;
    private Usuario solicitante;
    private int chamadoId;

    @BeforeEach
    void prepararFotos() {
        // Sem autenticação ou CSRF padrão nas requisições HTTP.
        mockMvcFotos = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(springSecurity())
            .build();

        solicitante = criarSolicitante();
        autenticarComo(solicitante);

        Chamado chamado = service.abrirChamado(
            "Impressora com problema",
            "Foto do erro no equipamento."
        );

        repository.flush();
        chamadoId = chamado.getId();
    }

    @Test
    void deveEnviarListarEConsultarImagemAutenticado() throws Exception {
        mockMvcFotos.perform(
                multipart("/chamados/{id}/fotos", chamadoId)
                    .file(fotoValida())
                    .with(
                        user(solicitante.getEmail()).roles("SOLICITANTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$[0].id").isString())
            .andExpect(jsonPath("$[0].tipo").value("image/png"))
            .andExpect(jsonPath("$[0].conteudo").doesNotExist());

        // O MockMvc limpa o contexto ao encerrar a requisição.
        autenticarComo(solicitante);

        var lista = fotos.listar(chamadoId);
        assertEquals(1, lista.size());

        String fotoId = lista.getFirst().id();

        mockMvcFotos.perform(get("/chamados/{id}/fotos", chamadoId)
                .with(user(solicitante.getEmail()).roles("SOLICITANTE")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(fotoId));

        byte[] conteudo = mockMvcFotos.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, fotoId)
                    .with(
                        user(solicitante.getEmail()).roles("SOLICITANTE")
                    )
            )
            .andExpect(status().isOk())
            .andExpect(content().contentType("image/png"))
            .andReturn()
            .getResponse()
            .getContentAsByteArray();

        BufferedImage imagem = ImageIO.read(
            new ByteArrayInputStream(conteudo)
        );

        assertNotNull(imagem);

        try {
            assertEquals(2, imagem.getWidth());
            assertEquals(2, imagem.getHeight());
        } finally {
            imagem.flush();
        }
    }

    @Test
    void deveRejeitarTextoDisfarcadoDeImagemSemSalvarParteDoEnvio()
            throws Exception {

        MockMultipartFile falsa = new MockMultipartFile(
            "fotos",
            "foto.png",
            "image/png",
            "isto não é uma imagem".getBytes(StandardCharsets.UTF_8)
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> fotos.adicionar(
                chamadoId,
                List.of(fotoValida(), falsa)
            )
        );

        assertEquals(0, fotos.listar(chamadoId).size());
    }

    @Test
    void deveLimitarQuantidadeAcumuladaDeFotos() throws Exception {
        byte[] bytes = fotoValida().getBytes();

        List<MultipartFile> cinco = IntStream.range(0, 5)
            .mapToObj(numero -> (MultipartFile) new MockMultipartFile(
                "fotos",
                "foto-" + numero + ".png",
                "image/png",
                bytes
            ))
            .toList();

        fotos.adicionar(chamadoId, cinco);

        assertThrows(
            IllegalArgumentException.class,
            () -> fotos.adicionar(chamadoId, List.of(fotoValida()))
        );

        assertEquals(5, fotos.listar(chamadoId).size());
    }

    @Test
    void deveRejeitarFotoMaiorQueCincoMb() {
        MockMultipartFile grande = new MockMultipartFile(
            "fotos",
            "grande.png",
            "image/png",
            new byte[5 * 1024 * 1024 + 1]
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> fotos.adicionar(chamadoId, List.of(grande))
        );

        assertEquals(0, fotos.listar(chamadoId).size());
    }

    @Test
    void deveExigirAutenticacaoECsrf() throws Exception {
        var foto = fotos.adicionar(
            chamadoId,
            List.of(fotoValida())
        ).getFirst();

        // Remove também a autenticação usada na preparação.
        TestSecurityContextHolder.clearContext();

        mockMvcFotos.perform(get("/chamados/{id}/fotos", chamadoId))
            .andExpect(status().isUnauthorized());

        mockMvcFotos.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, foto.id())
            )
            .andExpect(status().isUnauthorized());

        mockMvcFotos.perform(
                multipart("/chamados/{id}/fotos", chamadoId)
                    .file(fotoValida())
                    .with(csrf())
            )
            .andExpect(status().isUnauthorized());

        mockMvcFotos.perform(
                multipart("/chamados/{id}/fotos", chamadoId)
                    .file(fotoValida())
                    .with(
                        user(solicitante.getEmail()).roles("SOLICITANTE")
                    )
            )
            .andExpect(status().isForbidden());

        autenticarComo(solicitante);
        assertEquals(1, fotos.listar(chamadoId).size());
    }

    @Test
    void naoDeveConsultarFotoUsandoIdDeOutroChamado() throws Exception {
        var foto = fotos.adicionar(
            chamadoId,
            List.of(fotoValida())
        ).getFirst();

        // Mesmo proprietário, mas outro chamado.
        Chamado outro = service.abrirChamado(
            "Outro chamado",
            "Outra solicitação."
        );

        repository.flush();

        ResponseStatusException erro = assertThrows(
            ResponseStatusException.class,
            () -> fotos.buscar(outro.getId(), foto.id())
        );

        assertEquals(HttpStatus.NOT_FOUND, erro.getStatusCode());
    }

    @Test
    void outroSolicitanteNaoDeveListarConsultarOuAdicionarFotos()
            throws Exception {

        var foto = fotos.adicionar(
            chamadoId,
            List.of(fotoValida())
        ).getFirst();

        Usuario outro = criarSolicitante();

        TestSecurityContextHolder.clearContext();

        mockMvcFotos.perform(get("/chamados/{id}/fotos", chamadoId)
                .with(user(outro.getEmail()).roles("SOLICITANTE")))
            .andExpect(status().isNotFound());

        mockMvcFotos.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, foto.id())
                    .with(user(outro.getEmail()).roles("SOLICITANTE"))
            )
            .andExpect(status().isNotFound());

        mockMvcFotos.perform(
                multipart("/chamados/{id}/fotos", chamadoId)
                    .file(fotoValida())
                    .with(user(outro.getEmail()).roles("SOLICITANTE"))
                    .with(csrf())
            )
            .andExpect(status().isNotFound());

        // Confere que a tentativa não adicionou outra foto.
        autenticarComo(solicitante);

        var lista = fotos.listar(chamadoId);
        assertEquals(1, lista.size());
        assertEquals(foto.id(), lista.getFirst().id());
    }

    @Test
    void atendenteDeveListarConsultarEAdicionarFotosDeOutroUsuario()
            throws Exception {

        var foto = fotos.adicionar(
            chamadoId,
            List.of(fotoValida())
        ).getFirst();

        TestSecurityContextHolder.clearContext();

        mockMvcFotos.perform(get("/chamados/{id}/fotos", chamadoId)
                .with(user(usuarioTeste.getEmail()).roles("ATENDENTE")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(foto.id()));

        mockMvcFotos.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, foto.id())
                    .with(
                        user(usuarioTeste.getEmail()).roles("ATENDENTE")
                    )
            )
            .andExpect(status().isOk())
            .andExpect(content().contentType("image/png"));

        mockMvcFotos.perform(
                multipart("/chamados/{id}/fotos", chamadoId)
                    .file(fotoValida())
                    .with(
                        user(usuarioTeste.getEmail()).roles("ATENDENTE")
                    )
                    .with(csrf())
            )
            .andExpect(status().isCreated());

        // O proprietário também consegue consultar a foto adicionada.
        autenticarComo(solicitante);
        assertEquals(2, fotos.listar(chamadoId).size());
    }

    private MockMultipartFile fotoValida() throws Exception {
        BufferedImage imagem = new BufferedImage(
            2,
            2,
            BufferedImage.TYPE_INT_RGB
        );

        try (var saida = new ByteArrayOutputStream()) {
            ImageIO.write(imagem, "png", saida);

            return new MockMultipartFile(
                "fotos",
                "problema.png",
                "image/png",
                saida.toByteArray()
            );
        } finally {
            imagem.flush();
        }
    }
}