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
import java.util.List;
import java.util.stream.IntStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FotoChamadoTest {

    @Autowired
    private FotoChamadoService fotos;

    @Autowired
    private ChamadoService chamados;

    @Autowired
    private ChamadoRepository repository;

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private int chamadoId;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
            .apply(springSecurity())
            .build();

        Chamado chamado = chamados.abrirChamado(
            "Impressora com problema",
            "Foto do erro no equipamento."
        );

        repository.flush();
        chamadoId = chamado.getId();
    }

    @Test
    void deveEnviarListarEConsultarImagemAutenticado() throws Exception {
        mockMvc.perform(multipart("/chamados/{id}/fotos", chamadoId)
                .file(fotoValida())
                .with(user("teste@example.com"))
                .with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$[0].id").isString())
            .andExpect(jsonPath("$[0].tipo").value("image/png"))
            .andExpect(jsonPath("$[0].conteudo").doesNotExist());

        var lista = fotos.listar(chamadoId);
        assertEquals(1, lista.size());

        String fotoId = lista.getFirst().id();

        mockMvc.perform(get("/chamados/{id}/fotos", chamadoId)
                .with(user("teste@example.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(fotoId));

        byte[] conteudo = mockMvc.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, fotoId)
                    .with(user("teste@example.com")))
            .andExpect(status().isOk())
            .andExpect(content().contentType("image/png"))
            .andReturn()
            .getResponse()
            .getContentAsByteArray();

        BufferedImage imagem = ImageIO.read(
            new ByteArrayInputStream(conteudo)
        );

        assertNotNull(imagem);
        assertEquals(2, imagem.getWidth());
        assertEquals(2, imagem.getHeight());
    }

    @Test
    void deveRejeitarTextoDisfarcadoDeImagemSemSalvarParteDoEnvio()
            throws Exception {

        MockMultipartFile falsa = new MockMultipartFile(
            "fotos",
            "foto.png",
            "image/png",
            "isto não é uma imagem".getBytes(java.nio.charset.StandardCharsets.UTF_8)
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

        mockMvc.perform(get("/chamados/{id}/fotos", chamadoId))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(
                get("/chamados/{id}/fotos/{fotoId}", chamadoId, foto.id()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart("/chamados/{id}/fotos", chamadoId)
                .file(fotoValida())
                .with(csrf()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(multipart("/chamados/{id}/fotos", chamadoId)
                .file(fotoValida())
                .with(user("teste@example.com")))
            .andExpect(status().isForbidden());

        assertEquals(1, fotos.listar(chamadoId).size());
    }

    @Test
    void naoDeveConsultarFotoUsandoIdDeOutroChamado() throws Exception {
        var foto = fotos.adicionar(
            chamadoId,
            List.of(fotoValida())
        ).getFirst();

        Chamado outro = chamados.abrirChamado(
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