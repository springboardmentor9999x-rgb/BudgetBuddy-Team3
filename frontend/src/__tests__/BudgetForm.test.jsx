import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BudgetForm from "../components/budget/BudgetForm";

describe("BudgetForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.alert = jest.fn();
  });

  afterEach(() => {
    delete global.alert;
  });

  test("rejects a negative monthly budget amount", async () => {
    const user = userEvent.setup();

    const onSubmit = jest.fn();

    render(
      <BudgetForm
        onSubmit={onSubmit}
        editingBudget={null}
        onCancel={jest.fn()}
        loading={false}
      />
    );

    const amountInput =
      screen.getByPlaceholderText(
        "Enter budget amount"
      );

    await user.click(amountInput);

    await user.clear(amountInput);

    await user.type(amountInput, "-100");

    expect(amountInput).toHaveValue(-100);

    const form = amountInput.closest("form");

    fireEvent.submit(form);

    expect(global.alert).toHaveBeenCalledWith(
      "Please enter a valid monthly budget greater than 0."
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("rejects a zero monthly budget amount", async () => {
    const user = userEvent.setup();

    const onSubmit = jest.fn();

    render(
      <BudgetForm
        onSubmit={onSubmit}
        editingBudget={null}
        onCancel={jest.fn()}
        loading={false}
      />
    );

    const amountInput =
      screen.getByPlaceholderText(
        "Enter budget amount"
      );

    await user.clear(amountInput);

    await user.type(amountInput, "0");

    expect(amountInput).toHaveValue(0);

    const form = amountInput.closest("form");

    fireEvent.submit(form);

    expect(global.alert).toHaveBeenCalledWith(
      "Please enter a valid monthly budget greater than 0."
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });
});