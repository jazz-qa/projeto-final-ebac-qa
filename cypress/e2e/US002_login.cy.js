/// <reference types="cypress" />

describe('[US-0002] Login na plataforma', () => {
  const LOGIN_URL = '/minha-conta/'

  beforeEach(() => {
    cy.visit(LOGIN_URL)
  })

  context('Regra: somente usuários ativos podem fazer login', () => {
    it('CT001 - Deve realizar login com usuário ativo e credenciais válidas', () => {
      cy.fixture('dados').then((dados) => {
        cy.get('#username').type(dados.clienteValido.email)
        cy.get('#password').type(dados.clienteValido.senha)
        cy.get('.woocommerce-form-login__submit').click()
        cy.url().should('include', '/minha-conta/')
        cy.get('.woocommerce-MyAccount-navigation').should('be.visible')
      })
    })

    it('CT002 - Não deve permitir login de usuário inativo', () => {
      cy.get('#username').type('inativo@teste.com')
      cy.get('#password').type('Inativo@123')
      cy.get('.woocommerce-form-login__submit').click()
      cy.get('.woocommerce-error').should('be.visible')
    })
  })

  context('Regra: mensagem de erro para credenciais incorretas', () => {
    it('CT003 - Deve exibir mensagem de erro ao digitar senha incorreta', () => {
      cy.fixture('dados').then((dados) => {
        cy.get('#username').type(dados.clienteValido.email)
        cy.get('#password').type('senhaErrada123')
        cy.get('.woocommerce-form-login__submit').click()
        cy.get('.woocommerce-error').should('be.visible')
        cy.get('.woocommerce-error').should('contain', 'senha')
      })
    })

    it('CT004 - Deve exibir mensagem de erro ao informar email inexistente', () => {
      cy.fixture('dados').then((dados) => {
        cy.get('#username').type(dados.credenciaisInvalidas.email)
        cy.get('#password').type(dados.credenciaisInvalidas.senha)
        cy.get('.woocommerce-form-login__submit').click()
        cy.get('.woocommerce-error').should('be.visible')
      })
    })
  })

  context('Regra: bloqueio após 3 tentativas incorretas', () => {
    it('CT005 - Deve bloquear login por 15 minutos após 3 tentativas com senha errada', () => {
      cy.fixture('dados').then((dados) => {
        const email = dados.clienteValido.email
        const senhaErrada = 'senhaIncorreta#99'

        // 1ª tentativa
        cy.get('#username').type(email)
        cy.get('#password').type(senhaErrada)
        cy.get('.woocommerce-form-login__submit').click()
        cy.get('.woocommerce-error').should('be.visible')

        // 2ª tentativa
        cy.visit(LOGIN_URL)
        cy.get('#username').type(email)
        cy.get('#password').type(senhaErrada)
        cy.get('.woocommerce-form-login__submit').click()
        cy.get('.woocommerce-error').should('be.visible')

        // 3ª tentativa - deve acionar o bloqueio
        cy.visit(LOGIN_URL)
        cy.get('#username').type(email)
        cy.get('#password').type(senhaErrada)
        cy.get('.woocommerce-form-login__submit').click()
        cy.get('.woocommerce-error')
          .should('be.visible')
          .and('contain', '15')
      })
    })
  })
})
