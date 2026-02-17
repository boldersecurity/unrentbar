
import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { BuyProfile } from '../types';
import { COLORS, DEFAULT_PROFILE } from '../constants';

interface Props {
  profiles: BuyProfile[];
  setProfiles: (p: BuyProfile[]) => void;
}

// Defined outside to prevent re-render/focus loss
const InputGroup = React.memo(({ label, desc, field, unit, step = 1, type = "number", val, onChange }: any) => {
  return (
    <div className="flex flex-col min-w-[110px] flex-1">
      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1 truncate" title={label}>{label}</label>
      <div className="flex items-center bg-surface2 border border-border rounded-md overflow-hidden h-[34px]">
        {unit && ['$', '£'].includes(unit) && (
           <span className="px-2 text-text-dim text-xs select-none bg-surface2/50 border-r border-border/50 h-full flex items-center justify-center min-w-[30px]">{unit}</span>
        )}
        <input
          type={type}
          step={step}
          value={val}
          onChange={(e) => {
              const v = e.target.value;
              const num = parseFloat(v);
              onChange(field, isNaN(num) ? v : num);
          }}
          className="flex-1 bg-transparent py-1 px-2 text-sm focus:outline-none min-w-0 h-full w-full"
        />
        {unit && !['$', '£'].includes(unit) && (
          <span className="px-2 text-xs text-text-dim select-none pointer-events-none whitespace-nowrap bg-surface2/50 border-l border-border/50 h-full flex items-center justify-center">{unit}</span>
        )}
      </div>
      {desc && <p className="text-[10px] text-text-dim mt-1 leading-tight">{desc}</p>}
    </div>
  );
});

export const BuyTab: React.FC<Props> = ({ profiles, setProfiles }) => {
  const addProfile = () => {
    const newId = `buy_${Date.now()}`;
    const color = COLORS[profiles.length % COLORS.length];
    setProfiles([...profiles, { ...DEFAULT_PROFILE, id: newId, name: `Home ${profiles.length + 1}`, color }]);
  };

  const removeProfile = (id: string) => {
    if (profiles.length <= 1) return;
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const copyProfile = (profile: BuyProfile) => {
    const newId = `buy_${Date.now()}`;
    const color = COLORS[profiles.length % COLORS.length];
    setProfiles([...profiles, { ...profile, id: newId, name: `${profile.name} (Copy)`, color }]);
  };

  const updateProfile = (id: string, field: keyof BuyProfile, value: string | number) => {
    setProfiles(profiles.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Home Purchase Profiles</h2>
        <button 
          onClick={addProfile}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus size={16} /> Add Profile
        </button>
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <ProfileCard 
            key={profile.id} 
            profile={profile} 
            onUpdate={updateProfile}
            onRemove={() => removeProfile(profile.id)}
            onCopy={() => copyProfile(profile)}
            canRemove={profiles.length > 1}
          />
        ))}
      </div>
    </div>
  );
};

const ProfileCard: React.FC<{
  profile: BuyProfile;
  onUpdate: (id: string, field: keyof BuyProfile, val: any) => void;
  onRemove: () => void;
  onCopy: () => void;
  canRemove: boolean;
}> = ({ profile, onUpdate, onRemove, onCopy, canRemove }) => {
  const [expanded, setExpanded] = React.useState(true);
  
  const handleChange = (field: keyof BuyProfile, val: any) => {
    onUpdate(profile.id, field, val);
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-surface2/30 border-b border-border/50" style={{ borderLeft: `4px solid ${profile.color}` }}>
        <div className="flex items-center gap-4 flex-1">
          <input 
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="bg-transparent font-bold text-base text-text focus:outline-none border-b border-transparent focus:border-accent px-1"
          />
          <span className="text-xs font-mono bg-surface2 px-2 py-1 rounded text-text-dim hidden sm:inline-block">
            ${profile.purchasePrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCopy} className="p-1.5 hover:bg-surface2 rounded text-text-dim" title="Copy Profile">
            <Copy size={18} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-surface2 rounded text-text-dim">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {canRemove && (
            <button onClick={onRemove} className="p-1.5 hover:bg-red/10 text-text-dim hover:text-red rounded">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-accent uppercase tracking-widest border-b border-accent/20 pb-1">Purchase Details</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-full">
                <InputGroup label="Purchase Price" desc="Agreed price." field="purchasePrice" unit="$" step={1000} val={profile.purchasePrice} onChange={handleChange} />
              </div>
              <InputGroup label="Down Payment" desc="Cash upfront." field="downPaymentPct" unit="%" step={1} val={profile.downPaymentPct} onChange={handleChange} />
              <InputGroup label="Term" desc="Duration." field="mortgageTerm" unit="yrs" val={profile.mortgageTerm} onChange={handleChange} />
              <div className="w-full">
                <InputGroup label="Interest Rate" desc="Annual rate." field="interestRate" unit="%" step={0.125} val={profile.interestRate} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-yellow uppercase tracking-widest border-b border-yellow/20 pb-1">Closing Costs</h3>
            <div className="flex flex-wrap gap-2">
              <InputGroup label="Mansion Tax" desc="Luxury tax." field="mansionTaxPct" unit="%" step={0.1} val={profile.mansionTaxPct} onChange={handleChange} />
              <InputGroup label="Recording Tax" desc="Mortgage tax." field="mortgageRecordingTaxPct" unit="%" step={0.1} val={profile.mortgageRecordingTaxPct} onChange={handleChange} />
              <InputGroup label="Title Insurance" desc="Title policy." field="titleInsurancePct" unit="%" step={0.1} val={profile.titleInsurancePct} onChange={handleChange} />
              <InputGroup label="Attorney Fees" desc="Legal costs." field="realEstateAttorneyFee" unit="$" step={100} val={profile.realEstateAttorneyFee} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-teal uppercase tracking-widest border-b border-teal/20 pb-1">Ongoing Costs</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-full">
                <InputGroup label="HOA + Insurance" desc="Monthly charges." field="hoaInsuranceMonthly" unit="$/mo" step={10} val={profile.hoaInsuranceMonthly} onChange={handleChange} />
              </div>
              <InputGroup label="Annual Prop Tax" desc="Yearly tax." field="annualPropertyTax" unit="$/yr" step={100} val={profile.annualPropertyTax} onChange={handleChange} />
              <InputGroup label="Prop Tax Growth" desc="Annual increase." field="propTaxGrowth" unit="%/yr" step={0.1} val={profile.propTaxGrowth} onChange={handleChange} />
              <div className="w-full">
                <InputGroup label="Maintenance" desc="Repairs (% of val)." field="maintenancePct" unit="%/yr" step={0.1} val={profile.maintenancePct} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-green uppercase tracking-widest border-b border-green/20 pb-1">Exit Strategy</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-full">
                <InputGroup label="Home Appreciation" desc="Yearly growth." field="homeAppreciation" unit="%/yr" step={0.1} val={profile.homeAppreciation} onChange={handleChange} />
              </div>
              <InputGroup label="Seller Commission" desc="Broker fees." field="sellerCommissionPct" unit="%" step={0.5} val={profile.sellerCommissionPct} onChange={handleChange} />
              <InputGroup label="Transfer Tax" desc="Sales tax." field="transferTaxPct" unit="%" step={0.1} val={profile.transferTaxPct} onChange={handleChange} />
              <div className="w-full">
                <InputGroup label="Cap Gains Exclusion" desc="Profit limit." field="capitalGainsExclusion" unit="$" step={10000} val={profile.capitalGainsExclusion} onChange={handleChange} />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
