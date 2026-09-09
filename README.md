# Sistema de Chamados de TI

Aplicação de terminal desenvolvida em Java para cadastrar e acompanhar
chamados de suporte técnico.

Projeto de estudo em evolução, com foco em orientação a objetos,
validação de entradas e regras de negócio.

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

## Tecnologias e conceitos

- Java
- Git
- Classes e objetos
- Encapsulamento
- ArrayList
- Métodos
- Tratamento de exceções

## Como executar

É necessário ter um JDK instalado e os comandos `javac` e `java`
disponíveis no terminal.

Na pasta principal do projeto, compile:

```bash
javac -encoding UTF-8 -d out src/Main.java src/Chamado.java
```

Execute:

```bash
java -cp out Main
```

Use o menu do terminal para abrir, listar e atualizar chamados.
Digite `0` para encerrar.

## Estrutura

- `src/Main.java`: menu, leitura de dados e gerenciamento da lista.
- `src/Chamado.java`: dados do chamado e regras de mudança de status.
- `.gitignore`: arquivos que não devem ser versionados.

## Limitação atual

Os chamados são armazenados apenas em memória e são perdidos
ao encerrar o programa.

## Próximas melhorias

- Separar o gerenciamento dos chamados em uma classe de serviço.
- Adicionar testes automatizados.
- Criar uma API REST com Spring Boot.
- Adicionar persistência em banco de dados.

## Autor

Guilherme Tonelli