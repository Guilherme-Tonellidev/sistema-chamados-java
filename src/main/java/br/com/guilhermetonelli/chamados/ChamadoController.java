package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
            return ResponseEntity
                .badRequest()
                .body(Map.of("erro", e.getMessage()));
        }
    }
}