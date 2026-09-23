CREATE TABLE fotos_chamados (
    id VARCHAR(36) PRIMARY KEY,
    chamado_id INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    tamanho INTEGER NOT NULL,
    conteudo BYTEA NOT NULL,

    CONSTRAINT fk_fotos_chamado
        FOREIGN KEY (chamado_id)
        REFERENCES chamados (id)
        ON DELETE CASCADE,

    CONSTRAINT ck_fotos_tipo
        CHECK (tipo IN ('image/jpeg', 'image/png')),

    CONSTRAINT ck_fotos_tamanho
        CHECK (tamanho > 0 AND tamanho <= 5242880)
);

CREATE INDEX idx_fotos_chamado
    ON fotos_chamados (chamado_id);