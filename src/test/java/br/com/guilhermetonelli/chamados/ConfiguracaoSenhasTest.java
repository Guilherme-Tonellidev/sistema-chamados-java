package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ConfiguracaoSenhasTest {

    // Senha fictícia usada exclusivamente nestes testes.
    private static final String SENHA_TESTE = "SenhaDeTeste-2026!";

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void deveGerarHashEReconhecerSenhaCorreta() {
        String hash = passwordEncoder.encode(SENHA_TESTE);

        assertNotEquals(SENHA_TESTE, hash);
        assertTrue(hash.startsWith("{bcrypt}"));
        assertTrue(hash.length() <= 255);
        assertTrue(passwordEncoder.matches(SENHA_TESTE, hash));
    }

    @Test
    void deveRejeitarSenhaIncorreta() {
        String hash = passwordEncoder.encode(SENHA_TESTE);

        assertFalse(
            passwordEncoder.matches("OutraSenhaDeTeste-2026!", hash)
        );
    }

    @Test
    void deveGerarHashesDiferentesParaMesmaSenha() {
        String primeiroHash = passwordEncoder.encode(SENHA_TESTE);
        String segundoHash = passwordEncoder.encode(SENHA_TESTE);

        assertNotEquals(primeiroHash, segundoHash);
        assertTrue(passwordEncoder.matches(SENHA_TESTE, primeiroHash));
        assertTrue(passwordEncoder.matches(SENHA_TESTE, segundoHash));
    }
}