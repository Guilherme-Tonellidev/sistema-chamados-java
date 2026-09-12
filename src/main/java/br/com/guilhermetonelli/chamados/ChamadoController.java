package br.com.guilhermetonelli.chamados;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chamados")
public class ChamadoController {

    private final ChamadoService service;

    public ChamadoController(ChamadoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Chamado> listarChamados(
            @RequestParam(name = "status", required = false) String status) {

        return service.listarChamados(status);
    }

    @GetMapping("/paginados")
    public PaginaChamadosResposta listarChamadosPaginados(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "10") int tamanho) {

        return service.listarChamadosPaginados(status, pagina, tamanho);
    }

    @PostMapping
    public ResponseEntity<Chamado> abrirChamado(
            @RequestBody CriarChamadoRequest dados) {

        Chamado chamado = service.abrirChamado(
            dados.titulo(),
            dados.descricao()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(chamado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chamado> buscarChamado(
            @PathVariable("id") int id) {

        return ResponseEntity.ok(service.buscarChamadoPorId(id));
    }

    @PatchMapping("/{id}/atendimento")
    public ResponseEntity<Chamado> iniciarAtendimento(
            @PathVariable("id") int id) {

        service.iniciarAtendimento(id);

        return ResponseEntity.ok(service.buscarChamadoPorId(id));
    }

    @PatchMapping("/{id}/resolucao")
    public ResponseEntity<Chamado> resolverChamado(
            @PathVariable("id") int id) {

        service.resolverChamado(id);

        return ResponseEntity.ok(service.buscarChamadoPorId(id));
    }
}