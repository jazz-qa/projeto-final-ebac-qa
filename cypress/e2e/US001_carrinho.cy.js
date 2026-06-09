/// <reference types="cypress" />

describe('[US-0001] Adicionar item ao carrinho', () => {
  const PRODUTO_SLUG = 'ingrid-running-jacket'

  beforeEach(() => {
    cy.limparCarrinho()
  })

  context('Regra: limite de quantidade por produto', () => {
    it('CT001 - Deve adicionar produto ao carrinho com sucesso', () => {
      cy.visit(`/produto/${PRODUTO_SLUG}/`)
      cy.get('.quantity input').clear().type('1')
      cy.get('.single_add_to_cart_button').click()
      cy.get('.woocommerce-message').should('contain', 'carrinho')
      cy.visit('/carrinho/')
      cy.get('.cart_item').should('have.length.at.least', 1)
    })

    it('CT002 - Não deve permitir adicionar mais de 10 unidades do mesmo produto', () => {
      cy.visit(`/produto/${PRODUTO_SLUG}/`)
      cy.get('.quantity input').clear().type('11')
      cy.get('.single_add_to_cart_button').click()
      cy.visit('/carrinho/')
      cy.get('.qty').invoke('val').then((val) => {
        expect(Number(val)).to.be.at.most(10)
      })
    })

    it('CT003 - Deve permitir adicionar exatamente 10 unidades (limite máximo)', () => {
      cy.visit(`/produto/${PRODUTO_SLUG}/`)
      cy.get('.quantity input').clear().type('10')
      cy.get('.single_add_to_cart_button').click()
      cy.get('.woocommerce-message').should('exist')
      cy.visit('/carrinho/')
      cy.get('.qty').invoke('val').then((val) => {
        expect(Number(val)).to.equal(10)
      })
    })
  })

  context('Regra: valor máximo do carrinho (R$ 990,00)', () => {
    it('CT004 - Não deve permitir valores acima de R$ 990,00 no carrinho', () => {
      cy.visit('/carrinho/')
      cy.get('.order-total .woocommerce-Price-amount').then(($total) => {
        const totalText = $total.text().replace(/[^\d,]/g, '').replace(',', '.')
        const total = parseFloat(totalText)
        expect(total).to.be.at.most(990)
      })
    })
  })

  context('Regra: cupom de desconto por faixa de valor', () => {
    it('CT005 - Deve exibir cupom de 10% para compras entre R$ 200 e R$ 600', () => {
      // Produto de R$84 x 3 = R$252 (dentro da faixa de 10%)
      cy.visit(`/produto/${PRODUTO_SLUG}/`)
      cy.get('.quantity input').clear().type('3')
      cy.get('.single_add_to_cart_button').click()
      cy.visit('/carrinho/')
      cy.get('.order-total .woocommerce-Price-amount').then(($total) => {
        const totalText = $total.text().replace(/[^\d,]/g, '').replace(',', '.')
        const total = parseFloat(totalText)
        expect(total).to.be.within(200, 600)
      })
      cy.get('.coupon input[name="coupon_code"]').type('cupom10')
      cy.get('.coupon [name="apply_coupon"]').click()
      cy.get('.woocommerce-message, .woocommerce-error').should('exist')
    })

    it('CT006 - Deve exibir cupom de 15% para compras acima de R$ 600', () => {
      // Produto de R$84 x 8 = R$672 (acima de R$600)
      cy.visit(`/produto/${PRODUTO_SLUG}/`)
      cy.get('.quantity input').clear().type('8')
      cy.get('.single_add_to_cart_button').click()
      cy.visit('/carrinho/')
      cy.get('.order-total .woocommerce-Price-amount').then(($total) => {
        const totalText = $total.text().replace(/[^\d,]/g, '').replace(',', '.')
        const total = parseFloat(totalText)
        expect(total).to.be.above(600)
      })
      cy.get('.coupon input[name="coupon_code"]').type('cupom15')
      cy.get('.coupon [name="apply_coupon"]').click()
      cy.get('.woocommerce-message, .woocommerce-error').should('exist')
    })
  })
})
