package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chamados")
public class ChamadoController {

    private final ChamadoService service;

    public ChamadoController(ChamadoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Chamado> listarChamados() {
        return service.listarChamados();
    }

    @PostMapping
    public ResponseEntity<?> abrirChamado(
            @RequestBody CriarChamadoRequest dados) {

        try {
            Chamado chamado = service.abrirChamado(
                dados.titulo(),
                dados.descricao()
            );

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(chamado);

        } catch (IllegalArgumentException e) {
            return respostaErro(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarChamado(
            @PathVariable("id") int id) {

        try {
            Chamado chamado = service.buscarChamadoPorId(id);
            return ResponseEntity.ok(chamado);

        } catch (IllegalArgumentException e) {
            return respostaErro(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PatchMapping("/{id}/atendimento")
    public ResponseEntity<?> iniciarAtendimento(
            @PathVariable("id") int id) {

        try {
            service.iniciarAtendimento(id);

            return ResponseEntity.ok(
                service.buscarChamadoPorId(id)
            );

        } catch (IllegalArgumentException e) {
            return respostaErro(HttpStatus.NOT_FOUND, e.getMessage());

        } catch (IllegalStateException e) {
            return respostaErro(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @PatchMapping("/{id}/resolucao")
    public ResponseEntity<?> resolverChamado(
            @PathVariable("id") int id) {

        try {
            service.resolverChamado(id);

            return ResponseEntity.ok(
                service.buscarChamadoPorId(id)
            );

        } catch (IllegalArgumentException e) {
            return respostaErro(HttpStatus.NOT_FOUND, e.getMessage());

        } catch (IllegalStateException e) {
            return respostaErro(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> respostaErro(
            HttpStatus status, String mensagem) {

        return ResponseEntity
            .status(status)
            .body(Map.of("erro", mensagem));
    }
}