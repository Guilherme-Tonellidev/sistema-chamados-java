package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Scanner;

public class Main {

    private static final Scanner sc = new Scanner(System.in);
    private static final ChamadoService service = new ChamadoService();

    public static void main(String[] args) {
        boolean executando = true;

        while (executando) {
            exibirMenu();
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

        sc.close();
    }

    private static void exibirMenu() {
        System.out.println("\n=== SISTEMA DE CHAMADOS ===");
        System.out.println("1 - Abrir chamado");
        System.out.println("2 - Listar chamados");
        System.out.println("3 - Atualizar status");
        System.out.println("0 - Sair");
    }

    private static int lerInteiro(String mensagem) {
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

    private static String lerTextoObrigatorio(String mensagem) {
        while (true) {
            System.out.print(mensagem);
            String texto = sc.nextLine().trim();

            if (!texto.isEmpty()) {
                return texto;
            }

            System.out.println("Este campo não pode ficar vazio.");
        }
    }

    private static void abrirChamado() {
        String titulo = lerTextoObrigatorio("Título do chamado: ");
        String descricao = lerTextoObrigatorio("Descrição do problema: ");

        try {
            Chamado chamado = service.abrirChamado(titulo, descricao);

            System.out.println(
                "Chamado nº " + chamado.getId()
                + " aberto com sucesso!"
            );

        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }

    private static void listarChamados() {
        List<Chamado> chamados = service.listarChamados();

        if (chamados.isEmpty()) {
            System.out.println("Nenhum chamado cadastrado.");
            return;
        }

        System.out.println("\n=== CHAMADOS CADASTRADOS ===");

        for (Chamado chamado : chamados) {
            System.out.println("--------------------");
            System.out.println("Número: " + chamado.getId());
            System.out.println("Título: " + chamado.getTitulo());
            System.out.println("Descrição: " + chamado.getDescricao());
            System.out.println("Status: " + chamado.getStatus());
        }
    }

    private static void atualizarStatus() {
        if (service.listarChamados().isEmpty()) {
            System.out.println("Nenhum chamado cadastrado.");
            return;
        }

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
                "Status atualizado: " + chamado.getStatus()
            );

        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println(e.getMessage());
        }
    }
}