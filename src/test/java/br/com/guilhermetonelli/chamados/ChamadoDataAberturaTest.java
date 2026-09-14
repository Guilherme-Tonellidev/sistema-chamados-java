package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChamadoDataAberturaTest {

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void deveGravarDataAberturaAoPersistirNovoChamado() {
        Instant antes = Instant.now();

        Chamado chamado = new Chamado(
            "Teste de data de abertura",
            "Verificar a gravacao automatica da data."
        );

        entityManager.persist(chamado);
        entityManager.flush();

        Integer id = chamado.getId();
        entityManager.clear();

        Chamado encontrado = entityManager.find(Chamado.class, id);
        Instant depois = Instant.now();

        assertNotNull(encontrado);
        assertNotNull(encontrado.getDataAbertura());

        // Margem para a precisão do timestamp armazenado pelo banco.
        assertFalse(
            encontrado.getDataAbertura().isBefore(antes.minusSeconds(1))
        );
        assertFalse(
            encontrado.getDataAbertura().isAfter(depois.plusSeconds(1))
        );

        assertEquals("Aberto", encontrado.getStatus());
    }

    @Test
    void deveManterDataAberturaAoIniciarAtendimentoEResolver() {
        Chamado chamado = new Chamado(
            "Preservar data original",
            "Mudar o status sem alterar a data de abertura."
        );

        entityManager.persist(chamado);
        entityManager.flush();

        Integer id = chamado.getId();
        entityManager.clear();

        Chamado encontrado = entityManager.find(Chamado.class, id);
        Instant dataOriginal = encontrado.getDataAbertura();

        assertNotNull(dataOriginal);

        encontrado.iniciarAtendimento();
        entityManager.flush();
        entityManager.clear();

        Chamado emAtendimento = entityManager.find(Chamado.class, id);

        assertEquals("Em atendimento", emAtendimento.getStatus());
        assertEquals(dataOriginal, emAtendimento.getDataAbertura());

        emAtendimento.resolver();
        entityManager.flush();
        entityManager.clear();

        Chamado resolvido = entityManager.find(Chamado.class, id);

        assertEquals("Resolvido", resolvido.getStatus());
        assertEquals(dataOriginal, resolvido.getDataAbertura());
    }

    @Test
    void deveManterDataDesconhecidaEmRegistroAntigo() {
        String titulo = "Registro antigo " + UUID.randomUUID();

        // Simula um registro legado sem data, sem executar o @PrePersist.
        entityManager.createNativeQuery("""
            INSERT INTO chamados (titulo, descricao, status)
            VALUES (:titulo, :descricao, :status)
            """)
            .setParameter("titulo", titulo)
            .setParameter("descricao", "Registro sem data de abertura conhecida.")
            .setParameter("status", "Aberto")
            .executeUpdate();

        entityManager.clear();

        Chamado antigo = entityManager.createQuery(
            "SELECT c FROM Chamado c WHERE c.titulo = :titulo",
            Chamado.class
        )
            .setParameter("titulo", titulo)
            .getSingleResult();

        assertNull(antigo.getDataAbertura());

        Integer id = antigo.getId();

        antigo.iniciarAtendimento();
        entityManager.flush();
        entityManager.clear();

        Chamado atualizado = entityManager.find(Chamado.class, id);

        assertEquals("Em atendimento", atualizado.getStatus());
        assertNull(atualizado.getDataAbertura());
    }
}