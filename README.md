# EloDesk — Sistema de Chamados de TI

[![Verificações Java e Front-end](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml/badge.svg)](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml)

**Seu suporte, mais próximo.**

Aplicação full stack para gerenciamento de chamados de suporte técnico, com API REST em Java e Spring Boot, interface React e persistência em PostgreSQL.

Projeto de portfólio desenvolvido para praticar integração entre front-end e back-end, regras de negócio, autenticação, persistência, testes automatizados e integração contínua.

## Funcionalidades

### Interface web

- Entrar com e-mail e senha.
- Mostrar ou ocultar a senha no formulário de login.
- Recuperar a sessão ao recarregar a página.
- Encerrar a sessão pelo botão Sair.
- Cadastrar chamados com título, descrição e prioridade.
- Selecionar fotos durante o cadastro, com prévia e remoção antes do envio.
- Listar chamados em uma tabela com paginação de 5 itens.
- Abrir os detalhes pelo número ou pelo título do chamado.
- Consultar descrição, prioridade, status, datas e fotos nos detalhes.
- Adicionar fotos a um chamado existente.
- Abrir uma foto salva em outra aba.
- Filtrar por status e prioridade, separadamente ou em conjunto.
- Retornar à primeira página ao alterar qualquer filtro.
- Iniciar atendimento e resolver chamados.
- Exibir a data de abertura e as datas das transições.
- Identificar prioridades e status por texto e cores.
- Alternar o painel entre os temas claro e escuro.
- Salvar a preferência de tema no navegador quando o armazenamento estiver disponível.
- Atualizar a lista manualmente.
- Apresentar estados de carregamento, erro e lista vazia.
- Impedir cadastros com título ou descrição contendo apenas espaços.
- Bloquear novos envios enquanto uma operação estiver em andamento.
- Adaptar o layout para telas menores, com rolagem horizontal da tabela quando necessário.

A tela de login possui apresentação escura própria. A preferência de tema é aplicada ao painel de chamados.

### API REST

- Cadastrar, listar e buscar chamados pelo ID.
- Filtrar por status e prioridade.
- Listar com paginação e ordenação por ID crescente.
- Validar campos obrigatórios, prioridades e transições de status.
- Registrar abertura, início do atendimento e resolução.
- Receber, validar, armazenar e disponibilizar fotos dos chamados.
- Cadastrar usuários com e-mail normalizado e único.
- Armazenar somente o hash da senha, utilizando BCrypt.
- Autenticar usuários com sessão mantida por cookie.
- Proteger operações de escrita com CSRF.
- Exigir autenticação nos endpoints de chamados e fotos.
- Retornar erros padronizados.
- Persistir os dados no PostgreSQL.
- Gerenciar a estrutura do banco com migrações Flyway.

O cadastro de usuários está disponível somente pela API. Ainda não existe tela de cadastro.

## Regras de negócio

### Cadastro e status dos chamados

- Novos chamados recebem o status `Aberto`.
- Título e descrição são obrigatórios e não podem conter apenas espaços.
- Espaços nas extremidades do título e da descrição são removidos.
- Somente chamados abertos podem iniciar atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem iniciar atendimento novamente.

**Fluxo: Aberto → Em atendimento → Resolvido**

A tabela apresenta a ação correspondente ao status atual. A API também valida as transições quando a requisição é feita diretamente.

Chamados resolvidos continuam disponíveis para consulta.

### Prioridade

Valores aceitos:

- `Baixa`
- `Normal`
- `Alta`

A prioridade padrão é `Normal` quando não é informada no cadastro. Valores inválidos são rejeitados pela API.

A interface apresenta cada prioridade com texto e cor, sem depender exclusivamente da cor para identificá-la.

### Datas e horários

- `dataAbertura`: registrada na criação do chamado.
- `dataInicioAtendimento`: registrada ao iniciar o atendimento.
- `dataResolucao`: registrada ao resolver o chamado.

A tabela possui uma coluna de abertura. Durante o atendimento, a data de início aparece abaixo do status. Após a resolução, esse espaço apresenta a data de resolução.

Os detalhes permitem consultar as datas de abertura, início do atendimento e resolução.

Os horários são apresentados no formato brasileiro, utilizando o fuso horário do navegador. Datas ainda não registradas recebem uma indicação na interface.

### Fotos

- O envio de fotos é opcional.
- Cada chamado aceita até 5 fotos no total.
- Os formatos aceitos são JPEG e PNG.
- Cada arquivo pode ter até 5 MB.
- Cada imagem pode ter até 12 milhões de pixels.
- A API verifica o conteúdo da imagem, não apenas sua extensão.
- As imagens são reprocessadas antes do armazenamento.
- O conteúdo e os metadados das fotos são armazenados no banco.
- A consulta e o envio exigem autenticação.
- O envio também exige um token CSRF válido.

No cadastro pela interface, o chamado é criado primeiro e as fotos são enviadas em uma segunda requisição.

Se o chamado for criado e o envio das fotos falhar, o chamado permanece salvo. A interface orienta a conferir a galeria e enviar somente as fotos que faltam pelos detalhes, sem cadastrar outro chamado.

Não existe funcionalidade de exclusão de fotos já salvas. A remoção disponível no formulário se aplica aos arquivos selecionados antes do envio.

### Cadastro de usuários

- Nome, e-mail e senha são obrigatórios.
- O nome tem até 100 caracteres, após remover espaços nas extremidades.
- O e-mail tem até 254 caracteres e passa por validação de formato.
- O e-mail é salvo em minúsculas e sem espaços nas extremidades.
- Cada e-mail normalizado pode pertencer a apenas um usuário.
- A senha deve ter pelo menos 15 caracteres.
- A senha deve ocupar no máximo 72 bytes em UTF-8, respeitando o limite do BCrypt.
- Caracteres Unicode podem ocupar mais de um byte.
- A senha é preservada como recebida, inclusive os espaços nas extremidades.
- Novos usuários são criados com `ativo` igual a `true`.
- Novos usuários recebem o perfil `SOLICITANTE`.
- Somente o hash da senha é armazenado.
- A resposta do cadastro não contém senha nem hash.

A validação do formato do e-mail não verifica a existência da caixa postal nem confirma sua propriedade.

### Perfis e limites de acesso

O banco possui os perfis `SOLICITANTE` e `ATENDENTE`. O cadastro público utiliza `SOLICITANTE`.

A persistência dos perfis está implementada, mas as regras de autorização por perfil ainda não estão.

Atualmente, qualquer usuário autenticado pode consultar e operar todos os chamados e suas fotos. Os chamados ainda não possuem vínculo com um proprietário.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Back-end | Java 21, Spring Boot, Spring Web MVC |
| Persistência | Spring Data JPA, Spring JDBC, PostgreSQL 17, Flyway |
| Autenticação e segurança | Spring Security, sessão, CSRF e BCrypt |
| Front-end | React 19, JavaScript, Vite 8, HTML e CSS |
| Testes da API e persistência | JUnit Jupiter, MockMvc e H2 |
| Testes da interface | Vitest, React Testing Library, jest-dom, user-event e jsdom |
| Testes de ponta a ponta | Playwright e Chromium |
| Análise de código | Oxlint |
| Ferramentas | Maven, Node.js 24, npm, Git e GitHub Actions |

## Organização do projeto

Os caminhos abaixo são relativos à raiz do repositório.

| Caminho | Conteúdo |
|---|---|
| `src/main/java/br/com/guilhermetonelli/chamados` | Código Java principal |
| `src/main/resources` | Configurações da API |
| `src/main/resources/db/migration` | Migrações Flyway |
| `src/test/java` | Testes automatizados do back-end |
| `src/test/resources` | Configurações dos testes Java |
| `src/test/resources/application-e2e.properties` | Configuração da API de testes com H2 |
| `frontend/src/App.jsx` | Consulta da sessão e fluxo de autenticação |
| `frontend/src/PainelChamados.jsx` | Tema, filtros e coordenação das operações |
| `frontend/src/components/FormularioLogin.jsx` | Formulário de login |
| `frontend/src/components/FormularioChamado.jsx` | Cadastro e seleção de fotos |
| `frontend/src/components/ListaChamados.jsx` | Filtros e tabela de chamados |
| `frontend/src/components/DetalhesChamado.jsx` | Detalhes, galeria e envio de fotos |
| `frontend/src/components/StatusChamado.jsx` | Status e data correspondente |
| `frontend/src/components/Paginacao.jsx` | Navegação entre páginas |
| `frontend/src/services/autenticacaoApi.js` | Sessão, login, logout e CSRF |
| `frontend/src/services/chamadosApi.js` | Requisições de chamados e fotos |
| `frontend/src/App.css` | Estilos da interface |
| `frontend/src/index.css` | Estilos globais |
| `frontend/public/elodesk.svg` | Identidade visual do EloDesk |
| `frontend/src/test/setup.js` | Preparação e limpeza dos testes da interface |
| `frontend/vite.config.js` | Configuração do Vite, proxy e Vitest |
| `frontend/playwright.config.js` | Configuração dos testes de navegador |
| `frontend/e2e/autenticacao.js` | Preparação de usuários e sessões dos testes |
| `frontend/e2e/cadastro.spec.js` | Cadastro com foto, detalhes e transições |
| `frontend/e2e/filtros.spec.js` | Filtros combinados e paginação |
| `frontend/e2e/login.spec.js` | Login, sessão e logout |
| `.github/workflows/testes.yml` | Integração contínua |

### Principais componentes Java

| Componente | Responsabilidade |
|---|---|
| `ChamadosApplication` | Inicialização da aplicação |
| `Chamado` | Entidade, prioridade, datas e transições de status |
| `ChamadoRepository` | Persistência e consultas de chamados |
| `ChamadoService` | Validações e operações de negócio |
| `ChamadoController` | Endpoints de chamados |
| `CriarChamadoRequest` | Dados recebidos no cadastro |
| `PaginaChamadosResposta` | Resposta paginada |
| `FotoChamadoController` | Endpoints de fotos |
| `FotoChamadoService` | Validação, processamento e persistência das fotos |
| `Usuario` | Dados do usuário e perfil |
| `PerfilUsuario` | Perfis SOLICITANTE e ATENDENTE |
| `UsuarioRepository` | Persistência e busca por e-mail |
| `UsuarioService` | Validação e cadastro de usuários |
| `UsuarioController` | Endpoint de cadastro de usuários |
| `UsuarioResposta` | Dados públicos do usuário |
| `UsuarioDetalhesService` | Consulta do usuário para autenticação |
| `ConfiguracaoSenhas` | Configuração do BCrypt |
| `ConfiguracaoSeguranca` | Proteção HTTP, sessão e CSRF |
| `ErroResposta` | Estrutura dos erros |
| `TratadorDeErros` | Tratamento centralizado de erros |

## Pré-requisitos

- JDK 21 para reproduzir o ambiente da integração contínua.
- Maven 3.9.x.
- PostgreSQL 17.
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

Se o projeto já estiver no computador, utilize a pasta existente.

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

| Variável | Finalidade | Valor padrão |
|---|---|---|
| `DB_URL` | Endereço do banco | `jdbc:postgresql://localhost:5432/chamados_db` |
| `DB_USER` | Usuário do banco | `chamados_app` |
| `DB_PASSWORD` | Senha do banco | Sem valor padrão |

As configurações incluem:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
```

O Flyway aplica as migrações e o Hibernate valida a compatibilidade das tabelas com as entidades.

### 4. Executar os testes Java

Na raiz do projeto, onde está o `pom.xml`:

```powershell
mvn clean test
```

Os testes utilizam H2 em memória. Não é necessário iniciar o PostgreSQL nem definir `DB_PASSWORD`.

### 5. Iniciar o back-end

Com o PostgreSQL em execução, utilize um terminal na raiz:

```powershell
$senhaBanco = Read-Host "Senha do chamados_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $senhaBanco).Password
mvn spring-boot:run
```

Execute o Maven na raiz, não dentro de `frontend`.

A variável de ambiente fica disponível nessa sessão do terminal. Em outra sessão, informe-a novamente.

Não registre senhas reais no código ou em arquivos enviados ao GitHub.

A API utiliza `http://localhost:8080`. Os endpoints de chamados exigem uma sessão autenticada.

### 6. Iniciar o front-end

Abra outro terminal na raiz:

```powershell
cd frontend
npm ci
npm run dev
```

Nas próximas inicializações, se as dependências não tiverem mudado, basta executar `npm run dev` dentro de `frontend`.

Abra [http://localhost:5173](http://localhost:5173).

O Vite utiliza a porta 5173 com `strictPort: true`. Se ela estiver ocupada, informa um erro em vez de escolher outra porta.

Mantenha os dois terminais em execução. Para encerrar uma aplicação, pressione `Ctrl + C` no terminal correspondente.

Após alterar código Java, reinicie a API.

### 7. Cadastrar um usuário e entrar

O projeto não cria automaticamente uma conta com as credenciais dos exemplos.

Para uma instalação nova, utilize o exemplo de cadastro pela API apresentado adiante. Depois, entre na interface com o e-mail e a senha cadastrados.

A sessão do PowerShell e a sessão do navegador são independentes. Fazer login pelo PowerShell não conecta automaticamente a interface.

## Comunicação entre front-end e API

A interface utiliza caminhos iniciados por `/api`.

Durante o desenvolvimento, o proxy do Vite encaminha as requisições para `http://127.0.0.1:8080`, removendo esse prefixo.

Exemplo:

- A interface solicita `/api/chamados`.
- O proxy encaminha para `http://127.0.0.1:8080/chamados`.

No modo `e2e`, a interface utiliza a porta 5174 e o proxy aponta para a API de testes na porta 8081.

O serviço `autenticacaoApi.js` centraliza as operações de autenticação e obtenção do token CSRF. O serviço `chamadosApi.js` centraliza as operações de chamados e fotos.

O projeto ainda não possui deploy configurado. A publicação exigirá definir como a interface acessará a API em produção.

## Utilizando a interface

1. Entre com um usuário cadastrado.
2. Clique em **+ Criar chamado**.
3. Preencha título, descrição e prioridade.
4. Opcionalmente, clique em **+ Adicionar fotos** e selecione imagens.
5. Clique em **Cadastrar chamado**.
6. Consulte os detalhes abertos após o cadastro.
7. Na tabela, clique no número ou no título para abrir os detalhes novamente.
8. Utilize os filtros de status e prioridade.
9. Clique em **Iniciar atendimento** em um chamado aberto.
10. Clique em **Resolver chamado** quando ele estiver em atendimento.
11. Utilize **Sair** para encerrar a sessão.

A descrição fica nos detalhes, mantendo a tabela mais compacta.

### Comportamento dos filtros

Os filtros podem ser usados separadamente ou combinados.

Exemplo: selecionar `Abertos` e prioridade `Alta` retorna somente chamados abertos de prioridade alta.

- Alterar qualquer filtro retorna à primeira página.
- Selecionar `Todas as prioridades` remove apenas o filtro de prioridade.
- Clicar em `Todos` remove apenas o filtro de status.
- Atualizar a lista mantém os filtros e a página.
- O filtro de prioridade da tabela não altera a prioridade do formulário.

Após o cadastro, os filtros e a página são mantidos. Os detalhes do novo chamado são abertos, mesmo que ele não esteja visível na página atual da tabela.

A ordenação é por ID crescente. Um novo chamado aparece no final dos resultados quando corresponde aos filtros.

Ao mudar o status, um chamado pode deixar de corresponder ao filtro. Se isso eliminar a última página, a interface ajusta a navegação para uma página válida.

## Endpoints

Os caminhos abaixo são os da API, sem o prefixo `/api` utilizado pelo proxy do Vite.

| Método | Caminho | Operação | Sucesso |
|---|---|---|---|
| GET | `/auth/csrf` | Obter token CSRF | 200 |
| POST | `/usuarios` | Cadastrar usuário | 201 |
| POST | `/auth/login` | Iniciar sessão | 204 |
| GET | `/auth/me` | Consultar usuário conectado | 200 |
| POST | `/auth/logout` | Encerrar sessão | 204 |
| GET | `/chamados` | Listar com filtros opcionais | 200 |
| GET | `/chamados/paginados` | Listar com paginação e filtros | 200 |
| GET | `/chamados/{id}` | Buscar chamado | 200 |
| POST | `/chamados` | Abrir chamado | 201 |
| PATCH | `/chamados/{id}/atendimento` | Iniciar atendimento | 200 |
| PATCH | `/chamados/{id}/resolucao` | Resolver chamado | 200 |
| GET | `/chamados/{id}/fotos` | Listar metadados das fotos | 200 |
| POST | `/chamados/{id}/fotos` | Enviar fotos | 201 |
| GET | `/chamados/{id}/fotos/{fotoId}` | Consultar conteúdo da foto | 200 |

Todos os endpoints de chamados e fotos exigem autenticação. As operações de escrita exigem CSRF, inclusive o cadastro de usuários e o login.

### Cadastro de chamado

Corpo JSON de `POST /chamados`:

```json
{
  "titulo": "Computador nao liga",
  "descricao": "O equipamento nao responde ao botao.",
  "prioridade": "Alta"
}
```

Se a prioridade for omitida, a API utiliza `Normal`.

### Cadastro de usuário

Corpo JSON de `POST /usuarios`:

```json
{
  "nome": "Usuario Demonstracao",
  "email": "demo@example.com",
  "senha": "DemonstracaoLocal-2026!"
}
```

A senha é exclusiva do exemplo local e não deve ser reutilizada em contas reais.

Exemplo de resposta:

```json
{
  "id": 1,
  "nome": "Usuario Demonstracao",
  "email": "demo@example.com",
  "ativo": true
}
```

O ID é gerado pelo banco. A resposta não contém senha, hash ou perfil.

O cadastro não inicia uma sessão. Repetir um e-mail normalizado retorna `409 Conflict`.

### Login

O login recebe `email` e `senha` no formato `application/x-www-form-urlencoded`, não JSON.

Login e logout bem-sucedidos retornam HTTP 204, sem corpo.

### Fotos

O envio utiliza `multipart/form-data`, com um ou mais arquivos no campo `fotos`.

Ao utilizar `FormData` no navegador, não defina manualmente o cabeçalho `Content-Type`: o navegador inclui o delimitador necessário.

A listagem e o envio retornam metadados com:

- `id`
- `nome`
- `tipo`
- `tamanho`

A consulta de uma foto individual retorna o conteúdo binário, com o tipo de mídia correspondente.

### Filtros e paginação

| Parâmetro | Valores ou limites | Padrão |
|---|---|---|
| `pagina` | Índice começando em zero | `0` |
| `tamanho` | Entre 1 e 100 | `10` |
| `status` | `Aberto`, `Em atendimento`, `Resolvido` | Sem filtro |
| `prioridade` | `Baixa`, `Normal`, `Alta` | Sem filtro |

Exemplo:

```text
GET /chamados/paginados?pagina=0&tamanho=5&status=Aberto&prioridade=Alta
```

A API normaliza maiúsculas, minúsculas e espaços nas extremidades dos filtros. Para remover um filtro, omita seu parâmetro.

A resposta paginada contém:

| Campo | Conteúdo |
|---|---|
| `chamados` | Chamados da página |
| `pagina` | Índice da página |
| `tamanho` | Tamanho solicitado |
| `totalElementos` | Total correspondente aos filtros |
| `totalPaginas` | Quantidade de páginas |
| `temProxima` | Indica se há uma próxima página |

A interface solicita 5 itens por página.

### Dados de um chamado

- `id`
- `titulo`
- `descricao`
- `status`
- `prioridade`
- `dataAbertura`
- `dataInicioAtendimento`
- `dataResolucao`

Datas de transições ainda não realizadas permanecem sem valor. As fotos são consultadas por endpoints próprios.

### Erros

As respostas padronizadas utilizam `status`, `erro` e `caminho`.

| Código | Exemplos |
|---|---|
| 400 Bad Request | Campos, filtros, parâmetros ou imagens inválidos |
| 401 Unauthorized | Ausência de autenticação ou credenciais inválidas |
| 403 Forbidden | Token CSRF ausente ou inválido |
| 404 Not Found | Chamado ou foto não encontrados |
| 409 Conflict | Transição de status inválida ou e-mail duplicado |
| 413 Payload Too Large | Requisição multipart acima dos limites configurados |

Exemplo:

```json
{
  "status": 409,
  "erro": "E-mail já cadastrado.",
  "caminho": "/usuarios"
}
```

## Exemplos da API no PowerShell

Com a API em execução, abra outro terminal. Execute os exemplos na ordem, na mesma sessão do PowerShell, para preservar variáveis e cookies.

Os cadastros criam registros no banco utilizado pela API.

### Preparar a sessão e o CSRF

```powershell
$urlApi = "http://localhost:8080"

$csrf = Invoke-RestMethod `
    -Uri "$urlApi/auth/csrf" `
    -SessionVariable sessaoApi `
    -ErrorAction Stop

function Obter-CabecalhoCsrf {
    $token = Invoke-RestMethod `
        -Uri "$urlApi/auth/csrf" `
        -WebSession $sessaoApi `
        -ErrorAction Stop

    $cabecalhos = @{}
    $cabecalhos[$token.headerName] = $token.token

    return $cabecalhos
}
```

Obter o token CSRF não autentica o usuário. A função busca um token atualizado antes de cada operação de escrita.

### Cadastrar um usuário de demonstração

O e-mail é diferente a cada execução para evitar conflito com contas existentes.

```powershell
$emailDemonstracao = "demo-$([guid]::NewGuid().ToString('N'))@example.com"
$senhaDemonstracao = "DemonstracaoLocal-2026!"

$dadosUsuario = @{
    nome = "Usuario Demonstracao"
    email = $emailDemonstracao
    senha = $senhaDemonstracao
} | ConvertTo-Json

$parametrosUsuario = @{
    Uri = "$urlApi/usuarios"
    Method = "Post"
    WebSession = $sessaoApi
    Headers = (Obter-CabecalhoCsrf)
    ContentType = "application/json; charset=utf-8"
    Body = [System.Text.Encoding]::UTF8.GetBytes($dadosUsuario)
    ErrorAction = "Stop"
}

Invoke-RestMethod @parametrosUsuario
```

Para utilizar esse usuário na interface, consulte o e-mail gerado:

```powershell
$emailDemonstracao
```

### Entrar com o usuário criado

```powershell
$parametrosLogin = @{
    Uri = "$urlApi/auth/login"
    Method = "Post"
    WebSession = $sessaoApi
    Headers = (Obter-CabecalhoCsrf)
    ContentType = "application/x-www-form-urlencoded"
    Body = @{
        email = $emailDemonstracao
        senha = $senhaDemonstracao
    }
    ErrorAction = "Stop"
}

Invoke-RestMethod @parametrosLogin
```

O sucesso retorna HTTP 204. Os cookies são atualizados em `sessaoApi`.

Após o login, obtenha um token CSRF atualizado antes de outra escrita. A função definida anteriormente faz isso.

### Consultar o usuário conectado

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/auth/me" `
    -WebSession $sessaoApi `
    -ErrorAction Stop
```

### Abrir um chamado

```powershell
$dados = @{
    titulo = "Computador nao liga"
    descricao = "O equipamento nao responde ao botao."
    prioridade = "Alta"
} | ConvertTo-Json

$parametrosCadastro = @{
    Uri = "$urlApi/chamados"
    Method = "Post"
    WebSession = $sessaoApi
    Headers = (Obter-CabecalhoCsrf)
    ContentType = "application/json; charset=utf-8"
    Body = [System.Text.Encoding]::UTF8.GetBytes($dados)
    ErrorAction = "Stop"
}

$chamado = Invoke-RestMethod @parametrosCadastro
$chamado
```

### Consultar chamados

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/chamados" `
    -WebSession $sessaoApi `
    -ErrorAction Stop

Invoke-RestMethod `
    -Uri "$urlApi/chamados/$($chamado.id)" `
    -WebSession $sessaoApi `
    -ErrorAction Stop

Invoke-RestMethod `
    -Uri "$urlApi/chamados/paginados?pagina=0&tamanho=5&status=Aberto&prioridade=Alta" `
    -WebSession $sessaoApi `
    -ErrorAction Stop
```

### Iniciar atendimento e resolver

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/chamados/$($chamado.id)/atendimento" `
    -Method Patch `
    -WebSession $sessaoApi `
    -Headers (Obter-CabecalhoCsrf) `
    -ErrorAction Stop

Invoke-RestMethod `
    -Uri "$urlApi/chamados/$($chamado.id)/resolucao" `
    -Method Patch `
    -WebSession $sessaoApi `
    -Headers (Obter-CabecalhoCsrf) `
    -ErrorAction Stop
```

### Consultar metadados das fotos

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/chamados/$($chamado.id)/fotos" `
    -WebSession $sessaoApi `
    -ErrorAction Stop
```

Um chamado sem fotos retorna uma lista vazia. Para experimentar o envio, utilize o formulário ou os detalhes na interface.

### Encerrar a sessão

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/auth/logout" `
    -Method Post `
    -WebSession $sessaoApi `
    -Headers (Obter-CabecalhoCsrf) `
    -ErrorAction Stop
```

Após o logout, consultar `/auth/me`, chamados ou fotos exige um novo login.

## Persistência e migrações

Chamados, usuários e fotos são armazenados no PostgreSQL.

As migrações ficam em `src/main/resources/db/migration`.

| Versão | Alteração |
|---|---|
| V1 | Criação da tabela de chamados |
| V2 | Data de abertura |
| V3 | Datas de início do atendimento e resolução |
| V4 | Prioridade, com padrão Normal |
| V5 | Usuários, e-mail único e hash da senha |
| V6 | Perfil do usuário |
| V7 | Fotos vinculadas aos chamados |

O Hibernate utiliza `ddl-auto=validate`. Alterações na estrutura devem ser feitas por novas migrações, sem editar migrações já aplicadas.

O banco original do ambiente de desenvolvimento foi adotado pelo Flyway com baseline 0. Essa adoção não deve ser repetida. Instalações novas com banco vazio utilizam as migrações normalmente.

Para conferir a persistência no PostgreSQL:

1. Cadastre um chamado com foto.
2. Encerre a API com `Ctrl + C`.
3. Inicie novamente a API no mesmo terminal.
4. Entre novamente na interface, se necessário.
5. Abra o chamado e confira os dados e a foto.

## Testes e verificações

Resultados das execuções locais verificadas nesta versão:

| Verificação | Resultado |
|---|---|
| Back-end | 107 testes aprovados |
| Interface React | 36 testes aprovados |
| Playwright | 3 testes aprovados |
| Oxlint | 0 avisos e 0 erros |
| Build do front-end | Concluído com sucesso |

O badge no início do README informa separadamente o resultado do workflow executado no GitHub.

### Back-end

Na raiz:

```powershell
mvn clean test
```

A suíte cobre:

- Cadastro, consulta, filtros, paginação e transições dos chamados.
- Validação de campos, prioridades e datas.
- Persistência e respostas de erro.
- Cadastro de usuários, normalização e duplicidade de e-mail.
- Hash BCrypt e limites de senha.
- Autenticação, sessão e proteção CSRF.
- Persistência do perfil de usuário.
- Envio, consulta e validação de fotos.
- Limites de quantidade e tamanho das fotos.
- Rejeição de arquivos inválidos sem gravação parcial do lote.
- Proteção dos endpoints de fotos.
- Consulta de uma foto somente pelo chamado ao qual está vinculada.

Os testes utilizam o perfil `test`, H2 em memória e migrações Flyway. Não dependem do PostgreSQL nem de `DB_PASSWORD`.

O H2 permite testes independentes, mas não substitui a verificação com PostgreSQL.

### Interface React

Dentro de `frontend`:

```powershell
npm test
```

| Arquivo | Quantidade |
|---|---|
| `App.test.jsx` | 14 |
| `App.prioridade.test.jsx` | 3 |
| `App.filtros.test.jsx` | 6 |
| `App.tema.test.jsx` | 8 |
| `App.autenticacao.test.jsx` | 5 |

A suíte verifica:

- Tabela, estados de carregamento, lista vazia e paginação.
- Cadastro, validação, limpeza e preservação dos campos.
- Transições de status e falhas retornadas pela API.
- Abertura dos detalhes pelo número e pelo título.
- Seleção, remoção antes do envio e envio de fotos.
- Preservação do chamado quando o envio das fotos falha.
- Prioridades e filtros combinados.
- Temas e falhas de armazenamento da preferência.
- Login, recuperação de sessão, logout e erros de autenticação.

As chamadas HTTP são simuladas. Esses testes não dependem da API Java em execução e não acessam o PostgreSQL.

Para executar novamente ao salvar alterações:

```powershell
npm run test:watch
```

Encerre com `Ctrl + C`.

### Ponta a ponta

Os 3 testes Playwright verificam:

1. Cadastro com foto, detalhes, abertura da imagem em outra aba, início do atendimento, resolução e manutenção dos dados após recarregar.
2. Combinação de status e prioridade e remoção de cada filtro preservando o outro, percorrendo as páginas.
3. Rejeição de senha incorreta, login, manutenção da sessão após recarregar e logout.

Os testes utilizam React, API Java e H2 em memória, sem simular as chamadas HTTP.

Portas:

- API de testes: `http://127.0.0.1:8081`.
- Interface de testes: `http://127.0.0.1:5174`.

Na raiz, inicie a API de testes:

```powershell
mvn test-compile spring-boot:test-run "-Dspring-boot.run.profiles=e2e"
```

Mantenha esse terminal aberto.

Em outro terminal, dentro de `frontend`, prepare as dependências na primeira utilização:

```powershell
npm ci
npx playwright install chromium
```

Execute:

```powershell
npx playwright test
```

O Playwright inicia e encerra a interface de testes automaticamente. Os testes criam seus usuários e fazem login; não é necessário entrar manualmente.

A API deve permanecer em execução. Não é necessário iniciar PostgreSQL nem configurar `DB_PASSWORD`.

Os dados do banco temporário `chamados_e2e` desaparecem quando a API de testes é encerrada.

Se a interface na porta 5174 estiver aberta manualmente, encerre-a antes dos testes: a configuração não reutiliza servidores existentes.

Os testes utilizam identificadores únicos e percorrem as páginas para localizar seus chamados, permitindo novas execuções no mesmo banco temporário.

Em caso de falha, os diagnósticos ficam em `frontend/e2e/resultados`, pasta ignorada pelo Git.

Esses testes verificam a integração com H2. Recarregar a página não equivale a reiniciar a API nem comprova, por si só, persistência no PostgreSQL.

### Análise de código e build

Dentro de `frontend`:

```powershell
npm run lint
npm run build
```

O lint analisa o código com Oxlint. O build gera os arquivos de produção em `frontend/dist`, sem publicar a aplicação.

### Resumo dos comandos

| Diretório | Comando | Finalidade |
|---|---|---|
| Raiz | `mvn clean test` | Testes Java |
| Raiz | `mvn spring-boot:run` | API com PostgreSQL |
| Raiz | `mvn test-compile spring-boot:test-run "-Dspring-boot.run.profiles=e2e"` | API de testes com H2 |
| `frontend` | `npm ci` | Instalar dependências |
| `frontend` | `npm run dev` | Interface local |
| `frontend` | `npm test` | Testes React |
| `frontend` | `npm run test:watch` | Testes React ao salvar |
| `frontend` | `npm run lint` | Análise de código |
| `frontend` | `npm run build` | Build de produção |
| `frontend` | `npx playwright install chromium` | Instalar navegador dos testes |
| `frontend` | `npx playwright test` | Testes de ponta a ponta |

## Integração contínua

O GitHub Actions executa três verificações independentes:

| Verificação | Etapas |
|---|---|
| Java | Java 21 e testes Maven |
| Front-end | Node 24, dependências, lint, testes e build |
| Ponta a ponta | Java 21, Node 24, Chromium, API com H2 e Playwright |

O workflow é executado em pushes para `main`, pull requests direcionados a `main` e acionamento manual pela aba Actions.

A configuração fica em `.github/workflows/testes.yml`.

Se o job de ponta a ponta falhar, os diagnósticos disponíveis são armazenados no artefato `diagnosticos-e2e` por 7 dias.

[Consultar execuções no GitHub Actions](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions)

## Autenticação e proteção da API

- BCrypt com fator de custo 12 e prefixo `{bcrypt}`.
- Sessão mantida por cookie.
- Troca do identificador da sessão após o login.
- Recuperação da sessão pela interface.
- Logout com encerramento da sessão no servidor.
- Rejeição de credenciais inválidas e contas inativas.
- Mensagem genérica de falha de login.
- Proteção CSRF nas operações de escrita.
- Autenticação obrigatória para chamados e fotos.
- Cadastro de usuários disponível sem login, mas com CSRF.
- Senhas e hashes ausentes das respostas públicas de usuário.

A interface não armazena a senha no armazenamento local do navegador.

Um token CSRF válido não substitui a autenticação. Consultas protegidas sem sessão retornam HTTP 401; escritas sem CSRF válido retornam HTTP 403.

Quando uma operação de chamados retorna HTTP 401, a interface orienta a recarregar a página e entrar novamente.

### Limites atuais

- Os perfis estão persistidos, mas ainda não controlam permissões.
- Qualquer usuário autenticado pode consultar e operar todos os chamados e fotos.
- Os chamados ainda não estão vinculados a um proprietário.
- Não há recuperação de senha nem confirmação de propriedade do e-mail.
- Não há tela de cadastro de usuários.
- Não há exclusão de fotos já salvas.
- O deploy ainda não foi configurado.

## Próximas melhorias

- Aplicar regras de autorização aos perfis existentes.
- Vincular chamados aos usuários e definir acesso por proprietário.
- Criar a tela de cadastro de usuários.
- Preparar a configuração de produção.
- Realizar o deploy da aplicação.

## Autor

**Guilherme Douglas Augusto Tonelli**

Estudante de Análise e Desenvolvimento de Sistemas, desenvolvendo projetos para a primeira oportunidade como programador júnior.

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)