/**
* @jest-environment jsdom
*/

import { screen } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills  from "../containers/Bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase"
import { bills } from "../fixtures/bills.js"
import { formatDate } from "../app/format.js"

describe('When I am on Bills page but it is loading', () => {
  test('Then, Loading page should be rendered', () => {
    const html = BillsUI({ loading: true })
    document.body.innerHTML = html
    expect(screen.getAllByText('Loading...')).toBeTruthy()
  })
})
describe('When I am on Bills page but back-end send an error message', () => {
  test('Then, Error page should be rendered', () => {
    const html = BillsUI({ error: 'some error message' })
    document.body.innerHTML = html
    expect(screen.getAllByText('Erreur')).toBeTruthy()
  })
})

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: []})
      document.body.innerHTML = html
      //to-do write expect expression
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/(\d{1,2}\s[A-Za-zÀ-ÖØ-öø-ÿ]{3}\.\s\d{2})/gi).map(a => {
         formatDate(a.dataset.date) === a.innerHTML ? a.dataset.date : a.innerHTML
      })
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe('When I click on the icon eye', () => {
    test('A modal should open', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const sampleBills = new Bills({ document, onNavigate, firestore: null, localStorage: window.localStorage })
      // sampleBills.handleClickIconEye = jest.fn()
      // const handleClickIconEye = jest.fn(sampleBills.handleClickIconEye)
      const handleClickIconEye = jest.spyOn(sampleBills, 'handleClickIconEye');
      const eye = screen.getAllByTestId("icon-eye")[0]
      // eye.addEventListener('click', handleClickIconEye(eye))
      userEvent.click(eye)
      expect(handleClickIconEye).toBeCalled()
      const modale = screen.queryByTestId('modaleFile')
      expect(modale).toBeTruthy()
    })
  })
  describe('When I click on the new bill button', () => {
    test('Then I should navigate to NewBill page', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const sampleBills = new Bills({ document, onNavigate, firestore: null, localStorage: window.localStorage })
      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(sampleBills.handleClickNewBill)
      // const handleClickNewBill = jest.spyOn(sampleBills, 'handleClickNewBill');
      newBillButton.addEventListener('click', handleClickNewBill())
      userEvent.click(newBillButton)
      expect(handleClickNewBill).toBeCalled()
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })
  })
})
describe("Given I am a user connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(bills.data.length).toBe(4)
   })
   test("fetches bills from an API and fails with 404 message error", async () => {
    firebase.get.mockImplementationOnce(() =>
      Promise.reject(new Error("Erreur 404"))
    )
    const html = BillsUI({ error: "Erreur 404" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test("fetches messages from an API and fails with 500 message error", async () => {
    firebase.get.mockImplementationOnce(() =>
      Promise.reject(new Error("Erreur 500"))
    )
    const html = BillsUI({ error: "Erreur 500" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
  })
})