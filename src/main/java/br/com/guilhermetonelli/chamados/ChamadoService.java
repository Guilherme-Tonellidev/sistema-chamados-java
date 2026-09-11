package br.com.guilhermetonelli.chamados;

import java.util.List;

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

    public Chamado buscarChamadoPorId(int id) {
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                "Chamado não encontrado."
            ));
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