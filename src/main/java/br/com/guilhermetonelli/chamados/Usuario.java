package br.com.guilhermetonelli.chamados;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonIgnore;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @JsonIgnore
    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Column(nullable = false)
    private boolean ativo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private PerfilUsuario perfil = PerfilUsuario.SOLICITANTE;

    protected Usuario() {
    }

    // Recebe um hash já gerado. Não recebe uma senha em texto.
    public Usuario(String nome, String email, String senhaHash) {
        this.nome = validarTexto(
            nome == null ? null : nome.trim(),
            "Nome",
            100
        );

        this.email = validarTexto(
            email == null ? null : email.trim().toLowerCase(Locale.ROOT),
            "E-mail",
            254
        );

        this.senhaHash = validarTexto(senhaHash, "Hash da senha", 255);
        this.ativo = true;
        this.perfil = PerfilUsuario.SOLICITANTE;
    }

    private static String validarTexto(
            String valor,
            String campo,
            int limite) {

        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(
                campo + " é obrigatório."
            );
        }

        if (valor.length() > limite) {
            throw new IllegalArgumentException(
                campo + " deve ter no máximo " + limite + " caracteres."
            );
        }

        return valor;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    @JsonIgnore
    public String getSenhaHash() {
        return senhaHash;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public PerfilUsuario getPerfil() {
        return perfil;
    }
}