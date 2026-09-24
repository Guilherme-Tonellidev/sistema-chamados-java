ALTER TABLE chamados
    ADD COLUMN solicitante_id INTEGER;

ALTER TABLE chamados
    ADD CONSTRAINT fk_chamados_solicitante
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id);

CREATE INDEX idx_chamados_solicitante_id
    ON chamados (solicitante_id, id);