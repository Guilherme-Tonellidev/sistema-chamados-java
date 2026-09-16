package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
        return abrirChamado(titulo, descricao, null);
    }

    @Transactional
    public Chamado abrirChamado(
            String titulo, String descricao, String prioridade) {

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
            descricao.trim(),
            prioridade
        );

        return repository.save(chamado);
    }

    public List<Chamado> listarChamados() {
        return listarChamados(null, null);
    }

    public List<Chamado> listarChamados(String status) {
        return listarChamados(status, null);
    }

    public List<Chamado> listarChamados(
            String status, String prioridade) {

        String statusNormalizado = status == null
            ? null
            : normalizarStatus(status);

        String prioridadeNormalizada = prioridade == null
            ? null
            : normalizarPrioridade(prioridade);

        if (statusNormalizado != null && prioridadeNormalizada != null) {
            return repository.findByStatusAndPrioridadeOrderByIdAsc(
                statusNormalizado,
                prioridadeNormalizada
            );
        }

        if (statusNormalizado != null) {
            return repository.findByStatusOrderByIdAsc(statusNormalizado);
        }

        if (prioridadeNormalizada != null) {
            return repository.findByPrioridadeOrderByIdAsc(
                prioridadeNormalizada
            );
        }

        return repository.findAll(Sort.by("id").ascending());
    }

    public PaginaChamadosResposta listarChamadosPaginados(
            String status, int pagina, int tamanho) {

        return listarChamadosPaginados(status, null, pagina, tamanho);
    }

    public PaginaChamadosResposta listarChamadosPaginados(
            String status, String prioridade, int pagina, int tamanho) {

        if (pagina < 0) {
            throw new IllegalArgumentException(
                "A página deve ser maior ou igual a zero."
            );
        }

        if (tamanho < 1 || tamanho > 100) {
            throw new IllegalArgumentException(
                "O tamanho da página deve estar entre 1 e 100."
            );
        }

        if ((long) pagina * tamanho > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                "A página solicitada excede o limite permitido."
            );
        }

        String statusNormalizado = status == null
            ? null
            : normalizarStatus(status);

        String prioridadeNormalizada = prioridade == null
            ? null
            : normalizarPrioridade(prioridade);

        PageRequest paginacao = PageRequest.of(
            pagina,
            tamanho,
            Sort.by("id").ascending()
        );

        Page<Chamado> resultado;

        if (statusNormalizado != null && prioridadeNormalizada != null) {
            resultado = repository.findByStatusAndPrioridade(
                statusNormalizado,
                prioridadeNormalizada,
                paginacao
            );
        } else if (statusNormalizado != null) {
            resultado = repository.findByStatus(
                statusNormalizado,
                paginacao
            );
        } else if (prioridadeNormalizada != null) {
            resultado = repository.findByPrioridade(
                prioridadeNormalizada,
                paginacao
            );
        } else {
            resultado = repository.findAll(paginacao);
        }

        return new PaginaChamadosResposta(
            resultado.getContent(),
            resultado.getNumber(),
            resultado.getSize(),
            resultado.getTotalElements(),
            resultado.getTotalPages(),
            resultado.hasNext()
        );
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

    private String normalizarPrioridade(String prioridade) {
        return switch (prioridade.trim().toLowerCase(Locale.ROOT)) {
            case "baixa" -> "Baixa";
            case "normal" -> "Normal";
            case "alta" -> "Alta";
            default -> throw new IllegalArgumentException(
                "Prioridade inválida. Use: Baixa, Normal ou Alta."
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