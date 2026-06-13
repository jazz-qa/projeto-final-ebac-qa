/**
 * Configurações compartilhadas de performance
 * VUs: 20 | Duração total: 2 min | RampUp: 20 s
 */
export const opcoes = {
  stages: [
    { duration: '20s', target: 20 },  // RampUp: 0 → 20 VUs
    { duration: '100s', target: 20 }, // Sustentação: 20 VUs (~1min40s)
    { duration: '0s', target: 0 },    // RampDown imediato
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% das req. abaixo de 3s
    http_req_failed:   ['rate<0.05'],  // Menos de 5% de erros HTTP
  },
};
