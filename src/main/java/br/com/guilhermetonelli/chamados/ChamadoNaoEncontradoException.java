package br.com.guilhermetonelli.chamados;

public class ChamadoNaoEncontradoException extends IllegalArgumentException {

    public ChamadoNaoEncontradoException() {
        super("Chamado não encontrado.");
    }
}