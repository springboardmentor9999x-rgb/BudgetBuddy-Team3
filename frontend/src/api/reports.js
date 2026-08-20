import api from "./axios";

export const downloadMonthlyPDF = async (month, year) => {
  const response = await api.get(
    `/reports/export/pdf?month=${month}&year=${year}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.download = `BudgetBuddy_Report_${year}_${month}.pdf`;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadMonthlyExcel = async (month, year) => {
  const response = await api.get(
    `/reports/export/excel?month=${month}&year=${year}`,
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.download = `BudgetBuddy_Report_${year}_${month}.xlsx`;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};