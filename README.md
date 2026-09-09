# Sistema de Chamados de TI

Aplicação de terminal desenvolvida em Java para cadastrar e acompanhar
chamados de suporte técnico.

Projeto de estudo em evolução, com foco em orientação a objetos,
separação de responsabilidades e testes automatizados.

## Funcionalidades

- Abertura de chamados com número sequencial, título e descrição.
- Listagem dos chamados cadastrados.
- Busca por número para atualização de status.
- Validação de campos obrigatórios e entradas numéricas.
- Controle das transições de status.

## Regras de negócio

Todo chamado começa com o status "Aberto".

O fluxo permitido é:

Aberto → Em atendimento → Resolvido

- Somente chamados abertos podem iniciar o atendimento.
- Somente chamados em atendimento podem ser resolvidos.
- Chamados resolvidos não podem ser reabertos nesta versão.

## Tecnologias

- Java, com compilação direcionada à versão 21
- Maven
- JUnit Jupiter
- Git e GitHub

## Organização do código

| Arquivo | Responsabilidade |
|---|---|
| `src/main/java/Main.java` | Menu, leitura de dados e apresentação dos resultados |
| `src/main/java/Chamado.java` | Dados do chamado e regras de mudança de status |
| `src/main/java/ChamadoService.java` | Cadastro, listagem, busca e operações sobre chamados |
| `src/test/java/ChamadoServiceTest.java` | Testes automatizados do serviço e das regras |
| `pom.xml` | Configuração do Maven e dependências |

## Como executar

Requisitos: JDK 21 ou superior e Maven 3.9.x instalados,
com os comandos `java`, `javac` e `mvn` disponíveis no terminal.

Clone o repositório:

```bash
git clone https://github.com/Guilherme-Tonellidev/sistema-chamados-java.git
```

Entre na pasta:

```bash
cd sistema-chamados-java
```

Compile:

```bash
mvn clean compile
```

Execute:

```bash
java -cp target/classes Main
```

Use o menu para abrir, listar e atualizar chamados.
Digite `0` para encerrar.

## Testes automatizados

Execute:

```bash
mvn clean test
```

Os oito testes verificam:

- Cadastro de chamado com status inicial "Aberto".
- Geração de números diferentes para os chamados.
- Rejeição de título vazio.
- Rejeição de descrição vazia.
- Fluxo de atendimento até a resolução.
- Impedimento de resolução direta de um chamado aberto.
- Impedimento de reiniciar um chamado resolvido.
- Erro ao buscar um chamado inexistente.

## Limitação atual

Os chamados são armazenados apenas em memória e são perdidos
ao encerrar o programa.

## Próximas melhorias

- Executar os testes automaticamente no GitHub.
- Criar uma API REST com Spring Boot.
- Adicionar persistência em banco de dados.

## Autor

[Guilherme Tonelli](https://github.com/Guilherme-Tonellidev)