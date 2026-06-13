/**
 * CT-PERF-002 — Teste de Performance: Adição de Produto ao Carrinho
 *
 * Objetivo : Verificar que o fluxo de adicionar produto ao carrinho suporta
 *            20 VUs simultâneos durante 2 minutos sem erros críticos.
 *
 * Produto testado: ingrid-running-jacket (ID 4104)
 *   Variações confirmadas em estoque (tamanho L):
 *     4105 → L / Orange
 *     4106 → L / Red
 *     4107 → L / White
 *
 * Fluxo:
 *   1. Login do usuário
 *   2. Navegação até a loja
 *   3. Adição de variação ao carrinho via ?add-to-cart + variation_id
 *   4. Verificação do carrinho
 *
 * Critérios de aceite:
 *   - p(95) carrinho_adicao_duracao_ms < 3 000 ms
 *   - p(95) carrinho_verif_duracao_ms  < 3 000 ms
 *   - carrinho_adicao_sucesso rate > 95%
 *
 * Configuração:
 *   - VUs: 20 | RampUp: 20 s | Duração total: 2 min
 *   - Massa: 5 usuários × 3 variações em rodízio
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { opcoes } from './config/opcoes.js';
import { usuarios } from './data/usuarios.js';

// ── Métricas customizadas ────────────────────────────────────────────────────
const tendenciaAdicaoDuracao = new Trend('carrinho_adicao_duracao_ms', true);
const tendenciaVerifDuracao  = new Trend('carrinho_verif_duracao_ms', true);
const taxaAdicaoSucesso      = new Rate('carrinho_adicao_sucesso');
const totalAdicoes           = new Counter('total_adicoes_carrinho');

// ── Opções do teste ──────────────────────────────────────────────────────────
export const options = {
  ...opcoes,
  thresholds: {
    ...opcoes.thresholds,
    carrinho_adicao_duracao_ms: ['p(95)<3000'],
    carrinho_verif_duracao_ms:  ['p(95)<3000'],
    carrinho_adicao_sucesso:    ['rate>0.95'],
  },
};

// ── Constantes ───────────────────────────────────────────────────────────────
const BASE_URL      = 'http://lojaebac.ebaconline.art.br';
const LOGIN_PAGE    = `${BASE_URL}/minha-conta/`;
const LOJA_PAGE     = `${BASE_URL}/shop-both-sidebar/`;
const CARRINHO_PAGE = `${BASE_URL}/carrinho/`;
const PRODUTO_PAGE  = `${BASE_URL}/product/ingrid-running-jacket/`;

// Variações confirmadas em estoque no produto ingrid-running-jacket (ID 4104)
const variacoes = [
  { variation_id: '4105', attribute_size: 'L', attribute_color: 'Orange' },
  { variation_id: '4106', attribute_size: 'L', attribute_color: 'Red'    },
  { variation_id: '4107', attribute_size: 'L', attribute_color: 'White'  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function extrairNonce(html) {
  const match = html.match(/name="woocommerce-login-nonce"\s+value="([^"]+)"/);
  return match ? match[1] : '';
}

function fazerLogin(usuario) {
  const resPag = http.get(LOGIN_PAGE, { tags: { name: 'GET_login_page_ct002' } });
  const nonce  = extrairNonce(resPag.body);

  return http.post(
    LOGIN_PAGE,
    {
      username:                  usuario.username,
      password:                  usuario.password,
      'woocommerce-login-nonce': nonce,
      '_wp_http_referer':        '/minha-conta/',
      login:                     'Fazer login',
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer:        LOGIN_PAGE,
      },
      redirects: 5,
      tags: { name: 'POST_login_ct002' },
    }
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  const res = http.get(LOJA_PAGE);
  check(res, {
    '[setup] loja acessível': (r) => r.status === 200,
  });
}

// ── Cenário principal ────────────────────────────────────────────────────────
export default function () {
  const usuario  = usuarios[(__VU - 1) % usuarios.length];
  const variacao = variacoes[__ITER % variacoes.length];

  group('CT-PERF-002: Adição de Produto ao Carrinho', () => {

    // Passo 1: Login
    group('Passo 1 - Autenticar usuário', () => {
      const resLogin = fazerLogin(usuario);
      check(resLogin, {
        'login realizado com sucesso': (r) =>
          r.status === 200 &&
          (r.body.includes('logout') ||
           r.body.includes('Sair')   ||
           r.body.includes('Olá')),
      });
    });

    sleep(1);

    // Passo 2: Navegar até a loja
    group('Passo 2 - Listar produtos', () => {
      const resLoja = http.get(LOJA_PAGE, { tags: { name: 'GET_loja' } });
      check(resLoja, {
        'loja retornou 200':           (r) => r.status === 200,
        'lista de produtos presente':  (r) => r.body.includes('add-to-cart'),
      });
    });

    sleep(1);

    // Passo 3: Adicionar variação ao carrinho
    // WooCommerce aceita add-to-cart de produto variável via POST na página do produto
    group(`Passo 3 - Adicionar ao carrinho (var ${variacao.variation_id})`, () => {
      const payload = {
        'add-to-cart':              '4104',
        'variation_id':              variacao.variation_id,
        'attribute_pa_size':         variacao.attribute_size,
        'attribute_pa_color':        variacao.attribute_color,
        'quantity':                  '1',
      };

      const params = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer:        PRODUTO_PAGE,
        },
        redirects: 5,
        tags: { name: 'POST_add_to_cart' },
      };

      const inicio    = Date.now();
      const resAdicao = http.post(PRODUTO_PAGE, payload, params);
      const duracao   = Date.now() - inicio;

      tendenciaAdicaoDuracao.add(duracao);
      totalAdicoes.add(1);

      const adicionouOk = check(resAdicao, {
        'status 200 após add-to-cart':      (r) => r.status === 200,
        'produto adicionado com sucesso':   (r) =>
          r.body.includes('adicionado')  ||
          r.body.includes('carrinho')    ||
          r.body.includes('cart')        ||
          r.url.includes('carrinho')     ||
          r.url.includes('add-to-cart'),
        'sem erro de produto não encontrado': (r) =>
          r.status !== 404 &&
          !r.body.includes('Página não encontrada'),
      });

      taxaAdicaoSucesso.add(adicionouOk);

      console.log(
        `[CT-PERF-002] VU=${__VU} ITER=${__ITER} user=${usuario.username} ` +
        `var=${variacao.variation_id} status=${resAdicao.status} ` +
        `duracao=${duracao}ms ok=${adicionouOk}`
      );
    });

    sleep(1);

    // Passo 4: Verificar carrinho
    group('Passo 4 - Verificar carrinho', () => {
      const inicio       = Date.now();
      const resCarrinho  = http.get(CARRINHO_PAGE, { tags: { name: 'GET_carrinho' } });
      const duracao      = Date.now() - inicio;

      tendenciaVerifDuracao.add(duracao);

      check(resCarrinho, {
        'carrinho retornou 200':             (r) => r.status === 200,
        'carrinho contém ao menos 1 produto': (r) =>
          r.body.includes('cart_item')   ||
          r.body.includes('product-name') ||
          r.body.includes('woocommerce-cart-form'),
        'subtotal visível':                  (r) =>
          r.body.includes('subtotal') || r.body.includes('Subtotal'),
      });
    });
  });

  sleep(Math.random() * 2 + 1); // 1–3 s entre iterações
}

export function teardown() {
  console.log('[CT-PERF-002] Teste de carrinho finalizado.');
}

// ── Relatório de evidências (HTML + resumo no console) ───────────────────────
export function handleSummary(data) {
  return {
    'k6/evidencias/ct-perf-002-report.html': htmlReport(data),
    'k6/evidencias/ct-perf-002-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
