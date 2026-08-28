// Espelha o catálogo público da TCGdex (sets + cartas de cada set, pt e en)
// como arquivos JSON neste repositório. Roda automaticamente todo dia via
// GitHub Actions (ver .github/workflows/sync-catalogo.yml), mas também dá
// pra rodar na mão com `node sync.mjs`.
//
// Isso NÃO mexe em imagens (essas continuam vindo direto da TCGdex, nunca
// caíram) nem em preço (esse é dado ao vivo, não faz sentido espelhar).
// Só o catálogo "quais cartas existem" — que é o que quebra quando a API
// deles fica fora do ar.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IDIOMAS = ['pt', 'en'];
const BASE_URL = 'https://api.tcgdex.net/v2';
const TAMANHO_LOTE = 8; // sets buscados em paralelo por vez, pra não sobrecarregar a API deles

async function buscarJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} em ${url}`);
  }
  return resposta.json();
}

async function sincronizarIdioma(idioma) {
  console.log(`[${idioma}] buscando lista de sets...`);
  const listaSets = await buscarJson(`${BASE_URL}/${idioma}/sets`);

  const dirSets = path.join('data', idioma, 'sets');
  await mkdir(dirSets, { recursive: true });

  // Índice leve: id, nome, logo, cardCount — usado pra listar todos os sets
  // (tela Coleções) sem precisar baixar o detalhe de cada um.
  await writeFile(
    path.join(dirSets, 'index.json'),
    JSON.stringify(listaSets, null, 2),
  );
  console.log(`[${idioma}] ${listaSets.length} sets no índice.`);

  // Junta id/nome/número/imagem de TODA carta de TODO set num único arquivo
  // — é o que permite buscar carta por nome (scanner, busca manual) sem
  // depender do endpoint de busca ao vivo da TCGdex.
  const indiceDeCartas = [];

  let falhas = 0;
  for (let i = 0; i < listaSets.length; i += TAMANHO_LOTE) {
    const lote = listaSets.slice(i, i + TAMANHO_LOTE);
    await Promise.all(
      lote.map(async (set) => {
        try {
          const detalhe = await buscarJson(`${BASE_URL}/${idioma}/sets/${set.id}`);
          await writeFile(
            path.join(dirSets, `${set.id}.json`),
            JSON.stringify(detalhe, null, 2),
          );
          for (const carta of detalhe.cards ?? []) {
            indiceDeCartas.push({
              id: carta.id,
              name: carta.name,
              localId: carta.localId,
              image: carta.image,
              setId: set.id,
            });
          }
        } catch (erro) {
          falhas += 1;
          console.error(`[${idioma}] erro no set ${set.id}: ${erro.message}`);
        }
      }),
    );
    console.log(`[${idioma}] ${Math.min(i + TAMANHO_LOTE, listaSets.length)}/${listaSets.length} sets`);
  }

  await writeFile(
    path.join('data', idioma, 'cards-index.json'),
    JSON.stringify(indiceDeCartas, null, 2),
  );
  console.log(`[${idioma}] ${indiceDeCartas.length} cartas no índice de busca.`);

  if (falhas > 0) {
    console.warn(`[${idioma}] ${falhas} set(s) falharam nesta rodada — ficam com a versão anterior salva, tenta de novo na próxima sincronização.`);
  }
}

async function main() {
  for (const idioma of IDIOMAS) {
    await sincronizarIdioma(idioma);
  }
  console.log('Sincronização concluída.');
}

main().catch((erro) => {
  console.error('Falha geral na sincronização:', erro);
  process.exit(1);
});
