
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart } from 'recharts';
import { RentSettings, RentYearlyData } from '../types';

interface Props {
  rentSettings: RentSettings;
  setRentSettings: (s: RentSettings) => void;
  rentData: RentYearlyData[];
}

export const RentTab: React.FC<Props> = ({ rentSettings, setRentSettings, rentData }) => {
  const handleChange = (field: keyof RentSettings, value: string) => {
    setRentSettings({ ...rentSettings, [field]: parseFloat(value) || 0 });
  };

  const chartData = rentData.map((d, i) => ({
    ...d,
    name: `Year ${d.year}`,
    cumulative: rentData.slice(0, i + 1).reduce((acc, curr) => acc + curr.annualTotal, 0)
  }));

  const fmt = (n: number) => `$${(n/1000).toFixed(0)}k`;

  return (
    <div className="grid gap-6">
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Rent Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-text-dim uppercase tracking-wide mb-1">Monthly Rent</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">$</span>
              <input 
                type="number" 
                value={rentSettings.monthlyRent} 
                onChange={e => handleChange('monthlyRent', e.target.value)}
                className="w-full bg-surface2 border border-border rounded-md py-2 pl-7 pr-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-xs text-text-dim mt-1">Current monthly rent payment.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-dim uppercase tracking-wide mb-1">Annual Increase</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                value={rentSettings.annualRentIncrease} 
                onChange={e => handleChange('annualRentIncrease', e.target.value)}
                className="w-full bg-surface2 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:border-accent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim">%</span>
            </div>
            <p className="text-xs text-text-dim mt-1">Expected yearly rent hike.</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Rent Forecast</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#8c7e6a', fontSize: 12}} tickLine={false} axisLine={{stroke: '#d4cab8'}} />
              <YAxis yAxisId="left" tick={{fill: '#8c7e6a', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={fmt} label={{ value: 'Annual Cost', angle: -90, position: 'insideLeft', fill: '#8c7e6a', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{fill: '#8c7e6a', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d4cab8', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, '']}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="annualTotal" name="Annual Rent" fill="#c67b3c" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Rent" stroke="#6b8f5e" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
