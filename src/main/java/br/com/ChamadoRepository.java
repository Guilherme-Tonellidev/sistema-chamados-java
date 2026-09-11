package br.com.guilhermetonelli.chamados;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChamadoRepository
        extends JpaRepository<Chamado, Integer> {
}