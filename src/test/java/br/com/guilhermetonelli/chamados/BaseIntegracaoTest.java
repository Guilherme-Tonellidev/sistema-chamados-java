package br.com.guilhermetonelli.chamados;

import org.junit.jupiter.api.BeforeEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(classes = ChamadosApplication.class)
@ActiveProfiles("test")
public abstract class BaseIntegracaoTest {

    @Autowired
    protected ChamadoService service;

    @Autowired
    protected ChamadoRepository repository;

    @Autowired
    private WebApplicationContext context;

    protected MockMvc mockMvc;

    @BeforeEach
    void prepararBancoERequisicoes() {
        repository.deleteAll();

        mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            .build();
    }
}