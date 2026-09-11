# Sistema de Chamados de TI

Projeto de estudo desenvolvido em Java para cadastrar e acompanhar
chamados de suporte técnico, com versão de terminal e API REST.

O objetivo é praticar orientação a objetos, organização do código,
regras de negócio, testes automatizados e integração contínua.

## Funcionalidades

### Terminal

- Abrir e listar chamados.
- Buscar chamados pelo número para atualizar o status.
- Iniciar atendimento e resolver chamados.
- Validar entradas numéricas e campos obrigatórios.

### API REST

| Método | Rota | Funcionalidade |
|---|---|---|
| GET | `/chamados` | Listar todos os chamados |
| GET | `/chamados/{id}` | Buscar um chamado pelo número |
| POST | `/chamados` | Cadastrar um chamado |
| PATCH | `/chamados/{id}/atendimento` | Iniciar o atendimento |
| PATCH | `/chamados/{id}/resolucao` | Resolver um chamado |

### Respostas HTTP

- 200: consulta ou atualização realizada com sucesso.
- 201: chamado criado.
- 400: dados de entrada inválidos.
- 404: chamado não encontrado.
- 409: mudança de status incompatível com o estado atual.

## Regras de negócio

Todo chamado começa com o status "Aberto".

O fluxo permitido é:

Aberto → Em atendimento → Resolvido

- Título e descrição são obrigatórios.
- O número do chamado é gerado automaticamente.
- Somente chamados abertos podem iniciar o atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem ser reabertos nesta versão.

## Tecnologias

- Java, com compilação direcionada à versão 21
- Spring Boot 4.1.1
- Maven
- JUnit Jupiter
- MockMvc
- Git e GitHub
- GitHub Actions

## Organização do projeto

As classes principais ficam em:

`src/main/java/br/com/guilhermetonelli/chamados`

| Arquivo | Responsabilidade |
|---|---|
| `Main.java` | Menu e interação pelo terminal |
| `Chamado.java` | Dados do chamado e regras de mudança de status |
| `ChamadoService.java` | Cadastro, listagem, busca e operações sobre chamados |
| `ChamadosApplication.java` | Inicialização da aplicação Spring Boot |
| `ChamadoController.java` | Rotas HTTP e respostas da API |
| `CriarChamadoRequest.java` | Dados recebidos no cadastro pela API |

Os testes ficam em:

`src/test/java/br/com/guilhermetonelli/chamados`

| Arquivo | Responsabilidade |
|---|---|
| `ChamadoServiceTest.java` | Testes do serviço e das regras de negócio |
| `ChamadoControllerTest.java` | Testes de cadastro, listagem e entradas inválidas |
| `ChamadoStatusControllerTest.java` | Testes de busca e atualização de status |

Outros arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `pom.xml` | Configuração do Maven e dependências |
| `.gitignore` | Arquivos e pastas ignorados pelo Git |
| `.github/workflows/testes.yml` | Execução automática dos testes |

## Requisitos

- JDK 21 ou uma versão posterior compatível com o Spring Boot utilizado
- Maven 3.9.x
- Git para clonar o repositório
- Comandos `java`, `mvn` e `git` disponíveis no terminal

## Obter o projeto

Clone o repositório:

```bash
git clone https://github.com/Guilherme-Tonellidev/sistema-chamados-java.git
```

Entre na pasta:

```bash
cd sistema-chamados-java
```

## Executar a API

Na pasta principal do projeto:

```bash
mvn spring-boot:run
```

A aplicação inicia, por padrão, na porta 8080.

Consulte no navegador:

http://localhost:8080/chamados

Se nenhum chamado tiver sido cadastrado, a resposta será:

```json
[]
```

Para encerrar o servidor, pressione `Ctrl + C` no terminal.

## Exemplos de uso pelo PowerShell

Mantenha a API rodando e abra outro terminal PowerShell.

### Cadastrar um chamado

```powershell
$chamado = Invoke-RestMethod -Uri "http://localhost:8080/chamados" -Method Post -ContentType "application/json; charset=utf-8" -Body '{"titulo":"Problema no teclado","descricao":"Algumas teclas pararam de funcionar."}'
```

Exiba o resultado:

```powershell
$chamado
```

A resposta contém o número, o título, a descrição e o status "Aberto".

### Listar chamados

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados"
```

### Buscar o chamado cadastrado

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)"
```

### Iniciar o atendimento

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/atendimento" -Method Patch
```

O status passa para "Em atendimento".

### Resolver o chamado

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/resolucao" -Method Patch
```

O status passa para "Resolvido".

### Conferir uma entrada inválida

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados" -Method Post -ContentType "application/json; charset=utf-8" -Body '{"titulo":"","descricao":"Descricao de teste"}'
```

A API responde com HTTP 400 e uma mensagem de erro.
O chamado não é cadastrado.

## Executar a versão de terminal

Compile o projeto:

```bash
mvn clean compile
```

Execute:

```bash
java -cp target/classes br.com.guilhermetonelli.chamados.Main
```

Use o menu para cadastrar, listar e atualizar chamados.

Digite `0` para encerrar.

## Testes automatizados

Execute na pasta principal do projeto:

```bash
mvn test
```

O projeto possui 18 testes automatizados:

- 8 testes do serviço e das regras de negócio.
- 5 testes de cadastro e listagem da API.
- 5 testes de busca e atualização de status pela API.

Os testes verificam, entre outros comportamentos:

- Criação de chamados com status inicial "Aberto".
- Geração de números diferentes.
- Rejeição de título e descrição vazios.
- Cadastro seguido de consulta pela API.
- Rejeição de JSON incompleto.
- Resposta 404 para chamado inexistente.
- Fluxo de atendimento até a resolução.
- Resposta 409 para transições de status inválidas.
- Preservação do status após uma operação recusada.

Os testes dos controllers usam MockMvc para simular requisições
sem iniciar um servidor. Cada teste utiliza uma nova instância
do serviço.

Esses testes não verificam toda a inicialização e configuração
da aplicação Spring Boot.

## Integração contínua

O GitHub Actions compila o projeto e executa os testes com Java 21:

- A cada push na branch `main`.
- Em pull requests destinados à `main`.
- Quando a execução é iniciada manualmente pela aba Actions.

O workflow também falha se nenhum teste for encontrado.

## Limitações atuais

- Os chamados ficam em memória e são perdidos ao encerrar a aplicação.
- Terminal e API, executados separadamente, não compartilham dados.
- A API ainda não possui autenticação ou banco de dados.
- O armazenamento atual não possui tratamento de concorrência
  para uso com múltiplos usuários.

## Próximas melhorias

- Preparar o armazenamento para acessos simultâneos.
- Adicionar persistência em banco de dados.
- Adicionar autenticação e permissões de acesso.
- Criar testes de integração da aplicação completa.

## Autor

Guilherme Tonelli

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)