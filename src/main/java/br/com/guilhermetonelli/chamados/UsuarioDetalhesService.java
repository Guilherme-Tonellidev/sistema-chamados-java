package br.com.guilhermetonelli.chamados;

import java.util.Collections;
import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioDetalhesService implements UserDetailsService {

    private final UsuarioRepository repository;

    public UsuarioDetalhesService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        if (email == null || email.isBlank()) {
            throw usuarioNaoEncontrado();
        }

        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);

        Usuario usuario = repository.findByEmail(emailNormalizado)
            .orElseThrow(this::usuarioNaoEncontrado);

        return User.withUsername(usuario.getEmail())
            .password(usuario.getSenhaHash())
            .authorities(Collections.emptyList())
            .disabled(!usuario.isAtivo())
            .build();
    }

    private UsernameNotFoundException usuarioNaoEncontrado() {
        return new UsernameNotFoundException("Credenciais inválidas.");
    }
}