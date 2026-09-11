package br.com.guilhermetonelli.chamados;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(ChamadoNaoEncontradoException.class)
    public ResponseEntity<ErroResposta> tratarChamadoNaoEncontrado(
            ChamadoNaoEncontradoException exception,
            HttpServletRequest request) {

        return responder(
            HttpStatus.NOT_FOUND,
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErroResposta> tratarDadosInvalidos(
            IllegalArgumentException exception,
            HttpServletRequest request) {

        return responder(
            HttpStatus.BAD_REQUEST,
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErroResposta> tratarConflitoDeStatus(
            IllegalStateException exception,
            HttpServletRequest request) {

        return responder(
            HttpStatus.CONFLICT,
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta> tratarCorpoInvalido(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {

        return responder(
            HttpStatus.BAD_REQUEST,
            "O corpo da requisição deve conter um JSON válido.",
            request
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResposta> tratarParametroInvalido(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {

        return responder(
            HttpStatus.BAD_REQUEST,
            "O parâmetro '" + exception.getName()
                + "' deve ser um número inteiro válido.",
            request
        );
    }

    private ResponseEntity<ErroResposta> responder(
            HttpStatus status,
            String mensagem,
            HttpServletRequest request) {

        ErroResposta resposta = new ErroResposta(
            status.value(),
            mensagem,
            request.getRequestURI()
        );

        return ResponseEntity.status(status).body(resposta);
    }
}