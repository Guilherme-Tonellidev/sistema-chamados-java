package br.com.guilhermetonelli.chamados;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration(proxyBeanMethods = false)
@Profile("e2e")
public class ConfiguracaoUsuarioE2E {

    @Bean
    ApplicationRunner prepararTecnicoE2E(
            UsuarioRepository usuarios,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbc) {

        return args -> {
            Usuario tecnico = usuarios
                .findByEmail("tecnico@example.com")
                .orElseGet(() -> usuarios.saveAndFlush(
                    new Usuario(
                        "Técnico de TI",
                        "tecnico@example.com",
                        passwordEncoder.encode(
                            "TecnicoTeste2026!"
                        )
                    )
                ));

            jdbc.update(
                """
                UPDATE usuarios
                SET perfil = ?, ativo = ?
                WHERE id = ?
                """,
                PerfilUsuario.ATENDENTE.name(),
                true,
                tecnico.getId()
            );
        };
    }
}