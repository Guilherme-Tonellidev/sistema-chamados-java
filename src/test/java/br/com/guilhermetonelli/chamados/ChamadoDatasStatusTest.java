package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChamadoDatasStatusTest {

    @Autowired
    private ChamadoService service;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void deveGravarAsDatasEManterOHistoricoAoResolver() {
        Chamado criado = service.abrirChamado(
            "Teste das datas de status",
            "Conferir a persistencia dos horarios."
        );

        Integer id = criado.getId();
        Chamado aberto = recarregar(id);

        Instant abertura = aberto.getDataAbertura();

        assertNotNull(abertura);
        assertNull(aberto.getDataInicioAtendimento());
        assertNull(aberto.getDataResolucao());

        service.iniciarAtendimento(id);

        Chamado emAtendimento = recarregar(id);
        Instant inicio = emAtendimento.getDataInicioAtendimento();

        assertEquals("Em atendimento", emAtendimento.getStatus());
        assertNotNull(inicio);
        assertEquals(abertura, emAtendimento.getDataAbertura());
        assertNull(emAtendimento.getDataResolucao());

        service.resolverChamado(id);

        Chamado resolvido = recarregar(id);

        assertEquals("Resolvido", resolvido.getStatus());
        assertNotNull(resolvido.getDataResolucao());
        assertEquals(abertura, resolvido.getDataAbertura());
        assertEquals(inicio, resolvido.getDataInicioAtendimento());
    }

    @Test
    void transicoesInvalidasNaoDevemAlterarAsDatas() {
        Chamado chamado = new Chamado(
            "Transicoes invalidas",
            "Preservar datas quando a operacao for rejeitada."
        );

        entityManager.persist(chamado);

        Integer id = chamado.getId();
        Chamado aberto = recarregar(id);

        assertThrows(IllegalStateException.class, aberto::resolver);
        assertNull(aberto.getDataInicioAtendimento());
        assertNull(aberto.getDataResolucao());

        aberto.iniciarAtendimento();

        Chamado emAtendimento = recarregar(id);
        Instant inicio = emAtendimento.getDataInicioAtendimento();

        assertThrows(
            IllegalStateException.class,
            emAtendimento::iniciarAtendimento
        );

        assertEquals(inicio, emAtendimento.getDataInicioAtendimento());
        assertNull(emAtendimento.getDataResolucao());

        emAtendimento.resolver();

        Chamado resolvido = recarregar(id);
        Instant resolucao = resolvido.getDataResolucao();

        assertThrows(IllegalStateException.class, resolvido::resolver);
        assertThrows(
            IllegalStateException.class,
            resolvido::iniciarAtendimento
        );

        Chamado encontrado = recarregar(id);

        assertEquals("Resolvido", encontrado.getStatus());
        assertEquals(inicio, encontrado.getDataInicioAtendimento());
        assertEquals(resolucao, encontrado.getDataResolucao());
    }

    @Test
    void deveResolverRegistroLegadoSemInventarDatasAnteriores() {
        String titulo = "Atendimento antigo " + UUID.randomUUID();

        entityManager.createNativeQuery("""
            INSERT INTO chamados (titulo, descricao, status)
            VALUES (:titulo, :descricao, :status)
            """)
            .setParameter("titulo", titulo)
            .setParameter("descricao", "Registro anterior ao controle de datas.")
            .setParameter("status", "Em atendimento")
            .executeUpdate();

        entityManager.clear();

        Chamado antigo = entityManager.createQuery(
            "SELECT c FROM Chamado c WHERE c.titulo = :titulo",
            Chamado.class
        )
            .setParameter("titulo", titulo)
            .getSingleResult();

        assertNull(antigo.getDataAbertura());
        assertNull(antigo.getDataInicioAtendimento());
        assertNull(antigo.getDataResolucao());

        Integer id = antigo.getId();

        service.resolverChamado(id);

        Chamado resolvido = recarregar(id);

        assertEquals("Resolvido", resolvido.getStatus());
        assertNull(resolvido.getDataAbertura());
        assertNull(resolvido.getDataInicioAtendimento());
        assertNotNull(resolvido.getDataResolucao());
    }

    private Chamado recarregar(Integer id) {
        entityManager.flush();
        entityManager.clear();
        return entityManager.find(Chamado.class, id);
    }
}