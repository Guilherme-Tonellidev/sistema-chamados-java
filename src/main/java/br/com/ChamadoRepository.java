package br.com.guilhermetonelli.chamados;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChamadoRepository
        extends JpaRepository<Chamado, Integer> {

    List<Chamado> findByStatusOrderByIdAsc(String status);

    List<Chamado> findByPrioridadeOrderByIdAsc(String prioridade);

    List<Chamado> findByStatusAndPrioridadeOrderByIdAsc(
        String status,
        String prioridade
    );

    Page<Chamado> findByStatus(String status, Pageable pageable);

    Page<Chamado> findByPrioridade(
        String prioridade,
        Pageable pageable
    );

    Page<Chamado> findByStatusAndPrioridade(
        String status,
        String prioridade,
        Pageable pageable
    );

    Optional<Chamado> findByIdAndSolicitanteId(
        Integer id,
        Integer solicitanteId
    );

    @Query("""
        select c
        from Chamado c
        where (:atendente = true or c.solicitanteId = :usuarioId)
          and (:status is null or c.status = :status)
          and (:prioridade is null or c.prioridade = :prioridade)
        """)
    List<Chamado> listarPermitidos(
        @Param("usuarioId") Integer usuarioId,
        @Param("atendente") boolean atendente,
        @Param("status") String status,
        @Param("prioridade") String prioridade,
        Sort ordenacao
    );

    @Query(
        value = """
            select c
            from Chamado c
            where (:atendente = true or c.solicitanteId = :usuarioId)
              and (:status is null or c.status = :status)
              and (:prioridade is null or c.prioridade = :prioridade)
            """,
        countQuery = """
            select count(c)
            from Chamado c
            where (:atendente = true or c.solicitanteId = :usuarioId)
              and (:status is null or c.status = :status)
              and (:prioridade is null or c.prioridade = :prioridade)
            """
    )
    Page<Chamado> listarPermitidosPaginados(
        @Param("usuarioId") Integer usuarioId,
        @Param("atendente") boolean atendente,
        @Param("status") String status,
        @Param("prioridade") String prioridade,
        Pageable paginacao
    );
}