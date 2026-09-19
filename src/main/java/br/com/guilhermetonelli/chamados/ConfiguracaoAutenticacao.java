package br.com.guilhermetonelli.chamados;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class ConfiguracaoAutenticacao {

    @Bean
    public AuthenticationManager authenticationManager(
            UsuarioDetalhesService usuarioDetalhesService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(usuarioDetalhesService);

        provider.setPasswordEncoder(passwordEncoder);
        provider.setHideUserNotFoundExceptions(true);

        return new ProviderManager(provider);
    }
}