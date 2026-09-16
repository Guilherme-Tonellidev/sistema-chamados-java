# Sistema de Chamados de TI

[![Verificações Java e Front-end](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml/badge.svg)](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml)

Aplicação full stack para gerenciamento de chamados de suporte técnico, com API REST em Java e Spring Boot, interface React e persistência em PostgreSQL.

Projeto de portfólio desenvolvido para praticar integração entre front-end e back-end, regras de negócio, persistência, testes automatizados e integração contínua.

## Funcionalidades

### Interface web

- Cadastrar chamados com título, descrição e prioridade.
- Listar chamados com paginação de 5 itens.
- Filtrar por status e prioridade, separadamente ou em conjunto.
- Retornar à primeira página ao alterar qualquer filtro.
- Iniciar atendimento e resolver chamados.
- Exibir a data e a hora de abertura.
- Exibir abaixo do status a data e a hora de início do atendimento ou de resolução.
- Destacar prioridades com cores, letras maiúsculas e negrito.
- Alternar entre tema claro e tema escuro em azul.
- Salvar a preferência de tema no navegador quando o armazenamento estiver disponível.
- Atualizar a lista manualmente.
- Apresentar estados de carregamento, erro e lista vazia.
- Exibir mensagens de sucesso e erros retornados pela API.
- Impedir o cadastro de campos vazios ou contendo apenas espaços.
- Bloquear novos envios enquanto uma operação estiver em andamento.
- Adaptar a disposição dos elementos para telas menores.

### API REST

- Cadastrar, listar e buscar chamados pelo ID.
- Filtrar por status e prioridade, inclusive de forma combinada.
- Listar com paginação e ordenação por ID crescente.
- Validar campos obrigatórios, prioridades e transições de status.
- Registrar os momentos de abertura, início do atendimento e resolução.
- Retornar erros padronizados.
- Persistir os chamados no PostgreSQL.
- Gerenciar a estrutura do banco com migrações Flyway.

## Regras de negócio

### Cadastro e status

- Novos chamados recebem o status `Aberto`.
- Título e descrição são obrigatórios e não podem conter apenas espaços.
- Espaços nas extremidades do título e da descrição são removidos.
- Somente chamados abertos podem iniciar atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem iniciar atendimento novamente.

**Fluxo: Aberto → Em atendimento → Resolvido**

A interface apresenta a ação correspondente ao status atual. A API também valida as transições quando a requisição é feita diretamente.

### Prioridade

| Prioridade | Exibição na interface |
|---|---|
| Baixa | **BAIXA**, em verde |
| Normal | **NORMAL**, em amarelo/dourado |
| Alta | **ALTA**, em vermelho |

A prioridade padrão é `Normal` quando não é informada no cadastro. Valores inválidos são rejeitados pela API.

As cores são adaptadas aos temas claro e escuro. O texto identifica a prioridade independentemente da cor.

### Datas e horários

- `dataAbertura`: registrada na criação do chamado.
- `dataInicioAtendimento`: registrada ao iniciar o atendimento.
- `dataResolucao`: registrada ao resolver o chamado.

A data de abertura permanece abaixo do título.

Durante o atendimento, a interface mostra a data e a hora de início abaixo do status `Em atendimento`. Após a resolução, esse espaço passa a mostrar a data e a hora da resolução.

A data de início do atendimento continua armazenada no banco, mesmo quando deixa de aparecer na interface.

Os horários são apresentados no formato brasileiro, usando o fuso horário do navegador. Registros antigos sem uma determinada data recebem uma indicação de que ela não foi registrada.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Back-end | Java 21, Spring Boot, Spring Web MVC |
| Persistência | Spring Data JPA, PostgreSQL 17, Flyway |
| Front-end | React 19, JavaScript, Vite 8, HTML e CSS |
| Testes da API | JUnit Jupiter, MockMvc e H2 |
| Testes da interface | Vitest, React Testing Library, jest-dom, user-event e jsdom |
| Análise de código | Oxlint |
| Ferramentas | Maven, Node.js 24, npm, Git e GitHub Actions |

## Organização do projeto

| Caminho | Conteúdo |
|---|---|
| `src/main/java/br/com/guilhermetonelli/chamados` | Código Java |
| `src/main/resources` | Configurações da API |
| `src/main/resources/db/migration` | Migrações Flyway |
| `src/test/java` | Testes automatizados da API |
| `src/test/resources` | Configurações dos testes Java |
| `frontend/src/App.jsx` | Estado da aplicação, tema, filtros e coordenação das operações |
| `frontend/src/components/FormularioChamado.jsx` | Formulário de cadastro |
| `frontend/src/components/ListaChamados.jsx` | Filtros e apresentação dos chamados |
| `frontend/src/components/StatusChamado.jsx` | Status e data correspondente |
| `frontend/src/components/Paginacao.jsx` | Navegação entre páginas |
| `frontend/src/services/chamadosApi.js` | Requisições HTTP para a API |
| `frontend/src/App.css` | Estilos da interface |
| `frontend/src/index.css` | Estilos globais e temas |
| `frontend/src/App.test.jsx` | Testes dos fluxos da interface |
| `frontend/src/App.prioridade.test.jsx` | Testes de prioridade no cadastro |
| `frontend/src/test/setup.js` | Preparação e limpeza do ambiente de testes |
| `frontend/vite.config.js` | Configuração do Vite, proxy e Vitest |
| `.github/workflows/testes.yml` | Verificações automáticas do Java e do front-end |

### Principais componentes Java

| Componente | Responsabilidade |
|---|---|
| `ChamadosApplication` | Inicialização da aplicação Spring Boot |
| `Chamado` | Entidade, prioridade, datas e regras de mudança de status |
| `ChamadoRepository` | Acesso aos dados e consultas com filtros |
| `ChamadoService` | Operações de negócio, validações e transações |
| `ChamadoController` | Endpoints HTTP |
| `CriarChamadoRequest` | Dados recebidos no cadastro |
| `PaginaChamadosResposta` | Estrutura da resposta paginada |
| `ChamadoNaoEncontradoException` | Exceção para chamado inexistente |
| `ErroResposta` | Estrutura padronizada dos erros |
| `TratadorDeErros` | Tratamento centralizado de erros |
| `Main` | Interface de console mantida no projeto |

## Pré-requisitos

- JDK 21 para reproduzir o ambiente da integração contínua.
- Maven 3.9.x.
- PostgreSQL 17 instalado.
- Node.js 24 e npm.
- Git.

A compilação Java tem como alvo a versão 21. O ambiente local também foi utilizado com JDK 26.

Os comandos abaixo utilizam PowerShell.

## Como executar localmente

### 1. Clonar o repositório

```powershell
git clone https://github.com/Guilherme-Tonellidev/sistema-chamados-java.git
cd sistema-chamados-java
```

Se o projeto já estiver no computador, abra um terminal na pasta existente.

### 2. Preparar o PostgreSQL

Para uma instalação nova, conecte-se ao pgAdmin com um usuário administrador.

Em **Login/Group Roles**, crie um usuário com:

- Nome: `chamados_app`.
- Senha definida por você.
- Permissão de login habilitada.

Em **Databases**, crie o banco:

- Nome: `chamados_db`.
- Proprietário: `chamados_app`.

O usuário da aplicação não precisa ser superusuário.

Se o usuário e o banco já estiverem configurados, reutilize-os. O serviço do PostgreSQL deve estar em execução para iniciar a API.

### 3. Configurar a conexão

A conexão utiliza estas variáveis de ambiente:

| Variável | Finalidade | Valor padrão |
|---|---|---|
| `DB_URL` | Endereço do banco | `jdbc:postgresql://localhost:5432/chamados_db` |
| `DB_USER` | Usuário do banco | `chamados_app` |
| `DB_PASSWORD` | Senha do banco | Sem valor padrão |

A senha deve ser fornecida pela variável `DB_PASSWORD`.

As configurações de persistência incluem:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
```

O Flyway aplica as migrações e o Hibernate valida a compatibilidade das tabelas com as entidades Java.

### 4. Executar os testes Java

Na raiz do projeto, onde está o `pom.xml`:

```powershell
mvn clean test
```

Os testes utilizam H2 em memória. Não é necessário iniciar o PostgreSQL nem definir `DB_PASSWORD` para executá-los.

### 5. Iniciar o back-end

Com o PostgreSQL em execução, utilize um terminal na raiz do projeto:

```powershell
$senhaBanco = Read-Host "Senha do chamados_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $senhaBanco).Password
mvn spring-boot:run
```

Execute o comando Maven na raiz, não dentro da pasta `frontend`.

A senha permanece disponível nessa sessão do terminal. Se abrir outra sessão para iniciar a API, informe-a novamente.

Não registre senhas reais no código ou em arquivos enviados ao GitHub.

A API estará disponível em:

[http://localhost:8080/chamados](http://localhost:8080/chamados)

### 6. Iniciar o front-end

Abra outro terminal na raiz do projeto:

```powershell
cd frontend
npm ci
npm run dev
```

O comando `npm ci` instala as dependências registradas no `package-lock.json`.

Nas próximas inicializações, se as dependências já estiverem instaladas e não tiverem mudado, basta executar `npm run dev` dentro de `frontend`.

Abra:

[http://localhost:5173](http://localhost:5173)

O Vite utiliza a porta 5173 com `strictPort: true`. Se a porta estiver ocupada, ele informará um erro em vez de escolher outra.

Mantenha os terminais do back-end e do front-end em execução. Para encerrar cada aplicação, pressione `Ctrl + C` no terminal correspondente.

Após alterar o código Java, reinicie a API para utilizar a versão atualizada.

## Comunicação entre front-end e API

O arquivo `frontend/src/services/chamadosApi.js` centraliza as requisições HTTP de listagem, cadastro e mudança de status.

A interface utiliza caminhos iniciados por `/api`.

Durante o desenvolvimento, o proxy do Vite encaminha essas requisições para `http://127.0.0.1:8080`, removendo o prefixo `/api`.

Exemplo:

- A interface solicita `/api/chamados`.
- O proxy encaminha para `http://127.0.0.1:8080/chamados`.

Essa configuração é exclusiva do desenvolvimento. O projeto ainda não possui deploy configurado; a publicação exigirá definir como a interface acessará a API em produção.

## Utilizando a interface

1. Preencha título, descrição e prioridade.
2. Clique em **Cadastrar chamado**.
3. Consulte a lista e utilize os filtros de status e prioridade.
4. Clique em **Iniciar atendimento** em um chamado aberto.
5. Clique em **Resolver chamado** quando ele estiver em atendimento.
6. Use o botão de tema para alternar entre claro e escuro.

Chamados resolvidos permanecem disponíveis para consulta, sem botão de mudança de status.

### Comportamento dos filtros

Os filtros podem ser usados separadamente ou combinados.

Exemplo: selecionar `Aberto` e `Alta` retorna somente chamados abertos de prioridade alta.

- Alterar qualquer filtro retorna à primeira página.
- Selecionar `Todas as prioridades` remove apenas o filtro de prioridade.
- Selecionar `Todos os status` remove apenas o filtro de status.
- Atualizar a lista mantém os filtros e a página.

Após o cadastro, os filtros e a página também são mantidos. Como a ordenação é por ID crescente, o novo chamado aparece no final da lista quando corresponde aos filtros selecionados.

Ao mudar o status, um chamado pode deixar de corresponder ao filtro. Se isso eliminar a última página, a interface ajusta a navegação para uma página válida.

## Endpoints

| Método | Caminho | Operação | Sucesso |
|---|---|---|---|
| GET | `/chamados` | Listar com filtros opcionais de status e prioridade | 200 |
| GET | `/chamados/{id}` | Buscar pelo ID | 200 |
| POST | `/chamados` | Abrir chamado | 201 |
| PATCH | `/chamados/{id}/atendimento` | Iniciar atendimento | 200 |
| PATCH | `/chamados/{id}/resolucao` | Resolver chamado | 200 |
| GET | `/chamados/paginados` | Listar com paginação e filtros opcionais | 200 |

### Cadastro

Corpo JSON enviado para `POST /chamados`:

```json
{
  "titulo": "Computador nao liga",
  "descricao": "O equipamento nao responde ao botao.",
  "prioridade": "Alta"
}
```

Se a prioridade não for informada, a API utiliza `Normal`.

### Filtros

Valores aceitos:

| Filtro | Valores |
|---|---|
| `status` | `Aberto`, `Em atendimento`, `Resolvido` |
| `prioridade` | `Baixa`, `Normal`, `Alta` |

Exemplos:

```text
GET /chamados?status=Aberto
GET /chamados?prioridade=Alta
GET /chamados?status=Aberto&prioridade=Alta
```

A API normaliza diferenças entre letras maiúsculas e minúsculas e remove espaços nas extremidades dos valores dos filtros.

Para listar sem um filtro, omita o parâmetro correspondente.

### Paginação

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `pagina` | Índice da página, começando em zero | `0` |
| `tamanho` | Quantidade por página, entre 1 e 100 | `10` |
| `status` | Filtro opcional por status | Sem filtro |
| `prioridade` | Filtro opcional por prioridade | Sem filtro |

Exemplo:

```text
GET /chamados/paginados?pagina=0&tamanho=5&status=Aberto&prioridade=Alta
```

A resposta contém:

| Campo | Conteúdo |
|---|---|
| `chamados` | Chamados da página solicitada |
| `pagina` | Índice da página |
| `tamanho` | Tamanho solicitado |
| `totalElementos` | Quantidade de chamados que correspondem aos filtros |
| `totalPaginas` | Quantidade de páginas |
| `temProxima` | Indica se existe uma próxima página |

A interface solicita 5 itens por página. A ordenação é por ID crescente.

### Dados de um chamado

Os chamados retornados pela API incluem:

- `id`
- `titulo`
- `descricao`
- `status`
- `prioridade`
- `dataAbertura`
- `dataInicioAtendimento`
- `dataResolucao`

Datas de transições que ainda não aconteceram permanecem sem valor. Registros anteriores à inclusão das datas também podem não possuir esses valores.

### Erros

As respostas padronizadas contêm `status`, `erro` e `caminho`.

| Código | Exemplos |
|---|---|
| 400 Bad Request | Campos inválidos, prioridade inválida, JSON malformado ou parâmetros inválidos |
| 404 Not Found | Chamado inexistente |
| 409 Conflict | Mudança de status incompatível com o estado atual |

## Exemplos da API no PowerShell

Com a API em execução, abra outro terminal e execute os exemplos na ordem, na mesma sessão.

### Abrir um chamado

```powershell
$dados = @{
    titulo = "Computador nao liga"
    descricao = "O equipamento nao responde ao botao."
    prioridade = "Alta"
} | ConvertTo-Json

$parametrosCadastro = @{
    Uri = "http://localhost:8080/chamados"
    Method = "Post"
    ContentType = "application/json; charset=utf-8"
    Body = $dados
}

$chamado = Invoke-RestMethod @parametrosCadastro
$chamado
```

### Listar chamados

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados"
```

### Buscar o chamado criado

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)"
```

### Consultar com filtros combinados

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/paginados?pagina=0&tamanho=5&status=Aberto&prioridade=Alta"
```

### Iniciar atendimento

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/atendimento" -Method Patch
```

### Resolver o chamado

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/resolucao" -Method Patch
```

## Persistência e migrações

Os chamados são armazenados no PostgreSQL e permanecem disponíveis depois de reiniciar a aplicação.

As migrações ficam em:

```text
src/main/resources/db/migration
```

A estrutura evoluiu pelas seguintes versões:

| Versão | Alteração |
|---|---|
| V1 | Criação da tabela `chamados` |
| V2 | Inclusão da data de abertura |
| V3 | Inclusão das datas de início do atendimento e resolução |
| V4 | Inclusão da prioridade, com valor padrão `Normal` |

O Hibernate utiliza `ddl-auto=validate`. Alterações na estrutura do banco devem ser realizadas por novas migrações versionadas, sem editar migrações já aplicadas.

O banco existente do ambiente de desenvolvimento já foi adotado pelo Flyway com baseline 0. Essa adoção não deve ser repetida. Uma instalação nova com banco vazio utiliza as migrações normalmente.

A adição dos filtros combinados reutiliza as colunas existentes e não exige uma nova migração.

Para conferir a persistência:

1. Cadastre um chamado.
2. Encerre a API com `Ctrl + C`.
3. Execute novamente `mvn spring-boot:run` no mesmo terminal.
4. Atualize a lista na interface.

## Testes e verificações

### Back-end — 58 testes de integração

Na raiz do projeto:

```powershell
mvn clean test
```

A suíte cobre:

- Cadastro, listagem e busca por ID.
- Validação dos campos e das prioridades.
- Transições de status.
- Registro das datas.
- Filtros por status e prioridade.
- Combinação dos filtros.
- Paginação, ordenação e resultados vazios.
- Persistência e respostas padronizadas de erro.

Os testes utilizam o perfil `test`, H2 em memória e migrações Flyway. O banco de testes é separado do PostgreSQL da aplicação.

Não é necessário iniciar o PostgreSQL nem configurar `DB_PASSWORD` para executar essa suíte.

O H2 permite executar os testes de forma independente, mas não substitui a verificação da aplicação com PostgreSQL.

### Front-end — 13 testes automatizados

Dentro de `frontend`, com as dependências instaladas:

```powershell
npm test
```

Os testes utilizam Vitest, React Testing Library, jest-dom e user-event, com ambiente DOM simulado pelo jsdom.

A suíte verifica:

- Listagem, lista vazia e limites de paginação.
- Nova tentativa após falha de conexão.
- Cadastro e remoção de espaços nas extremidades dos campos.
- Limpeza do formulário após sucesso.
- Bloqueio de cadastro com campos contendo apenas espaços.
- Preservação dos campos após falha no cadastro.
- Avanço de página e retorno à primeira página ao alterar o filtro de status.
- Início do atendimento e resolução.
- Apresentação de erro ao rejeitar uma mudança de status.
- Cadastro com prioridades Baixa e Alta.
- Retorno da prioridade do formulário para Normal após sucesso.
- Preservação da prioridade selecionada após falha.

As chamadas `fetch` são simuladas. A suíte não depende da API Java em execução e não acessa o PostgreSQL.

Esses testes verificam a interface com respostas simuladas. Eles não substituem testes de ponta a ponta com navegador, API e banco reais.

Os filtros combinados foram também conferidos manualmente na interface. Ampliar a cobertura automatizada desse fluxo no React é uma melhoria prevista.

### Modo de acompanhamento

Para executar novamente os testes ao salvar alterações:

```powershell
npm run test:watch
```

Para encerrar, pressione `Ctrl + C`.

### Análise de código e build

Dentro de `frontend`:

```powershell
npm run lint
npm run build
```

- `lint`: analisa o código com Oxlint.
- `build`: gera a versão de produção em `frontend/dist`.

Gerar o build não publica a aplicação.

### Resumo dos comandos

| Diretório | Comando | Finalidade |
|---|---|---|
| Raiz | `mvn clean test` | Executar os testes Java |
| Raiz | `mvn spring-boot:run` | Iniciar a API |
| `frontend` | `npm ci` | Instalar as dependências do lockfile |
| `frontend` | `npm run dev` | Iniciar a interface em desenvolvimento |
| `frontend` | `npm test` | Executar os testes da interface |
| `frontend` | `npm run test:watch` | Executar testes ao salvar alterações |
| `frontend` | `npm run lint` | Analisar o código |
| `frontend` | `npm run build` | Gerar o build de produção |

## Integração contínua

O GitHub Actions executa duas verificações independentes:

| Verificação | Etapas |
|---|---|
| Java | Configurar Java 21 e executar os testes Maven |
| Front-end | Configurar Node 24, instalar dependências, executar lint, testes e build |

O workflow é executado em:

- Pushes para `main`.
- Pull requests direcionados a `main`.
- Acionamento manual pela aba Actions.

A configuração fica em:

```text
.github/workflows/testes.yml
```

O badge no início deste README indica o resultado do workflow no GitHub.

[Consultar execuções no GitHub Actions](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions)

## Próximas melhorias

- Ampliar os testes React para filtros combinados e temas.
- Adicionar testes de ponta a ponta.
- Adicionar autenticação e autorização.
- Preparar a configuração de produção.
- Realizar o deploy da aplicação.

## Autor

**Guilherme Douglas Augusto Tonelli**

Estudante de Análise e Desenvolvimento de Sistemas, desenvolvendo projetos para a primeira oportunidade como programador júnior.

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)