# Apostila de Estudo — Aula 01
## Apresentação da Disciplina e Introdução aos Sistemas Operacionais

> **Disciplina:** Sistemas Operacionais
> **Instituição:** Fatec — Faculdade de Tecnologia
> **Professor:** Prof. Me. Deivison S. Takatu
> **Contato:** deivison.takatu@fatec.sp.gov.br

---

## 📑 Índice

1. [Resumo Executivo](#-resumo-executivo)
2. [Mapa Mental (em texto)](#-mapa-mental-em-texto)
3. [Fluxograma do Processo da Disciplina](#-fluxograma-do-processo-da-disciplina)
4. [Explicação Detalhada dos Conceitos](#-explicação-detalhada-dos-conceitos)
   - [4.1 Apresentação da Disciplina](#41-apresentação-da-disciplina)
   - [4.2 O que são Sistemas Operacionais](#42-o-que-são-sistemas-operacionais)
   - [4.3 Estrutura Interna: Camadas e Modelos](#43-estrutura-interna-camadas-e-modelos)
   - [4.4 Escalonamento de Processos](#44-escalonamento-de-processos)
   - [4.5 Gerenciamento de Memória](#45-gerenciamento-de-memória-real-e-virtual)
   - [4.6 Dispositivos, Arquivos, Segurança e Virtualização](#46-dispositivos-arquivos-segurança-e-virtualização)
5. [Exemplos Práticos](#-exemplos-práticos)
6. [Pontos Importantes](#️-pontos-importantes)
7. [Checklist de Aprendizado](#-checklist-de-aprendizado)
8. [Perguntas Frequentes](#-perguntas-frequentes)
9. [Exercícios com Gabarito](#-exercícios-com-gabarito)
10. [Tabelas Comparativas](#-tabelas-comparativas)
11. [Glossário](#-glossário)
12. [Resumo Final (Resumo de Bolso)](#-resumo-final-resumo-de-bolso)

---

## 📖 Resumo Executivo

A Aula 01 tem caráter **introdutório** e cumpre dois papéis: (1) apresentar a disciplina, o professor, os critérios de avaliação e a primeira atividade; e (2) iniciar o conteúdo técnico com uma **visão panorâmica dos Sistemas Operacionais (SO)** — o que são, para que servem e quais são seus principais componentes internos (kernel, escalonamento de processos, gerenciamento de memória, gerenciamento de E/S, sistemas de arquivos, segurança e virtualização).

O material serve como **mapa de navegação** para o restante do semestre, indicando a sequência de tópicos que serão aprofundados nas aulas seguintes.

---

## 🧠 Mapa Mental (em texto)

```
Sistemas Operacionais (Aula 01)
│
├── 1. Apresentação da Disciplina
│   ├── Apresentação do professor (formação e atuação)
│   ├── Apresentação da turma
│   ├── Sumário da aula
│   └── Atuação do professor na Fatec
│
├── 2. O que são Sistemas Operacionais
│   ├── Definição (gerencia hardware e software)
│   ├── Importância (interface usuário-máquina)
│   └── Exemplos (Windows, macOS, Linux, Android, iOS)
│
├── 3. Estrutura Interna
│   ├── Estrutura em camadas (modularidade)
│   ├── Kernel monolítico vs. modular
│   ├── Kernel (núcleo, acesso ao hardware, recursos vitais)
│   └── Modos de operação (Usuário x Kernel)
│
├── 4. Escalonamento de Processos
│   ├── Objetivos (eficiência, justiça, tempo de resposta)
│   ├── Algoritmos (FIFO, Round Robin, Prioridade)
│   └── Impactos no desempenho
│
├── 5. Gerenciamento de Memória
│   ├── Memória Principal (alocação dinâmica, proteção)
│   └── Memória Virtual (paginação, segmentação, segurança)
│
├── 6. Dispositivos, Arquivos e Futuro
│   ├── Gerenciamento de E/S
│   ├── Sistemas de Arquivos
│   ├── Segurança em SO
│   └── Virtualização
│
└── 7. Avaliação e Atividade
    ├── Fórmula de avaliação (P1, P2, Projeto, Atividades)
    └── Atividade em grupo (GitHub + Miro)
```

---

## 🔄 Fluxograma do Processo da Disciplina

O material da aula descreve um processo claro para a **primeira atividade avaliativa**. Abaixo, o fluxo está representado em formato textual sequencial:

```
[Início]
   │
   ▼
Formar grupo de 3 a 5 integrantes
   │
   ▼
Submeter arquivo com nomes completos dos participantes
   │
   ▼
Criar repositório no GitHub (diretório principal do semestre)
   │
   ▼
Criar arquivo Markdown (.md) com resumo da Aula 01
   │
   ▼
Elaborar linha do tempo (mapa mental) dos anos de lançamento
de Sistemas Operacionais — de forma colaborativa no Miro
   │
   ▼
Converter o conteúdo do Miro em .md e salvar no repositório
   │
   ▼
[Fim — Entrega da Atividade 1]
```

---

## 📚 Explicação Detalhada dos Conceitos

### 4.1 Apresentação da Disciplina

**Histórico acadêmico e profissional do professor:**

| Formação | Ano |
|---|---|
| Graduação em Análise e Desenvolvimento de Sistemas | 2016 |
| Mestrado em Ciência da Computação | 2021 |
| Quatro Pós-graduações *Lato sensu* | — |
| Especialização em Inteligência Artificial | Em andamento |

**Experiência profissional:**

- Professor de Informática (2017–2023)
- Coordenador Acadêmico (2019–2021)
- Professor Universitário (2022–atual)
- Gerente de Projetos (2023–atual)

**Atuação na Fatec:**

- Orientações voltadas à **Programação Web**;
- Projetos envolvendo **Programação Web** e **Educação Financeira** (com apoio de recursos de **gamificação**).

**Dinâmica de apresentação da turma:** os alunos foram convidados a compartilhar experiências profissionais na área, expectativas após a conclusão do curso e um hobby ou passatempo pessoal.

---

### 4.2 O que são Sistemas Operacionais

Um **Sistema Operacional (SO)** é definido, segundo o material da aula, como um **software essencial que gerencia hardware e software**. Ele atua como uma **interface entre o usuário e a máquina**, sendo a camada que possibilita a operação prática do computador.

**Exemplos citados na aula:**
- Windows
- macOS
- Linux
- Android
- iOS

> 💬 Em outras palavras: sem um SO, o hardware existiria, mas não haveria uma forma organizada e acessível de o usuário (ou de outros programas) utilizá-lo.

---

### 4.3 Estrutura Interna: Camadas e Modelos

O material aborda como os SOs são **organizados internamente** para funcionar, destacando dois modelos de organização:

- **Estrutura em Camadas:** organização hierárquica que visa a **modularidade** do sistema.
- **Monolítica vs. Modular:** duas abordagens diferentes de **design de kernel**.

**O Kernel (núcleo do SO):**
- É o núcleo do sistema operacional;
- Possui **acesso direto ao hardware**;
- **Gerencia recursos vitais** do sistema.

**Modos de Operação:**

| Modo | Característica |
|---|---|
| **Modo Usuário** | Executa programas comuns, com privilégios limitados |
| **Modo Kernel** | Privilégios elevados, com acesso total ao sistema |

---

### 4.4 Escalonamento de Processos

O **escalonamento de processos** trata de como o SO decide **qual processo executar e por quanto tempo**.

- **Objetivos:** eficiência, justiça (*fairness*) e tempo de resposta.
- **Algoritmos citados:** FIFO (*First In, First Out*), Round Robin e Prioridade.
- **Impactos:** influencia diretamente o **desempenho geral do sistema**.

> ⚠️ O material apresenta apenas os **nomes** dos algoritmos (FIFO, Round Robin, Prioridade), sem detalhar seu funcionamento interno, vantagens ou desvantagens específicas. Esse aprofundamento não está presente nesta aula.

---

### 4.5 Gerenciamento de Memória: Real e Virtual

**Memória Principal:**
- Alocação dinâmica;
- Proteção de memória.

**Memória Virtual:**
- Funciona como uma **expansão lógica da RAM**;
- Utiliza técnicas de **paginação e segmentação**;
- Proporciona **maior segurança e flexibilidade** ao sistema.

---

### 4.6 Dispositivos, Arquivos, Segurança e Virtualização

| Tópico | Descrição (conforme material da aula) |
|---|---|
| **Gerenciamento de E/S** | Controle de hardware periférico |
| **Sistemas de Arquivos** | Organização e acesso a dados |
| **Segurança em SO** | Proteção contra ameaças |
| **Virtualização** | Otimização de recursos e flexibilidade |

> 📌 O slide apresenta esses quatro temas em nível **introdutório**, apenas nomeando cada área. O aprofundamento de cada tópico é indicado como conteúdo a ser tratado em aulas futuras, conforme a sequência do semestre.

---

## 💡 Exemplos Práticos

Os exemplos explicitamente citados no material são:

- **Sistemas Operacionais comerciais/populares:** Windows, macOS, Linux, Android, iOS.
- **Ferramentas de trabalho da disciplina:**
  - **GitHub** — repositório central das atividades do semestre;
  - **Markdown (.md)** — formato de entrega de resumos e conteúdos;
  - **Miro** — ferramenta colaborativa para construção de mapas mentais/linhas do tempo.

> ℹ️ O material não traz exemplos práticos de código, comandos ou simulações de escalonamento/memória — esses conteúdos não constam nesta aula introdutória.

---

## ⚠️ Pontos Importantes

- [x] **Portfólio de projetos é fortemente recomendado** pelo professor, pois:
  - Demonstra habilidades práticas, criatividade e domínio de ferramentas;
  - Funciona como evidência concreta do aprendizado;
  - Facilita a avaliação pelo professor;
  - Amplia oportunidades em estágios e empregos;
  - Incentiva organização, melhoria contínua e desenvolvimento de soluções reais.
- [x] As **atividades semanais são feitas em grupo** (3 a 5 integrantes) e devem manter a **mesma composição** durante o semestre — trocar de grupo não é indicado pelo material.
- [x] O **arquivo com os nomes dos participantes** deve ser submetido na primeira atividade disponível — etapa administrativa obrigatória antes do início dos trabalhos.
- [x] O **repositório do GitHub** é o diretório principal e será utilizado **durante todo o semestre**, não apenas nesta atividade.

---

## 📋 Checklist de Aprendizado

- [ ] Sei explicar o que é um Sistema Operacional e citar exemplos.
- [ ] Compreendo a diferença entre kernel monolítico e modular.
- [ ] Sei diferenciar Modo Usuário de Modo Kernel.
- [ ] Conheço os objetivos do escalonamento de processos.
- [ ] Sei nomear os três algoritmos de escalonamento citados na aula (FIFO, Round Robin, Prioridade).
- [ ] Compreendo a diferença entre Memória Principal e Memória Virtual.
- [ ] Sei o que são paginação e segmentação (em nível introdutório).
- [ ] Conheço as quatro áreas citadas na última seção (E/S, Sistemas de Arquivos, Segurança, Virtualização).
- [ ] Sei como funciona a fórmula de avaliação da disciplina.
- [ ] Formei meu grupo (3 a 5 integrantes) e submeti a lista de nomes.
- [ ] Criei o repositório no GitHub para a disciplina.
- [ ] Elaborei o resumo da Aula 01 em Markdown.
- [ ] Participei da linha do tempo colaborativa no Miro.

---

## ❓ Perguntas Frequentes

**1. O que é um Sistema Operacional, segundo o material da aula?**
É um software essencial que gerencia hardware e software, funcionando como interface entre o usuário e a máquina.

**2. Quais são os dois modos de operação de um SO?**
Modo Usuário (programas comuns) e Modo Kernel (privilégios elevados e acesso total).

**3. Quais algoritmos de escalonamento foram citados?**
FIFO, Round Robin e Prioridade.

**4. Qual é a fórmula de avaliação da disciplina?**
`(P1 × 0,25) + (P2 × 0,25) + ((PJ + AT) × 0,25)`, onde P1 e P2 são as provas, PJ é o projeto e AT são as atividades.

**5. Quantos integrantes deve ter cada grupo?**
De 3 a 5 integrantes, mantendo a mesma composição durante o semestre.

**6. Onde as atividades da disciplina devem ser armazenadas?**
Em um repositório no GitHub, criado para servir como diretório principal durante todo o semestre.

**7. Qual ferramenta será usada para a linha do tempo colaborativa?**
A ferramenta Miro, com o conteúdo posteriormente convertido para Markdown.

**8. O material detalha o funcionamento interno de cada algoritmo de escalonamento?**
Não. O material apenas cita os nomes dos algoritmos, sem detalhar seu funcionamento — esse conteúdo não está presente nesta aula.

---

## 🎓 Exercícios com Gabarito

**Questão 1 (Múltipla escolha)**
Segundo o material da aula, um Sistema Operacional é definido como:

a) Um dispositivo de hardware que armazena dados
b) Um software essencial que gerencia hardware e software
c) Um tipo de linguagem de programação
d) Um protocolo de rede

<details>
<summary>Gabarito</summary>
Resposta correta: <strong>b)</strong> Um software essencial que gerencia hardware e software.
</details>

---

**Questão 2 (Verdadeiro ou Falso)**
O Modo Kernel oferece privilégios elevados e acesso total ao sistema, enquanto o Modo Usuário é destinado à execução de programas comuns.

<details>
<summary>Gabarito</summary>
<strong>Verdadeiro.</strong> Conforme apresentado no slide "Estrutura Interna: Camadas e Modelos".
</details>

---

**Questão 3 (Dissertativa curta)**
Cite os três algoritmos de escalonamento de processos mencionados na aula.

<details>
<summary>Gabarito</summary>
FIFO, Round Robin e Prioridade.
</details>

---

**Questão 4 (Cálculo)**
Um aluno obteve as seguintes notas: P1 = 8,0; P2 = 7,0; PJ = 9,0; AT = 10,0.
Calcule sua média final utilizando a fórmula: `(P1 × 0,25) + (P2 × 0,25) + ((PJ + AT) × 0,25)`.

<details>
<summary>Gabarito</summary>

Cálculo:
- P1 × 0,25 = 8,0 × 0,25 = 2,0
- P2 × 0,25 = 7,0 × 0,25 = 1,75
- (PJ + AT) × 0,25 = (9,0 + 10,0) × 0,25 = 19,0 × 0,25 = 4,75

**Média final = 2,0 + 1,75 + 4,75 = 8,5**
</details>

---

**Questão 5 (Múltipla escolha)**
Qual das opções abaixo NÃO é um exemplo de Sistema Operacional citado na aula?

a) Windows
b) Linux
c) MySQL
d) Android

<details>
<summary>Gabarito</summary>
Resposta correta: <strong>c) MySQL</strong> (é um sistema de gerenciamento de banco de dados, não um SO — os SOs citados na aula foram Windows, macOS, Linux, Android e iOS).
</details>

---

**Questão 6 (Dissertativa)**
Descreva, em suas palavras, a diferença entre Memória Principal e Memória Virtual, conforme apresentado na aula.

<details>
<summary>Gabarito (modelo de resposta)</summary>
A Memória Principal é responsável pela alocação dinâmica e proteção de memória no hardware físico (RAM). Já a Memória Virtual funciona como uma expansão lógica da RAM, utilizando técnicas de paginação e segmentação para oferecer maior segurança e flexibilidade ao sistema.
</details>

---

## 📊 Tabelas Comparativas

### Comparação: Modo Usuário x Modo Kernel

| Característica | Modo Usuário | Modo Kernel |
|---|---|---|
| Nível de privilégio | Limitado | Elevado |
| Acesso ao hardware | Restrito | Total |
| Tipo de execução | Programas comuns | Recursos vitais do sistema |

### Comparação: Memória Principal x Memória Virtual

| Característica | Memória Principal | Memória Virtual |
|---|---|---|
| Natureza | Física (RAM) | Lógica (expansão da RAM) |
| Técnicas associadas | Alocação dinâmica, proteção de memória | Paginação, segmentação |
| Benefício principal | Desempenho direto | Segurança e flexibilidade |

### Estrutura de Avaliação da Disciplina

| Sigla | Significado | Peso na fórmula |
|---|---|---|
| P1 | Prova 1 | 25% |
| P2 | Prova 2 | 25% |
| PJ | Projeto | Parte dos 25% finais (somado com AT) |
| AT | Atividades | Parte dos 25% finais (somado com PJ) |

---

## 📖 Glossário

| Termo | Definição (conforme abordado na aula) |
|---|---|
| **Sistema Operacional (SO)** | Software essencial que gerencia hardware e software, servindo de interface entre usuário e máquina |
| **Kernel** | Núcleo do SO; possui acesso direto ao hardware e gerencia recursos vitais |
| **Modo Usuário** | Modo de operação para execução de programas comuns |
| **Modo Kernel** | Modo de operação com privilégios elevados e acesso total ao sistema |
| **Escalonamento de Processos** | Mecanismo pelo qual o SO decide qual processo executar e por quanto tempo |
| **FIFO** | Algoritmo de escalonamento citado na aula (First In, First Out) |
| **Round Robin** | Algoritmo de escalonamento citado na aula |
| **Memória Virtual** | Expansão lógica da memória RAM, com uso de paginação e segmentação |
| **Paginação** | Técnica associada à memória virtual, citada no material |
| **Segmentação** | Técnica associada à memória virtual, citada no material |
| **Gerenciamento de E/S** | Controle de hardware periférico pelo SO |
| **Virtualização** | Otimização de recursos e flexibilidade do sistema |

---

## 📝 Resumo Final (Resumo de Bolso)

> Um **Sistema Operacional** gerencia hardware e software, atuando como interface entre usuário e máquina (ex.: Windows, macOS, Linux, Android, iOS). Internamente, organiza-se em **camadas**, podendo ter kernel **monolítico ou modular**; o **kernel** acessa diretamente o hardware e opera em **Modo Kernel** (privilégios totais) ou **Modo Usuário** (privilégios limitados). O **escalonamento de processos** (algoritmos como FIFO, Round Robin e Prioridade) busca eficiência, justiça e bom tempo de resposta. A **memória** é gerenciada em nível físico (Memória Principal) e lógico (Memória Virtual, via paginação e segmentação). Outras frentes do SO incluem **gerenciamento de E/S**, **sistemas de arquivos**, **segurança** e **virtualização**. Na disciplina, a avaliação segue a fórmula `(P1×0,25)+(P2×0,25)+((PJ+AT)×0,25)`, e a primeira atividade exige formação de grupos, criação de repositório no GitHub e produção colaborativa de conteúdo em Markdown e Miro.

---

## 📚 Referências Bibliográficas (citadas no material da aula)

- TANENBAUM, Andrew S.; BOS, Herbert. *Sistemas Operacionais Modernos*. 4. ed. São Paulo: Pearson, 2016.
- SILBERSCHATZ, Abraham; GALVIN, Peter B.; GAGNE, Greg. *Fundamentos de Sistemas Operacionais*. 9. ed. Rio de Janeiro: LTC, 2015.
- STALLINGS, William. *Sistemas Operacionais: Conceitos e Projetos*. 8. ed. São Paulo: Pearson, 2015.
- DENARDIN, G. W.; BARRIQUELLO, C. H. *Sistemas Operacionais de Tempo Real e sua Aplicação em Sistemas Embarcados*. Porto Alegre: Editora da UFRGS, 2014.
- AWASTHI, A.; RAWAT, V. *Ramificação e Tarefas do Sistema Operacional*. Edições Nosso Conhecimento, 2023.
- DOWNEY, Allen B. *Think OS: A Brief Introduction to Operating Systems*. Green Tea Press, 2015.
- RED HAT. *Red Hat Enterprise Linux – System Administration Guide*. Documentação Oficial.
- DOCKER INC. *Docker Documentation*. Documentação Oficial. Disponível em: https://docs.docker.com

---

> ⚠️ **Nota de transparência:** Este material foi elaborado **exclusivamente com base no conteúdo apresentado nos slides da Aula 01**. Tópicos citados apenas pelo nome (como os algoritmos de escalonamento, paginação/segmentação, segurança em SO e virtualização) não foram detalhados tecnicamente na aula original, e portanto não foram expandidos além do que consta no material — presume-se que serão aprofundados em aulas futuras, conforme indicado no plano da disciplina.
