package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Scanner;

import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

public class Main {

    private final Scanner sc;
    private final ChamadoService service;

    public Main(Scanner sc, ChamadoService service) {
        this.sc = sc;
        this.service = service;
    }

    public static void main(String[] args) {
        try (
            ConfigurableApplicationContext context =
                new SpringApplicationBuilder(ChamadosApplication.class)
                    .web(WebApplicationType.NONE)
                    .run(args);

            Scanner sc = new Scanner(System.in)
        ) {
            ChamadoService service = context.getBean(ChamadoService.class);
            new Main(sc, service).executar();
        }
    }

    private void executar() {
        boolean executando = true;

        while (executando) {
            System.out.println("\n=== SISTEMA DE CHAMADOS ===");
            System.out.println("1 - Abrir chamado");
            System.out.println("2 - Listar chamados");
            System.out.println("3 - Atualizar status");
            System.out.println("0 - Sair");

            int opcao = lerInteiro("Escolha uma opção: ");

            switch (opcao) {
                case 1:
                    abrirChamado();
                    break;
                case 2:
                    listarChamados();
                    break;
                case 3:
                    atualizarStatus();
                    break;
                case 0:
                    executando = false;
                    System.out.println("Sistema encerrado.");
                    break;
                default:
                    System.out.println("Opção inválida.");
            }
        }
    }

    private int lerInteiro(String mensagem) {
        while (true) {
            System.out.print(mensagem);

            if (sc.hasNextInt()) {
                int numero = sc.nextInt();
                sc.nextLine();
                return numero;
            }

            System.out.println("Digite um número inteiro válido.");
            sc.nextLine();
        }
    }

    private String lerTextoObrigatorio(String mensagem) {
        while (true) {
            System.out.print(mensagem);
            String texto = sc.nextLine().trim();

            if (!texto.isEmpty()) {
                return texto;
            }

            System.out.println("Este campo não pode ficar vazio.");
        }
    }

    private void abrirChamado() {
        String titulo = lerTextoObrigatorio("Título do chamado: ");
        String descricao = lerTextoObrigatorio("Descrição do problema: ");

        try {
            Chamado chamado = service.abrirChamado(titulo, descricao);
            System.out.println(
                "Chamado nº " + chamado.getId() + " aberto com sucesso!"
            );
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }

    private void listarChamados() {
        List<Chamado> chamados = service.listarChamados();

        if (chamados.isEmpty()) {
            System.out.println("Nenhum chamado cadastrado.");
            return;
        }

        for (Chamado chamado : chamados) {
            System.out.println("--------------------");
            System.out.println("Número: " + chamado.getId());
            System.out.println("Título: " + chamado.getTitulo());
            System.out.println("Descrição: " + chamado.getDescricao());
            System.out.println("Status: " + chamado.getStatus());
        }
    }

    private void atualizarStatus() {
        int id = lerInteiro("Número do chamado: ");

        try {
            Chamado chamado = service.buscarChamadoPorId(id);

            System.out.println("Título: " + chamado.getTitulo());
            System.out.println("Status atual: " + chamado.getStatus());
            System.out.println("1 - Iniciar atendimento");
            System.out.println("2 - Resolver chamado");

            int acao = lerInteiro("Escolha uma ação: ");

            switch (acao) {
                case 1:
                    service.iniciarAtendimento(id);
                    break;
                case 2:
                    service.resolverChamado(id);
                    break;
                default:
                    System.out.println("Ação inválida.");
                    return;
            }

            System.out.println(
                "Status atualizado: "
                + service.buscarChamadoPorId(id).getStatus()
            );

        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println(e.getMessage());
        }
    }
}