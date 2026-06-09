const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://lojaebac.ebaconline.art.br',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {},
  },
  env: {
    API_URL: 'http://lojaebac.ebaconline.art.br/wp-json/wc/v3',
    API_AUTH: 'Basic YWRtaW5fZWJhYzpAYWRtaW4hJmJAYyEyMDIy',
    USUARIO_EMAIL: 'cliente_ebac@teste.com',
    USUARIO_SENHA: 'Cliente@123',
  },
})
