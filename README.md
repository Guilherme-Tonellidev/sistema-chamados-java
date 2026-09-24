# EloDesk — Sistema de Chamados de TI

[![Verificações Java e Front-end](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml/badge.svg)](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml)

**Seu suporte, mais próximo.**

Aplicação full stack para gerenciamento de chamados de suporte técnico, com API REST em Java e Spring Boot, interface React e persistência em PostgreSQL.

Projeto de portfólio desenvolvido para praticar integração entre front-end e back-end, regras de negócio, autenticação, autorização, persistência, testes automatizados e integração contínua.

## Funcionalidades

### Interface web

- Entrar com e-mail e senha, mostrar ou ocultar a senha e encerrar a sessão.
- Recuperar a sessão ao recarregar a página.
- Cadastrar chamados com título, descrição e prioridade.
- Selecionar fotos durante o cadastro, com prévia e remoção antes do envio.
- Listar chamados permitidos ao usuário, com paginação de 5 itens.
- Abrir detalhes pelo número ou pelo título do chamado.
- Consultar descrição, prioridade, status, datas e fotos.
- Adicionar fotos a um chamado acessível e abrir imagens em outra aba.
- Filtrar por status e prioridade, separadamente ou em conjunto.
- Retornar à primeira página ao alterar filtros.
- Oferecer ações de atendimento somente ao Técnico de TI.
- Exibir datas de abertura, início do atendimento e resolução.
- Identificar prioridades e status por texto e cores.
- Alternar entre temas claro e escuro e salvar a preferência no navegador.
- Atualizar a lista e apresentar estados de carregamento, erro e lista vazia.
- Validar campos obrigatórios e bloquear novos envios durante uma operação.
- Adaptar o layout a telas menores, com rolagem horizontal da tabela.

A tela de login possui apresentação escura própria. A preferência de tema é aplicada ao painel de chamados.

### API REST

- Cadastrar, listar, filtrar e buscar chamados.
- Vincular novos chamados ao usuário autenticado.
- Aplicar permissões por perfil e pelo solicitante do chamado.
- Restringir início de atendimento e resolução ao Técnico de TI.
- Aplicar as permissões também às fotos, à paginação e às contagens.
- Validar campos, prioridades, imagens e transições de status.
- Registrar datas de abertura e transições.
- Cadastrar usuários com e-mail normalizado e único.
- Armazenar somente o hash da senha, utilizando BCrypt.
- Autenticar por sessão e proteger escritas com CSRF.
- Retornar erros padronizados.
- Persistir dados no PostgreSQL e gerenciar a estrutura com Flyway.

O cadastro de usuários está disponível pela API. Ainda não existe tela de cadastro.

## Perfis e permissões

O sistema utiliza dois perfis:

| Perfil interno | Nome utilizado na documentação | Acesso |
|---|---|---|
| `SOLICITANTE` | Solicitante | Cria chamados e acessa somente seus próprios chamados e fotos |
| `ATENDENTE` | Técnico de TI | Acessa todos os chamados e fotos e pode iniciar atendimento e resolver chamados |

**Técnico de TI** é o nome apresentado nesta documentação para o perfil interno `ATENDENTE`.

- O cadastro público sempre cria usuários com perfil `SOLICITANTE`.
- O solicitante de um novo chamado é definido pelo usuário autenticado.
- Um Técnico de TI também pode criar chamados.
- Somente o Técnico de TI pode alterar o status, inclusive quando o chamado pertence ao próprio solicitante.
- As permissões são verificadas no back-end, mesmo em requisições feitas diretamente à API.
- A autorização dos chamados consulta o perfil atual e a situação ativa do usuário no banco.
- Chamados antigos sem solicitante vinculado ficam acessíveis somente ao Técnico de TI.
- Não existe endpoint público para promover usuários a Técnico de TI.

Na interface, a coluna de ações fica oculta para solicitantes e para usuários sem perfil reconhecido como `ATENDENTE`.

Listagens, filtros, paginação e totais consideram somente os chamados que o usuário pode acessar. Consultas a chamados de outro solicitante e às respectivas fotos retornam `404`, evitando confirmar a existência desses recursos.

## Regras de negócio

### Cadastro e status dos chamados

- Título e descrição são obrigatórios e não podem conter apenas espaços.
- Espaços nas extremidades desses campos são removidos.
- Novos chamados recebem status `Aberto`.
- Somente chamados abertos podem iniciar atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem iniciar atendimento novamente.

**Fluxo: Aberto → Em atendimento → Resolvido**

Para o Técnico de TI, a tabela oferece a ação correspondente ao status atual. A API valida tanto a permissão quanto a transição solicitada.

Chamados resolvidos continuam disponíveis para consulta, respeitando as permissões.

### Prioridade

Valores aceitos:

- `Baixa`
- `Normal`
- `Alta`

A prioridade padrão é `Normal` quando omitida no cadastro. Valores inválidos são rejeitados.

A interface utiliza texto e cor para identificar a prioridade.

### Datas e horários

| Campo | Registro |
|---|---|
| `dataAbertura` | Criação do chamado |
| `dataInicioAtendimento` | Início do atendimento |
| `dataResolucao` | Resolução |

A tabela mostra a abertura e a data correspondente ao status. Os detalhes permitem consultar as três datas.

Os horários são apresentados no formato brasileiro, utilizando o fuso horário do navegador. Datas não registradas recebem uma indicação na interface. Registros antigos não recebem datas históricas inventadas.

### Fotos

- Envio opcional, limitado a 5 fotos por chamado.
- Formatos JPEG e PNG.
- Até 5 MB por arquivo e 12 milhões de pixels por imagem.
- Validação do conteúdo real da imagem, além da extensão.
- Reprocessamento antes do armazenamento.
- Conteúdo e metadados armazenados no banco.
- Consulta e envio sujeitos às permissões do chamado.
- Envio protegido por CSRF.

Na interface, o chamado é criado primeiro e as fotos são enviadas em uma segunda requisição.

Se o envio das fotos falhar, o chamado permanece salvo. A interface orienta a conferir a galeria e enviar apenas as fotos que faltam, sem repetir o cadastro.

Não existe exclusão de fotos já salvas. A remoção no formulário se aplica aos arquivos selecionados antes do envio.

### Cadastro de usuários

- Nome, e-mail e senha obrigatórios.
- Nome com até 100 caracteres, após remover espaços nas extremidades.
- E-mail com até 254 caracteres, validação de formato e normalização para minúsculas.
- Cada e-mail normalizado pode pertencer a apenas um usuário.
- Senha com pelo menos 15 caracteres e no máximo 72 bytes em UTF-8.
- Caracteres Unicode podem ocupar mais de um byte.
- A senha é preservada como recebida, inclusive espaços nas extremidades.
- Novos usuários recebem `ativo: true` e perfil `SOLICITANTE`.
- Somente o hash da senha é armazenado.
- Respostas públicas incluem o perfil, mas não incluem senha nem hash.

A validação do formato do e-mail não confirma a existência da caixa postal nem sua propriedade.

## Tecnologias

| Área | Tecnologias |
|---|---|
| Back-end | Java 21, Spring Boot, Spring Web MVC |
| Persistência | Spring Data JPA, Spring JDBC, PostgreSQL 17, Flyway |
| Segurança | Spring Security, sessão, CSRF e BCrypt |
| Front-end | React 19, JavaScript, Vite 8, HTML e CSS |
| Testes Java | JUnit Jupiter, MockMvc e H2 |
| Testes da interface | Vitest, React Testing Library, jest-dom, user-event e jsdom |
| Ponta a ponta | Playwright e Chromium |
| Análise de código | Oxlint |
| Ferramentas | Maven, Node.js 24, npm, Git e GitHub Actions |

## Organização do projeto

Caminhos relativos à raiz do repositório:

| Caminho | Conteúdo |
|---|---|
| `src/main/java` | Código Java principal |
| `src/main/resources` | Configurações da API |
| `src/main/resources/db/migration` | Migrações Flyway |
| `src/test/java` | Testes Java e preparação do técnico E2E |
| `src/test/resources` | Configurações dos ambientes de teste |
| `frontend/src/App.jsx` | Sessão e fluxo de autenticação |
| `frontend/src/PainelChamados.jsx` | Tema, filtros, permissões visuais e operações |
| `frontend/src/components` | Login, cadastro, listagem, detalhes, fotos e paginação |
| `frontend/src/services/autenticacaoApi.js` | Sessão, login, logout e CSRF |
| `frontend/src/services/chamadosApi.js` | Requisições de chamados e fotos |
| `frontend/src/test/setup.js` | Preparação dos testes da interface |
| `frontend/vite.config.js` | Vite, proxy e Vitest |
| `frontend/playwright.config.js` | Configuração dos testes de navegador |
| `frontend/e2e/autenticacao.js` | Usuários e sessões E2E |
| `frontend/e2e/cadastro.spec.js` | Cadastro com foto, permissões e atendimento |
| `frontend/e2e/filtros.spec.js` | Filtros combinados e paginação |
| `frontend/e2e/login.spec.js` | Login, sessão e logout |
| `.github/workflows/testes.yml` | Integração contínua |

### Principais componentes Java

| Componente | Responsabilidade |
|---|---|
| `ChamadosApplication` | Inicialização |
| `Chamado` | Solicitante, prioridade, datas e transições |
| `ChamadoRepository` | Consultas, filtros e paginação com permissões |
| `ChamadoService` | Validação, autorização e operações |
| `ChamadoController` | Endpoints de chamados |
| `CriarChamadoRequest` | Dados recebidos no cadastro |
| `PaginaChamadosResposta` | Resposta paginada |
| `FotoChamadoController` | Endpoints de fotos |
| `FotoChamadoService` | Acesso, validação, processamento e armazenamento de fotos |
| `Usuario` e `PerfilUsuario` | Dados e perfil do usuário |
| `UsuarioRepository` | Persistência e consulta de usuários |
| `UsuarioService` e `UsuarioController` | Cadastro de usuários |
| `UsuarioResposta` | Dados públicos, incluindo perfil |
| `UsuarioDetalhesService` | Autenticação e autoridades do perfil |
| `AutenticacaoController` | Consulta da sessão e token CSRF |
| `ConfiguracaoSenhas` | BCrypt |
| `ConfiguracaoSeguranca` | Proteção HTTP, sessão e CSRF |
| `ErroResposta` e `TratadorDeErros` | Respostas de erro |
| `ConfiguracaoUsuarioE2E` | Conta técnica exclusiva do ambiente E2E, em `src/test/java` |

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

Para uma instalação nova, utilize uma conta administradora no pgAdmin:

1. Crie o usuário `chamados_app`, com senha definida por você e permissão de login.
2. Crie o banco `chamados_db`, tendo `chamados_app` como proprietário.

O usuário da aplicação não precisa ser superusuário. Se o usuário e o banco já existirem, reutilize-os.

### 3. Configurar a conexão

| Variável | Finalidade | Padrão |
|---|---|---|
| `DB_URL` | Endereço do banco | `jdbc:postgresql://localhost:5432/chamados_db` |
| `DB_USER` | Usuário | `chamados_app` |
| `DB_PASSWORD` | Senha | Sem valor padrão |

O Flyway aplica as migrações e o Hibernate valida a estrutura:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
```

### 4. Executar os testes Java

Na raiz, onde está o `pom.xml`:

```powershell
mvn clean test
```

Os testes utilizam H2 em memória. Não exigem PostgreSQL nem `DB_PASSWORD`.

### 5. Iniciar o back-end

Com o PostgreSQL em execução, utilize um terminal na raiz:

```powershell
$senhaBanco = Read-Host "Senha do chamados_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $senhaBanco).Password
mvn spring-boot:run
```

A variável vale para essa sessão do terminal. Em outra sessão, informe-a novamente.

Não registre senhas reais no código ou em arquivos enviados ao GitHub.

A API utiliza `http://localhost:8080`. Após alterar código Java, reinicie a API.

### 6. Iniciar o front-end

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

Nas próximas inicializações, se as dependências não mudarem, basta executar `npm run dev`.

O Vite utiliza a porta 5173 com `strictPort: true`. Se estiver ocupada, informa um erro.

Mantenha ambos os terminais abertos. Para encerrar uma aplicação, pressione `Ctrl + C` no terminal correspondente.

### 7. Cadastrar um usuário e entrar

No ambiente normal com PostgreSQL, o projeto não cria automaticamente contas de demonstração nem técnicos.

Cadastre um usuário pela API, conforme os exemplos adiante, e entre na interface. Esse usuário terá perfil `SOLICITANTE`.

Não existe tela ou endpoint público de alteração de perfil. O provisionamento de técnicos no ambiente normal depende de administração controlada do banco.

A conta técnica criada para E2E existe somente no ambiente de testes.

As sessões do PowerShell e do navegador são independentes.

## Comunicação entre front-end e API

A interface utiliza caminhos iniciados por `/api`.

No desenvolvimento, o proxy do Vite remove esse prefixo e encaminha para `http://127.0.0.1:8080`.

Exemplo:

- Interface: `/api/chamados`.
- API: `http://127.0.0.1:8080/chamados`.

No modo `e2e`, a interface utiliza a porta 5174 e encaminha para a API na porta 8081.

`autenticacaoApi.js` centraliza sessão e CSRF. `chamadosApi.js` centraliza chamados e fotos.

O deploy ainda não foi configurado. A publicação exigirá definir como a interface acessará a API em produção.

## Utilizando a interface

### Solicitante

1. Entre com um usuário cadastrado.
2. Clique em **+ Criar chamado**.
3. Preencha título, descrição e prioridade.
4. Opcionalmente, adicione fotos.
5. Clique em **Cadastrar chamado**.
6. Consulte os detalhes abertos após o cadastro.
7. Utilize a tabela, a paginação e os filtros para acompanhar seus chamados.
8. Abra detalhes pelo número ou pelo título.
9. Utilize **Sair** para encerrar a sessão.

### Técnico de TI

Além de cadastrar e consultar chamados, o técnico pode acessar chamados de outros usuários.

Na tabela:

- **Iniciar atendimento** altera um chamado aberto para em atendimento.
- **Resolver chamado** conclui um chamado em atendimento.

O solicitante não recebe esses botões. Requisições diretas para alterar status também são rejeitadas pelo back-end.

### Comportamento dos filtros

- Status e prioridade podem ser utilizados separadamente ou combinados.
- Alterar qualquer filtro retorna à primeira página.
- **Todas as prioridades** remove apenas a prioridade.
- **Todos** remove apenas o status.
- Atualizar a lista mantém filtros e página.
- O filtro de prioridade não altera o formulário de cadastro.
- Resultados e totais respeitam as permissões do usuário.

Após o cadastro, os filtros e a página são mantidos. Os detalhes do chamado criado são abertos mesmo quando ele não está visível na tabela atual.

A ordenação é por ID crescente. Se uma alteração de status esvaziar a última página de um filtro, a interface ajusta a navegação para uma página válida.

## Endpoints

Caminhos da API, sem o prefixo `/api` do proxy:

| Método | Caminho | Operação | Sucesso |
|---|---|---|---|
| GET | `/auth/csrf` | Obter CSRF | 200 |
| POST | `/usuarios` | Cadastrar solicitante | 201 |
| POST | `/auth/login` | Iniciar sessão | 204 |
| GET | `/auth/me` | Consultar usuário conectado e perfil | 200 |
| POST | `/auth/logout` | Encerrar sessão | 204 |
| GET | `/chamados` | Listar chamados permitidos | 200 |
| GET | `/chamados/paginados` | Paginar chamados permitidos | 200 |
| GET | `/chamados/{id}` | Buscar chamado acessível | 200 |
| POST | `/chamados` | Abrir chamado vinculado ao usuário | 201 |
| PATCH | `/chamados/{id}/atendimento` | Iniciar atendimento, somente técnico | 200 |
| PATCH | `/chamados/{id}/resolucao` | Resolver, somente técnico | 200 |
| GET | `/chamados/{id}/fotos` | Listar fotos de chamado acessível | 200 |
| POST | `/chamados/{id}/fotos` | Enviar fotos a chamado acessível | 201 |
| GET | `/chamados/{id}/fotos/{fotoId}` | Consultar conteúdo da foto | 200 |

Chamados e fotos exigem autenticação. Escritas exigem CSRF, inclusive cadastro de usuários e login.

### Cadastro de chamado

```json
{
  "titulo": "Computador nao liga",
  "descricao": "O equipamento nao responde ao botao.",
  "prioridade": "Alta"
}
```

A prioridade omitida assume `Normal`. O solicitante é definido pela sessão autenticada.

### Cadastro de usuário

```json
{
  "nome": "Usuario Demonstracao",
  "email": "demo@example.com",
  "senha": "DemonstracaoLocal-2026!"
}
```

A senha acima é exclusiva do exemplo local.

Exemplo de resposta:

```json
{
  "id": 1,
  "nome": "Usuario Demonstracao",
  "email": "demo@example.com",
  "ativo": true,
  "perfil": "SOLICITANTE"
}
```

O ID é gerado pelo banco. A resposta inclui perfil e não contém senha nem hash. `/auth/me` também retorna os dados públicos do usuário, incluindo o perfil.

O cadastro não inicia uma sessão. E-mail normalizado duplicado retorna `409 Conflict`.

### Login

Recebe `email` e `senha` em `application/x-www-form-urlencoded`.

Login e logout bem-sucedidos retornam HTTP 204, sem corpo.

### Fotos

O envio utiliza `multipart/form-data`, com arquivos no campo `fotos`.

Ao usar `FormData` no navegador, não defina manualmente `Content-Type`: o navegador inclui o delimitador necessário.

Listagem e envio retornam metadados com `id`, `nome`, `tipo` e `tamanho`. A consulta individual retorna o conteúdo binário.

### Filtros e paginação

| Parâmetro | Valores ou limites | Padrão |
|---|---|---|
| `pagina` | Índice começando em zero | `0` |
| `tamanho` | Entre 1 e 100 | `10` |
| `status` | `Aberto`, `Em atendimento`, `Resolvido` | Sem filtro |
| `prioridade` | `Baixa`, `Normal`, `Alta` | Sem filtro |

```text
GET /chamados/paginados?pagina=0&tamanho=5&status=Aberto&prioridade=Alta
```

A API normaliza maiúsculas, minúsculas e espaços nas extremidades dos filtros. Para remover um filtro, omita seu parâmetro.

| Campo da resposta | Conteúdo |
|---|---|
| `chamados` | Chamados permitidos da página |
| `pagina` | Índice da página |
| `tamanho` | Tamanho solicitado |
| `totalElementos` | Total permitido correspondente aos filtros |
| `totalPaginas` | Quantidade de páginas |
| `temProxima` | Indica se existe próxima página |

A interface solicita 5 itens por página.

### Dados de um chamado

- `id`
- `titulo`
- `descricao`
- `status`
- `prioridade`
- `solicitanteId`
- `dataAbertura`
- `dataInicioAtendimento`
- `dataResolucao`

Datas de transições não realizadas permanecem sem valor. Chamados legados podem não ter solicitante vinculado. Fotos são consultadas por endpoints próprios.

### Erros

As respostas padronizadas utilizam `status`, `erro` e `caminho`.

| Código | Exemplos |
|---|---|
| 400 | Campos, filtros, parâmetros ou imagens inválidos |
| 401 | Ausência de autenticação ou credenciais inválidas |
| 403 | CSRF ausente ou inválido; usuário sem permissão para alterar status |
| 404 | Chamado ou foto inexistentes ou não acessíveis ao solicitante |
| 409 | Transição inválida ou e-mail duplicado |
| 413 | Requisição multipart acima dos limites configurados |

```json
{
  "status": 409,
  "erro": "E-mail já cadastrado.",
  "caminho": "/usuarios"
}
```

## Exemplos da API no PowerShell

Execute na ordem, na mesma sessão do PowerShell. Os cadastros criam registros no banco da API utilizada.

### Preparar sessão e CSRF

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

Obter CSRF não autentica o usuário. A função busca um token atualizado antes de cada escrita.

### Cadastrar um solicitante

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
$emailDemonstracao
```

### Entrar e consultar a sessão

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

### Consultar os próprios chamados e fotos

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

Invoke-RestMethod `
    -Uri "$urlApi/chamados/$($chamado.id)/fotos" `
    -WebSession $sessaoApi `
    -ErrorAction Stop
```

Um chamado sem fotos retorna uma lista vazia de fotos.

O usuário criado neste exemplo é solicitante. Tentativas de iniciar atendimento ou resolver chamados com essa sessão são rejeitadas com HTTP 403, mesmo com CSRF válido.

Para experimentar transições com um técnico, utilize o ambiente E2E descrito adiante ou uma conta técnica previamente provisionada no ambiente normal.

### Encerrar a sessão

```powershell
Invoke-RestMethod `
    -Uri "$urlApi/auth/logout" `
    -Method Post `
    -WebSession $sessaoApi `
    -Headers (Obter-CabecalhoCsrf) `
    -ErrorAction Stop
```

Após logout, consultar sessão, chamados ou fotos exige novo login.

## Persistência e migrações

Chamados, usuários e fotos são armazenados no PostgreSQL.

Migrações em `src/main/resources/db/migration`:

| Versão | Alteração |
|---|---|
| V1 | Tabela de chamados |
| V2 | Data de abertura |
| V3 | Datas de início e resolução |
| V4 | Prioridade com padrão Normal |
| V5 | Usuários, e-mail único e hash da senha |
| V6 | Perfil do usuário |
| V7 | Fotos vinculadas aos chamados |
| V8 | Solicitante do chamado, chave estrangeira e índice |

A V8 mantém o vínculo opcional para preservar registros legados. Novos chamados criados pelo serviço recebem o solicitante autenticado. Registros sem vínculo ficam acessíveis somente ao Técnico de TI.

O Hibernate utiliza `ddl-auto=validate`. Mudanças estruturais devem ser feitas em novas migrações, sem editar migrações já aplicadas.

O banco original de desenvolvimento foi adotado pelo Flyway com baseline 0. Essa adoção não deve ser repetida. Instalações novas utilizam as migrações normalmente.

Para conferir persistência no PostgreSQL:

1. Cadastre um chamado com foto.
2. Encerre a API.
3. Inicie novamente a API.
4. Entre com o mesmo solicitante ou com um técnico.
5. Confira os dados e a foto.

## Testes e verificações

Resultados locais verificados em 24/09/2026:

| Verificação | Resultado |
|---|---|
| Back-end | 123 testes aprovados |
| Interface React | 40 testes aprovados |
| Playwright | 3 testes aprovados |
| Oxlint | 0 avisos e 0 erros |
| Build do front-end | Concluído com sucesso |

O badge no início informa separadamente o resultado do workflow no GitHub.

### Back-end

Na raiz:

```powershell
mvn clean test
```

A suíte cobre:

- Cadastro, consulta, filtros, paginação e transições.
- Campos, prioridades, datas, persistência e erros.
- Cadastro de usuários, e-mail único, BCrypt e limites de senha.
- Autenticação, sessão, CSRF e perfis.
- Vínculo do chamado ao usuário autenticado.
- Acesso do solicitante somente aos próprios chamados.
- Acesso e transições pelo Técnico de TI.
- Paginação e contagens respeitando permissões.
- Tratamento de chamados legados sem solicitante.
- Envio, consulta, formato, quantidade e tamanho de fotos.
- Rejeição de imagens inválidas sem gravação parcial do lote.
- Restrição de fotos conforme o acesso ao chamado.
- Rejeição de consulta de foto pelo ID de outro chamado.

Os testes usam H2 e Flyway. Não exigem PostgreSQL nem `DB_PASSWORD`.

H2 permite testes independentes, mas não substitui a verificação com PostgreSQL.

### Interface React

Dentro de `frontend`:

```powershell
npm test
```

| Arquivo | Quantidade |
|---|---|
| `App.test.jsx` | 18 |
| `App.prioridade.test.jsx` | 3 |
| `App.filtros.test.jsx` | 6 |
| `App.tema.test.jsx` | 8 |
| `App.autenticacao.test.jsx` | 5 |

A suíte verifica cadastro, tabela, paginação, filtros, prioridades, detalhes, fotos, temas, autenticação e tratamento de falhas.

Também verifica que as ações de atendimento ficam ocultas para solicitantes, usuários sem perfil, com perfil desconhecido ou não informados, mantendo o acesso aos detalhes na interface.

As chamadas HTTP são simuladas. Esses testes não acessam a API Java nem o PostgreSQL.

Para repetir ao salvar:

```powershell
npm run test:watch
```

### Ponta a ponta

Os três cenários utilizam React, API Java e H2, sem simular HTTP:

1. Solicitante cadastra chamado com foto, consulta detalhes e imagem; alteração direta de status é negada; técnico entra e realiza atendimento e resolução; fotos e status permanecem após recarregar.
2. Solicitante cria os chamados e um técnico, em sessão separada, prepara as resoluções; o solicitante verifica filtros combinados e paginação.
3. Senha incorreta é rejeitada; login, recuperação de sessão e logout funcionam.

Portas:

- API E2E: `http://127.0.0.1:8081`.
- Interface E2E: `http://127.0.0.1:5174`.

Na raiz, inicie a API:

```powershell
mvn test-compile spring-boot:test-run "-Dspring-boot.run.profiles=e2e"
```

Mantenha o terminal aberto.

Em outro terminal, dentro de `frontend`, prepare as dependências na primeira utilização:

```powershell
npm ci
npx playwright install chromium
```

Execute:

```powershell
npx playwright test
```

O Playwright inicia e encerra a interface automaticamente. Os testes criam solicitantes e fazem login sem intervenção manual.

### Técnico exclusivo do ambiente E2E

`ConfiguracaoUsuarioE2E`, em `src/test/java`, prepara uma conta técnica quando o perfil `e2e` está ativo:

| Campo | Valor de teste |
|---|---|
| Nome | Técnico de TI E2E |
| E-mail | `tecnico@example.com` |
| Senha | `TecnicoTeste2026!` |
| Perfil | `ATENDENTE` |

Essas credenciais são destinadas ao banco temporário E2E. A configuração não cria essa conta no PostgreSQL durante a execução normal.

Para acessar manualmente a interface E2E, mantenha a API de testes aberta e execute, dentro de `frontend`:

```powershell
npm run dev -- --mode e2e --host 127.0.0.1
```

Abra [http://127.0.0.1:5174](http://127.0.0.1:5174).

Encerre essa interface manual antes de executar o Playwright: a configuração não reutiliza servidores existentes.

O banco `chamados_e2e` desaparece quando a API de testes é encerrada. Não é necessário iniciar PostgreSQL ou informar `DB_PASSWORD`.

Os testes usam identificadores únicos e percorrem páginas para localizar seus chamados, permitindo novas execuções no mesmo banco temporário.

Diagnósticos de falhas ficam em `frontend/e2e/resultados`, ignorado pelo Git.

Recarregar o navegador não equivale a reiniciar a API nem comprova persistência no PostgreSQL.

### Análise de código e build

Dentro de `frontend`:

```powershell
npm run lint
npm run build
```

O build gera arquivos em `frontend/dist`, sem publicar a aplicação.

### Resumo dos comandos

| Diretório | Comando | Finalidade |
|---|---|---|
| Raiz | `mvn clean test` | Testes Java |
| Raiz | `mvn spring-boot:run` | API com PostgreSQL |
| Raiz | `mvn test-compile spring-boot:test-run "-Dspring-boot.run.profiles=e2e"` | API E2E |
| `frontend` | `npm ci` | Instalar dependências |
| `frontend` | `npm run dev` | Interface normal |
| `frontend` | `npm test` | Testes React |
| `frontend` | `npm run test:watch` | Testes ao salvar |
| `frontend` | `npm run lint` | Análise de código |
| `frontend` | `npm run build` | Build |
| `frontend` | `npx playwright install chromium` | Instalar navegador |
| `frontend` | `npx playwright test` | Testes E2E |

## Integração contínua

O GitHub Actions executa três verificações independentes:

| Verificação | Etapas |
|---|---|
| Java | Java 21 e Maven |
| Front-end | Node 24, dependências, lint, testes e build |
| Ponta a ponta | Java 21, Node 24, Chromium, API com H2 e Playwright |

O workflow em `.github/workflows/testes.yml` é executado em pushes para `main`, pull requests direcionados a `main` e acionamento manual.

Se o job E2E falhar, os diagnósticos disponíveis são armazenados no artefato `diagnosticos-e2e` por 7 dias.

[Consultar execuções no GitHub Actions](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions)

## Autenticação e proteção da API

- BCrypt com custo 12 e prefixo `{bcrypt}`.
- Sessão por cookie e troca do identificador após login.
- Logout com encerramento da sessão no servidor.
- Rejeição de credenciais inválidas e contas inativas.
- Mensagem genérica de falha no login.
- CSRF nas operações de escrita.
- Autenticação obrigatória para chamados e fotos.
- Autorização por perfil e solicitante no back-end.
- Cadastro público restrito ao perfil `SOLICITANTE`.
- Senhas e hashes ausentes das respostas públicas.

A interface não guarda a senha no armazenamento local.

CSRF válido não substitui autenticação nem autorização. Consultas protegidas sem sessão retornam 401. Escritas sem CSRF válido e alterações de status sem permissão retornam 403.

Quando uma operação de chamados retorna 401, a interface orienta a recarregar e entrar novamente.

### Limites atuais

- Não há recuperação de senha nem confirmação de propriedade do e-mail.
- Não há tela de cadastro de usuários.
- Não há tela ou endpoint de administração de perfis.
- Não há exclusão de fotos já salvas.
- Chamados legados sem solicitante ficam restritos ao Técnico de TI.
- O deploy ainda não foi configurado.

## Próximas melhorias

- Criar a tela de cadastro de usuários.
- Implementar administração de usuários e perfis com autorização específica.
- Adicionar recuperação de senha e confirmação de e-mail.
- Preparar a configuração de produção.
- Realizar o deploy.

## Autor

**Guilherme Douglas Augusto Tonelli**

Estudante de Análise e Desenvolvimento de Sistemas, desenvolvendo projetos para a primeira oportunidade como programador júnior.

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)