package br.com.guilhermetonelli.chamados;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private static final Pattern FORMATO_EMAIL = Pattern.compile(
        "^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@"
        + "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
        + "(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$"
    );

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResposta cadastrar(CriarUsuarioRequest dados) {
        if (dados == null) {
            throw new IllegalArgumentException(
                "Informe os dados do usuário."
            );
        }

        String nome = validarNome(dados.nome());
        String email = validarEmail(dados.email());
        String senha = validarSenha(dados.senha());

        if (repository.findByEmail(email).isPresent()) {
            throw emailJaCadastrado();
        }

        String senhaHash = passwordEncoder.encode(senha);
        Usuario usuario = new Usuario(nome, email, senhaHash);

        try {
            Usuario salvo = repository.saveAndFlush(usuario);
            return UsuarioResposta.de(salvo);
        } catch (DataIntegrityViolationException exception) {
            // A restrição do banco também protege contra cadastros simultâneos.
            if (violouUnicidadeEmail(exception)) {
                throw emailJaCadastrado();
            }

            throw exception;
        }
    }

    private static String validarNome(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }

        String normalizado = nome.trim();

        if (normalizado.length() > 100) {
            throw new IllegalArgumentException(
                "Nome deve ter no máximo 100 caracteres."
            );
        }

        return normalizado;
    }

    private static String validarEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }

        String normalizado = email.trim().toLowerCase(Locale.ROOT);

        if (normalizado.length() > 254
                || !FORMATO_EMAIL.matcher(normalizado).matches()) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }

        String parteLocal = normalizado.substring(
            0,
            normalizado.indexOf('@')
        );

        if (parteLocal.startsWith(".")
                || parteLocal.endsWith(".")
                || parteLocal.contains("..")) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }

        return normalizado;
    }

    private static String validarSenha(String senha) {
        if (senha == null || senha.isBlank()) {
            throw new IllegalArgumentException("Senha é obrigatória.");
        }

        int caracteres = senha.codePointCount(0, senha.length());

        if (caracteres < 15) {
            throw new IllegalArgumentException(
                "Senha deve ter pelo menos 15 caracteres."
            );
        }

        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException(
                "Senha deve ter no máximo 72 bytes em UTF-8."
            );
        }

        return senha;
    }

    private static IllegalStateException emailJaCadastrado() {
        return new IllegalStateException("E-mail já cadastrado.");
    }

    private static boolean violouUnicidadeEmail(Throwable exception) {
        Throwable causa = exception;

        while (causa != null) {
            if (causa instanceof ConstraintViolationException violacao) {
                String nomeRestricao = violacao.getConstraintName();

                if (nomeRestricao != null
                        && nomeRestricao.toLowerCase(Locale.ROOT)
                            .contains("uk_usuarios_email")) {
                    return true;
                }
            }

            causa = causa.getCause();
        }

        return false;
    }
}