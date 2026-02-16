import React, { useState, useEffect } from 'react';
import { Download, Upload, RotateCcw, Save } from 'lucide-react';
import { RentTab } from './components/RentTab';
import { BuyTab } from './components/BuyTab';
import { CompareTab } from './components/CompareTab';
import { AnalysisTab } from './components/AnalysisTab';
import { GlobalSettings, BuyProfile, RentSettings, TabType } from './types';
import { DEFAULT_GLOBAL_SETTINGS, DEFAULT_RENT_SETTINGS, DEFAULT_PROFILE } from './constants';
import { calculateRentScenario, calculateBuyScenario } from './utils/calculations';

const STORAGE_KEY = 'rentVsBuy_v2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('rent');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [rentSettings, setRentSettings] = useState<RentSettings>(DEFAULT_RENT_SETTINGS);
  const [profiles, setProfiles] = useState<BuyProfile[]>([{ ...DEFAULT_PROFILE, id: 'buy_1', name: 'Home 1' }]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.globalSettings) setGlobalSettings(data.globalSettings);
        if (data.rentSettings) setRentSettings(data.rentSettings);
        if (data.profiles) setProfiles(data.profiles);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        globalSettings,
        rentSettings,
        profiles
      }));
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus(null), 3000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [globalSettings, rentSettings, profiles]);

  const handleExport = () => {
    const data = {
      _format: 'rent-vs-buy-analysis-v2',
      globalSettings,
      rentSettings,
      profiles,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rent-vs-buy-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.globalSettings) setGlobalSettings(data.globalSettings);
        if (data.rentSettings) setRentSettings(data.rentSettings);
        if (data.profiles) setProfiles(data.profiles);
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all settings?')) {
      setGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
      setRentSettings(DEFAULT_RENT_SETTINGS);
      setProfiles([{ ...DEFAULT_PROFILE, id: 'buy_1', name: 'Home 1' }]);
    }
  };

  // Pre-calculate data to pass down
  const rentData = calculateRentScenario(rentSettings, globalSettings.forecastYears);
  const calculations = profiles.map(p => ({
    profileId: p.id,
    result: calculateBuyScenario(p, globalSettings, rentData)
  }));

  return (
    <div className="min-h-screen pb-12 font-sans text-text">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-text">Rent vs Buy Financial Analysis</h1>
          <div className="text-sm text-text-dim">Optimize for the "Unrent Bar" (&lt;6 year break-even)</div>
        </div>
        
        <div className="flex items-center gap-2">
           {saveStatus === 'saved' && <span className="text-green text-xs font-medium mr-2">Saved</span>}
           <button onClick={handleExport} className="p-2 text-text-dim hover:text-accent hover:bg-surface2 rounded-md transition-colors" title="Export">
             <Download size={18} />
           </button>
           <label className="p-2 text-text-dim hover:text-accent hover:bg-surface2 rounded-md transition-colors cursor-pointer" title="Import">
             <Upload size={18} />
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
           </label>
           <button onClick={handleReset} className="p-2 text-text-dim hover:text-red hover:bg-red/10 rounded-md transition-colors" title="Reset">
             <RotateCcw size={18} />
           </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-surface border-b border-border px-6 flex overflow-x-auto no-scrollbar">
        {[
          { id: 'rent', label: 'Rent Scenario' },
          { id: 'buy', label: 'Buy Profiles' },
          { id: 'compare', label: 'Comparison' },
          { id: 'analysis', label: 'Analysis' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              px-6 py-4 text-sm font-medium border-b-[3px] transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'text-accent border-accent font-bold bg-accent/5' 
                : 'text-text-dim border-transparent hover:text-text hover:bg-accent/5'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {activeTab === 'rent' && (
          <RentTab 
            rentSettings={rentSettings} 
            setRentSettings={setRentSettings}
            rentData={rentData}
          />
        )}
        
        {activeTab === 'buy' && (
          <BuyTab 
            profiles={profiles} 
            setProfiles={setProfiles} 
          />
        )}
        
        {activeTab === 'compare' && (
          <CompareTab 
            globalSettings={globalSettings}
            setGlobalSettings={setGlobalSettings}
            profiles={profiles}
            calculations={calculations}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            profiles={profiles}
            rentSettings={rentSettings}
            globalSettings={globalSettings}
          />
        )}
      </main>
    </div>
  );
};

export default App;