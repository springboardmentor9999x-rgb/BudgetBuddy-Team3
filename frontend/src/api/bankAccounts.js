import api from "./axios";

// ==========================================
// GET ALL BANK ACCOUNTS
// ==========================================

export const getBankAccounts = async () => {
  const response = await api.get("/bank-accounts/");
  return response.data;
};

// ==========================================
// GET SINGLE BANK ACCOUNT
// ==========================================

export const getBankAccount = async (id) => {
  const response = await api.get(`/bank-accounts/${id}`);
  return response.data;
};

// ==========================================
// ADD BANK ACCOUNT
// ==========================================

export const addBankAccount = async (accountData) => {
  const response = await api.post(
    "/bank-accounts/",
    accountData
  );

  return response.data;
};

// ==========================================
// UPDATE BANK ACCOUNT
// ==========================================

export const updateBankAccount = async (
  id,
  accountData
) => {
  const response = await api.put(
    `/bank-accounts/${id}`,
    accountData
  );

  return response.data;
};

// ==========================================
// DELETE BANK ACCOUNT
// ==========================================

export const deleteBankAccount = async (id) => {
  const response = await api.delete(
    `/bank-accounts/${id}`
  );

  return response.data;
};