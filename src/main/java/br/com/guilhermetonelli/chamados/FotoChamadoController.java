package br.com.guilhermetonelli.chamados;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/chamados/{chamadoId}/fotos")
public class FotoChamadoController {

    private final FotoChamadoService service;

    public FotoChamadoController(FotoChamadoService service) {
        this.service = service;
    }

    @GetMapping
    public List<FotoChamadoService.FotoResposta> listar(
            @PathVariable("chamadoId") int chamadoId) {

        return service.listar(chamadoId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<FotoChamadoService.FotoResposta>> adicionar(
            @PathVariable("chamadoId") int chamadoId,
            @RequestParam("fotos") List<MultipartFile> fotos) {

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.adicionar(chamadoId, fotos));
    }

    @GetMapping("/{fotoId}")
    public ResponseEntity<byte[]> buscar(
            @PathVariable("chamadoId") int chamadoId,
            @PathVariable("fotoId") String fotoId) {

        FotoChamadoService.ConteudoFoto foto =
            service.buscar(chamadoId, fotoId);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(foto.tipo()))
            .contentLength(foto.bytes().length)
            .cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff")
            .body(foto.bytes());
    }
}