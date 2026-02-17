
export type TabType = 'rent' | 'buy' | 'compare' | 'analysis';

export interface GlobalSettings {
  forecastYears: number;
  federalTaxRate: number;
  investReturn: number;
  capGainsRate: number;
}

export interface RentSettings {
  monthlyRent: number;
  annualRentIncrease: number;
}

export interface BuyProfile {
  id: string;
  name: string;
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  mortgageTerm: number;
  homeAppreciation: number;
  hoaInsuranceMonthly: number;
  annualPropertyTax: number;
  propTaxGrowth: number;
  
  // Closing Costs
  mansionTaxPct: number;
  mortgageRecordingTaxPct: number;
  titleInsurancePct: number;
  realEstateAttorneyFee: number;
  bankAttorneyFee: number;
  lenderFee: number;
  recordingFee: number;
  
  // Selling Costs
  sellerCommissionPct: number;
  transferTaxPct: number;
  capitalGainsExclusion: number;
  maintenancePct: number;
  
  color: string;
}

export interface YearlyData {
  year: number;
  homeValue: number;
  mortBalance: number;
  interestPaid: number;
  taxShield: number;
  buyOutlay: number;
  annualRent: number;
  netHouseWealth: number;
  renterPortfolio: number;
  cumInvested: number;
  renterExitTax: number;
  netRenterWealth: number;
  wealthDelta: number;
  cashFlowDelta: number;
}

export interface RentYearlyData {
  year: number;
  monthlyRent: number;
  annualRent: number;
  annualTotal: number;
}

export interface CalculationResult {
  rows: YearlyData[];
  downPmt: number;
  closingCosts: number;
  loanAmount: number;
  monthlyPI: number;
  breakevenYear: number | null;
  preciseBreakeven: number | null;
}
