# Sistema de Chamados de TI

Projeto de estudo desenvolvido em Java para cadastrar e acompanhar
chamados de suporte técnico, com versão de terminal e API REST
em desenvolvimento.

## Funcionalidades

### Terminal

- Abrir e listar chamados.
- Buscar chamados pelo número para atualizar o status.
- Iniciar atendimento e resolver chamados.
- Validar entradas numéricas e campos obrigatórios.

### API REST

- GET /chamados: listar chamados.
- POST /chamados: cadastrar um chamado.
- Retornar HTTP 201 no cadastro válido.
- Retornar HTTP 400 para título ou descrição vazios.

## Regras de negócio

Todo chamado começa como "Aberto".

Fluxo permitido:

Aberto → Em atendimento → Resolvido

- Somente chamados abertos podem iniciar o atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem ser reabertos nesta versão.

## Tecnologias

- Java, com compilação direcionada à versão 21
- Spring Boot 4.1.1
- Maven
- JUnit Jupiter
- Git e GitHub
- GitHub Actions

## Organização

As classes principais ficam em:

`src/main/java/br/com/guilhermetonelli/chamados`

| Classe | Responsabilidade |
|---|---|
| Main | Menu e interação pelo terminal |
| Chamado | Dados e regras de mudança de status |
| ChamadoService | Cadastro, listagem e busca |
| ChamadosApplication | Inicialização do Spring Boot |
| ChamadoController | Rotas HTTP |
| CriarChamadoRequest | Dados recebidos no cadastro pela API |

Os testes ficam em:

`src/test/java/br/com/guilhermetonelli/chamados/ChamadoServiceTest.java`

## Requisitos

- JDK 21 ou uma versão posterior compatível com o Spring Boot utilizado
- Maven 3.9.x
- Comandos java e mvn disponíveis no terminal

## Executar a API

Na pasta principal do projeto:

```bash
mvn spring-boot:run
```

Consultar no navegador:

http://localhost:8080/chamados

Uma lista vazia aparece como `[]`.

### Cadastrar pelo PowerShell

Abra outro terminal enquanto a API estiver rodando:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados" -Method Post -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Computador sem internet","descricao":"O computador perdeu a conexao."}'
```

Atualize a consulta no navegador para visualizar o chamado.

Para encerrar a API, pressione Ctrl + C no terminal do servidor.

## Executar a versão de terminal

Compile:

```bash
mvn clean compile
```

Execute:

```bash
java -cp target/classes br.com.guilhermetonelli.chamados.Main
```

Digite 0 no menu para encerrar.

## Testes automatizados

```bash
mvn clean test
```

O projeto possui oito testes do serviço e das regras de negócio.
Os testes HTTP serão adicionados em uma próxima etapa.

## Integração contínua

O GitHub Actions compila e executa os testes com Java 21
a cada push em main e em pull requests destinados a ela.

Também é possível iniciar a execução manualmente pela aba Actions.

## Limitações atuais

- Os chamados ficam em memória e são perdidos ao encerrar a aplicação.
- Terminal e API, executados separadamente, não compartilham dados.
- Atualização de status ainda está disponível apenas no terminal.
- A API ainda não possui autenticação, banco de dados ou tratamento
  de concorrência para uso com múltiplos usuários.

## Próximas melhorias

- Adicionar testes das rotas HTTP.
- Disponibilizar atualização de status pela API.
- Preparar o armazenamento para acessos simultâneos.
- Adicionar persistência em banco de dados.

## Autor

[Guilherme Tonelli](https://github.com/Guilherme-Tonellidev)