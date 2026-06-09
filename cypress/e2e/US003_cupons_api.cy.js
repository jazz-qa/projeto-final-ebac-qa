/// <reference types="cypress" />

describe('[US-0003] API de Cupons', () => {
  const API_URL = Cypress.env('API_URL')
  const AUTH = Cypress.env('API_AUTH')
  let cupomCriadoId

  const headers = {
    Authorization: AUTH,
    'Content-Type': 'application/json',
  }

  context('GET - Listar cupons', () => {
    it('CT001 - Deve retornar status 200 ao listar todos os cupons', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/coupons`,
        headers,
      }).then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.be.an('array')
      })
    })

    it('CT002 - A resposta deve conter os campos obrigatórios de cada cupom', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/coupons`,
        headers,
      }).then((response) => {
        expect(response.status).to.equal(200)
        if (response.body.length > 0) {
          const cupom = response.body[0]
          expect(cupom).to.have.property('id')
          expect(cupom).to.have.property('code')
          expect(cupom).to.have.property('amount')
          expect(cupom).to.have.property('discount_type')
        }
      })
    })

    it('CT003 - Deve retornar um cupom específico ao buscar por ID', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/coupons`,
        headers,
      }).then((response) => {
        expect(response.body.length).to.be.greaterThan(0)
        const id = response.body[0].id
        cy.request({
          method: 'GET',
          url: `${API_URL}/coupons/${id}`,
          headers,
        }).then((res) => {
          expect(res.status).to.equal(200)
          expect(res.body.id).to.equal(id)
        })
      })
    })
  })

  context('POST - Cadastrar cupom', () => {
    const timestamp = Date.now()
    const novoCupom = {
      code: `AUTOCUPOM${timestamp}`,
      amount: '10.00',
      discount_type: 'fixed_product',
      description: 'Cupom de desconto de teste automatizado',
    }

    it('CT004 - Deve cadastrar um novo cupom com os campos obrigatórios', () => {
      cy.request({
        method: 'POST',
        url: `${API_URL}/coupons`,
        headers,
        body: novoCupom,
      }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.have.property('id')
        expect(response.body.code).to.equal(novoCupom.code.toLowerCase())
        expect(response.body.amount).to.equal(novoCupom.amount)
        expect(response.body.discount_type).to.equal(novoCupom.discount_type)
        cupomCriadoId = response.body.id
      })
    })

    it('CT005 - Não deve permitir cadastrar cupom com nome duplicado', () => {
      const cupomDuplicado = {
        code: `DUPLICADO${timestamp}`,
        amount: '5.00',
        discount_type: 'fixed_product',
        description: 'Cupom duplicado para teste',
      }

      // Cria o primeiro
      cy.request({
        method: 'POST',
        url: `${API_URL}/coupons`,
        headers,
        body: cupomDuplicado,
      }).then((res) => {
        expect(res.status).to.equal(201)

        // Tenta criar com o mesmo código
        cy.request({
          method: 'POST',
          url: `${API_URL}/coupons`,
          headers,
          body: cupomDuplicado,
          failOnStatusCode: false,
        }).then((resDuplicado) => {
          expect(resDuplicado.status).to.not.equal(201)
          expect(resDuplicado.body).to.have.property('code')
        })
      })
    })

    it('CT006 - Não deve cadastrar cupom sem o campo obrigatório "code"', () => {
      cy.request({
        method: 'POST',
        url: `${API_URL}/coupons`,
        headers,
        body: {
          amount: '10.00',
          discount_type: 'fixed_product',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.equal(201)
      })
    })
  })
})
