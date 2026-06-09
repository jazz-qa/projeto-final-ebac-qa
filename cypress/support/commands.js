// Comandos personalizados para reutilização nos testes

// Realiza login na plataforma
Cypress.Commands.add('login', (email, senha) => {
  cy.visit('/minha-conta/')
  cy.get('#username').type(email)
  cy.get('#password').type(senha)
  cy.get('.woocommerce-form-login__submit').click()
})

// Limpa o carrinho antes de cada teste
Cypress.Commands.add('limparCarrinho', () => {
  cy.visit('/carrinho/')
  cy.get('body').then(($body) => {
    if ($body.find('.cart_item').length > 0) {
      cy.get('a.remove').each(($btn) => {
        cy.wrap($btn).click()
        cy.wait(500)
      })
    }
  })
})

// Adiciona produto ao carrinho pelo slug do produto
Cypress.Commands.add('adicionarAoCarrinho', (slugProduto, quantidade = 1) => {
  cy.visit(`/produto/${slugProduto}/`)
  cy.get('.quantity input').clear().type(String(quantidade))
  cy.get('.single_add_to_cart_button').click()
  cy.get('.woocommerce-message, .wc-block-components-notice-banner').should('exist')
})
