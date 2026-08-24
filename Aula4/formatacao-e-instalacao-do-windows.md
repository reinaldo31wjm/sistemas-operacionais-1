# Relatório Técnico: Formatação e Instalação do Windows sob a Ótica da Arquitetura de Sistemas Operacionais

**Tema:** Arquitetura de Sistemas Operacionais
**Escopo:** Boot → Instalação → Uso
**Formato:** Markdown

> **Nota:** Este relatório correlaciona cada etapa prática da formatação/instalação do Windows com os conceitos teóricos de Arquitetura de Sistemas Operacionais (kernel, modos de execução, processos, threads, sistema de arquivos e E/S).

---

## Índice

1. [Descrição Geral e Componentes do SO](#1-descrição-geral-e-componentes-do-sistema-operacional)
2. [Kernel: O Núcleo do Sistema](#2-kernel-o-núcleo-do-sistema)
3. [Modos de Execução](#3-modos-de-execução-modo-usuário-vs-modo-kernel)
4. [Gerenciamento de Processos](#4-gerenciamento-de-processos)
5. [Programa × Processo × Thread](#5-diferenciação-programa--processo--thread)
6. [Sistema de Arquivos](#6-sistema-de-arquivos)
7. [Entrada/Saída e Drivers](#7-entradasaída-es-e-drivers-de-dispositivos)
8. [Linha do Tempo e Tabela Relacional](#8-linha-do-tempo-e-tabela-relacional)
9. [Checklist de Verificação do Processo](#9-checklist-de-verificação-do-processo)
10. [Desafio Final e Questão Central](#10-desafio-final-e-questão-central)

---

## 1. Descrição Geral e Componentes do Sistema Operacional

O processo de formatação e instalação do Windows não é um evento único, mas uma sequência coordenada de fases em que diferentes agentes de software assumem o controle da máquina progressivamente: primeiro o **firmware** (BIOS/UEFI), depois um **micro sistema operacional de instalação** (WinPE — Windows Preinstallation Environment) e, por fim, o **kernel definitivo** do Windows (NT Kernel) já configurado para o hardware específico da máquina.

**Fluxo geral do processo:**

```
Firmware (UEFI/BIOS)
        |
        v
Bootloader (Windows Boot Manager)
        |
        v
Kernel do WinPE (Ambiente de Instalação)
        |
        v
Particionamento e Formatação
        |
        v
Cópia da Imagem do Windows
        |
        v
Kernel Definitivo (Instalado em Disco)
        |
        v
OOBE e Carregamento do Shell
        |
        v
   Windows Pronto
```

Componentes do SO envolvidos ao longo do processo:

| Componente | Função geral |
|---|---|
| Firmware (BIOS/UEFI) | Inicializa hardware básico e localiza o carregador de boot |
| Bootloader (Windows Boot Manager) | Carrega o kernel na memória |
| Kernel (`ntoskrnl.exe`) | Gerencia CPU, memória, processos e dispositivos |
| HAL (Hardware Abstraction Layer) | Abstrai diferenças de hardware para o kernel |
| Drivers de dispositivo | Traduzem comandos genéricos do SO para comandos específicos de hardware |
| Subsistema de Entrada/Saída | Gerencia comunicação entre processos e dispositivos físicos |
| Sistema de arquivos (NTFS) | Organiza e indexa dados persistentes em disco |
| Gerenciador de processos/threads | Escalona e controla a execução de programas |
| Shell (Explorer) | Camada de interação com o usuário, disponível apenas ao final |

Recursos de hardware gerenciados nessas fases incluem: CPU (ciclos de processamento), memória RAM (alocação temporária durante a instalação), armazenamento (SSD/HD/pendrive), controladores de entrada (teclado/mouse), saída de vídeo e, eventualmente, interface de rede.

> **Atenção:** Nenhum desses componentes atua isoladamente. A ausência de qualquer um — por exemplo, um driver de disco ausente no WinPE — é suficiente para impedir a instalação por completo, já que o kernel não conseguiria "enxergar" a unidade de destino.

---

## 2. Kernel: O Núcleo do Sistema

O kernel **não atua desde o primeiro instante do boot**. Existe uma fase anterior, controlada inteiramente pelo firmware, na qual nenhum sistema operacional está presente em memória.

### Quando o kernel passa a atuar

**Sequência de carregamento:**

1. **Firmware (UEFI)** executa o POST (autoteste de hardware).
2. O firmware localiza e carrega o Boot Manager do Windows (`bootmgfw.efi`, em sistemas UEFI).
3. O Boot Manager carrega `ntoskrnl.exe` (o kernel) na memória RAM.
4. A partir desse instante, o **kernel assume o controle da máquina**.
5. O kernel passa a enviar comandos ao hardware via drivers e HAL, e a receber interrupções de volta (disco pronto, tecla pressionada, etc.).
6. O sistema fica pronto para exibir o instalador.

**Linha exata de atuação do kernel:**

- **Antes do kernel**: a UEFI/BIOS executa rotinas de autoteste (POST), identifica dispositivos de boot e carrega o *bootloader* (`bootmgfw.efi` em UEFI, ou `bootmgr` em sistemas BIOS legado).
- **Carregamento do kernel**: o bootloader lê o arquivo `ntoskrnl.exe` do meio de instalação (ou do disco, após instalado) e o carrega na memória RAM. É neste instante — ainda antes de qualquer tela gráfica do instalador aparecer — que o **kernel do WinPE passa a atuar**, controlando a máquina.
- **Reinicializações intermediárias**: durante a instalação, o computador reinicia diversas vezes. A cada reinício, o kernel é recarregado — primeiro o kernel do ambiente de instalação, depois, nas fases finais, o kernel do sistema definitivamente instalado no disco.

### Como o kernel gerencia recursos e faz a ponte hardware-software

O kernel opera como intermediário obrigatório entre qualquer software e o hardware físico. Ele:

- Mantém tabelas de processos e threads, decidindo quando e por quanto tempo cada um recebe tempo de CPU (escalonamento).
- Gerencia o mapeamento de memória virtual para memória física, isolando os processos entre si.
- Recebe interrupções de hardware (ex.: conclusão de escrita em disco, movimento do mouse) e as encaminha para os drivers e processos apropriados.
- Utiliza a **HAL (Hardware Abstraction Layer)** para que o mesmo kernel funcione em diferentes placas-mãe/chipsets sem precisar ser reescrito para cada combinação de hardware.

**Aprofundamento — por que o kernel precisa ser recarregado múltiplas vezes durante a instalação:**

Cada reinicialização representa uma mudança de **contexto de execução completo**: a RAM é zerada e o processador retorna ao estado de pré-boot. Isso é necessário porque, entre uma fase e outra (ex.: do WinPE para o Windows já instalado), o kernel que deve assumir o controle muda — não é mais o kernel minimalista do ambiente de instalação, mas o kernel completo, já configurado para o disco e drivers definitivos. Não é possível "trocar" um kernel em execução sem reiniciar o processador, pois o kernel controla as estruturas mais fundamentais de memória e processos do sistema em execução.

Sem o kernel ativo, nenhuma leitura de disco, escrita de arquivo ou exibição de tela do instalador seria possível — é ele quem transforma comandos abstratos ("gravar este arquivo") em sinais elétricos reais direcionados ao controlador correto.

---

## 3. Modos de Execução (Modo Usuário vs. Modo Kernel)

| Aspecto | Modo Usuário | Modo Kernel |
|---|---|---|
| Nível de privilégio | Restrito (Ring 3) | Total (Ring 0) |
| Acesso a hardware | Indireto, via chamadas de sistema (syscalls) | Direto |
| Isolamento | Cada processo em seu próprio espaço de memória | Compartilha o espaço com o núcleo do SO |
| Falha de um processo | Não derruba o sistema | Pode causar pane total (BSOD) |
| Exemplos na instalação | Assistente gráfico do instalador (`setup.exe`), seleção de partições | Drivers de disco, gerenciador de memória, escalonador de processos |

**Fluxo de comunicação entre os modos:**

```
Modo Usuário (Ring 3)                Modo Kernel (Ring 0)
------------------------             ------------------------
setup.exe            --- syscall --> Escalonador de Processos
Interface gráfica     --- syscall --> Drivers de Disco/USB --> Disco/SSD
(seleção idioma/
 partição)
```

**Momentos da instalação em cada modo:**

- **Modo Kernel**: a leitura bruta do meio de instalação, o particionamento físico do disco, a formatação (escrita da estrutura NTFS), a alocação de memória para o processo de instalação e a comunicação com controladores de disco/USB ocorrem em modo kernel, executadas por drivers e pelo próprio núcleo do WinPE.
- **Modo Usuário**: a interface gráfica que exibe "Selecione o idioma", "Escolha a unidade", as barras de progresso de cópia de arquivos e as telas de configuração de conta rodam como processos de modo usuário (`setup.exe`, `oobe.exe`), que **solicitam** ao kernel — via chamadas de sistema — que execute as operações reais de disco em nome delas.

**Por que o SO impede acesso direto e irrestrito ao hardware:**

1. **Segurança**: um processo malicioso ou defeituoso poderia sobrescrever dados de outro processo ou até do próprio SO.
2. **Estabilidade**: um erro em modo usuário causa apenas o fechamento daquele programa; o mesmo erro em modo kernel pode derrubar toda a máquina.
3. **Concorrência controlada**: múltiplos processos escrevendo simultaneamente no mesmo setor de disco, sem mediação, corromperiam dados.
4. **Abstração**: aplicações não precisam conhecer detalhes elétricos de cada controladora; pedem "grave este bloco" e o kernel/driver traduz isso para o hardware específico.

---

## 4. Gerenciamento de Processos

Durante a execução do instalador do Windows, diversos processos coexistem, cada um com seu próprio espaço de memória, prioridade de execução e conjunto de recursos alocados:

| Processo | Papel |
|---|---|
| `winpeshl.exe` | Shell mínimo do ambiente WinPE que inicia o instalador |
| `setup.exe` / `setuphost.exe` | Processo principal do assistente de instalação |
| `dism.exe` | Aplica a imagem `.wim`/`.esd` do Windows ao disco |
| `diskpart.exe` | Particiona e formata unidades (interna ou externamente) |
| Drivers (modo kernel) | Carregados conforme o hardware é detectado |
| `smss.exe` | Primeiro processo de modo usuário criado pelo kernel após o boot final |
| `winlogon.exe` / `services.exe` | Iniciam sessão e serviços essenciais |
| `OOBE.exe` | Conduz a configuração final (conta, rede, idioma) |

**Características de um processo e alocação de recursos:**

Um processo possui: um espaço de endereçamento de memória virtual próprio, um conjunto de *handles* para arquivos e dispositivos abertos, um contexto de segurança (token de privilégios), pelo menos uma thread de execução e um estado (pronto, em execução, bloqueado, suspenso).

O kernel aloca recursos a cada processo por meio do **Process Manager** e do **Memory Manager**: reserva páginas de memória, atribui um identificador único (PID), define prioridade de escalonamento e cria a primeira thread. Quando um processo solicita mais memória ou tenta acessar um arquivo, ele faz isso por *syscalls*, validadas pelo kernel antes de serem atendidas — garantindo que um processo não invada o espaço de outro.

---

## 5. Diferenciação: Programa × Processo × Thread

**Etapa escolhida como exemplo:** a cópia e aplicação dos arquivos de sistema do Windows ao disco (execução do `DISM`/motor de aplicação da imagem `.wim`).

```
Programa                    Processo                  Threads
----------------------      -------------------       -------------------------
dism.exe em disco     --->  PID atribuído,      --->  Thread 1: leitura da imagem .wim
(código binário              memória alocada           Thread 2: descompressão
 inerte)                     (kernel carrega           Thread 3: escrita no disco
                              em RAM)                   Thread 4: atualização da UI
```

- **Programa**: é o arquivo executável estático `dism.exe`, armazenado como código binário na mídia de instalação. Nesse estado, é apenas dado inerte em disco — não consome CPU nem memória de execução.
- **Processo**: quando o instalador invoca esse executável, o kernel carrega o binário na memória RAM, cria um espaço de endereçamento, atribui um PID e o coloca na fila de escalonamento. Nesse momento, o *programa* torna-se um *processo* — uma instância ativa e em execução, com estado próprio (arquivos abertos, memória alocada, progresso da cópia).
- **Threads**: dentro desse processo, múltiplas *threads* são criadas para realizar subtarefas em paralelo — por exemplo, uma thread lendo blocos comprimidos da imagem `.wim` enquanto outra thread grava blocos já descompactados no disco, e outra ainda atualiza a barra de progresso na interface.

**Vantagem do uso de múltiplas threads nesse cenário:**

Como threads de um mesmo processo compartilham o mesmo espaço de memória, a comunicação entre elas é rápida (sem necessidade de mecanismos custosos de comunicação entre processos). Isso permite:

- **Paralelismo real** em CPUs multi-core: enquanto uma thread aguarda a conclusão de uma operação de E/S no disco (lenta comparada à CPU), outra thread pode continuar processando dados já lidos, evitando ociosidade da CPU.
- **Redução do tempo total de instalação**, já que leitura, descompressão e escrita ocorrem de forma sobreposta (pipeline) em vez de sequencial.

---

## 6. Sistema de Arquivos

**Impacto da formatação nos dados existentes:**

A formatação não apaga fisicamente o conteúdo de cada arquivo, bit a bit, na maioria dos casos (a menos que seja uma formatação "completa"/de baixo nível, ou envolva sobrescrita explícita). O que ocorre é a **recriação das estruturas de metadados** que permitem localizar arquivos — como a Master File Table (MFT) no NTFS. Sem esses metadados, os dados antigos tornam-se inacessíveis pelo SO, mesmo que os bits ainda existam fisicamente no disco (por isso ferramentas de recuperação de dados às vezes conseguem restaurar arquivos após uma formatação rápida).

**Diferença exata entre apagar, particionar e formatar:**

| Operação | O que faz | Nível de atuação |
|---|---|---|
| **Apagar dados** | Remove a referência (entrada) de um arquivo específico do índice do sistema de arquivos; os blocos ficam marcados como "livres" | Nível de arquivo individual |
| **Particionar** | Divide o espaço físico do disco em unidades lógicas independentes, cada uma com sua própria tabela de partição (GPT/MBR) | Nível do disco inteiro |
| **Formatar** | Cria a estrutura de um sistema de arquivos (ex.: NTFS) dentro de uma partição já existente, estabelecendo tabelas de alocação, índices e diretório raiz | Nível da partição |

> **Nota:** Primeiro **particiona-se** o disco (define-se "onde" existirão unidades lógicas); depois **formata-se** cada partição (define-se "como" os dados serão organizados dentro dela). **Apagar dados** é uma operação mais granular, independente das outras duas.

**Criação da estrutura de arquivos de inicialização e diretórios:**

Após a formatação, o instalador cria a seguinte estrutura (esquema GPT/UEFI moderno):

```
Disco Físico (SSD/HD)
|
├── EFI System Partition (ESP)          -- Localizável pelo firmware
|   └── EFI/
|       └── Microsoft/
|           └── Boot/
|               └── bootmgfw.efi        -- Bootloader carregado pela UEFI
|
├── Microsoft Reserved (MSR)            -- Reservada para uso interno do SO
|
├── Partição Principal (C:)
|   ├── Boot/
|   |   └── BCD                         -- Boot Configuration Data
|   ├── Windows/
|   |   ├── System32/
|   |   |   └── ntoskrnl.exe            -- Kernel definitivo
|   |   ├── SysWOW64/
|   |   └── WinSxS/
|   ├── Users/                          -- Perfis de usuário
|   ├── Program Files/
|   └── ProgramData/
|
└── Partição de Recuperação
    └── Winre.wim                       -- Imagem de restauração do sistema
```

---

## 7. Entrada/Saída (E/S) e Drivers de Dispositivos

| Dispositivo | Papel durante a instalação | Papel após a instalação |
|---|---|---|
| Teclado/Mouse | Navegação via drivers genéricos (HID) embutidos no WinPE | Interação contínua com o Shell |
| Monitor | Interface gráfica via driver de vídeo básico (VESA/genérico) | Renderização completa após driver de GPU dedicado |
| SSD/HD | Alvo do particionamento, formatação e gravação dos arquivos do sistema | Armazenamento persistente do SO e dos dados |
| Pendrive/DVD | Fonte de leitura da imagem de instalação (`.wim`/`.esd`) | Geralmente removido; sem papel após a instalação |
| Rede (opcional) | Download de atualizações/ativação da conta Microsoft durante o OOBE | Conectividade contínua, exigindo o driver de rede correto |

**Como o Windows se comunica com esses dispositivos e o papel dos drivers:**

O kernel não "sabe", de fábrica, como operar cada modelo específico de SSD, placa de vídeo ou placa de rede existente no mercado — ele conhece apenas interfaces padronizadas (definidas pela HAL e por classes de driver). O **driver** é o componente de software, geralmente executado em modo kernel, que traduz comandos genéricos do SO ("ler setor X", "renderizar este quadro") para os comandos elétricos/protocolares específicos daquele componente de hardware.

**Aprofundamento — drivers genéricos (in-box) vs. drivers específicos do fabricante:**

Durante a instalação, o WinPE já traz um conjunto de **drivers genéricos** (*in-box drivers*) para dispositivos essenciais (controladores de disco padrão, USB, teclado, mouse, vídeo básico) — suficiente para operar a máquina em modo funcional, porém não otimizado.

Após a instalação, o Windows completo detecta hardware adicional e instala (via Windows Update ou mídia local) **drivers específicos do fabricante**, que desbloqueiam recursos avançados: aceleração gráfica 3D, economia de energia, Wi-Fi, som surround, etc.

Sem o driver correto, o dispositivo físico existe, mas o SO não consegue operá-lo além de funções mínimas genéricas — por isso uma instalação recém-concluída frequentemente exibe vídeo em baixa resolução até que o driver de GPU apropriado seja instalado.

---

## 8. Linha do Tempo e Tabela Relacional

| Etapa | O que acontece? | Conceito de SO envolvido | Por que é importante? |
|---|---|---|---|
| **1. Inicialização (Boot)** | Firmware (UEFI/BIOS) executa o POST, inicializa componentes básicos de hardware e busca um dispositivo de boot | Pré-boot / Firmware, antes do kernel | Sem essa etapa, nenhum software, incluindo o SO, poderia ser carregado na memória |
| **2. Inicialização do instalador** | O bootloader carrega o kernel do WinPE na RAM, que assume o controle da máquina | Carregamento do kernel, transição para modo kernel | Estabelece o primeiro ambiente de software capaz de gerenciar hardware e executar programas |
| **3. Reconhecimento do hardware** | O kernel do WinPE carrega drivers genéricos para identificar CPU, memória, discos e periféricos | Drivers, HAL, Entrada/Saída | Permite que o SO saiba quais recursos existem e como se comunicar com eles antes de agir |
| **4. Seleção da unidade** | O usuário escolhe o disco/partição de destino via interface gráfica em modo usuário | Modo Usuário/Kernel, chamadas de sistema | Demonstra a mediação: a interface não acessa o disco diretamente, apenas solicita ao kernel |
| **5. Particionamento/formatação** | O disco é dividido em partições (ESP, MSR, principal) e cada uma recebe uma estrutura de sistema de arquivos (NTFS) | Sistema de arquivos, gerenciamento de armazenamento | Organiza fisicamente o disco em unidades lógicas legíveis pelo SO, condição para qualquer gravação futura |
| **6. Cópia dos arquivos** | A imagem do Windows (`.wim`/`.esd`) é descompactada e gravada na partição principal | Processos, threads, Entrada/Saída paralela | Multithreading acelera a operação, sobrepondo leitura, descompressão e escrita |
| **7. Instalação do Windows** | Estruturas de boot (BCD), registro do sistema e diretórios (`\Windows`, `\Users`) são criados/configurados; ocorrem reinicializações | Sistema de arquivos, gerenciador de boot | Prepara o disco para conter um sistema operacional funcional e reinicializável de forma independente |
| **8. Instalação/configuração de drivers** | O Windows identifica dispositivos específicos e carrega/instala drivers apropriados | Drivers, subsistema de E/S | Sem drivers corretos, hardware específico (GPU, rede, som) opera de forma limitada ou não funciona |
| **9. Inicialização do sistema** | O kernel definitivo (já instalado em disco) é carregado; serviços essenciais (`smss.exe`, `services.exe`, `winlogon.exe`) são iniciados | Gerenciamento de processos, escalonamento | Estabelece o ambiente multiprocessos que sustentará toda a operação do SO daí em diante |
| **10. Windows pronto para utilização** | A tela OOBE conclui a configuração de conta/idioma/rede e o Shell (Explorer) é carregado | Modo Usuário, Shell, gerenciamento de processos em regime permanente | Marca a transição de um sistema "recém-instalado" para um ambiente operacional completo, pronto para executar aplicações do usuário |

---

## 9. Checklist de Verificação do Processo

- [x] Firmware executou o POST e localizou o dispositivo de boot
- [x] Kernel do WinPE carregado e hardware reconhecido
- [x] Disco particionado (ESP, MSR, partição principal)
- [x] Partição principal formatada em NTFS
- [x] Imagem do Windows copiada e aplicada ao disco
- [x] Estruturas de boot (BCD) e diretórios do sistema criados
- [x] Drivers essenciais instalados/configurados
- [x] Kernel definitivo carregado a partir do disco
- [x] OOBE concluído (conta, idioma, rede)
- [x] Shell (Explorer) carregado — sistema pronto para aplicações

---

## 10. Desafio Final e Questão Central

### Questão Central: "Ao formatar e instalar o Windows, onde o Sistema Operacional está trabalhando e por que cada um desses componentes é necessário?"

O Sistema Operacional está trabalhando **em todas as camadas do processo, simultaneamente em diferentes níveis de abstração**:

- No **nível mais baixo**, o kernel (primeiro do WinPE, depois o definitivo) está constantemente mediando o acesso à CPU, à memória RAM e aos controladores físicos, traduzindo pedidos abstratos em operações elétricas concretas via drivers e HAL.
- No **nível intermediário**, o sistema de arquivos está organizando o espaço em disco em estruturas legíveis (partições, tabelas de alocação, diretórios), sem as quais os dados gravados seriam apenas bits sem significado recuperável.
- No **nível de gerenciamento de execução**, o gerenciador de processos e threads está criando, escalonando e isolando cada componente do instalador (setup, DISM, drivers), garantindo que múltiplas tarefas ocorram de forma coordenada e sem corrupção mútua de dados.
- No **nível de interface**, o modo usuário está expondo, de forma segura e simplificada, opções de decisão ao ser humano (idioma, partição, conta), sem jamais expor o hardware diretamente a esse contexto menos privilegiado.

Cada componente é necessário porque nenhum deles, isoladamente, seria suficiente: o kernel sem sistema de arquivos não teria onde persistir dados de forma organizada; o sistema de arquivos sem kernel não teria como ser lido/escrito fisicamente; processos sem escalonamento disputariam a CPU de forma caótica; e uma interface de usuário sem a separação de modos exporia o sistema a falhas catastróficas ou brechas de segurança.

### Cenário sem SO: o que precisaria ser feito manualmente?

Sem um Sistema Operacional mediando o processo, cada programa (ou o próprio usuário, em nível de firmware/hardware) precisaria:

- **Endereçar diretamente os setores físicos do disco**, sem abstração de arquivos — ou seja, saber exatamente em quais cilindros/trilhas/setores gravar cada byte, sem conceito de "arquivo" ou "pasta".
- **Implementar, em cada programa, seu próprio driver** para cada modelo de disco, teclado, mouse e monitor existente — não haveria abstração compartilhada.
- **Gerenciar manualmente a memória física**, decidindo em quais endereços de RAM cada dado seria colocado, sem proteção contra sobreposição com outros programas em execução.
- **Controlar a concorrência entre tarefas "na mão"**, sem escalonador — impraticável para um usuário comum.
- **Reimplementar, em cada aplicação, a lógica de particionamento e formatação**, sem um padrão comum (NTFS/FAT), tornando qualquer troca de programa incompatível com dados gravados por outro.

> **Atenção:** Sem SO, a "instalação de um sistema" deixaria de ser um evento único e coordenado e se tornaria uma sequência de operações de baixíssimo nível, específicas de hardware, sem portabilidade nem segurança — inviável para o uso cotidiano.

### Conceito-chave: o que transforma hardware em um sistema capaz de executar aplicações?

O conceito mais fundamental é a **abstração de hardware realizada pelo kernel em conjunto com a separação entre Modo Usuário e Modo Kernel**.

**Justificativa:** todos os demais conceitos estudados — sistema de arquivos, drivers, gerenciamento de processos/threads — **dependem** dessa abstração central para existir de forma útil e segura:

- O sistema de arquivos só faz sentido porque o kernel abstrai o disco físico em unidades lógicas gerenciáveis.
- Os drivers só são eficazes porque existe uma camada (HAL/kernel) que padroniza como eles se comunicam com o restante do sistema.
- O gerenciamento de processos só é seguro porque a separação de modos impede que um processo defeituoso em modo usuário corrompa a memória do próprio kernel.

É essa combinação — um núcleo privilegiado que intermedeia *todo* acesso ao hardware, somado à barreira de proteção entre o que os programas comuns podem e não podem fazer diretamente — que transforma um conjunto de componentes eletrônicos isolados (CPU, RAM, disco, periféricos) em uma **plataforma coerente, segura e multitarefa**, capaz de executar de forma confiável qualquer aplicação desenvolvida por terceiros, sem que ela precise conhecer os detalhes físicos da máquina em que roda.

---

## Conclusão

Este relatório demonstrou que a formatação e instalação do Windows é, na prática, uma **execução guiada de conceitos clássicos de Arquitetura de Sistemas Operacionais**: transição de modos de execução, gerenciamento de processos/threads, organização de sistemas de arquivos e mediação de E/S via drivers — todos orquestrados pelo kernel, do primeiro instante do boot até a entrega de um ambiente multitarefa pronto para o usuário final.
