package br.com.guilhermetonelli.chamados;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ChamadoServiceTest {

    private ChamadoService service;

    @BeforeEach
    void preparar() {
        service = new ChamadoService();
    }

    @Test
    void deveCadastrarChamadoComStatusAberto() {
        Chamado chamado = service.abrirChamado(
            "Computador não liga",
            "O equipamento não responde ao botão."
        );

        assertEquals("Computador não liga", chamado.getTitulo());
        assertEquals(
            "O equipamento não responde ao botão.",
            chamado.getDescricao()
        );
        assertEquals("Aberto", chamado.getStatus());

        assertEquals(1, service.listarChamados().size());
        assertSame(
            chamado,
            service.buscarChamadoPorId(chamado.getId())
        );
    }

    @Test
    void deveGerarNumerosDiferentesParaOsChamados() {
        Chamado primeiro = service.abrirChamado(
            "Problema no teclado",
            "Algumas teclas não funcionam."
        );

        Chamado segundo = service.abrirChamado(
            "Problema no monitor",
            "A tela está apagada."
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

        assertTrue(service.listarChamados().isEmpty());
    }

    @Test
    void deveRecusarDescricaoVaziaSemCadastrarChamado() {
        assertThrows(
            IllegalArgumentException.class,
            () -> service.abrirChamado("Título válido", "   ")
        );

        assertTrue(service.listarChamados().isEmpty());
    }

    @Test
    void devePermitirFluxoDeAbertoAteResolvido() {
        Chamado chamado = service.abrirChamado(
            "Sem acesso à internet",
            "O computador está sem conexão."
        );

        service.iniciarAtendimento(chamado.getId());

        assertEquals("Em atendimento", chamado.getStatus());

        service.resolverChamado(chamado.getId());

        assertEquals("Resolvido", chamado.getStatus());
    }

    @Test
    void deveImpedirResolucaoDeChamadoAberto() {
        Chamado chamado = service.abrirChamado(
            "Impressora não imprime",
            "Os documentos ficam na fila."
        );

        assertThrows(
            IllegalStateException.class,
            () -> service.resolverChamado(chamado.getId())
        );

        assertEquals("Aberto", chamado.getStatus());
    }

    @Test
    void deveImpedirReaberturaDeChamadoResolvido() {
        Chamado chamado = service.abrirChamado(
            "Mouse não funciona",
            "O cursor não se movimenta."
        );

        service.iniciarAtendimento(chamado.getId());
        service.resolverChamado(chamado.getId());

        assertThrows(
            IllegalStateException.class,
            () -> service.iniciarAtendimento(chamado.getId())
        );

        assertEquals("Resolvido", chamado.getStatus());
    }

    @Test
    void deveInformarErroAoBuscarChamadoInexistente() {
        assertThrows(
            IllegalArgumentException.class,
            () -> service.buscarChamadoPorId(999)
        );
    }
}