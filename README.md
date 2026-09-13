# Sistema de Chamados de TI

[![Verificações Java e Front-end](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml/badge.svg)](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml)

Aplicação full stack para gerenciamento de chamados de suporte técnico, com API REST em Java e Spring Boot, interface React e persistência em PostgreSQL.

Projeto de portfólio desenvolvido para praticar integração entre front-end e back-end, regras de negócio, persistência de dados, testes automatizados e integração contínua.

## Funcionalidades

### Interface web

- Cadastrar chamados com título e descrição.
- Listar chamados reais da API.
- Filtrar por status.
- Navegar pela lista com paginação de 5 itens.
- Iniciar atendimento e resolver chamados.
- Atualizar a lista manualmente.
- Exibir estados de carregamento, erro e lista vazia.
- Exibir mensagens de sucesso e erros retornados pela API.
- Impedir campos vazios ou contendo apenas espaços.
- Bloquear novos envios enquanto uma operação está em andamento.
- Adaptar a disposição dos elementos para telas menores.

### API REST

- Cadastrar e listar chamados.
- Buscar um chamado pelo ID.
- Filtrar chamados por status.
- Listar com paginação e ordenação por ID crescente.
- Validar campos obrigatórios e transições de status.
- Retornar erros padronizados.
- Persistir os chamados no PostgreSQL.
- Gerenciar a estrutura do banco com migrações Flyway.

## Regras de negócio

- Novos chamados recebem o status `Aberto`.
- Título e descrição não podem ficar vazios.
- Somente chamados abertos podem iniciar atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem iniciar atendimento novamente.

**Fluxo de status: Aberto → Em atendimento → Resolvido**

A interface apresenta a ação correspondente ao status atual. A API também valida as transições, inclusive quando a requisição é feita diretamente, sem utilizar a interface.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Back-end | Java 21, Spring Boot, Spring Web MVC |
| Persistência | Spring Data JPA, PostgreSQL 17, Flyway |
| Front-end | React 19, JavaScript, Vite 8, HTML e CSS |
| Testes da API | JUnit Jupiter, MockMvc e H2 |
| Verificação do front-end | Oxlint e build com Vite |
| Ferramentas | Maven, Node.js 24, npm, Git e GitHub Actions |

## Organização do projeto

| Caminho | Conteúdo |
|---|---|
| `src/main/java/br/com/guilhermetonelli/chamados` | Código Java da aplicação |
| `src/main/resources` | Configurações da API |
| `src/main/resources/db/migration` | Migrações Flyway |
| `src/test/java` | Testes automatizados da API |
| `src/test/resources` | Configurações dos testes |
| `frontend/src/App.jsx` | Cadastro, listagem, filtros, paginação e mudança de status |
| `frontend/src/App.css` | Estilos dos componentes da interface |
| `frontend/src/index.css` | Estilos globais |
| `frontend/vite.config.js` | Configuração do Vite e proxy de desenvolvimento |
| `.github/workflows/testes.yml` | Verificações automáticas do Java e do front-end |

### Principais componentes Java

| Componente | Responsabilidade |
|---|---|
| `ChamadosApplication` | Inicialização da aplicação Spring Boot |
| `Chamado` | Entidade persistida e regras de mudança de status |
| `ChamadoRepository` | Acesso aos dados com Spring Data JPA |
| `ChamadoService` | Operações de negócio e transações |
| `ChamadoController` | Endpoints HTTP da API |
| `CriarChamadoRequest` | Dados recebidos no cadastro |
| `PaginaChamadosResposta` | Estrutura da resposta paginada |
| `ChamadoNaoEncontradoException` | Exceção para chamado inexistente |
| `ErroResposta` | Estrutura padronizada dos erros |
| `TratadorDeErros` | Tratamento centralizado de erros da API |
| `Main` | Interface de console mantida no projeto |

## Pré-requisitos

- JDK 21 para reproduzir o ambiente da integração contínua.
- Maven 3.9.x.
- PostgreSQL 17 instalado e em execução.
- Node.js 24 e npm.
- Git.

A compilação Java tem como alvo a versão 21. O ambiente local de desenvolvimento também foi utilizado com JDK 26.

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

Se esse usuário e esse banco já estiverem configurados, reutilize-os.

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

Na raiz do projeto, antes de iniciar a API:

```powershell
mvn clean test
```

A suíte utiliza H2 em memória. Não é necessário iniciar o PostgreSQL nem definir `DB_PASSWORD` para executar os testes.

### 5. Iniciar o back-end

Com o PostgreSQL em execução, informe a senha no terminal da raiz:

```powershell
$senhaBanco = Read-Host "Senha do chamados_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $senhaBanco).Password
mvn spring-boot:run
```

A variável permanece disponível nessa sessão do terminal. Se abrir outra sessão para iniciar a API, informe-a novamente.

Não registre senhas reais no código ou em arquivos enviados ao GitHub.

A API estará disponível em:

http://localhost:8080/chamados

### 6. Iniciar o front-end

Abra outro terminal na raiz do projeto:

```powershell
cd frontend
npm ci
npm run dev
```

O comando `npm ci` instala as dependências a partir do `package-lock.json`. Nas próximas inicializações, se as dependências já estiverem instaladas e não tiverem mudado, basta executar `npm run dev`.

Abra o endereço indicado pelo Vite, normalmente:

http://localhost:5173

Mantenha os terminais do back-end e do front-end em execução. Para encerrar cada aplicação, pressione `Ctrl + C` no terminal correspondente.

## Comunicação entre front-end e API

A interface utiliza caminhos iniciados por `/api`.

Durante o desenvolvimento, o proxy do Vite encaminha essas requisições para `http://127.0.0.1:8080`, removendo o prefixo `/api`.

Exemplo:

- A interface solicita `/api/chamados`.
- O proxy encaminha para `http://127.0.0.1:8080/chamados`.

Essa configuração é exclusiva do ambiente de desenvolvimento. O projeto ainda não possui deploy configurado; a publicação exigirá definir como a interface acessará a API em produção.

## Utilizando a interface

1. Preencha título e descrição e clique em **Cadastrar chamado**.
2. Consulte a lista e utilize o filtro por status.
3. Clique em **Iniciar atendimento** em um chamado aberto.
4. Clique em **Resolver chamado** quando ele estiver em atendimento.
5. Chamados resolvidos permanecem disponíveis para consulta, sem botão de alteração.

Após o cadastro, o filtro e a página são mantidos. Como a ordenação é por ID crescente, o novo chamado aparece no final da lista quando o filtro permite exibi-lo.

Ao alterar um status, o chamado pode deixar de aparecer no filtro selecionado. Se isso eliminar a última página, a interface ajusta a navegação para uma página válida.

## Endpoints

| Método | Caminho | Operação | Sucesso |
|---|---|---|---|
| GET | `/chamados` | Listar chamados, com filtro opcional por status | 200 |
| GET | `/chamados/{id}` | Buscar pelo ID | 200 |
| POST | `/chamados` | Abrir chamado | 201 |
| PATCH | `/chamados/{id}/atendimento` | Iniciar atendimento | 200 |
| PATCH | `/chamados/{id}/resolucao` | Resolver chamado | 200 |
| GET | `/chamados/paginados` | Listar com paginação e filtro opcional | 200 |

### Cadastro

Corpo JSON enviado para `POST /chamados`:

```json
{
  "titulo": "Computador nao liga",
  "descricao": "O equipamento nao responde ao botao."
}
```

### Filtro por status

```text
GET /chamados?status=Aberto
```

Valores de status: `Aberto`, `Em atendimento` e `Resolvido`.

### Paginação

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `pagina` | Índice da página, começando em zero | `0` |
| `tamanho` | Quantidade por página, entre 1 e 100 | `10` |
| `status` | Filtro opcional por status | Sem filtro |

Exemplo:

```text
GET /chamados/paginados?pagina=0&tamanho=5&status=Aberto
```

A resposta contém:

- `chamados`
- `pagina`
- `tamanho`
- `totalElementos`
- `totalPaginas`
- `temProxima`

A interface solicita 5 itens por página.

### Erros

As respostas padronizadas contêm `status`, `erro` e `caminho`.

| Código | Exemplos |
|---|---|
| 400 Bad Request | Campos inválidos, JSON malformado ou parâmetros inválidos |
| 404 Not Found | Chamado inexistente |
| 409 Conflict | Mudança de status incompatível com o estado atual |

## Exemplos da API no PowerShell

Com a API em execução, abra outro terminal e execute os exemplos na ordem, na mesma sessão.

### Abrir um chamado

```powershell
$dados = @{
    titulo = "Computador nao liga"
    descricao = "O equipamento nao responde ao botao."
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

### Iniciar atendimento

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/atendimento" -Method Patch
```

### Resolver o chamado

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/$($chamado.id)/resolucao" -Method Patch
```

### Consultar uma página com filtro

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chamados/paginados?pagina=0&tamanho=5&status=Aberto"
```

## Persistência e migrações

Os chamados são armazenados no PostgreSQL e permanecem disponíveis depois de reiniciar a aplicação.

As migrações ficam em:

```text
src/main/resources/db/migration
```

A migração inicial é:

```text
V1__criar_tabela_chamados.sql
```

O Hibernate utiliza `ddl-auto=validate`. Alterações na estrutura do banco devem ser realizadas por novas migrações versionadas, sem editar a V1 já aplicada.

O banco existente do ambiente de desenvolvimento já foi adotado pelo Flyway com baseline 0. Essa adoção não deve ser repetida. Uma instalação nova com banco vazio utiliza as migrações normalmente.

Para conferir a persistência:

1. Cadastre um chamado.
2. Encerre a API com `Ctrl + C`.
3. Execute novamente `mvn spring-boot:run` no mesmo terminal.
4. Atualize a lista na interface.

## Testes e verificações

### Back-end

Na raiz:

```powershell
mvn clean test
```

A suíte atual contém **38 testes de integração**, cobrindo cadastro, consultas, validações, transições de status, filtros, paginação, persistência e respostas de erro.

Os testes utilizam o perfil `test`, H2 em memória e migrações Flyway. O banco de testes é separado do PostgreSQL da aplicação.

O H2 permite executar a suíte de forma independente, mas não substitui a verificação da aplicação com PostgreSQL.

### Front-end

Dentro de `frontend`:

```powershell
npm run lint
npm run build
```

- `lint`: analisa o código com Oxlint.
- `build`: gera a versão de produção em `frontend/dist`.

Essas verificações não substituem testes automatizados de comportamento da interface, que ainda não foram implementados.

O cadastro e as mudanças de status também foram conferidos manualmente na interface integrada à API.

## Integração contínua

O GitHub Actions executa duas verificações independentes:

| Verificação | Etapas |
|---|---|
| Compilar e testar | Configurar Java 21 e executar os testes Maven |
| Verificar e compilar front-end | Configurar Node 24, executar `npm ci`, lint e build |

O workflow é executado em:

- Pushes para `main`.
- Pull requests direcionados a `main`.
- Acionamento manual pela aba Actions.

Arquivo:

```text
.github/workflows/testes.yml
```

[Consultar execuções no GitHub Actions](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions)

## Próximas melhorias

- Adicionar testes automatizados para os fluxos da interface.
- Adicionar autenticação e autorização.
- Evoluir a organização dos componentes React.
- Preparar a configuração de produção e realizar o deploy.

## Autor

**Guilherme Douglas Augusto Tonelli**

Estudante de Análise e Desenvolvimento de Sistemas, desenvolvendo projetos para a primeira oportunidade como programador júnior.

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)