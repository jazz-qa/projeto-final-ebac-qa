// Comandos personalizados para reutilização nos testes

// Realiza login na plataforma
Cypress.Commands.add('login', (email, senha) => {
  cy.visit('/minha-conta/')
  cy.get('#username').type(email)
  cy.get('#password').type(senha)
  cy.get('input[name="login"]').click()
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

// Seleciona a primeira variação disponível em produtos variáveis (ex: tamanho, cor)
// Lê o data-product_variations do WooCommerce para garantir uma combinação válida e em estoque
Cypress.Commands.add('selecionarVariacao', () => {
  cy.get('body').then(($body) => {
    if ($body.find('form.variations_form').length === 0) return

    cy.get('form.variations_form').then(($form) => {
      const variations = JSON.parse($form.attr('data-product_variations') || '[]')
      const disponivel = variations.find((v) => v.is_in_stock && v.is_purchasable)

      if (!disponivel) return

      Object.entries(disponivel.attributes).forEach(([atributo, valor]) => {
        cy.get(`select[name="${atributo}"]`).select(valor, { force: true })
      })
    })
  })
})

// Adiciona produto ao carrinho pelo slug do produto
Cypress.Commands.add('adicionarAoCarrinho', (slugProduto, quantidade = 1) => {
  cy.visit(`/produto/${slugProduto}/`)
  cy.selecionarVariacao()
  cy.get('input[type="number"]').clear().type(String(quantidade))
  cy.get('.single_add_to_cart_button').click()
  cy.get('.woocommerce-message, .wc-block-components-notice-banner').should('exist')
})
