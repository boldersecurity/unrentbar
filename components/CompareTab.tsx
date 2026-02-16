import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { GlobalSettings, BuyProfile, CalculationResult } from '../types';

interface Props {
  globalSettings: GlobalSettings;
  setGlobalSettings: (s: GlobalSettings) => void;
  profiles: BuyProfile[];
  calculations: { profileId: string; result: CalculationResult }[];
}

export const CompareTab: React.FC<Props> = ({ globalSettings, setGlobalSettings, profiles, calculations }) => {
  const [view, setView] = useState<'delta' | 'wealth' | 'monthly'>('delta');

  const updateGlobal = (field: keyof GlobalSettings, val: string) => {
    setGlobalSettings({ ...globalSettings, [field]: parseFloat(val) || 0 });
  };

  const years = globalSettings.forecastYears;
  
  // Transform data for charts
  const chartData = Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const item: any = { name: `Year ${year}` };
    calculations.forEach(c => {
      const row = c.result.rows[i];
      const p = profiles.find(p => p.id === c.profileId);
      if (row && p) {
        if (view === 'delta') item[p.id] = row.wealthDelta;
        if (view === 'wealth') {
          item[`${p.id}_house`] = row.netHouseWealth;
          item[`${p.id}_rent`] = row.netRenterWealth;
        }
        if (view === 'monthly') {
           item[`${p.id}_buy`] = row.buyOutlay / 12;
           item[`rent`] = row.annualRent / 12; // Rent is same for all
        }
      }
    });
    return item;
  });

  const Input = ({ label, field, unit }: any) => (
    <div className="flex-1 min-w-[140px]">
      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wide mb-1">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          value={globalSettings[field as keyof GlobalSettings]} 
          onChange={e => updateGlobal(field as keyof GlobalSettings, e.target.value)}
          className="w-full bg-surface2 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:border-accent"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
         <h2 className="text-lg font-semibold mb-4">Comparison Assumptions</h2>
         <div className="flex flex-wrap gap-4">
           <Input label="Forecast Years" field="forecastYears" unit="yrs" />
           <Input label="Fed Tax Rate" field="federalTaxRate" unit="%" />
           <Input label="Investment Return" field="investReturn" unit="%" />
           <Input label="Cap Gains Rate" field="capGainsRate" unit="%" />
         </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold">Wealth Analysis</h2>
          <div className="bg-surface2 p-1 rounded-lg flex gap-1">
            <button onClick={() => setView('delta')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'delta' ? 'bg-white shadow text-accent' : 'text-text-dim hover:text-text'}`}>Wealth Delta</button>
            <button onClick={() => setView('wealth')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'wealth' ? 'bg-white shadow text-accent' : 'text-text-dim hover:text-text'}`}>Net Wealth</button>
            <button onClick={() => setView('monthly')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'monthly' ? 'bg-white shadow text-accent' : 'text-text-dim hover:text-text'}`}>Monthly Cost</button>
          </div>
        </div>

        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#8c7e6a', fontSize: 12}} tickLine={false} axisLine={{stroke: '#d4cab8'}} />
              <YAxis tick={{fill: '#8c7e6a', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={val => `$${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d4cab8' }}
                formatter={(val: number) => [`$${Math.round(val).toLocaleString()}`, '']}
              />
              <Legend />
              {view === 'delta' && <ReferenceLine y={0} stroke="#8c7e6a" strokeDasharray="3 3" />}
              
              {profiles.map((p, i) => {
                if (view === 'delta') {
                  return <Line key={p.id} type="monotone" dataKey={p.id} name={`${p.name} (Buy - Rent)`} stroke={p.color} strokeWidth={2.5} dot={false} />;
                }
                if (view === 'wealth') {
                  return [
                    <Line key={`${p.id}_h`} type="monotone" dataKey={`${p.id}_house`} name={`${p.name} House`} stroke={p.color} strokeWidth={2} dot={false} />,
                    <Line key={`${p.id}_r`} type="monotone" dataKey={`${p.id}_rent`} name={`${p.name} Rent`} stroke={p.color} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  ];
                }
                if (view === 'monthly') {
                   return <Line key={`${p.id}_m`} type="monotone" dataKey={`${p.id}_buy`} name={`${p.name} Cost`} stroke={p.color} strokeWidth={2} dot={false} />;
                }
                return null;
              })}
              {view === 'monthly' && <Line type="monotone" dataKey="rent" name="Rent Cost" stroke="#c0513f" strokeWidth={2} strokeDasharray="3 3" dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {profiles.map(p => {
            const calc = calculations.find(c => c.profileId === p.id)?.result;
            if (!calc) return null;
            const final = calc.rows[calc.rows.length - 1];
            const be = calc.breakevenYear;
            
            return (
                <div key={p.id} className="bg-surface border-l-4 rounded-md p-4 shadow-sm" style={{ borderLeftColor: p.color }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: p.color }}>{p.name}</div>
                    <div className={`text-xl font-bold ${final.wealthDelta >= 0 ? 'text-green' : 'text-red'}`}>
                        {final.wealthDelta >= 0 ? '+' : ''}${Math.round(final.wealthDelta / 1000).toLocaleString()}k
                    </div>
                    <div className="text-xs text-text-dim mt-1">Delta at Year {globalSettings.forecastYears}</div>
                    <div className="mt-3 pt-3 border-t border-border/40">
                        {be ? (
                            <span className="inline-block px-2 py-1 rounded bg-green/10 text-green text-xs font-bold">
                                BE: Year {be}
                            </span>
                        ) : (
                            <span className="inline-block px-2 py-1 rounded bg-red/10 text-red text-xs font-bold">
                                Never BE
                            </span>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
