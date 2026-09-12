package br.com.guilhermetonelli.chamados;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChamadoRepository
        extends JpaRepository<Chamado, Integer> {

    List<Chamado> findByStatusOrderByIdAsc(String status);

    Page<Chamado> findByStatus(String status, Pageable pageable);
}