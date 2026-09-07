import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ExpenseForm from "../components/expenses/ExpenseForm";

import api from "../api/axios";
import {
  addExpense,
  updateExpense,
} from "../api/transactions";

import { toast } from "react-toastify";

jest.mock("../api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("../api/transactions", () => ({
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("ExpenseForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    api.get.mockResolvedValue({
      data: [
        {
          id: 1,
          bank_name: "Test Bank",
          account_type: "Savings Account",
          account_number: "1234567890",
          balance: 10000,
        },
      ],
    });

    addExpense.mockResolvedValue({
      data: {
        id: 1,
      },
    });

    updateExpense.mockResolvedValue({
      data: {
        id: 1,
      },
    });
  });

  test("rejects a negative expense amount", async () => {
    const user = userEvent.setup();

    render(
      <ExpenseForm
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Enter amount")
      ).toBeInTheDocument();
    });

    const amountInput =
      screen.getByPlaceholderText("Enter amount");

    await user.click(amountInput);

    await user.clear(amountInput);

    await user.type(amountInput, "-100");

    expect(amountInput).toHaveValue(-100);

    const form = amountInput.closest("form");

    fireEvent.submit(form);

    expect(toast.error).toHaveBeenCalledWith(
      "Expense amount must be greater than zero"
    );

    expect(addExpense).not.toHaveBeenCalled();
  });
});