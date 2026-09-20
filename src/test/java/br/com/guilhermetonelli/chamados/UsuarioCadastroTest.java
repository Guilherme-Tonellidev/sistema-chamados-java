package br.com.guilhermetonelli.chamados;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import jakarta.persistence.EntityManager;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UsuarioCadastroTest {

    private static final String SENHA_TESTE = "SenhaDeTeste-2026!";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntityManager entityManager;

    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders
    .webAppContextSetup(context)
    .apply(springSecurity())
    .build();

        repository.deleteAll();
        repository.flush();
        entityManager.clear();
    }

    @Test
    void deveCadastrarComDadosNormalizadosESenhaProtegida() throws Exception {
        cadastrar("  Ana Silva  ", "  ANA@Example.COM  ", SENHA_TESTE)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.nome").value("Ana Silva"))
            .andExpect(jsonPath("$.email").value("ana@example.com"))
            .andExpect(jsonPath("$.ativo").value(true))
            .andExpect(jsonPath("$.senha").doesNotExist())
            .andExpect(jsonPath("$.senhaHash").doesNotExist())
            .andExpect(jsonPath("$.senha_hash").doesNotExist());
            
        entityManager.clear();

        Usuario usuario = repository.findByEmail("ana@example.com")
            .orElseThrow();

        assertEquals(1L, repository.count());
        assertNotEquals(SENHA_TESTE, usuario.getSenhaHash());
        assertTrue(usuario.getSenhaHash().startsWith("{bcrypt}"));
        assertTrue(
            passwordEncoder.matches(SENHA_TESTE, usuario.getSenhaHash())
        );
    }

    @Test
    void deveRejeitarEmailDuplicadoAposNormalizacao() throws Exception {
        cadastrar("Ana", "ana@example.com", SENHA_TESTE)
            .andExpect(status().isCreated());

        cadastrar("Outra pessoa", "  ANA@EXAMPLE.COM  ", SENHA_TESTE)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.erro").value("E-mail já cadastrado."))
            .andExpect(jsonPath("$.caminho").value("/usuarios"));

        assertEquals(1L, repository.count());
    }

    @Test
    void deveRejeitarEmailsInvalidos() throws Exception {
        String[] emails = {
            "sem-arroba",
            "ana@",
            "@example.com",
            "ana pessoa@example.com",
            ".ana@example.com",
            "ana..silva@example.com",
            "ana@-example.com",
            "a".repeat(255) + "@example.com"
        };

        for (String email : emails) {
            cadastrar("Ana", email, SENHA_TESTE)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.erro").value(
                    "Informe um e-mail válido."
                ))
                .andExpect(jsonPath("$.caminho").value("/usuarios"));
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarCamposObrigatoriosAusentesOuVazios() throws Exception {
        String[][] casos = {
            {null, "ana@example.com", SENHA_TESTE},
            {"   ", "ana@example.com", SENHA_TESTE},
            {"Ana", null, SENHA_TESTE},
            {"Ana", "   ", SENHA_TESTE},
            {"Ana", "ana@example.com", null},
            {"Ana", "ana@example.com", "   "}
        };

        for (String[] caso : casos) {
            cadastrar(caso[0], caso[1], caso[2])
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.erro").isString())
                .andExpect(jsonPath("$.caminho").value("/usuarios"));
        }

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarNomeAcimaDoLimite() throws Exception {
        cadastrar("A".repeat(101), "ana@example.com", SENHA_TESTE)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value(
                "Nome deve ter no máximo 100 caracteres."
            ));

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarSenhaCurta() throws Exception {
        cadastrar("Ana", "ana@example.com", "a".repeat(14))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value(
                "Senha deve ter pelo menos 15 caracteres."
            ));

        assertEquals(0L, repository.count());
    }

    @Test
    void deveRejeitarSenhaAcimaDe72Bytes() throws Exception {
        cadastrar("Ana", "ana@example.com", "a".repeat(73))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value(
                "Senha deve ter no máximo 72 bytes em UTF-8."
            ));

        assertEquals(0L, repository.count());
    }

    @Test
    void deveContarBytesDaSenhaComCaracteresAcentuados() throws Exception {
        // Cada "á" ocupa dois bytes em UTF-8: 37 caracteres somam 74 bytes.
        cadastrar("Ana", "ana@example.com", "á".repeat(37))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value(
                "Senha deve ter no máximo 72 bytes em UTF-8."
            ));

        assertEquals(0L, repository.count());
    }

    @Test
    void deveAceitarSenhaNoLimiteDe72Bytes() throws Exception {
        String senha = "a".repeat(72);

        cadastrar("Ana", "ana@example.com", senha)
            .andExpect(status().isCreated());

        entityManager.clear();

        Usuario usuario = repository.findByEmail("ana@example.com")
            .orElseThrow();

        assertTrue(passwordEncoder.matches(senha, usuario.getSenhaHash()));
    }

    @Test
    void devePreservarEspacosDaSenha() throws Exception {
        String senha = "  " + SENHA_TESTE + "  ";

        cadastrar("Ana", "ana@example.com", senha)
            .andExpect(status().isCreated());

        entityManager.clear();

        Usuario usuario = repository.findByEmail("ana@example.com")
            .orElseThrow();

        assertTrue(passwordEncoder.matches(senha, usuario.getSenhaHash()));
        assertFalse(passwordEncoder.matches(senha.trim(), usuario.getSenhaHash())
        );
    }

    @Test
    void deveRejeitarJsonMalformado() throws Exception {
        mockMvc.perform(post("/usuarios")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.erro").value(
                "O corpo da requisição deve conter um JSON válido."
            ))
            .andExpect(jsonPath("$.caminho").value("/usuarios"));

        assertEquals(0L, repository.count());
    }

    private ResultActions cadastrar(
            String nome,
            String email,
            String senha) throws Exception {

        Map<String, Object> dados = new HashMap<>();
        dados.put("nome", nome);
        dados.put("email", email);
        dados.put("senha", senha);

        return mockMvc.perform(post("/usuarios")
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dados)));
    }
}
