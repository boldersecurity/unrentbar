
import { RentSettings, GlobalSettings, BuyProfile, CalculationResult, RentYearlyData, YearlyData } from '../types';

export function calculateRentScenario(settings: RentSettings, years: number): RentYearlyData[] {
  const data: RentYearlyData[] = [];
  const growth = settings.annualRentIncrease / 100;
  
  for (let y = 1; y <= years; y++) {
    const rentThisYear = settings.monthlyRent * Math.pow(1 + growth, y - 1);
    const annualRent = rentThisYear * 12;
    data.push({ 
      year: y, 
      monthlyRent: rentThisYear, 
      annualRent, 
      annualTotal: annualRent 
    });
  }
  return data;
}

export function getBuyingClosingCosts(p: BuyProfile) {
  const price = p.purchasePrice;
  const costs = {
    mansionTax: price * p.mansionTaxPct / 100,
    mortgageRecordingTax: price * p.mortgageRecordingTaxPct / 100,
    titleInsurance: price * p.titleInsurancePct / 100,
    realEstateAttorneyFee: p.realEstateAttorneyFee,
    bankAttorneyFee: p.bankAttorneyFee,
    lenderFee: p.lenderFee,
    recordingFee: p.recordingFee,
  };
  const total = Object.values(costs).reduce((a, b) => a + b, 0);
  return { ...costs, total };
}

export function calculateBuyScenario(
  p: BuyProfile, 
  global: GlobalSettings, 
  rentData: RentYearlyData[]
): CalculationResult {
  const years = global.forecastYears;
  const fedTaxRate = global.federalTaxRate / 100;
  const investGrowth = global.investReturn / 100;
  const capGainsRate = global.capGainsRate / 100;

  const price = p.purchasePrice;
  const downPmt = price * p.downPaymentPct / 100;
  const closingCosts = getBuyingClosingCosts(p).total;
  const sellingCostPct = (p.sellerCommissionPct + p.transferTaxPct) / 100;
  const loanAmount = price - downPmt;
  const monthlyRate = p.interestRate / 100 / 12;
  const totalPayments = p.mortgageTerm * 12;
  
  const monthlyPI = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : loanAmount / totalPayments;

  const deductionCap = Math.min(1, 750000 / loanAmount);
  
  const rows: YearlyData[] = [];
  let renterPortfolio = 0;
  let cumInvested = 0;

  for (let y = 1; y <= years; y++) {
    const homeValue = price * Math.pow(1 + p.homeAppreciation / 100, y);
    
    // Mortgage Balance
    const remainingPayments = Math.max(0, totalPayments - y * 12);
    let mortBalance = 0;
    if (remainingPayments > 0 && monthlyRate > 0) {
      mortBalance = monthlyPI * (1 - Math.pow(1 + monthlyRate, -remainingPayments)) / monthlyRate;
    } else if (remainingPayments > 0) {
      mortBalance = loanAmount - (monthlyPI * y * 12);
    }

    // Interest Paid
    let interestPaid = 0;
    const startMonth = (y - 1) * 12 + 1;
    const endMonth = y * 12;
    
    // Simple iterative interest calculation for the year
    if (startMonth <= totalPayments) {
      let tempBal = loanAmount;
      // If we are past year 1, calculate balance at start of year
      if (y > 1) {
         const prevRem = Math.max(0, totalPayments - (y - 1) * 12);
         if (prevRem > 0 && monthlyRate > 0) {
             tempBal = monthlyPI * (1 - Math.pow(1 + monthlyRate, -prevRem)) / monthlyRate;
         } else if (monthlyRate === 0) {
             tempBal = loanAmount - (monthlyPI * (y - 1) * 12);
         } else {
             tempBal = 0;
         }
      }

      for (let m = 0; m < 12; m++) {
          if (tempBal <= 0) break;
          const intPmt = tempBal * monthlyRate;
          const prinPmt = monthlyPI - intPmt;
          interestPaid += intPmt;
          tempBal -= prinPmt;
      }
    }

    const taxShield = interestPaid * deductionCap * fedTaxRate;
    
    const piThisYear = Math.min(12, Math.max(0, totalPayments - (y - 1) * 12));
    const actualPI = monthlyPI * piThisYear;
    
    const propTax = p.annualPropertyTax * Math.pow(1 + p.propTaxGrowth / 100, y - 1);
    const hoaIns = p.hoaInsuranceMonthly * 12;
    const maintenance = (price * Math.pow(1 + p.homeAppreciation / 100, y - 1)) * (p.maintenancePct / 100);
    const buyOutlay = actualPI + propTax + hoaIns + maintenance - taxShield;

    const annualRent = rentData[y - 1] ? rentData[y - 1].annualTotal : 0;

    // Net House Wealth
    const netSaleProceeds = homeValue * (1 - sellingCostPct);
    const homeGain = netSaleProceeds - (price + closingCosts) - p.capitalGainsExclusion;
    const homeCapGainsTax = Math.max(0, homeGain * capGainsRate);
    const netHouseWealth = netSaleProceeds - mortBalance - homeCapGainsTax;

    // Renter Portfolio
    const cashFlowDelta = buyOutlay - annualRent;
    if (y === 1) {
      renterPortfolio = (downPmt + closingCosts) * (1 + investGrowth) + cashFlowDelta;
      cumInvested = (downPmt + closingCosts) + cashFlowDelta;
    } else {
      renterPortfolio = renterPortfolio * (1 + investGrowth) + cashFlowDelta;
      cumInvested = cumInvested + cashFlowDelta;
    }

    const renterGain = renterPortfolio - cumInvested;
    const renterExitTax = Math.max(0, renterGain * capGainsRate);
    const netRenterWealth = renterPortfolio - renterExitTax;
    const wealthDelta = netHouseWealth - netRenterWealth;

    rows.push({
      year: y,
      homeValue,
      mortBalance,
      interestPaid,
      taxShield,
      buyOutlay,
      annualRent,
      netHouseWealth,
      renterPortfolio,
      cumInvested,
      renterExitTax,
      netRenterWealth,
      wealthDelta,
      cashFlowDelta
    });
  }

  let breakevenYear = null;
  let preciseBreakeven = null;
  const initialDelta = -(downPmt + closingCosts);

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].wealthDelta >= 0) {
      breakevenYear = rows[i].year;
      
      const prevDelta = i === 0 ? initialDelta : rows[i-1].wealthDelta;
      const currDelta = rows[i].wealthDelta;
      
      // Interpolate for year index
      // wealthDelta goes from negative (prevDelta) to positive (currDelta)
      // We want to find t where delta is 0
      // 0 = prevDelta + (t) * (currDelta - prevDelta)
      // -prevDelta = t * (currDelta - prevDelta)
      // t = -prevDelta / (currDelta - prevDelta)
      // Year = (Year i-1) + t
      // Since i is 0-based index in rows array, rows[0] is Year 1.
      // If i=0, prev year is Year 0.
      
      const fraction = Math.abs(prevDelta) / (currDelta - prevDelta);
      preciseBreakeven = (i) + fraction; // i is the index, which equals (Year - 1). Year 0 is just 0.
      
      break;
    }
  }

  return { rows, downPmt, closingCosts, loanAmount, monthlyPI, breakevenYear, preciseBreakeven };
}

export function findOptimizedValue(
  targetYear: number,
  variable: 'price' | 'rate' | 'downpayment',
  profile: BuyProfile,
  global: GlobalSettings,
  rentSettings: RentSettings
): number | null {
  const rentData = calculateRentScenario(rentSettings, global.forecastYears);
  
  // Binary search or iterative solver
  let min = 0;
  let max = variable === 'price' ? profile.purchasePrice * 2 
          : variable === 'rate' ? 15 
          : 100; // 100% downpayment
  
  if (variable === 'price') max = profile.purchasePrice; // We usually want to lower price
  if (variable === 'rate') max = profile.interestRate; // We want to lower rate
  
  // Optimization function: returns breakeven year for a given value
  const check = (val: number) => {
      const testP = { ...profile };
      if (variable === 'price') testP.purchasePrice = val;
      if (variable === 'rate') testP.interestRate = val;
      if (variable === 'downpayment') testP.downPaymentPct = val;
      const res = calculateBuyScenario(testP, global, rentData);
      return res.breakevenYear !== null ? res.breakevenYear : 999;
  }

  if (variable === 'downpayment') {
      // Simple scan for downpayment
      for(let dp = 0; dp <= 100; dp += 5) {
          if (check(dp) <= targetYear) return dp;
      }
      return null;
  }
  
  // Bisection for Price and Rate (Lower is better)
  let low = 0;
  let high = variable === 'price' ? profile.purchasePrice : profile.interestRate;
  
  if (check(high) <= targetYear) return high;

  let iterations = 0;
  let bestVal: number | null = null;

  while (iterations < 20) {
      const mid = (low + high) / 2;
      if (check(mid) <= targetYear) {
          bestVal = mid;
          low = mid; // Try to go higher (closer to original) to see if we can still pass
      } else {
          high = mid; // Need to go lower
      }
      iterations++;
  }
  
  return bestVal;
}
