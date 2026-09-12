# Sistema de Chamados de TI

[![Testes Java](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml/badge.svg)](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions/workflows/testes.yml)

API REST para gerenciamento de chamados de suporte técnico, desenvolvida com Java e Spring Boot, com armazenamento em PostgreSQL.

Projeto de estudo para praticar desenvolvimento back-end, regras de negócio, persistência de dados, testes automatizados e integração contínua.

## Funcionalidades

- Abrir chamados com título e descrição.
- Listar chamados cadastrados.
- Buscar um chamado pelo ID.
- Iniciar o atendimento de um chamado.
- Resolver um chamado em atendimento.
- Preservar os dados depois de reiniciar a aplicação.
- Validar campos obrigatórios e transições de status.

## Regras de negócio

- Novos chamados recebem o status `Aberto`.
- Título e descrição não podem ficar vazios.
- Somente chamados abertos podem iniciar atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem iniciar atendimento novamente.

Fluxo de status:

**Aberto → Em atendimento → Resolvido**

## Tecnologias

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- PostgreSQL
- Maven
- Flyway
- JUnit Jupiter
- MockMvc
- H2 para testes
- Git e GitHub
- GitHub Actions

## Organização do código

| Componente | Responsabilidade |
|---|---|
| `ChamadosApplication` | Inicialização da aplicação Spring Boot |
| `Chamado` | Entidade persistida e regras de mudança de status |
| `ChamadoRepository` | Acesso aos dados com Spring Data JPA |
| `ChamadoService` | Operações de negócio e transações |
| `ChamadoController` | Endpoints HTTP da API |
| `CriarChamadoRequest` | Dados recebidos na abertura de chamados |
| `Main` | Interface de console |

O código principal fica em `src/main/java/br/com/guilhermetonelli/chamados`.

As configurações ficam em `src/main/resources`.

Os testes e suas configurações ficam em `src/test/java` e `src/test/resources`.

## Pré-requisitos

- JDK 21 ou uma versão posterior compatível com o Spring Boot utilizado.
- Maven 3.9.x.
- PostgreSQL instalado e em execução.
- Git para clonar o projeto.

A compilação utiliza a versão 21 do Java. A integração contínua também executa com Java 21.

## Como executar a API

### 1. Clonar o repositório

```powershell
git clone https://github.com/Guilherme-Tonellidev/sistema-chamados-java.git
cd sistema-chamados-java
```

### 2. Preparar o PostgreSQL

No pgAdmin, conecte-se com um usuário administrador.

Em **Login/Group Roles**, crie um usuário com:

- Nome: `chamados_app`.
- Senha: uma senha definida por você.
- Permissão de login habilitada.

Depois, em **Databases**, crie o banco:

- Nome: `chamados_db`.
- Proprietário: `chamados_app`.

O usuário da aplicação não precisa ser superusuário.

### 3. Configurar a conexão

O arquivo `src/main/resources/application.properties` utiliza:

```properties
spring.application.name=sistema-chamados-java

spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/chamados_db}
spring.datasource.username=${DB_USER:chamados_app}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
```

| Variável | Finalidade | Valor padrão |
|---|---|---|
| `DB_URL` | Endereço do banco | `jdbc:postgresql://localhost:5432/chamados_db` |
| `DB_USER` | Usuário do banco | `chamados_app` |
| `DB_PASSWORD` | Senha do banco | Sem padrão; deve ser informada |

Para informar a senha no PowerShell:

```powershell
$senhaBanco = Read-Host "Senha do chamados_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $senhaBanco).Password
```

Digite a senha do usuário `chamados_app` quando solicitado.

A variável fica disponível nessa sessão do terminal. Ao abrir outro terminal, informe-a novamente.

Não coloque senhas reais no código, no README ou em arquivos enviados ao GitHub.

### 4. Iniciar a aplicação

No mesmo terminal:

```powershell
mvn spring-boot:run
```

A API fica disponível em:

```text
http://localhost:8080/chamados
```

Se não houver chamados cadastrados, a resposta será:

```json
[]
```

A estrutura do banco é gerenciada por migrações Flyway, localizadas em 
`src/main/resources/db/migration`. 
O Hibernate valida a compatibilidade entre as tabelas e as entidades Java com `ddl-auto=validate`.

Os testes também executam essas migrações no H2 em memória.

## Endpoints

| Método | Caminho | Operação | Sucesso |
|---|---|---|---|
| GET | `/chamados` | Listar chamados | 200 |
| GET | `/chamados/{id}` | Buscar pelo ID | 200 |
| POST | `/chamados` | Abrir chamado | 201 |
| PATCH | `/chamados/{id}/atendimento` | Iniciar atendimento | 200 |
| PATCH | `/chamados/{id}/resolucao` | Resolver chamado | 200 |
| GET | `/chamados/paginados` | Listar com paginação e filtro opcional por status | 200 |

A listagem paginada aceita `pagina` (padrão 0), `tamanho` (padrão 10, entre 1 e 100) e `status` opcional.

Exemplo: `/chamados/paginados?pagina=0&tamanho=10&status=Aberto`

A resposta contém `chamados`, `pagina`, `tamanho`, `totalElementos`, `totalPaginas` e `temProxima`.

Respostas de erro:

- **400 Bad Request:** dados de cadastro inválidos ou JSON malformado.
- **404 Not Found:** chamado não encontrado.
- **409 Conflict:** mudança de status incompatível com o estado atual.

## Exemplos no PowerShell

Com a aplicação em execução, abra outro terminal.

### Abrir um chamado

```powershell
$dados = @{
    titulo = "Computador nao liga"
    descricao = "O equipamento nao responde ao botao."
} | ConvertTo-Json

$chamado = Invoke-RestMethod `
    -Uri "http://localhost:8080/chamados" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body $dados

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
Invoke-RestMethod `
    -Uri "http://localhost:8080/chamados/$($chamado.id)/atendimento" `
    -Method Patch
```

### Resolver o chamado

```powershell
Invoke-RestMethod `
    -Uri "http://localhost:8080/chamados/$($chamado.id)/resolucao" `
    -Method Patch
```

Os exemplos usam o ID retornado no cadastro. Execute-os na ordem apresentada e no mesmo terminal.

## Persistência

Os chamados são armazenados no PostgreSQL e permanecem disponíveis depois de reiniciar a aplicação.

Para verificar:

1. Cadastre um chamado pela API.
2. Encerre a aplicação com `Ctrl + C`.
3. Execute novamente `mvn spring-boot:run` no mesmo terminal.
4. Consulte `GET /chamados`.

O chamado cadastrado deve continuar na listagem.

## Testes automatizados

Execute na raiz do projeto:

```powershell
mvn clean test
```

A suíte atual contém **38 testes de integração**, cobrindo:

- Cadastro e listagem de chamados.
- Validação de título e descrição.
- Busca por ID.
- Transições de status.
- Respostas HTTP da API.
- Rejeição de JSON malformado.
- Operações de persistência no banco de testes.
- Filtrar chamados por status: Aberto, Em atendimento ou Resolvido.
- Respostas padronizadas para erros de cadastro, chamado inexistente, mudança de status, JSON inválido e ID não numérico.

Os testes utilizam o perfil `test` e um banco H2 em memória, separado do PostgreSQL da aplicação.

Não é necessário iniciar o PostgreSQL nem configurar `DB_PASSWORD` para executar os testes.

O H2 permite executar a suíte de forma independente, mas não substitui a verificação da aplicação com PostgreSQL.

## Integração contínua

O GitHub Actions executa a compilação e os testes em pushes e pull requests direcionados à branch `main`.

O workflow fica em:

```text
.github/workflows/testes.yml
```

[Consultar execuções dos testes](https://github.com/Guilherme-Tonellidev/sistema-chamados-java/actions)

## Próximas melhorias

- Evoluir a validação e padronizar as respostas de erro.
- Adicionar filtros e paginação.
- Versionar alterações do banco com migrações.
- Criar uma interface web para consumir a API.
- Evoluir o projeto para uma aplicação full stack.

## Autor

**Guilherme Douglas Augusto Tonelli**

Estudante de Análise e Desenvolvimento de Sistemas

- [GitHub](https://github.com/Guilherme-Tonellidev)
- [LinkedIn](https://www.linkedin.com/in/guilherme-tonelli-473584423)