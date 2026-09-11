package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ChamadoService {

    private final ChamadoRepository repository;

    public ChamadoService(ChamadoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Chamado abrirChamado(String titulo, String descricao) {
        if (titulo == null || titulo.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "O título não pode ficar vazio."
            );
        }

        if (descricao == null || descricao.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "A descrição não pode ficar vazia."
            );
        }

        Chamado chamado = new Chamado(
            titulo.trim(),
            descricao.trim()
        );

        return repository.save(chamado);
    }

    public List<Chamado> listarChamados() {
        return repository.findAll(Sort.by("id"));
    }

    public List<Chamado> listarChamados(String status) {
        if (status == null) {
            return listarChamados();
        }

        String statusNormalizado = normalizarStatus(status);

        return repository.findByStatusOrderByIdAsc(statusNormalizado);
    }

    private String normalizarStatus(String status) {
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "aberto" -> "Aberto";
            case "em atendimento" -> "Em atendimento";
            case "resolvido" -> "Resolvido";
            default -> throw new IllegalArgumentException(
                "Status inválido. Use: Aberto, Em atendimento ou Resolvido."
            );
        };
    }

    public Chamado buscarChamadoPorId(int id) {
        return repository.findById(id)
            .orElseThrow(ChamadoNaoEncontradoException::new);
    }

    @Transactional
    public void iniciarAtendimento(int id) {
        Chamado chamado = buscarChamadoPorId(id);

        chamado.iniciarAtendimento();

        repository.save(chamado);
    }

    @Transactional
    public void resolverChamado(int id) {
        Chamado chamado = buscarChamadoPorId(id);

        chamado.resolver();

        repository.save(chamado);
    }
}