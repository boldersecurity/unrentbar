
import { GlobalSettings, RentSettings, BuyProfile } from './types.ts';

export const COLORS = ['#c67b3c','#c0513f','#6b8f5e','#c9a84c','#5b8a7a','#7a6e5d','#d4883e','#8b5e3c'];

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  forecastYears: 30,
  federalTaxRate: 37,
  investReturn: 4,
  capGainsRate: 38.6,
};

export const DEFAULT_RENT_SETTINGS: RentSettings = {
  monthlyRent: 7050,
  annualRentIncrease: 5,
};

export const DEFAULT_PROFILE: BuyProfile = {
  id: 'temp',
  name: 'New Profile',
  purchasePrice: 1850000,
  downPaymentPct: 20,
  interestRate: 6.3,
  mortgageTerm: 30,
  homeAppreciation: 2,
  hoaInsuranceMonthly: 919,
  annualPropertyTax: 2093, // Monthly equivalent * 12
  propTaxGrowth: 2,
  
  mansionTaxPct: 1,
  mortgageRecordingTaxPct: 1.925,
  titleInsurancePct: 0.6,
  realEstateAttorneyFee: 5000,
  bankAttorneyFee: 1000,
  lenderFee: 1500,
  recordingFee: 750,
  
  sellerCommissionPct: 5,
  transferTaxPct: 1.825,
  capitalGainsExclusion: 500000,
  maintenancePct: 0,
  
  color: COLORS[0],
};
