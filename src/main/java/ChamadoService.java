import java.util.ArrayList;
import java.util.List;

public class ChamadoService {

    private final List<Chamado> chamados = new ArrayList<>();
    private int proximoId = 1;

    public Chamado abrirChamado(String titulo, String descricao) {
        if (titulo == null || titulo.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "O título não pode ficar vazio."
            );
        }

        if (descricao == null || descricao.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "A descrição não pode ficar vazia."
            );
        }

        Chamado chamado = new Chamado(
            proximoId,
            titulo.trim(),
            descricao.trim()
        );

        chamados.add(chamado);
        proximoId++;

        return chamado;
    }

    public List<Chamado> listarChamados() {
        return new ArrayList<>(chamados);
    }

    public Chamado buscarChamadoPorId(int id) {
        for (Chamado chamado : chamados) {
            if (chamado.getId() == id) {
                return chamado;
            }
        }

        throw new IllegalArgumentException(
            "Chamado não encontrado."
        );
    }

    public void iniciarAtendimento(int id) {
        Chamado chamado = buscarChamadoPorId(id);
        chamado.iniciarAtendimento();
    }

    public void resolverChamado(int id) {
        Chamado chamado = buscarChamadoPorId(id);
        chamado.resolver();
    }
}