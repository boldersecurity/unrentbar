import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { BuyProfile } from '../types';
import { COLORS, DEFAULT_PROFILE } from '../constants';

interface Props {
  profiles: BuyProfile[];
  setProfiles: (p: BuyProfile[]) => void;
}

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
  canRemove: boolean;
}> = ({ profile, onUpdate, onRemove, canRemove }) => {
  const [expanded, setExpanded] = React.useState(true);
  
  const handleChange = (field: keyof BuyProfile, val: string) => {
    const num = parseFloat(val);
    onUpdate(profile.id, field, isNaN(num) ? val : num);
  };

  // Helper for input fields
  const InputGroup = ({ label, field, unit, step = 1, type = "number" }: any) => (
    <div>
      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={step}
          value={profile[field as keyof BuyProfile]}
          onChange={(e) => handleChange(field as keyof BuyProfile, e.target.value)}
          className="w-full bg-surface2 border border-border rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-accent transition-colors"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim pointer-events-none">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-surface2/30 border-b border-border/50" style={{ borderLeft: `4px solid ${profile.color}` }}>
        <div className="flex items-center gap-4 flex-1">
          <input 
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="bg-transparent font-bold text-base text-text focus:outline-none border-b border-transparent focus:border-accent px-1"
          />
          <span className="text-xs font-mono bg-surface2 px-2 py-1 rounded text-text-dim">
            ${profile.purchasePrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-widest border-b border-accent/20 pb-1">Purchase Details</h3>
            <InputGroup label="Purchase Price" field="purchasePrice" unit="$" step={1000} />
            <InputGroup label="Down Payment" field="downPaymentPct" unit="%" step={1} />
            <InputGroup label="Interest Rate" field="interestRate" unit="%" step={0.125} />
            <InputGroup label="Term (Years)" field="mortgageTerm" unit="yrs" />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-yellow uppercase tracking-widest border-b border-yellow/20 pb-1">Closing Costs</h3>
            <InputGroup label="Mansion Tax" field="mansionTaxPct" unit="%" step={0.1} />
            <InputGroup label="Recording Tax" field="mortgageRecordingTaxPct" unit="%" step={0.1} />
            <InputGroup label="Title Insurance" field="titleInsurancePct" unit="%" step={0.1} />
            <InputGroup label="Attorney Fees" field="realEstateAttorneyFee" unit="$" step={100} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-teal uppercase tracking-widest border-b border-teal/20 pb-1">Ongoing Costs</h3>
            <InputGroup label="HOA + Insurance" field="hoaInsuranceMonthly" unit="$/mo" step={10} />
            <InputGroup label="Annual Prop Tax" field="annualPropertyTax" unit="$/yr" step={100} />
            <InputGroup label="Maintenance" field="maintenancePct" unit="%/yr" step={0.1} />
            <InputGroup label="Prop Tax Growth" field="propTaxGrowth" unit="%/yr" step={0.1} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-green uppercase tracking-widest border-b border-green/20 pb-1">Exit Strategy</h3>
            <InputGroup label="Appreciation" field="homeAppreciation" unit="%/yr" step={0.1} />
            <InputGroup label="Seller Comm." field="sellerCommissionPct" unit="%" step={0.5} />
            <InputGroup label="Transfer Tax" field="transferTaxPct" unit="%" step={0.1} />
            <InputGroup label="Cap Gains Excl." field="capitalGainsExclusion" unit="$" step={10000} />
          </div>

        </div>
      )}
    </div>
  );
};
