/**
 * CT-PERF-001 — Teste de Performance: Login do Usuário
 *
 * Objetivo : Verificar que o fluxo de login suporta 20 VUs simultâneos
 *            durante 2 minutos sem degradação de resposta.
 *
 * Fluxo:
 *   1. GET /minha-conta/          → extrai nonce do formulário WooCommerce
 *   2. POST /minha-conta/         → autentica com credenciais
 *   3. Valida resposta autenticada
 *
 * Critérios de aceite:
 *   - p(95) login_duracao_ms < 3 000 ms
 *   - login_sucesso rate > 95%
 *   - Resposta contém indicador de sessão autenticada
 *
 * Configuração:
 *   - VUs: 20 | RampUp: 20 s | Duração total: 2 min
 *   - Massa: 5 usuários em rodízio por VU
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { opcoes } from './config/opcoes.js';
import { usuarios } from './data/usuarios.js';

// ── Métricas customizadas ────────────────────────────────────────────────────
const tendenciaLoginDuracao = new Trend('login_duracao_ms', true);
const taxaLoginSucesso      = new Rate('login_sucesso');
const totalLogins           = new Counter('total_logins');

// ── Opções do teste ──────────────────────────────────────────────────────────
export const options = {
  ...opcoes,
  thresholds: {
    ...opcoes.thresholds,
    login_duracao_ms: ['p(95)<3000'],
    login_sucesso:    ['rate>0.95'],
  },
};

// ── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL   = 'http://lojaebac.ebaconline.art.br';
const LOGIN_PAGE = `${BASE_URL}/minha-conta/`;

// ── Extrai nonce do formulário WooCommerce ───────────────────────────────────
function extrairNonce(html) {
  const match = html.match(/name="woocommerce-login-nonce"\s+value="([^"]+)"/);
  return match ? match[1] : '';
}

// ── Setup: valida acessibilidade antes de iniciar ────────────────────────────
export function setup() {
  const res = http.get(LOGIN_PAGE);
  check(res, {
    '[setup] página de login acessível': (r) => r.status === 200,
  });
}

// ── Cenário principal ────────────────────────────────────────────────────────
export default function () {
  // Rodízio de usuários por VU (distribui carga entre os 5 usuários)
  const usuario = usuarios[(__VU - 1) % usuarios.length];

  group('CT-PERF-001: Login do Usuário', () => {

    // Passo 1: Carregar página de login e extrair nonce
    let resPagina;
    group('Passo 1 - Carregar página de login', () => {
      resPagina = http.get(LOGIN_PAGE, { tags: { name: 'GET_login_page' } });

      check(resPagina, {
        'página de login retornou 200':     (r) => r.status === 200,
        'formulário de login presente':     (r) => r.body.includes('woocommerce-login-nonce'),
      });
    });

    sleep(1); // Simula tempo de preenchimento do formulário

    // Passo 2: Submeter credenciais
    group('Passo 2 - Submeter credenciais', () => {
      const nonce = extrairNonce(resPagina.body);

      const payload = {
        username:                  usuario.username,
        password:                  usuario.password,
        'woocommerce-login-nonce': nonce,
        '_wp_http_referer':        '/minha-conta/',
        login:                     'Fazer login',
      };

      const params = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer':       LOGIN_PAGE,
        },
        redirects: 5,
        tags: { name: 'POST_login' },
      };

      const inicio   = Date.now();
      const resLogin = http.post(LOGIN_PAGE, payload, params);
      const duracao  = Date.now() - inicio;

      tendenciaLoginDuracao.add(duracao);
      totalLogins.add(1);

      // WooCommerce autentica e redireciona para /minha-conta/
      // A página autenticada contém "Olá", "logout" ou o username
      const loginOk = check(resLogin, {
        'status 200 após login':         (r) => r.status === 200,
        'sessão autenticada na resposta': (r) =>
          r.body.includes('logout') ||
          r.body.includes('Sair')   ||
          r.body.includes('Olá')    ||
          r.body.includes('minha-conta'),
        'sem erro de credenciais':       (r) =>
          !r.body.includes('Usuário inválido') &&
          !r.body.includes('Senha incorreta')  &&
          !r.body.includes('woocommerce-error'),
      });

      taxaLoginSucesso.add(loginOk);

      console.log(
        `[CT-PERF-001] VU=${__VU} user=${usuario.username} ` +
        `status=${resLogin.status} duracao=${duracao}ms ok=${loginOk}`
      );
    });
  });

  sleep(Math.random() * 2 + 1); // 1–3 s entre iterações
}

export function teardown() {
  console.log('[CT-PERF-001] Teste de login finalizado.');
}

// ── Relatório de evidências (HTML + resumo no console) ───────────────────────
export function handleSummary(data) {
  return {
    'k6/evidencias/ct-perf-001-report.html': htmlReport(data),
    'k6/evidencias/ct-perf-001-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
