package br.com.guilhermetonelli.chamados;

import java.time.Instant;
import java.util.Locale;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chamados")
public class Chamado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "solicitante_id", updatable = false)
    private Integer solicitanteId;

    @Column(nullable = false, columnDefinition = "text")
    private String titulo;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, length = 20)
    private String prioridade;

    @Column(name = "data_abertura", updatable = false)
    private Instant dataAbertura;

    @Column(name = "data_inicio_atendimento")
    private Instant dataInicioAtendimento;

    @Column(name = "data_resolucao")
    private Instant dataResolucao;

    protected Chamado() {
    }

    public Chamado(String titulo, String descricao) {
        this(titulo, descricao, null);
    }

    public Chamado(String titulo, String descricao, String prioridade) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = "Aberto";
        this.prioridade = normalizarPrioridade(prioridade);
    }

    public Chamado(int id, String titulo, String descricao) {
        this(titulo, descricao);
        this.id = id;
    }

    public Chamado(
        String titulo,
        String descricao,
        String prioridade,
        Integer solicitanteId) {

    this(titulo, descricao, prioridade);

    if (solicitanteId == null || solicitanteId <= 0) {
        throw new IllegalArgumentException(
            "O solicitante do chamado é obrigatório."
        );
    }

    this.solicitanteId = solicitanteId;
}

    private static String normalizarPrioridade(String prioridade) {
        if (prioridade == null) {
            return "Normal";
        }

        return switch (prioridade.trim().toLowerCase(Locale.ROOT)) {
            case "baixa" -> "Baixa";
            case "normal" -> "Normal";
            case "alta" -> "Alta";
            default -> throw new IllegalArgumentException(
                "Prioridade inválida. Use: Baixa, Normal ou Alta."
            );
        };
    }

    @PrePersist
    protected void registrarDataAbertura() {
        if (dataAbertura == null) {
            dataAbertura = Instant.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public Integer getSolicitanteId() {
        return solicitanteId;
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

    public String getPrioridade() {
        return prioridade;
    }

    public Instant getDataAbertura() {
        return dataAbertura;
    }

    public Instant getDataInicioAtendimento() {
        return dataInicioAtendimento;
    }

    public Instant getDataResolucao() {
        return dataResolucao;
    }

    public void iniciarAtendimento() {
        if (!status.equals("Aberto")) {
            throw new IllegalStateException(
                "Só é possível iniciar o atendimento de um chamado aberto."
            );
        }

        dataInicioAtendimento = Instant.now();
        status = "Em atendimento";
    }

    public void resolver() {
        if (!status.equals("Em atendimento")) {
            throw new IllegalStateException(
                "O chamado precisa estar em atendimento antes de ser resolvido."
            );
        }

        dataResolucao = Instant.now();
        status = "Resolvido";
    }
}