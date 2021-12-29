import { screen } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import firebase from "../__mocks__/firebase"
import { ROUTES } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"

afterEach(jest.clearAllMocks)
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I change the file for a new bill", () => {
      test("Then the new file should be uploaded", () => {
        const html = NewBillUI()
        document.body.innerHTML = html

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: "Employee",
        }))
        const sampleNewBills = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })  

        const file = new File(['hello'], 'hello.png', {type: 'image/png'})
        const input = screen.getByTestId("file")
        const handleChangeFile = jest.spyOn(sampleNewBills, 'handleChangeFile');
        input.addEventListener("change", handleChangeFile)
        userEvent.upload(input, file)

        expect(input.files[0]).toStrictEqual(file)
        expect(input.files.item(0)).toStrictEqual(file)
        expect(input.files).toHaveLength(1)
        expect(handleChangeFile).toHaveBeenCalledTimes(1)
      })
    })

    describe("When I submit a new bill without filling the form", () => {
      test("Then the new bill should not be created and I should stay on the form", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: "Employee",
          email: "thomas@facadia.com"
        }))
        const sampleNewBills = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })
        sampleNewBills.handleSubmit = jest.fn()
        const submit = screen.getByRole("button", { name: 'Envoyer' })
        userEvent.click(submit)
        expect(sampleNewBills.handleSubmit).not.toHaveBeenCalled()
      })
    })

    describe("When I submit a new bill with datas", () => {
      test("Then the new bill should be created", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        userEvent.selectOptions(screen.getByTestId("expense-type"), "Transports")
        userEvent.type(screen.getByTestId("expense-name"), "expense name")
        userEvent.type(screen.getByTestId("datepicker"), "2020-01-02")
        userEvent.type(screen.getByTestId("amount"), "200")
        userEvent.type(screen.getByTestId("vat"), "70")
        userEvent.type(screen.getByTestId("pct"), "20")
        userEvent.type(screen.getByTestId("commentary"), "this is a commentary")
        const file = new File(['hello'], 'hello.png', {type: 'image/png'})
        const input = screen.getByTestId("file")
        userEvent.upload(input, file)
        
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: "Employee",
          email: "johndoe@email.com"
        }))

        const sampleNewBills = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })
        sampleNewBills.createBill = jest.fn()

        const submit = screen.getByRole("button", { name: 'Envoyer' })
        userEvent.click(submit)
        expect(sampleNewBills.createBill).toHaveBeenCalledTimes(1)
        expect(sampleNewBills.createBill).toBeCalledWith(
          expect.objectContaining({
            amount: expect.any(Number),
            commentary: expect.any(String),
            date: expect.any(String),
            email: undefined,
            fileName: null,
            fileUrl: null,
            name: expect.any(String),
            pct: expect.any(Number),
            status: expect.any(String),
            type: expect.any(String),
            vat: expect.anything(),
          }),
        );
        expect(screen.getAllByText('Mes notes de frais')).toBeTruthy() 
      })
    })
  })
})
describe("Given I am a user connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("post bill with API POST", async () => {
      const getSpy = jest.spyOn(firebase, "post")
      firebase.post({bill:"bill"});
      expect(getSpy).toHaveBeenCalledTimes(1)
   })
   test("post bill with API and fails with 404 message error", async () => {
    firebase.post.mockImplementationOnce(() =>
      Promise.reject(new Error("Erreur 404"))
    )
    const html = BillsUI({ error: "Erreur 404" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test("post bill with API and fails with 500 message error", async () => {
    firebase.post.mockImplementationOnce(() =>
      Promise.reject(new Error("Erreur 500"))
    )
    const html = BillsUI({ error: "Erreur 500" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
  })
})