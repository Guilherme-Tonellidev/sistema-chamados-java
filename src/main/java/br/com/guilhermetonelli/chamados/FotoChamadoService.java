package br.com.guilhermetonelli.chamados;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FotoChamadoService {

    private static final int MAX_FOTOS = 5;
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final long MAX_PIXELS = 12_000_000L;

    private final JdbcTemplate jdbc;
    private final ChamadoService chamadoService;

    public FotoChamadoService(
            JdbcTemplate jdbc,
            ChamadoService chamadoService) {

        this.jdbc = jdbc;
        this.chamadoService = chamadoService;
    }

    public record FotoResposta(
        String id,
        String nome,
        String tipo,
        int tamanho
    ) {
    }

    public record ConteudoFoto(String tipo, byte[] bytes) {
    }

    private record FotoPreparada(
        String id,
        String nome,
        String tipo,
        byte[] bytes
    ) {
    }

    public List<FotoResposta> listar(int chamadoId) {
        chamadoService.buscarChamadoPorId(chamadoId);

        return jdbc.query(
            """
            SELECT id, nome, tipo, tamanho
            FROM fotos_chamados
            WHERE chamado_id = ?
            ORDER BY nome
            """,
            (resultado, numero) -> new FotoResposta(
                resultado.getString("id"),
                resultado.getString("nome"),
                resultado.getString("tipo"),
                resultado.getInt("tamanho")
            ),
            chamadoId
        );
    }

    public ConteudoFoto buscar(int chamadoId, String fotoId) {
        chamadoService.buscarChamadoPorId(chamadoId);

        List<ConteudoFoto> fotos = jdbc.query(
            """
            SELECT tipo, conteudo
            FROM fotos_chamados
            WHERE chamado_id = ? AND id = ?
            """,
            (resultado, numero) -> new ConteudoFoto(
                resultado.getString("tipo"),
                resultado.getBytes("conteudo")
            ),
            chamadoId,
            fotoId
        );

        if (fotos.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Foto não encontrada neste chamado."
            );
        }

        return fotos.getFirst();
    }

    @Transactional
    public List<FotoResposta> adicionar(
            int chamadoId,
            List<MultipartFile> arquivos) {

        chamadoService.buscarChamadoPorId(chamadoId);

        if (arquivos == null || arquivos.isEmpty()) {
            throw new IllegalArgumentException(
                "Selecione pelo menos uma foto."
            );
        }

        if (arquivos.size() > MAX_FOTOS) {
            throw new IllegalArgumentException(
                "Cada chamado pode ter no máximo 5 fotos."
            );
        }

        List<FotoPreparada> preparadas = new ArrayList<>();

        for (MultipartFile arquivo : arquivos) {
            preparadas.add(preparar(arquivo));
        }

        // Serializa os envios para o mesmo chamado, evitando que
        // requisições simultâneas ultrapassem o limite de fotos.
        List<Integer> chamados = jdbc.query(
            "SELECT id FROM chamados WHERE id = ? FOR UPDATE",
            (resultado, numero) -> resultado.getInt("id"),
            chamadoId
        );

        if (chamados.isEmpty()) {
            throw new ChamadoNaoEncontradoException();
        }

        Integer quantidade = jdbc.queryForObject(
            "SELECT COUNT(*) FROM fotos_chamados WHERE chamado_id = ?",
            Integer.class,
            chamadoId
        );

        if (quantidade == null
                || quantidade + preparadas.size() > MAX_FOTOS) {
            throw new IllegalArgumentException(
                "Cada chamado pode ter no máximo 5 fotos."
            );
        }

        List<FotoResposta> adicionadas = new ArrayList<>();

        for (FotoPreparada foto : preparadas) {
            jdbc.update(
                """
                INSERT INTO fotos_chamados
                    (id, chamado_id, nome, tipo, tamanho, conteudo)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                foto.id(),
                chamadoId,
                foto.nome(),
                foto.tipo(),
                foto.bytes().length,
                foto.bytes()
            );

            adicionadas.add(new FotoResposta(
                foto.id(),
                foto.nome(),
                foto.tipo(),
                foto.bytes().length
            ));
        }

        return adicionadas;
    }

    private FotoPreparada preparar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException(
                "Não é permitido enviar uma foto vazia."
            );
        }

        if (arquivo.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException(
                "Cada foto deve ter no máximo 5 MB."
            );
        }

        try {
            byte[] recebidos = arquivo.getBytes();

            if (recebidos.length > MAX_BYTES) {
                throw new IllegalArgumentException(
                    "Cada foto deve ter no máximo 5 MB."
                );
            }

            try (var entrada = new MemoryCacheImageInputStream(
                    new ByteArrayInputStream(recebidos))) {

                var leitores = ImageIO.getImageReaders(entrada);

                if (!leitores.hasNext()) {
                    throw imagemInvalida();
                }

                ImageReader leitor = leitores.next();

                try {
                    leitor.setInput(entrada, true, true);

                    String formato = leitor.getFormatName()
                        .toLowerCase(Locale.ROOT);

                    boolean jpeg = formato.equals("jpeg")
                        || formato.equals("jpg");

                    if (!jpeg && !formato.equals("png")) {
                        throw imagemInvalida();
                    }

                    int largura = leitor.getWidth(0);
                    int altura = leitor.getHeight(0);

                    if (largura <= 0 || altura <= 0
                            || (long) largura * altura > MAX_PIXELS) {
                        throw new IllegalArgumentException(
                            "A foto deve ter no máximo 12 megapixels. "
                            + "Reduza as dimensões antes de enviar."
                        );
                    }

                    BufferedImage imagem = leitor.read(0);

                    if (imagem == null) {
                        throw imagemInvalida();
                    }

                    String extensao = jpeg ? "jpg" : "png";
                    String tipo = jpeg ? "image/jpeg" : "image/png";

                    // Grava apenas a imagem decodificada, sem confiar
                    // no nome, na extensão ou no tipo enviado pelo cliente.
                    try (var saida = new ByteArrayOutputStream()) {
                        try {
                            if (!ImageIO.write(imagem, extensao, saida)) {
                                throw imagemInvalida();
                            }
                        } finally {
                            imagem.flush();
                        }

                        byte[] conteudo = saida.toByteArray();

                        if (conteudo.length > MAX_BYTES) {
                            throw new IllegalArgumentException(
                                "A foto processada ultrapassou 5 MB. "
                                + "Reduza a imagem antes de enviar."
                            );
                        }

                        String id = UUID.randomUUID().toString();

                        return new FotoPreparada(
                            id,
                            "foto-" + id + "." + extensao,
                            tipo,
                            conteudo
                        );
                    }
                } finally {
                    leitor.dispose();
                }
            }
        } catch (IOException exception) {
            throw imagemInvalida();
        }
    }

    private IllegalArgumentException imagemInvalida() {
        return new IllegalArgumentException(
            "Envie uma imagem JPEG ou PNG válida."
        );
    }
}