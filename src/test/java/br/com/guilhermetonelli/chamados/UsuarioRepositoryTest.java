package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UsuarioRepositoryTest {

    // Valor fictício para testar armazenamento, não autenticação.
    private static final String HASH_TESTE =
        "hash-ficticio-exclusivo-do-teste-de-persistencia";

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private ChamadoRepository chamadoRepository;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void preparar() {
    // Limpa primeiro os chamados que podem referenciar usuários.
    // Afeta somente o H2 dentro da transação deste teste.
    chamadoRepository.deleteAll();
    chamadoRepository.flush();

    repository.deleteAll();
    repository.flush();

    entityManager.clear();
}

    @Test
    void deveSalvarERecuperarUsuarioAtivo() {
        Usuario salvo = repository.saveAndFlush(
            new Usuario(
                "Ana Silva",
                "ana@example.com",
                HASH_TESTE
            )
        );

        Integer id = salvo.getId();
        assertNotNull(id);

        // Obriga a próxima consulta a recuperar os dados do banco.
        entityManager.clear();

        Usuario recuperado = repository.findById(id).orElseThrow();

        assertEquals("Ana Silva", recuperado.getNome());
        assertEquals("ana@example.com", recuperado.getEmail());
        assertEquals(HASH_TESTE, recuperado.getSenhaHash());
        assertTrue(recuperado.isAtivo());
    }

    @Test
    void deveNormalizarNomeEEmailAntesDeSalvar() {
        Usuario salvo = repository.saveAndFlush(
            new Usuario(
                "  Ana Silva  ",
                "  ANA@Example.COM  ",
                HASH_TESTE
            )
        );

        Integer id = salvo.getId();
        entityManager.clear();

        Usuario recuperado = repository.findById(id).orElseThrow();

        assertEquals("Ana Silva", recuperado.getNome());
        assertEquals("ana@example.com", recuperado.getEmail());
    }

    @Test
    void deveBuscarUsuarioPeloEmail() {
        repository.saveAndFlush(
            new Usuario(
                "Ana Silva",
                "ana@example.com",
                HASH_TESTE
            )
        );

        Usuario bruno = repository.saveAndFlush(
            new Usuario(
                "Bruno Souza",
                "bruno@example.com",
                HASH_TESTE
            )
        );

        Integer idBruno = bruno.getId();
        entityManager.clear();

        Usuario encontrado = repository
            .findByEmail("bruno@example.com")
            .orElseThrow();

        assertEquals(idBruno, encontrado.getId());
        assertEquals("Bruno Souza", encontrado.getNome());
    }

    @Test
    void deveRetornarVazioQuandoEmailNaoExiste() {
        assertTrue(
            repository.findByEmail("inexistente@example.com").isEmpty()
        );
    }

    @Test
    void deveRejeitarEmailDuplicadoAposNormalizacao() {
        repository.saveAndFlush(
            new Usuario(
                "Ana Silva",
                "ana@example.com",
                HASH_TESTE
            )
        );

        entityManager.clear();

        Usuario duplicado = new Usuario(
            "Outra pessoa",
            "  ANA@EXAMPLE.COM  ",
            HASH_TESTE
        );

        assertThrows(
            DataIntegrityViolationException.class,
            () -> repository.saveAndFlush(duplicado)
        );
    }
}