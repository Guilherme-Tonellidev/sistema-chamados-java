package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ChamadoService {

    private final ChamadoRepository repository;
    private final UsuarioRepository usuarioRepository;

    public ChamadoService(
            ChamadoRepository repository,
            UsuarioRepository usuarioRepository) {

        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public Chamado abrirChamado(String titulo, String descricao) {
        return abrirChamado(titulo, descricao, null);
    }

    @Transactional
    public Chamado abrirChamado(
            String titulo,
            String descricao,
            String prioridade) {

        Usuario usuario = obterUsuarioAutenticado();

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
            prioridade,
            usuario.getId()
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
            String status,
            String prioridade) {

        Usuario usuario = obterUsuarioAutenticado();

        String statusNormalizado = status == null
            ? null
            : normalizarStatus(status);

        String prioridadeNormalizada = prioridade == null
            ? null
            : normalizarPrioridade(prioridade);

        return repository.listarPermitidos(
            usuario.getId(),
            ehAtendente(usuario),
            statusNormalizado,
            prioridadeNormalizada,
            Sort.by("id").ascending()
        );
    }

    public PaginaChamadosResposta listarChamadosPaginados(
            String status,
            int pagina,
            int tamanho) {

        return listarChamadosPaginados(
            status,
            null,
            pagina,
            tamanho
        );
    }

    public PaginaChamadosResposta listarChamadosPaginados(
            String status,
            String prioridade,
            int pagina,
            int tamanho) {

        Usuario usuario = obterUsuarioAutenticado();

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

        Page<Chamado> resultado =
            repository.listarPermitidosPaginados(
                usuario.getId(),
                ehAtendente(usuario),
                statusNormalizado,
                prioridadeNormalizada,
                paginacao
            );

        return new PaginaChamadosResposta(
            resultado.getContent(),
            resultado.getNumber(),
            resultado.getSize(),
            resultado.getTotalElements(),
            resultado.getTotalPages(),
            resultado.hasNext()
        );
    }

    public Chamado buscarChamadoPorId(int id) {
        Usuario usuario = obterUsuarioAutenticado();

        return buscarChamadoPermitido(id, usuario);
    }

    @Transactional
    public void iniciarAtendimento(int id) {
        Usuario usuario = obterUsuarioAutenticado();
        exigirAtendente(usuario);

        Chamado chamado = buscarChamadoPermitido(id, usuario);
        chamado.iniciarAtendimento();

        repository.save(chamado);
    }

    @Transactional
    public void resolverChamado(int id) {
        Usuario usuario = obterUsuarioAutenticado();
        exigirAtendente(usuario);

        Chamado chamado = buscarChamadoPermitido(id, usuario);
        chamado.resolver();

        repository.save(chamado);
    }

    private Chamado buscarChamadoPermitido(int id, Usuario usuario) {
        if (ehAtendente(usuario)) {
            return repository.findById(id)
                .orElseThrow(ChamadoNaoEncontradoException::new);
        }

        return repository.findByIdAndSolicitanteId(
                id,
                usuario.getId()
            )
            .orElseThrow(ChamadoNaoEncontradoException::new);
    }

    private Usuario obterUsuarioAutenticado() {
        Authentication autenticacao =
            SecurityContextHolder.getContext().getAuthentication();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {

            throw new AuthenticationCredentialsNotFoundException(
                "Autenticação necessária."
            );
        }

        String email = autenticacao.getName();

        if (email == null || email.isBlank()) {
            throw new AuthenticationCredentialsNotFoundException(
                "Autenticação necessária."
            );
        }

        String emailNormalizado =
            email.trim().toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepository
            .findByEmail(emailNormalizado)
            .orElseThrow(() ->
                new AuthenticationCredentialsNotFoundException(
                    "Autenticação necessária."
                )
            );

        if (!usuario.isAtivo()
                || usuario.getId() == null
                || (usuario.getPerfil() != PerfilUsuario.SOLICITANTE
                    && usuario.getPerfil() != PerfilUsuario.ATENDENTE)) {

            throw new AccessDeniedException(
                "Requisição não autorizada."
            );
        }

        return usuario;
    }

    private boolean ehAtendente(Usuario usuario) {
        return usuario.getPerfil() == PerfilUsuario.ATENDENTE;
    }

    private void exigirAtendente(Usuario usuario) {
        if (!ehAtendente(usuario)) {
            throw new AccessDeniedException(
                "Somente atendentes podem alterar o status do chamado."
            );
        }
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
}