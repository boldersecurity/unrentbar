import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ArrowRight, CheckCircle, AlertCircle, TrendingDown, DollarSign, Percent, Sparkles, Loader2, ChevronDown, ChevronUp, Info, HelpCircle, X } from 'lucide-react';
import { BuyProfile, RentSettings, GlobalSettings, YearlyData } from '../types';
import { calculateBuyScenario, calculateRentScenario, findOptimizedValue } from '../utils/calculations';

interface Props {
  profiles: BuyProfile[];
  rentSettings: RentSettings;
  globalSettings: GlobalSettings;
}

export const AnalysisTab: React.FC<Props> = ({ profiles, rentSettings, globalSettings }) => {
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id || '');
  const [geminiAdvice, setGeminiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Table State
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: string; rect: DOMRect } | null>(null);

  const selectedProfile = profiles.find(p => p.id === selectedId);
  if (!selectedProfile) return <div className="p-8 text-center text-text-dim">Please create a buy profile first.</div>;

  const rentData = calculateRentScenario(rentSettings, globalSettings.forecastYears);
  const currentCalc = calculateBuyScenario(selectedProfile, globalSettings, rentData);
  const currentBE = currentCalc.breakevenYear;
  const isGood = currentBE !== null && currentBE <= 6;

  // Optimizations
  const optPrice = findOptimizedValue(6, 'price', selectedProfile, globalSettings, rentSettings);
  const optRate = findOptimizedValue(6, 'rate', selectedProfile, globalSettings, rentSettings);
  const optDown = findOptimizedValue(6, 'downpayment', selectedProfile, globalSettings, rentSettings);

  const getGeminiAdvice = async () => {
    setLoading(true);
    setGeminiAdvice(null);
    try {
      if (!process.env.API_KEY) {
         setGeminiAdvice("API Key not found. Please configure the environment.");
         return;
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a real estate financial advisor.
        Analyze this Rent vs Buy scenario:
        
        Rent: $${rentSettings.monthlyRent}/mo, increasing ${rentSettings.annualRentIncrease}%/yr.
        Buy: $${selectedProfile.purchasePrice}, Rate: ${selectedProfile.interestRate}%, Down: ${selectedProfile.downPaymentPct}%.
        
        Current Break-even Year: ${currentBE ?? 'Never within 30 years'}.
        Target Break-even: 6 years (The "Unrent Bar").
        
        Optimization math suggests:
        1. Target Price: ${optPrice ? '$' + Math.round(optPrice).toLocaleString() : 'Not possible'}
        2. Target Rate: ${optRate ? optRate.toFixed(2) + '%' : 'Not possible'}
        
        Provide a concise, strategic 3-bullet point plan to help the buyer achieve this 6-year break-even. 
        Focus on negotiation, market timing, or financing strategies.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setGeminiAdvice(response.text || "No advice generated.");
    } catch (e) {
      setGeminiAdvice("Error generating advice. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Tooltip Logic
  const handleCellEnter = (e: React.MouseEvent, row: number, col: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({ row, col, rect });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const renderTooltip = () => {
    if (!hoveredCell) return null;
    const { row, col, rect } = hoveredCell;
    const rowData = currentCalc.rows.find(r => r.year === row);
    if (!rowData) return null;

    const content = getTooltipContent(col, rowData, selectedProfile, globalSettings);

    // Calculate position (centered above the cell usually, or below if near top)
    const left = rect.left + rect.width / 2;
    const top = rect.top - 10; // 10px spacing
    
    // Adjust if off screen (simple logic)
    const style: React.CSSProperties = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: 'translate(-50%, -100%)',
      zIndex: 1000,
    };

    return (
      <div style={style} className="pointer-events-none">
        <div className="bg-surface text-text border border-border shadow-xl rounded-lg p-4 w-[280px] md:w-[320px] text-sm relative">
           <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-r border-b border-border rotate-45"></div>
           <h4 className="font-bold text-accent mb-1">{content.title}</h4>
           <p className="text-text-dim text-xs mb-3 leading-relaxed">{content.explanation}</p>
           
           <div className="bg-surface2/50 rounded p-2 mb-3">
             <div className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Formula</div>
             <code className="text-xs font-mono text-purple">{content.formula}</code>
           </div>

           <div>
             <div className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Values Plugged In</div>
             <ul className="space-y-1">
               {content.values.map((v, i) => (
                 <li key={i} className="flex justify-between text-xs border-b border-border/30 last:border-0 pb-1 last:pb-0">
                   <span className="text-text-dim">{v.label}</span>
                   <span className="font-mono font-medium">{v.val}</span>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Selector */}
      <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border shadow-sm">
        <label className="font-semibold text-sm text-text-dim uppercase tracking-wide">Analyze Profile:</label>
        <select 
          value={selectedId} 
          onChange={(e) => { setSelectedId(e.target.value); setGeminiAdvice(null); }}
          className="bg-surface2 border border-border rounded-md px-4 py-2 font-medium text-text focus:outline-none focus:border-accent"
        >
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Main Status */}
      <div className={`
        relative overflow-hidden rounded-xl border p-8 text-center transition-all
        ${isGood ? 'bg-green/10 border-green' : 'bg-surface border-border'}
      `}>
        <div className="relative z-10">
          <div className="text-sm font-bold uppercase tracking-widest mb-2 text-text-dim">Break Even Point</div>
          <div className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
             {currentBE ? (
               <>Year {currentBE}</>
             ) : (
               <span className="text-red">30+ Years</span>
             )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`h-2 w-16 rounded-full ${currentBE && currentBE <= 6 ? 'bg-green' : 'bg-border'}`} />
            <div className={`h-2 w-16 rounded-full ${currentBE && currentBE > 6 && currentBE <= 10 ? 'bg-yellow' : 'bg-border'}`} />
            <div className={`h-2 w-16 rounded-full ${!currentBE || currentBE > 10 ? 'bg-red' : 'bg-border'}`} />
          </div>

          {isGood ? (
             <div className="flex items-center justify-center gap-2 text-green font-bold text-lg">
               <CheckCircle size={24} />
               <span>Excellent! You beat the "Unrent Bar" (6 Years).</span>
             </div>
          ) : (
             <div className="flex flex-col items-center gap-2 text-text">
               <div className="flex items-center gap-2 text-red font-bold text-lg">
                 <AlertCircle size={24} />
                 <span>Above the "Unrent Bar" (Target: 6 Years)</span>
               </div>
               <p className="text-text-dim max-w-lg mx-auto mt-2">
                 To justify this purchase over renting purely on financials within a 6-year horizon, 
                 you would need to optimize the deal structure.
               </p>
             </div>
          )}
        </div>
      </div>

      {/* Optimizations */}
      {!isGood && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OptimizationCard 
            icon={<DollarSign className="text-accent" />}
            title="Target Offer Price"
            current={selectedProfile.purchasePrice}
            target={optPrice}
            format={(v: number) => '$' + Math.round(v).toLocaleString()}
            label="Offer Reduction"
            diff={optPrice ? selectedProfile.purchasePrice - optPrice : 0}
          />

          <OptimizationCard 
            icon={<Percent className="text-teal" />}
            title="Target Interest Rate"
            current={selectedProfile.interestRate}
            target={optRate}
            format={(v: number) => v.toFixed(3) + '%'}
            label="Rate Reduction"
            diff={optRate ? selectedProfile.interestRate - optRate : 0}
            diffFormat={(v: number) => v.toFixed(3) + '% pts'}
            inverse
          />

          <OptimizationCard 
            icon={<TrendingDown className="text-purple" />}
            title="Target Down Payment"
            current={selectedProfile.downPaymentPct}
            target={optDown}
            format={(v: number) => v + '%'}
            label="Adjustment"
            diff={optDown ? optDown - selectedProfile.downPaymentPct : 0}
            diffFormat={(v: number) => (v > 0 ? '+' : '') + v + '%'}
            subtext="Note: Higher down payment isn't always better if market returns exceed mortgage rate."
          />
        </div>
      )}

      {/* Gemini AI Advisor */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold flex items-center gap-2">
             <Sparkles className="text-accent" size={20} />
             AI Strategy Advisor
           </h3>
           <button 
             onClick={getGeminiAdvice}
             disabled={loading}
             className="px-4 py-2 bg-text text-bg rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
           >
             {loading ? <Loader2 className="animate-spin" size={16} /> : 'Generate Strategy'}
           </button>
         </div>
         
         <div className="min-h-[100px] bg-bg/50 rounded-lg p-6 border border-border/50 text-text/90 leading-relaxed">
            {geminiAdvice ? (
              <div className="markdown prose prose-sm max-w-none">
                {geminiAdvice.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
              </div>
            ) : (
              <p className="text-text-dim italic text-center py-4">
                Click "Generate Strategy" to get AI-powered negotiation and financing advice based on your numbers.
              </p>
            )}
         </div>
      </div>

      {/* Yearly Data Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden transition-all">
        <button 
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-surface2/30 hover:bg-surface2/50 transition-colors"
        >
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-bold text-text">Yearly Breakdown</h3>
             <span className="text-xs text-text-dim bg-surface2 px-2 py-1 rounded-full border border-border/50">
               {isTableExpanded ? 'Hide Details' : 'Show Details'}
             </span>
          </div>
          {isTableExpanded ? <ChevronUp className="text-text-dim" /> : <ChevronDown className="text-text-dim" />}
        </button>

        {isTableExpanded && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-surface2 text-text-dim text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <Th label="Year" sub="Timeline" />
                  <Th label="Home Value" sub="Market Price" />
                  <Th label="Mortgage Bal" sub="Debt Remaining" />
                  <Th label="Net House Equity" sub="Proceeds if Sold" />
                  <Th label="Renter Portfolio" sub="Investments" />
                  <Th label="Net Renter Wealth" sub="After Taxes" />
                  <Th label="Wealth Delta" sub="Buy Advantage" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50" onMouseLeave={handleCellLeave}>
                {currentCalc.rows.map((row) => (
                  <tr key={row.year} className={`hover:bg-surface2/50 transition-colors ${row.wealthDelta >= 0 ? 'bg-green/5' : ''}`}>
                    <td className="px-4 py-3 font-medium sticky left-0 bg-inherit shadow-[1px_0_0_0_#d4cab8]">{row.year}</td>
                    
                    <Td val={row.homeValue} row={row.year} col="homeValue" onEnter={handleCellEnter} />
                    <Td val={row.mortBalance} row={row.year} col="mortBalance" onEnter={handleCellEnter} isDim />
                    <Td val={row.netHouseWealth} row={row.year} col="netHouseWealth" onEnter={handleCellEnter} isBold />
                    
                    <Td val={row.renterPortfolio} row={row.year} col="renterPortfolio" onEnter={handleCellEnter} isDim />
                    <Td val={row.netRenterWealth} row={row.year} col="netRenterWealth" onEnter={handleCellEnter} isBold />
                    
                    <td 
                      className={`px-4 py-3 text-right font-bold cursor-help border-b-2 border-transparent hover:border-text/10 ${row.wealthDelta >= 0 ? 'text-green' : 'text-red'}`}
                      onMouseEnter={(e) => handleCellEnter(e, row.year, 'wealthDelta')}
                      onClick={(e) => handleCellEnter(e, row.year, 'wealthDelta')}
                    >
                      {row.wealthDelta > 0 ? '+' : ''}${Math.round(row.wealthDelta).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderTooltip()}
          </div>
        )}
      </div>

    </div>
  );
};

const Th = ({ label, sub }: { label: string, sub: string }) => (
  <th className="px-4 py-3 text-right first:text-left group relative">
    <div className="flex flex-col">
       <span>{label}</span>
       <span className="text-[10px] text-text-dim/80 font-normal normal-case tracking-normal">{sub}</span>
    </div>
  </th>
);

const Td = ({ val, row, col, onEnter, isBold, isDim }: any) => (
  <td 
    className={`px-4 py-3 text-right cursor-help border-b-2 border-transparent hover:border-text/10 ${isBold ? 'font-medium' : ''} ${isDim ? 'text-text-dim' : ''}`}
    onMouseEnter={(e) => onEnter(e, row, col)}
    onClick={(e) => onEnter(e, row, col)}
  >
    ${Math.round(val).toLocaleString()}
  </td>
);

const OptimizationCard = ({ icon, title, current, target, format, label, diff, diffFormat, inverse, subtext }: any) => {
  const isImpossible = target === null;
  const formatter = diffFormat || format;
  
  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-bg rounded-md">{icon}</div>
        <div className="font-semibold text-sm">{title}</div>
      </div>
      
      {isImpossible ? (
         <div className="text-text-dim text-sm italic">
           Even at 0, this variable alone cannot achieve the 6-year target.
         </div>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-2xl font-bold text-text">{format(target)}</span>
            <span className="text-xs text-text-dim mb-1">Target</span>
          </div>
          <div className="text-xs text-text-dim mb-4">
            vs Current: {format(current)}
          </div>
          
          <div className="pt-3 border-t border-border/50 flex justify-between items-center text-sm">
            <span className="text-text-dim">{label}</span>
            <span className={`font-bold ${inverse ? 'text-green' : 'text-accent'}`}>
               {formatter(diff)}
            </span>
          </div>
          {subtext && <div className="mt-2 text-[10px] text-text-dim leading-tight">{subtext}</div>}
        </>
      )}
    </div>
  );
};

// Helper to generate tooltip content
function getTooltipContent(col: string, row: YearlyData, p: BuyProfile, g: GlobalSettings) {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  
  // Re-calculate intermediate values for tooltip transparency
  const sellingCostPct = (p.sellerCommissionPct + p.transferTaxPct) / 100;
  const grossSale = row.homeValue;
  const sellingCosts = grossSale * sellingCostPct;
  const netProceeds = grossSale - sellingCosts;
  
  // Approximate buy costs from previous context (not stored in row, so we estimate logic)
  // For precise Cap Gains, we'd need purchase price + closing costs. 
  // We can approximate gain ~ NetProceeds - Mortgage - InitialEquity? No.
  // We'll just show the formula components we have.
  
  switch (col) {
    case 'homeValue':
      return {
        title: 'Projected Home Value',
        explanation: `The estimated market price of the home in Year ${row.year}, based on your appreciation setting.`,
        formula: `Purchase Price × (1 + Appreciation)^Year`,
        values: [
          { label: 'Purchase Price', val: fmt(p.purchasePrice) },
          { label: 'Appreciation Rate', val: `${p.homeAppreciation}%` },
          { label: 'Growth Factor', val: `^${row.year}` }
        ]
      };
    case 'mortBalance':
      return {
        title: 'Mortgage Balance',
        explanation: 'The remaining principal amount on your loan after making payments for this many years.',
        formula: `Loan Amount - Principal Paid`,
        values: [
          { label: 'Interest Rate', val: `${p.interestRate}%` },
          { label: 'Original Loan', val: fmt(p.purchasePrice * (1 - p.downPaymentPct/100)) },
          { label: 'Term', val: `${p.mortgageTerm} yrs` }
        ]
      };
    case 'netHouseWealth':
      return {
        title: 'Net House Equity',
        explanation: 'Cash in pocket if you sold the home today, after paying agent fees, taxes, and the bank.',
        formula: `(Value - Selling Costs) - Loan - Taxes`,
        values: [
          { label: 'Home Value', val: fmt(row.homeValue) },
          { label: `Selling Costs (${(sellingCostPct*100).toFixed(1)}%)`, val: fmt(sellingCosts) },
          { label: 'Mortgage Balance', val: fmt(row.mortBalance) },
          { label: 'Est. Cap Gains Tax', val: fmt(row.netHouseWealth - (netProceeds - row.mortBalance)) /* Approximate diff usually just tax */ }
        ]
      };
    case 'renterPortfolio':
      return {
        title: 'Renter Portfolio Value',
        explanation: 'The total value of your investment portfolio if you had rented instead. Includes the down payment + closing costs you saved, plus monthly savings.',
        formula: `Prev Balance × (1 + Return) + Monthly Savings`,
        values: [
          { label: 'Invest Return', val: `${g.investReturn}%` },
          { label: 'Cum. Invested Principal', val: fmt(row.cumInvested) },
          { label: 'Investment Gains', val: fmt(row.renterPortfolio - row.cumInvested) }
        ]
      };
    case 'netRenterWealth':
      return {
        title: 'Net Renter Wealth',
        explanation: 'Your portfolio value after paying Capital Gains tax on the profits upon withdrawal.',
        formula: `Portfolio Value - (Gains × Tax Rate)`,
        values: [
          { label: 'Portfolio Value', val: fmt(row.renterPortfolio) },
          { label: 'Total Gains', val: fmt(row.renterPortfolio - row.cumInvested) },
          { label: `Cap Gains Tax (${g.capGainsRate}%)`, val: fmt(row.renterExitTax) }
        ]
      };
    case 'wealthDelta':
      return {
        title: 'Wealth Delta',
        explanation: 'The difference in your total net worth between the two scenarios. Positive means Buying is better.',
        formula: `Net House Equity - Net Renter Wealth`,
        values: [
          { label: 'Net House Equity', val: fmt(row.netHouseWealth) },
          { label: 'Net Renter Wealth', val: fmt(row.netRenterWealth) },
          { label: 'Difference', val: fmt(row.wealthDelta) }
        ]
      };
    default:
      return { title: '', explanation: '', formula: '', values: [] };
  }
}
