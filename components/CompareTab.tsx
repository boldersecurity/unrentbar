
import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { GlobalSettings, BuyProfile, CalculationResult } from '../types.ts';

interface Props {
  globalSettings: GlobalSettings;
  setGlobalSettings: (s: GlobalSettings) => void;
  profiles: BuyProfile[];
  calculations: { profileId: string; result: CalculationResult }[];
}

export const CompareTab: React.FC<Props> = ({ globalSettings, setGlobalSettings, profiles, calculations }) => {
  const [view, setView] = useState<'delta' | 'wealth' | 'monthly'>('delta');
  const [visibleProfileIds, setVisibleProfileIds] = useState<string[]>(profiles.map(p => p.id));

  // Sync visible IDs if profiles change (add new ones automatically)
  React.useEffect(() => {
     setVisibleProfileIds(prev => {
         const currentIds = profiles.map(p => p.id);
         const existing = prev.filter(id => currentIds.includes(id));
         const newIds = currentIds.filter(id => !prev.includes(id));
         
         // If we have some selected, just keep those. If we adding a new profile, decide if we want to auto-select it.
         // Let's auto-select new profiles if list was empty or just append.
         return existing.length > 0 ? [...existing, ...newIds] : currentIds;
     });
  }, [profiles.length]);

  const toggleProfile = (id: string) => {
    if (visibleProfileIds.includes(id)) {
      if (visibleProfileIds.length > 1) {
         setVisibleProfileIds(visibleProfileIds.filter(pid => pid !== id));
      }
    } else {
      setVisibleProfileIds([...visibleProfileIds, id]);
    }
  };

  const updateGlobal = (field: keyof GlobalSettings, val: string) => {
    setGlobalSettings({ ...globalSettings, [field]: parseFloat(val) || 0 });
  };

  const years = globalSettings.forecastYears;
  
  // Transform data for charts
  const chartData = Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const item: any = { name: `Year ${year}` };
    calculations.forEach(c => {
      if (!visibleProfileIds.includes(c.profileId)) return;
      
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
      <div className="relative flex items-center bg-surface2 border border-border rounded-md overflow-hidden h-[34px]">
        <input 
          type="number" 
          value={globalSettings[field as keyof GlobalSettings]} 
          onChange={e => updateGlobal(field as keyof GlobalSettings, e.target.value)}
          className="flex-1 bg-transparent py-1 px-3 text-sm focus:outline-none w-full"
        />
        {unit && <span className="pr-3 pl-1 text-xs text-text-dim select-none">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Global Assumptions */}
         <div className="bg-surface border border-border rounded-lg p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-dim mb-4">Market Assumptions</h2>
            <div className="flex flex-wrap gap-4">
              <Input label="Forecast Years" field="forecastYears" unit="yrs" />
              <Input label="Fed Tax Rate" field="federalTaxRate" unit="%" />
              <Input label="Invest Return" field="investReturn" unit="%" />
              <Input label="Cap Gains Rate" field="capGainsRate" unit="%" />
            </div>
         </div>

         {/* Scenario Selection */}
         <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-dim mb-4">Visible Scenarios</h2>
            <div className="flex flex-wrap gap-2">
               {profiles.map(p => (
                   <button
                       key={p.id}
                       onClick={() => toggleProfile(p.id)}
                       className={`
                           flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                           ${visibleProfileIds.includes(p.id) ? 'bg-surface2 border-text/20 text-text shadow-sm' : 'bg-transparent border-transparent text-text-dim hover:bg-surface2'}
                       `}
                   >
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: visibleProfileIds.includes(p.id) ? p.color : '#ccc' }} />
                       {p.name}
                   </button>
               ))}
            </div>
         </div>
      </div>

      {/* Break Even Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {calculations.filter(c => visibleProfileIds.includes(c.profileId)).map(c => {
           const p = profiles.find(prof => prof.id === c.profileId);
           if (!p) return null;
           const be = c.result.preciseBreakeven;
           
           return (
             <div key={c.profileId} className="bg-surface border border-border rounded-lg p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: p.color }}></div>
                <div>
                   <div className="text-xs text-text-dim font-semibold">{p.name}</div>
                   <div className="text-xl font-bold mt-1">
                     {be ? `Year ${be.toFixed(1)}` : <span className="text-red-500 text-sm">30+ Years</span>}
                   </div>
                </div>
                <div className="text-xs text-text-dim text-right">
                   Break Even
                </div>
             </div>
           );
        })}
      </div>

      {/* Charts */}
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
                if (!visibleProfileIds.includes(p.id)) return null;
                
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
                   return <Line key={`${p.id}_buy`} type="monotone" dataKey={`${p.id}_buy`} name={`${p.name} Monthly`} stroke={p.color} strokeWidth={2} dot={false} />;
                }
                return null;
              })}
              {view === 'monthly' && (
                 <Line type="monotone" dataKey="rent" name="Rent Cost" stroke="#666" strokeDasharray="3 3" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
