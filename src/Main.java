import java.util.ArrayList;
import java.util.Scanner;

public class Main {

    private static final Scanner sc = new Scanner(System.in);
    private static final ArrayList<Chamado> chamados = new ArrayList<>();

    private static int proximoId = 1;

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

        Chamado novoChamado = new Chamado(
            proximoId,
            titulo,
            descricao
        );

        chamados.add(novoChamado);
        proximoId++;

        System.out.println(
            "Chamado nº " + novoChamado.getId()
            + " aberto com sucesso!"
        );
    }

    private static void listarChamados() {
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

    private static Chamado buscarChamadoPorId(int id) {
        for (Chamado chamado : chamados) {
            if (chamado.getId() == id) {
                return chamado;
            }
        }

        return null;
    }

    private static void atualizarStatus() {
        if (chamados.isEmpty()) {
            System.out.println("Nenhum chamado cadastrado.");
            return;
        }

        int id = lerInteiro("Número do chamado: ");
        Chamado chamado = buscarChamadoPorId(id);

        if (chamado == null) {
            System.out.println("Chamado não encontrado.");
            return;
        }

        System.out.println("Título: " + chamado.getTitulo());
        System.out.println("Status atual: " + chamado.getStatus());
        System.out.println("1 - Iniciar atendimento");
        System.out.println("2 - Resolver chamado");

        int acao = lerInteiro("Escolha uma ação: ");

        try {
            switch (acao) {
                case 1:
                    chamado.iniciarAtendimento();
                    break;

                case 2:
                    chamado.resolver();
                    break;

                default:
                    System.out.println("Ação inválida.");
                    return;
            }

            System.out.println(
                "Status atualizado: " + chamado.getStatus()
            );

        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }
    }
}