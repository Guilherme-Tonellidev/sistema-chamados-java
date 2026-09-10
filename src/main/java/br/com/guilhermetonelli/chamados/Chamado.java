package br.com.guilhermetonelli.chamados;

public class Chamado {

    private int id;
    private String titulo;
    private String descricao;
    private String status;

    public Chamado(int id, String titulo, String descricao) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = "Aberto";
    }

    public int getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getStatus() {
        return status;
    }

    public void iniciarAtendimento() {
        if (!status.equals("Aberto")) {
            throw new IllegalStateException(
                "Só é possível iniciar o atendimento de um chamado aberto."
            );
        }

        status = "Em atendimento";
    }

    public void resolver() {
        if (!status.equals("Em atendimento")) {
            throw new IllegalStateException(
                "O chamado precisa estar em atendimento antes de ser resolvido."
            );
        }

        status = "Resolvido";
    }
}