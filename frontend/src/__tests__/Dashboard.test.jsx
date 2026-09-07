import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import Dashboard from "../pages/Dashboard";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

jest.mock("../api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),

  useLocation: () => ({
    pathname: "/dashboard",
  }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      user: {
        id: 1,
        full_name: "Test User",
        role: "user",
      },
      logout: jest.fn(),
    });

    api.get.mockImplementation((url) => {
      switch (url) {
        case "/incomes/":
          return Promise.resolve({
            data: [
              {
                id: 1,
                source: "Salary",
                amount: 50000,
                date: "2026-09-01",
              },
            ],
          });

        case "/expenses/":
          return Promise.resolve({
            data: [
              {
                id: 1,
                category: "Food",
                amount: 5000,
                date: "2026-09-02",
              },
            ],
          });

        case "/budgets/":
          return Promise.resolve({
            data: [
              {
                id: 1,
                category: "Food",
                monthly_limit: 10000,
                month_year: "2026-09",
              },
            ],
          });

        case "/bank-accounts/":
          return Promise.resolve({
            data: [
              {
                id: 1,
                bank_name: "Test Bank",
                account_type: "Savings Account",
                balance: 40000,
              },
            ],
          });

        case "/goals/":
          return Promise.resolve({
            data: [
              {
                id: 1,
                title: "Emergency Fund",
                target_amount: 100000,
                current_amount: 25000,
                status: "in_progress",
              },
            ],
          });

        default:
          return Promise.resolve({
            data: [],
          });
      }
    });
  });

  test("renders Dashboard without crashing with mock API data", async () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("heading", {
        name: "Dashboard",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Welcome back, Test User")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("₹50000.00")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("₹5000.00")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("₹40000.00").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("₹10000.00").length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText("Emergency Fund")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Salary")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Food").length
    ).toBeGreaterThan(0);

    expect(api.get).toHaveBeenCalledWith(
      "/incomes/"
    );

    expect(api.get).toHaveBeenCalledWith(
      "/expenses/"
    );

    expect(api.get).toHaveBeenCalledWith(
      "/budgets/"
    );

    expect(api.get).toHaveBeenCalledWith(
      "/bank-accounts/"
    );

    expect(api.get).toHaveBeenCalledWith(
      "/goals/"
    );
  });
});