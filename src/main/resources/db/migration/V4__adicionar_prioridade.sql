ALTER TABLE chamados
ADD COLUMN prioridade VARCHAR(20) DEFAULT 'Normal' NOT NULL;

ALTER TABLE chamados
ADD CONSTRAINT ck_chamados_prioridade
CHECK (prioridade IN ('Baixa', 'Normal', 'Alta'));