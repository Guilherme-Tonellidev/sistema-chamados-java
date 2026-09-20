package br.com.guilhermetonelli.chamados;

import java.io.IOException;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
public class ConfiguracaoSeguranca {

    private final ObjectMapper objectMapper;

    public ConfiguracaoSeguranca(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain segurancaAutenticacao(
            HttpSecurity http,
            AuthenticationManager authenticationManager) throws Exception {

        http
            .authenticationManager(authenticationManager)
            .authorizeHttpRequests(autorizacao -> autorizacao
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.GET, "/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/usuarios").permitAll()
                .requestMatchers(HttpMethod.GET, "/auth/me").authenticated()
                .requestMatchers("/chamados", "/chamados/**").authenticated()
                .anyRequest().denyAll()
            )
            .csrf(Customizer.withDefaults())
            .requestCache(cache -> cache.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(login -> login
                .loginProcessingUrl("/auth/login")
                .usernameParameter("email")
                .passwordParameter("senha")
                .successHandler((request, response, authentication) ->
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT)
                )
                .failureHandler((request, response, exception) ->
                    responderErro(
                        request,
                        response,
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "E-mail ou senha inválidos."
                    )
                )
            )
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT)
                )
            )
            .exceptionHandling(erros -> erros
                .authenticationEntryPoint((request, response, exception) ->
                    responderErro(
                        request,
                        response,
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Autenticação necessária."
                    )
                )
                .accessDeniedHandler((request, response, exception) ->
                    responderErro(
                        request,
                        response,
                        HttpServletResponse.SC_FORBIDDEN,
                        "Requisição não autorizada."
                    )
                )
            );

        return http.build();
    }

    private void responderErro(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            String mensagem) throws IOException {

        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(
            response.getWriter(),
            new ErroResposta(status, mensagem, request.getRequestURI())
        );
    }
}