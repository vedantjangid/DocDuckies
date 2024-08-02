// data.ts

export interface FinancialData {
    Capital: string | number | null;
    Investments: string | number | null;
    "Net-Profit": string | number | null;
    "Total-Assets": string | number | null;
    "Total-Expenditure": string | number | null;
    "Total-Income": string | number | null;
    "Total-Liabilities": string | number | null;
    Year: string | null;
    "Current-Ratio": number | null;
    "Quick-Ratio": number | null;
    "Net-Profit-Margin": number | null;
    "Return-on-Assets": number | null;
    "Return-on-Equity": number | null;
    "Debt-to-Equity-Ratio": number | null;
    "Debt-to-Assets-Ratio": number | null;
    "Total-Asset-Turnover-Ratio": number | null;
    [key: string]: string | number | null;
  }
  
  export const initialFinancialData: FinancialData = {
    Capital: null,
    Investments: null,
    "Net-Profit": null,
    "Total-Assets": null,
    "Total-Expenditure": null,
    "Total-Income": null,
    "Total-Liabilities": null,
    Year: null,
    "Current-Ratio": null,
    "Quick-Ratio": null,
    "Net-Profit-Margin": null,
    "Return-on-Assets": null,
    "Return-on-Equity": null,
    "Debt-to-Equity-Ratio": null,
    "Debt-to-Assets-Ratio": null,
    "Total-Asset-Turnover-Ratio": null,
  };
  
// data.ts
export const processFinancialData = (data: any): FinancialData => {
  if (!data || typeof data !== 'object') {
    console.error("Invalid data received:", data);
    return initialFinancialData;
  }

  const processedData: FinancialData = {...initialFinancialData};

  Object.keys(initialFinancialData).forEach(key => {
    if (key in data) {
      const value = data[key];
      processedData[key] = value !== null ? value : null;
    }
  });

  return processedData;
};