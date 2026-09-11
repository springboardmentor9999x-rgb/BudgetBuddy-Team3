import api from "./axios";


/* =========================================================
   MONTHLY REPORT DATA
========================================================= */

/**
 * Fetch monthly report data.
 *
 * Backend:
 *
 * GET /reports/monthly?month={month}&year={year}
 */
export const getMonthlyReport = async (
  month,
  year
) => {

  const response =
    await api.get(
      "/reports/monthly",
      {
        params: {
          month,
          year,
        },
      }
    );


  return response.data;

};


/* =========================================================
   CLEAN REPORT PARAMS
========================================================= */

const cleanReportParams = (
  params = {}
) => {

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

};


/* =========================================================
   NORMALIZE REPORT ARGUMENTS
========================================================= */

/**
 * Supports BOTH calling styles.
 *
 * OLD:
 *
 * downloadMonthlyPDF(
 *   8,
 *   2026,
 *   "2026-08-01",
 *   "2026-08-31"
 * )
 *
 * NEW:
 *
 * downloadMonthlyPDF({
 *   month: 8,
 *   year: 2026,
 *   startDate: "2026-08-01",
 *   endDate: "2026-08-31",
 *   range: "custom"
 * })
 */

const normalizeReportArguments = (
  monthOrOptions,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  /* -----------------------------------------
     OBJECT STYLE
  ----------------------------------------- */

  if (
    monthOrOptions &&
    typeof monthOrOptions === "object" &&
    !Array.isArray(monthOrOptions)
  ) {

    return {

      month:
        monthOrOptions.month,

      year:
        monthOrOptions.year,

      startDate:
        monthOrOptions.startDate ||
        monthOrOptions.start_date ||
        "",

      endDate:
        monthOrOptions.endDate ||
        monthOrOptions.end_date ||
        "",

      range:
        monthOrOptions.range ||
        "",

    };

  }


  /* -----------------------------------------
     POSITIONAL STYLE
  ----------------------------------------- */

  return {

    month:
      monthOrOptions,

    year,

    startDate,

    endDate,

    range,

  };

};


/* =========================================================
   BUILD REPORT PARAMETERS
========================================================= */

/**
 * Builds parameters for:
 *
 * 1. Current month
 * 2. Last 6 months
 * 3. Last 12 months
 * 4. Custom date range
 *
 * The `range` value is intentionally sent to the
 * backend so the backend knows which export period
 * the user selected.
 */

const buildReportParams = (
  month,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  /* -----------------------------------------
     CUSTOM RANGE
  ----------------------------------------- */

  if (
    range === "custom" &&
    startDate &&
    endDate
  ) {

    return cleanReportParams({

      range: "custom",

      start_date:
        startDate,

      end_date:
        endDate,

    });

  }


  /* -----------------------------------------
     LAST 6 MONTHS
  ----------------------------------------- */

  if (
    range === "6_months"
  ) {

    return cleanReportParams({

      range: "6_months",

      month,

      year,

    });

  }


  /* -----------------------------------------
     LAST 12 MONTHS
  ----------------------------------------- */

  if (
    range === "12_months"
  ) {

    return cleanReportParams({

      range: "12_months",

      month,

      year,

    });

  }


  /* -----------------------------------------
     CURRENT MONTH
  ----------------------------------------- */

  return cleanReportParams({

    range:
      range ||
      "current_month",

    month,

    year,

  });

};


/* =========================================================
   DOWNLOAD BLOB HELPER
========================================================= */

/**
 * Download a blob returned by Axios.
 */

const downloadBlob = (
  response,
  filename
) => {

  const blob =
    new Blob(
      [response.data],
      {
        type:
          response.headers?.[
            "content-type"
          ] ||
          "application/octet-stream",
      }
    );


  const url =
    window.URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    filename;

  link.style.display =
    "none";


  document.body.appendChild(
    link
  );


  link.click();


  document.body.removeChild(
    link
  );


  setTimeout(() => {

    window.URL.revokeObjectURL(
      url
    );

  }, 100);

};


/* =========================================================
   REPORT FILE NAME
========================================================= */

/**
 * Generates filenames for all supported ranges.
 *
 * Current month:
 *   BudgetBuddy_Report_2026_08.pdf
 *
 * Last 6 months:
 *   BudgetBuddy_Report_Last_6_Months_2026_08.pdf
 *
 * Last 12 months:
 *   BudgetBuddy_Report_Last_12_Months_2026_08.pdf
 *
 * Custom:
 *   BudgetBuddy_Report_2026-08-01_to_2026-08-31.pdf
 */

const buildReportFilename = (
  extension,
  month,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  /* -----------------------------------------
     CUSTOM RANGE
  ----------------------------------------- */

  if (
    range === "custom" &&
    startDate &&
    endDate
  ) {

    return (
      `BudgetBuddy_Report_` +
      `${startDate}_to_${endDate}` +
      `.${extension}`
    );

  }


  /* -----------------------------------------
     LAST 6 MONTHS
  ----------------------------------------- */

  if (
    range === "6_months"
  ) {

    return (
      `BudgetBuddy_Report_Last_6_Months_` +
      `${year}_` +
      `${String(
        month
      ).padStart(2, "0")}` +
      `.${extension}`
    );

  }


  /* -----------------------------------------
     LAST 12 MONTHS
  ----------------------------------------- */

  if (
    range === "12_months"
  ) {

    return (
      `BudgetBuddy_Report_Last_12_Months_` +
      `${year}_` +
      `${String(
        month
      ).padStart(2, "0")}` +
      `.${extension}`
    );

  }


  /* -----------------------------------------
     CURRENT MONTH
  ----------------------------------------- */

  return (
    `BudgetBuddy_Report_` +
    `${year}_` +
    `${String(
      month
    ).padStart(2, "0")}` +
    `.${extension}`
  );

};


/* =========================================================
   PDF REPORT
========================================================= */

/**
 * Download PDF financial report.
 *
 * Supports:
 *
 * downloadMonthlyPDF(8, 2026)
 *
 * OR:
 *
 * downloadMonthlyPDF({
 *   month: 8,
 *   year: 2026,
 *   range: "current_month"
 * })
 *
 * OR:
 *
 * downloadMonthlyPDF({
 *   month: 8,
 *   year: 2026,
 *   range: "6_months"
 * })
 *
 * OR:
 *
 * downloadMonthlyPDF({
 *   month: 8,
 *   year: 2026,
 *   range: "12_months"
 * })
 *
 * OR:
 *
 * downloadMonthlyPDF({
 *   range: "custom",
 *   startDate: "2026-07-01",
 *   endDate: "2026-08-31"
 * })
 */

export const downloadMonthlyPDF = async (
  monthOrOptions,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  try {

    const options =
      normalizeReportArguments(
        monthOrOptions,
        year,
        startDate,
        endDate,
        range
      );


    const params =
      buildReportParams(
        options.month,
        options.year,
        options.startDate,
        options.endDate,
        options.range
      );


    const response =
      await api.get(
        "/reports/export/pdf",
        {
          params,

          responseType:
            "blob",
        }
      );


    const filename =
      buildReportFilename(
        "pdf",
        options.month,
        options.year,
        options.startDate,
        options.endDate,
        options.range
      );


    downloadBlob(
      response,
      filename
    );


  } catch (error) {

    console.error(
      "Failed to download PDF report:",
      error
    );


    throw error;

  }

};


/* =========================================================
   EXCEL REPORT
========================================================= */

/**
 * Download Excel financial report.
 *
 * Supports:
 *
 * Current month
 * Last 6 months
 * Last 12 months
 * Custom date range
 */

export const downloadMonthlyExcel = async (
  monthOrOptions,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  try {

    const options =
      normalizeReportArguments(
        monthOrOptions,
        year,
        startDate,
        endDate,
        range
      );


    const params =
      buildReportParams(
        options.month,
        options.year,
        options.startDate,
        options.endDate,
        options.range
      );


    const response =
      await api.get(
        "/reports/export/excel",
        {
          params,

          responseType:
            "blob",
        }
      );


    const filename =
      buildReportFilename(
        "xlsx",
        options.month,
        options.year,
        options.startDate,
        options.endDate,
        options.range
      );


    downloadBlob(
      response,
      filename
    );


  } catch (error) {

    console.error(
      "Failed to download Excel report:",
      error
    );


    throw error;

  }

};


/* =========================================================
   GENERIC REPORT DOWNLOAD
========================================================= */

/**
 * Generic helper.
 *
 * Supports:
 *
 * downloadReport(
 *   "pdf",
 *   8,
 *   2026
 * )
 *
 * OR:
 *
 * downloadReport(
 *   "pdf",
 *   {
 *     month: 8,
 *     year: 2026,
 *     range: "6_months"
 *   }
 * )
 */

export const downloadReport = async (
  format,
  monthOrOptions,
  year,
  startDate = "",
  endDate = "",
  range = ""
) => {

  const normalizedFormat =
    String(
      format || ""
    )
      .trim()
      .toLowerCase();


  /* -----------------------------------------
     PDF
  ----------------------------------------- */

  if (
    normalizedFormat ===
    "pdf"
  ) {

    return downloadMonthlyPDF(
      monthOrOptions,
      year,
      startDate,
      endDate,
      range
    );

  }


  /* -----------------------------------------
     EXCEL
  ----------------------------------------- */

  if (
    normalizedFormat ===
      "excel" ||
    normalizedFormat ===
      "xlsx"
  ) {

    return downloadMonthlyExcel(
      monthOrOptions,
      year,
      startDate,
      endDate,
      range
    );

  }


  throw new Error(
    `Unsupported report format: ${format}`
  );

};


/* =========================================================
   EXPORTS
========================================================= */

export default {

  getMonthlyReport,

  downloadMonthlyPDF,

  downloadMonthlyExcel,

  downloadReport,

};