package br.com.guilhermetonelli.chamados;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "chamados")
public class Chamado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "text")
    private String titulo;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(nullable = false)
    private String status;

    protected Chamado() {
    }

    public Chamado(String titulo, String descricao) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = "Aberto";
    }

    public Chamado(int id, String titulo, String descricao) {
        this(titulo, descricao);
        this.id = id;
    }

    public Integer getId() {
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