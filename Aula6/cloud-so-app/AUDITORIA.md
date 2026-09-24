# Auditoria profissional — `cloud-so-app`

## 1. Escopo

A auditoria foi realizada sobre o projeto original enviado em `Nova-pasta-main.zip`, composto por `index.js`, `package.json`, `package-lock.json` e dependências instaladas. O objetivo foi verificar funcionamento, qualidade de código, operação em cloud, segurança básica, acessibilidade, observabilidade e aderência à atividade acadêmica.

## 2. Resumo executivo

O projeto original era funcional e retornava uma página HTML pela rota `GET /`. Entretanto, apresentava configuração incompleta para uso profissional: não possuía script `start`, instalava CORS sem utilizá-lo, não possuía API ou health check, não controlava cache, não tinha estrutura HTML completa, não oferecia atualização automática, não tratava rotas inexistentes de forma explícita e não realizava encerramento gracioso.

A versão corrigida mantém a simplicidade do exercício e adiciona recursos de qualidade sem introduzir banco de dados ou complexidade desnecessária.

## 3. Achados do projeto original

| ID | Severidade | Achado | Impacto | Correção |
|---|---|---|---|---|
| A-01 | Média | `package.json` não tinha `scripts` | `npm start` falhava ou não era padronizado | Adicionado `start`, `dev` e `check` |
| A-02 | Média | `cors` estava instalado, mas não configurado | A dependência não produzia efeito e não havia controle por ambiente | `CORS_ORIGIN` restringe a origem; `*` fica apenas como fallback de desenvolvimento |
| A-03 | Média | HTML era fragmento sem `doctype`, idioma, viewport ou acessibilidade | Renderização e uso em dispositivos móveis eram inferiores | Dashboard completo e responsivo |
| A-04 | Média | Não existia API JSON | Integração com frontend ou monitor externo era difícil | Criado `/api/status` |
| A-05 | Média | Não existia health check | Render e ferramentas de operação não tinham endpoint explícito | Criado `/health` |
| A-06 | Baixa | Respostas não desabilitavam cache | Métricas poderiam ficar obsoletas | `Cache-Control: no-store` |
| A-07 | Média | Não havia rota 404 explícita | Resposta padrão pouco informativa | 404 em JSON com caminho solicitado |
| A-08 | Média | Não havia middleware de erro | Falhas poderiam ter respostas inconsistentes | Handler de erro interno adicionado |
| A-09 | Baixa | Cabeçalho `X-Powered-By` permanecia habilitado | Exposição desnecessária de tecnologia | `app.disable('x-powered-by')` |
| A-10 | Baixa | Não havia encerramento gracioso | Deploy/restart poderia interromper conexões abruptamente | Tratamento de `SIGTERM` e `SIGINT` |
| A-11 | Baixa | Dados apareciam apenas no carregamento inicial | Não havia experiência de monitoramento contínuo | Atualização via `fetch` a cada 5 segundos |
| A-12 | Informativa | Uptime do sistema e uptime do processo são conceitos diferentes | Possível interpretação incorreta | Dashboard identifica sistema; `/health` informa uptime do processo |
| A-13 | Baixa | Percentual de memória era arredondado para inteiro | Ambientes com muita RAM poderiam perder precisão | `usedPercent` passou a usar uma casa decimal |
| A-14 | Baixa | Barra de memória interpolava largura dentro do CSS | A estilização inicial ficava acoplada ao bloco `<style>` | Largura inicial movida para `style` no elemento `#memoryBar` |
| A-15 | Baixa | Falha do `fetch` não alterava o indicador visual | O usuário não distinguia estado online de falha de atualização | Classe `.status.offline` e texto de alerta adicionados |
| A-16 | Média | Shutdown não tinha limite de segurança | Conexões pendentes poderiam travar o deploy | Timer de 10 segundos com `unref()` força `process.exit(1)` |

## 4. Riscos e decisões

### CORS

CORS foi ativado porque o pacote já fazia parte da atividade. A versão corrigida lê `process.env.CORS_ORIGIN`: quando definida, somente a origem informada é permitida; quando ausente, `*` é utilizado como fallback para desenvolvimento local. Em produção, a variável deve ser configurada no Render.

### Exposição de infraestrutura

Hostname, plataforma, arquitetura e memória são informações de infraestrutura. Elas são adequadas ao objetivo didático, mas um serviço público de produção deveria avaliar se todos esses dados podem ser expostos sem autenticação.

### Segurança de saída HTML

Os valores do módulo `os` são tratados como dados do ambiente, mas a versão corrigida aplica `escapeHtml` antes de inseri-los na resposta HTML. Isso reduz o risco de injeção caso uma fonte externa seja incorporada futuramente.

### Limites de responsabilidade

A aplicação mede o sistema visível ao processo. Em VM ou container, os valores podem representar uma visão limitada dos recursos físicos. A aplicação não consegue inferir, com precisão, a capacidade total do hardware físico do provedor.

## 5. Melhorias implementadas

O novo `index.js` possui uma função única de coleta, `getSystemSnapshot()`, evitando duplicação entre HTML e JSON. A memória é apresentada em bytes, megabytes, percentual usado com uma casa decimal e valores total/livre. A largura inicial da barra é aplicada no próprio elemento `#memoryBar`, enquanto as atualizações posteriores usam `style.width` no navegador. O dashboard tem semântica HTML, `lang="pt-BR"`, viewport, contraste, layout responsivo, barra de progresso acessível e atualização automática.

A aplicação respeita `process.env.PORT`, requisito essencial em plataformas cloud. O erro de porta inválida é detectado antes da inicialização. O servidor retorna respostas JSON previsíveis em `/api/status`, `/health` e em erros 404/500. Se a atualização do cliente falhar, o indicador muda para `.status.offline` e exibe `Atualização indisponível`. O encerramento gracioso usa um temporizador de dez segundos com `unref()` e força a saída com código 1 caso conexões pendentes não sejam finalizadas.

## 6. Validação recomendada

```bash
npm install
npm run check
npm start
```

Em outro terminal:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/api/status
curl -i http://localhost:3000/health
curl -i http://localhost:3000/rota-inexistente
```

Resultados esperados:

- `/`: `200 OK` e `Content-Type: text/html`.
- `/api/status`: `200 OK` e JSON com `hostname`, `platform`, `architecture`, `cpus`, `memory`, `uptimeSeconds` e `measuredAt`.
- `/health`: `200 OK` e `status: ok`.
- rota inexistente: `404` e JSON com `error` e `path`.

## 7. Resultado da auditoria

A versão corrigida está adequada para uma atividade acadêmica e para um deploy simples no Render. Os fontes Mermaid e os PNGs correspondentes estão presentes em `docs/diagrams/`, e o README aponta para os arquivos existentes. Ela não deve ser interpretada como uma plataforma completa de observabilidade: não há autenticação, histórico, banco de dados, métricas de CPU em percentual, alertas ou coleta distribuída. Esses itens seriam escopo de uma evolução posterior.
