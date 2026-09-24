package br.com.guilhermetonelli.chamados;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.util.UUID;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(classes = ChamadosApplication.class)
@ActiveProfiles("test")
public abstract class BaseIntegracaoTest {

    @Autowired
    protected ChamadoService service;

    @Autowired
    protected ChamadoRepository repository;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private EntityManager contextoPersistencia;

    protected MockMvc mockMvc;

    protected Usuario usuarioTeste;

    @BeforeEach
    void prepararBancoERequisicoes() {
        TestSecurityContextHolder.clearContext();

        repository.deleteAll();
        repository.flush();

        Usuario usuario = usuarioRepository
            .findByEmail("teste@example.com")
            .orElseGet(() -> usuarioRepository.saveAndFlush(
                new Usuario(
                    "Atendente de testes",
                    "teste@example.com",
                    passwordEncoder.encode("SenhaDeTesteLocal-2026!")
                )
            ));

        // Atribuição de perfil exclusiva do banco de testes.
        jdbc.update(
            """
            UPDATE usuarios
            SET perfil = ?, ativo = ?
            WHERE id = ?
            """,
            PerfilUsuario.ATENDENTE.name(),
            true,
            usuario.getId()
        );

        Integer usuarioId = usuario.getId();

        // Recarrega o perfil atualizado diretamente por SQL.
        contextoPersistencia.clear();

        usuarioTeste = usuarioRepository.findById(usuarioId)
            .orElseThrow();

        autenticarComo(usuarioTeste);
    }

    protected Usuario criarSolicitante() {
        String email = "solicitante-"
            + UUID.randomUUID()
            + "@example.com";

        return usuarioRepository.saveAndFlush(
            new Usuario(
                "Solicitante de testes",
                email,
                usuarioTeste.getSenhaHash()
            )
        );
    }

    protected void autenticarComo(Usuario usuario) {
        UserDetails principal = User
            .withUsername(usuario.getEmail())
            .password(usuario.getSenhaHash())
            .authorities("ROLE_" + usuario.getPerfil().name())
            .disabled(!usuario.isAtivo())
            .build();

        var autenticacao =
            UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities()
            );

        TestSecurityContextHolder.setAuthentication(autenticacao);

        mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            .defaultRequest(
                get("/")
                    .with(user(principal))
                    .with(csrf())
            )
            .apply(springSecurity())
            .build();
    }

    @AfterEach
    void limparAutenticacao() {
        TestSecurityContextHolder.clearContext();
    }
}