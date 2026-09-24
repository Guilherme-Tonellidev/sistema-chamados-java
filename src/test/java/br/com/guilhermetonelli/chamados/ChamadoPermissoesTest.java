package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.test.context.TestSecurityContextHolder;

public class ChamadoPermissoesTest extends BaseIntegracaoTest {

    @Test
    void deveVincularNovoChamadoAoUsuarioAutenticado() {
        Usuario solicitante = criarSolicitante();
        autenticarComo(solicitante);

        Chamado chamado = service.abrirChamado(
            "Computador não liga",
            "O equipamento não responde."
        );

        Chamado salvo = repository.findById(chamado.getId())
            .orElseThrow();

        assertEquals(
            solicitante.getId(),
            salvo.getSolicitanteId()
        );
    }

    @Test
    void solicitanteDeveListarSomenteOsPropriosChamados() {
        Usuario primeiro = criarSolicitante();
        Usuario segundo = criarSolicitante();

        autenticarComo(primeiro);
        Chamado chamadoPrimeiro = service.abrirChamado(
            "Chamado do primeiro",
            "Descrição do primeiro."
        );

        autenticarComo(segundo);
        service.abrirChamado(
            "Chamado do segundo",
            "Descrição do segundo."
        );

        autenticarComo(primeiro);
        var chamados = service.listarChamados();

        assertEquals(1, chamados.size());
        assertEquals(
            chamadoPrimeiro.getId(),
            chamados.getFirst().getId()
        );
    }

    @Test
    void solicitanteNaoDeveConsultarChamadoDeOutraPessoa() {
        Usuario primeiro = criarSolicitante();
        Usuario segundo = criarSolicitante();

        autenticarComo(primeiro);
        Chamado chamado = service.abrirChamado(
            "Chamado particular",
            "Descrição do primeiro solicitante."
        );

        autenticarComo(segundo);

        assertThrows(
            ChamadoNaoEncontradoException.class,
            () -> service.buscarChamadoPorId(chamado.getId())
        );
    }

    @Test
    void solicitanteNaoDeveIniciarAtendimento() {
        Usuario solicitante = criarSolicitante();
        autenticarComo(solicitante);

        Chamado chamado = service.abrirChamado(
            "Impressora",
            "Documentos presos na fila."
        );

        assertThrows(
            AccessDeniedException.class,
            () -> service.iniciarAtendimento(chamado.getId())
        );

        Chamado salvo = repository.findById(chamado.getId())
            .orElseThrow();

        assertEquals("Aberto", salvo.getStatus());
        assertNull(salvo.getDataInicioAtendimento());
    }

    @Test
    void solicitanteNaoDeveResolverChamadoEmAtendimento() {
        Usuario solicitante = criarSolicitante();
        autenticarComo(solicitante);

        Chamado chamado = service.abrirChamado(
            "Sem conexão",
            "Computador sem acesso à rede."
        );

        autenticarComo(usuarioTeste);
        service.iniciarAtendimento(chamado.getId());

        autenticarComo(solicitante);

        assertThrows(
            AccessDeniedException.class,
            () -> service.resolverChamado(chamado.getId())
        );

        Chamado salvo = repository.findById(chamado.getId())
            .orElseThrow();

        assertEquals("Em atendimento", salvo.getStatus());
        assertNull(salvo.getDataResolucao());
    }

    @Test
    void atendenteDeveResolverChamadoDeOutroUsuario() {
        Usuario solicitante = criarSolicitante();
        autenticarComo(solicitante);

        Chamado chamado = service.abrirChamado(
            "Monitor",
            "Tela apagada."
        );

        autenticarComo(usuarioTeste);

        service.iniciarAtendimento(chamado.getId());
        service.resolverChamado(chamado.getId());

        Chamado salvo = service.buscarChamadoPorId(chamado.getId());

        assertEquals("Resolvido", salvo.getStatus());
        assertEquals(
            solicitante.getId(),
            salvo.getSolicitanteId()
        );
        assertNotNull(salvo.getDataInicioAtendimento());
        assertNotNull(salvo.getDataResolucao());
    }

    @Test
    void somenteAtendenteDeveConsultarChamadoAntigoSemSolicitante() {
        Chamado antigo = repository.saveAndFlush(
            new Chamado(
                "Chamado antigo",
                "Registro anterior ao vínculo com usuários."
            )
        );

        Usuario solicitante = criarSolicitante();
        autenticarComo(solicitante);

        assertTrue(service.listarChamados().isEmpty());

        assertThrows(
            ChamadoNaoEncontradoException.class,
            () -> service.buscarChamadoPorId(antigo.getId())
        );

        autenticarComo(usuarioTeste);

        Chamado encontrado =
            service.buscarChamadoPorId(antigo.getId());

        assertEquals(antigo.getId(), encontrado.getId());
        assertNull(encontrado.getSolicitanteId());
    }

    @Test
    void deveRecusarOperacoesSemAutenticacao() {
        TestSecurityContextHolder.clearContext();

        assertThrows(
            AuthenticationCredentialsNotFoundException.class,
            () -> service.listarChamados()
        );

        assertThrows(
            AuthenticationCredentialsNotFoundException.class,
            () -> service.abrirChamado(
                "Sem sessão",
                "Não deve ser cadastrado."
            )
        );

        assertEquals(0, repository.count());
    }
}