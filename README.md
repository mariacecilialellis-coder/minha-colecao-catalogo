# Catálogo Minha Coleção

Espelho gratuito do catálogo público da [TCGdex](https://tcgdex.dev) (nomes, números,
sets e raridades das cartas), usado pelo app **Minha Coleção** pra não depender só do
servidor ao vivo deles — a API deles já caiu várias vezes.

Um GitHub Action roda todo dia e atualiza os arquivos em `data/` automaticamente. Só o
catálogo é espelhado aqui — imagens continuam vindo direto de `assets.tcgdex.net`
(nunca caiu) e preços continuam sendo buscados ao vivo (dado que muda o tempo todo, não
faz sentido espelhar).

## Estrutura

```
data/
  pt/sets/index.json     lista resumida de todos os sets, em português
  pt/sets/<setId>.json   detalhe completo de um set (cartas, cardCount)
  en/sets/index.json     mesma coisa, em inglês
  en/sets/<setId>.json
```

## Como o app consome isso

Servido via [jsDelivr](https://www.jsdelivr.com/) (CDN gratuita em cima do GitHub):

```
https://cdn.jsdelivr.net/gh/mariacecilialellis-coder/minha-colecao-catalogo@main/data/pt/sets/index.json
```

## Rodar manualmente

```
node sync.mjs
```
