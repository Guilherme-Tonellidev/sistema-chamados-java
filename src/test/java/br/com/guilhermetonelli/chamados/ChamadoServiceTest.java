package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ChamadoServiceTest extends BaseIntegracaoTest {

    @Test
    void deveCadastrarChamadoComStatusAberto() {
        Chamado criado = service.abrirChamado(
            "Computador não liga",
            "O equipamento não responde ao botão."
        );

        Chamado salvo = service.buscarChamadoPorId(criado.getId());

        assertNotNull(salvo.getId());
        assertEquals("Computador não liga", salvo.getTitulo());
        assertEquals(
            "O equipamento não responde ao botão.",
            salvo.getDescricao()
        );
        assertEquals("Aberto", salvo.getStatus());
        assertEquals(1, repository.count());
    }

    @Test
    void deveGerarNumerosDiferentesParaOsChamados() {
        Chamado primeiro = service.abrirChamado(
            "Teclado", "Teclas não funcionam."
        );
        Chamado segundo = service.abrirChamado(
            "Monitor", "Tela apagada."
        );

        assertNotEquals(primeiro.getId(), segundo.getId());
        assertEquals(2, service.listarChamados().size());
    }

    @Test
    void deveRecusarTituloVazioSemCadastrarChamado() {
        assertThrows(
            IllegalArgumentException.class,
            () -> service.abrirChamado("   ", "Descrição válida.")
        );

        assertEquals(0, repository.count());
    }

    @Test
    void deveRecusarDescricaoVaziaSemCadastrarChamado() {
        assertThrows(
            IllegalArgumentException.class,
            () -> service.abrirChamado("Título válido", "   ")
        );

        assertEquals(0, repository.count());
    }

    @Test
    void devePermitirFluxoDeAbertoAteResolvido() {
        int id = service.abrirChamado(
            "Sem internet", "Computador sem conexão."
        ).getId();

        service.iniciarAtendimento(id);
        assertEquals(
            "Em atendimento",
            service.buscarChamadoPorId(id).getStatus()
        );

        service.resolverChamado(id);
        assertEquals(
            "Resolvido",
            service.buscarChamadoPorId(id).getStatus()
        );
    }

    @Test
    void deveImpedirResolucaoDeChamadoAberto() {
        int id = service.abrirChamado(
            "Impressora", "Documentos presos na fila."
        ).getId();

        assertThrows(
            IllegalStateException.class,
            () -> service.resolverChamado(id)
        );

        assertEquals(
            "Aberto",
            service.buscarChamadoPorId(id).getStatus()
        );
    }

    @Test
    void deveImpedirReaberturaDeChamadoResolvido() {
        int id = service.abrirChamado(
            "Mouse", "Cursor não se movimenta."
        ).getId();

        service.iniciarAtendimento(id);
        service.resolverChamado(id);

        assertThrows(
            IllegalStateException.class,
            () -> service.iniciarAtendimento(id)
        );

        assertEquals(
            "Resolvido",
            service.buscarChamadoPorId(id).getStatus()
        );
    }

    @Test
    void deveInformarErroAoBuscarChamadoInexistente() {
        assertThrows(
            IllegalArgumentException.class,
            () -> service.buscarChamadoPorId(-1)
        );
    }
}