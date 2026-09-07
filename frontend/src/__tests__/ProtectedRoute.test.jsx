import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "../routes/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("ProtectedRoute", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to login when no token exists", () => {
    useAuth.mockReturnValue({
      token: null,
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={<div>Login Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText("Login Page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Protected Dashboard")
    ).not.toBeInTheDocument();
  });

  test("renders protected content when a valid token exists", () => {
    useAuth.mockReturnValue({
      token: "test-token",
      user: {
        id: 1,
        role: "user",
      },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={<div>Login Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText("Protected Dashboard")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Login Page")
    ).not.toBeInTheDocument();
  });
});