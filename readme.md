# 🖥️ Introdução aos Sistemas Operacionais

> Material de apoio para disciplinas introdutórias de Computação, Engenharia de Software, Sistemas de Informação e cursos técnicos.

---

## 📌 Visão Geral

Este material apresenta os **fundamentos dos Sistemas Operacionais (SO)**: conceitos essenciais, evolução histórica, principais funções, tipos de sistemas e exemplos utilizados no mercado.

O objetivo é construir uma **base conceitual sólida**, preparando o estudante para temas mais avançados como processos, escalonamento, memória, sistemas de arquivos e concorrência.

## 🎯 Objetivos de Aprendizagem

Ao final do estudo, o aluno será capaz de:

1. Definir formalmente um sistema operacional
2. Explicar sua importância no funcionamento de um computador
3. Identificar suas principais funções
4. Diferenciar tipos de sistemas operacionais
5. Reconhecer o que **não** é responsabilidade de um SO

---

## 1️⃣ O que é um Sistema Operacional

### 1.1 Definição formal

Um **Sistema Operacional** é o software fundamental que **gerencia os recursos de hardware** e **fornece serviços para programas e usuários**, garantindo funcionamento eficiente, seguro e organizado do sistema.

### 1.2 O SO como intermediário

O SO atua como uma **camada intermediária** entre:

- 👤 Usuário / Aplicações
- ⚙️ Hardware (CPU, memória, disco, dispositivos de entrada e saída)

Essa camada evita que programas acessem diretamente o hardware, reduzindo erros, conflitos e riscos.

### 1.3 Usuário x Hardware

Sem um sistema operacional, o usuário precisaria:

- Programar diretamente em linguagem de máquina
- Controlar manualmente dispositivos e memória

O SO abstrai essa complexidade, tornando o uso do computador viável e acessível.

---

## 2️⃣ Evolução dos Computadores

### 2.1 Antes dos sistemas operacionais

- Um único programa era executado por vez
- Programação feita diretamente em baixo nível
- Ausência de gerenciamento automático de recursos
- Alto risco de erros e desperdício de tempo

### 2.2 Surgimento dos sistemas operacionais

- Necessidade de automatizar tarefas repetitivas
- Introdução do processamento em lote (*batch*)
- Evolução para multiprogramação e sistemas interativos
- Base para os sistemas operacionais modernos

---

## 3️⃣ Principais Funções do Sistema Operacional

| Função | O que envolve |
|---|---|
| 🧠 **Gerenciamento de CPU** | Criação, execução e finalização de processos; escalonamento; compartilhamento do processador |
| 💾 **Gerenciamento de Memória** | Alocação e liberação de memória; proteção entre processos; memória virtual |
| 🔌 **Gerenciamento de Dispositivos** | Controle de periféricos; uso de drivers; comunicação hardware–software |
| 📁 **Gerenciamento de Arquivos** | Criação, leitura, escrita e exclusão de arquivos; organização em diretórios; permissões |
| 🖱️ **Interface com o Usuário** | Meio de interação com o sistema (gráfica ou textual) |

---

## 4️⃣ Tipos de Interface com o Usuário

| Tipo | Características |
|---|---|
| **GUI** (Interface Gráfica) | Janelas, ícones, menus, mouse |
| **CLI** (Linha de Comando) | Interação por comandos textuais |

Muitos sistemas modernos oferecem suporte a ambos os tipos.

---

## 5️⃣ Tipos de Sistemas Operacionais

| Tipo | Características |
|---|---|
| 🖥️ **Desktop** | Foco em usabilidade e interação gráfica, uso pessoal ou corporativo |
| 🗄️ **Servidor** | Alta disponibilidade e desempenho, gerenciamento de rede/usuários/serviços, geralmente sem interface gráfica |
| 📱 **Dispositivos Móveis** | Otimizados para toque, sensores e bateria, forte integração com hardware específico |
| ⚙️ **Embarcados** | Presentes em equipamentos dedicados, recursos limitados, execução específica (carros, eletrodomésticos, equipamentos industriais) |

---

## 6️⃣ Exemplos de Sistemas Operacionais

| Sistema | Uso principal |
|---|---|
| **Windows** | Amplamente utilizado em desktops pessoais e corporativos |
| **Linux** | Código aberto, muito utilizado em servidores e sistemas críticos |
| **macOS** | Sistema da Apple para computadores pessoais |
| **Android / iOS** | Sistemas operacionais para dispositivos móveis |

---

## 7️⃣ Comparação Básica entre Sistemas Operacionais

| Categoria | Interface Gráfica | Multitarefa | Recursos | Público-alvo |
|---|---|---|---|---|
| Desktop | Alta | Sim | Médios | Usuário final |
| Servidor | Baixa | Sim | Altos | Serviços |
| Móvel | Alta | Sim | Otimizados | Usuário final |
| Embarcado | Rara | Limitada | Muito limitados | Sistema dedicado |

---

## 8️⃣ O que o Sistema Operacional NÃO Faz

- ❌ Não desenvolve aplicações
- ❌ Não substitui o hardware
- ❌ Não toma decisões de negócio
- ❌ Não executa tarefas sem solicitação
- ❌ Não corrige erros lógicos dos programas

> 💡 O sistema operacional **gerencia recursos**, mas não define o objetivo final do uso do computador.

---

## 🗺️ Mapa Mental

Veja o arquivo `mapa-mental-so.mermaid` para a versão em diagrama interativo.

---

## ✅ Considerações Finais

O Sistema Operacional é o **elemento central** de qualquer sistema computacional moderno. Compreender seus conceitos iniciais é essencial para entender:

- Como programas são executados
- Como recursos são compartilhados
- Como sistemas se mantêm estáveis e seguros

Este conteúdo serve como fundamento teórico para estudos posteriores sobre **processos, threads, escalonamento, sincronização, memória virtual e sistemas de arquivos**.
