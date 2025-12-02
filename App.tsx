import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator, ArrowUpCircle, ArrowDownCircle, Settings2, Info } from 'lucide-react';
import { InputGroup } from './components/InputGroup';
import { ResultCard } from './components/ResultCard';
import { PositionSide, TradeState, CalculationResult, TargetLevel } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const App: React.FC = () => {
  // --- State ---
  const [side, setSide] = useState<PositionSide>(PositionSide.LONG);
  const [leverage, setLeverage] = useState<number>(100);
  
  // Inputs stored separately to preserve data when switching tabs
  const [longState, setLongState] = useState<TradeState>({ price: '', amount: '' });
  const [shortState, setShortState] = useState<TradeState>({ price: '', amount: '' });
  
  // Total Capital for the 5% calculation helper
  const [totalCapital, setTotalCapital] = useState<string>('10000');

  // --- Helpers ---
  const activeState = side === PositionSide.LONG ? longState : shortState;
  
  const handleInputChange = (field: keyof TradeState, value: string) => {
    if (side === PositionSide.LONG) {
      setLongState(prev => ({ ...prev, [field]: value }));
    } else {
      setShortState(prev => ({ ...prev, [field]: value }));
    }
  };

  const applyStandardPosition = () => {
    const capital = parseFloat(totalCapital);
    if (!isNaN(capital)) {
      const standardAmount = (capital * 0.05).toFixed(0); // 5% of total capital
      handleInputChange('amount', standardAmount);
    }
  };

  // --- Calculation Logic ---
  const result: CalculationResult | null = useMemo(() => {
    const entryPrice = parseFloat(activeState.price);
    const margin = parseFloat(activeState.amount);
    
    if (isNaN(entryPrice) || isNaN(margin) || entryPrice <= 0 || margin <= 0) {
      return null;
    }

    // Logic Explanation based on user request:
    // Risk/Reward 1:1 implies getting 100% ROE (doubling margin) if Risk is liquidation (100% loss).
    // TP1: 1:1 (100% ROE) -> Sell 50%
    // TP2: 1:1.5 (150% ROE) -> Sell 30%
    // TP3: 1:3.5 (350% ROE) -> Sell 20%
    
    // Price movement % required for 100% ROE = 1 / Leverage
    const moveFor100Percent = 1 / leverage;

    const calculateTarget = (roeMultiple: number, qtyPercent: number, label: string): TargetLevel => {
      const requiredMove = moveFor100Percent * roeMultiple;
      
      let targetPrice: number;
      if (side === PositionSide.LONG) {
        targetPrice = entryPrice * (1 + requiredMove);
      } else {
        targetPrice = entryPrice * (1 - requiredMove);
      }

      // Profit = Margin * ROE * QtyPercent
      // ROE is technically roeMultiple (e.g. 1.0, 1.5)
      const pnl = margin * roeMultiple * qtyPercent;

      return {
        price: targetPrice,
        pnl: pnl,
        roe: roeMultiple,
        percentQty: qtyPercent,
        label
      };
    };

    const tp1 = calculateTarget(1.0, 0.5, 'TP 1 (Risk/Reward 1:1)');
    const tp2 = calculateTarget(1.5, 0.3, 'TP 2 (Risk/Reward 1:1.5)');
    const tp3 = calculateTarget(3.5, 0.2, 'TP 3 (Risk/Reward 1:3.5)');

    const totalProfit = tp1.pnl + tp2.pnl + tp3.pnl;

    return {
      tp1,
      tp2,
      tp3,
      entryPrice,
      leverage,
      totalProfit
    };

  }, [activeState, leverage, side]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Entry', price: result.entryPrice, type: 'entry' },
      { name: 'TP1', price: result.tp1.price, type: 'tp' },
      { name: 'TP2', price: result.tp2.price, type: 'tp' },
      { name: 'TP3', price: result.tp3.price, type: 'tp' },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Calculator className="text-primary" size={24} />
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            ProTrade
          </h1>
        </div>
        <div className="text-xs font-medium px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
          v1.0
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 pt-6 space-y-6">
        
        {/* Toggle Switch */}
        <div className="bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 flex relative">
           <div 
             className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-lg shadow-sm transition-all duration-300 ease-out ${
               side === PositionSide.LONG ? 'left-1.5 bg-emerald-600' : 'left-[calc(50%+3px)] bg-rose-600'
             }`}
           />
           <button
            onClick={() => setSide(PositionSide.LONG)}
            className={`relative z-1 flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors ${side === PositionSide.LONG ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <ArrowUpCircle size={18} />
             Open Long
           </button>
           <button
            onClick={() => setSide(PositionSide.SHORT)}
            className={`relative z-1 flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors ${side === PositionSide.SHORT ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <ArrowDownCircle size={18} />
             Open Short
           </button>
        </div>

        {/* Leverage Slider */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Settings2 size={16} />
              <span>Leverage</span>
            </div>
            <span className="text-2xl font-mono font-bold text-primary">{leverage}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-blue-400"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>75x</span>
            <span>100x</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <InputGroup
            label={`Entry Price (${side === PositionSide.LONG ? 'Long' : 'Short'})`}
            value={activeState.price}
            onChange={(v) => handleInputChange('price', v)}
            placeholder="0.00"
            suffix={<span className="text-slate-500 text-sm">USDT</span>}
          />
          
          <div className="relative">
            <InputGroup
              label="Margin Amount (Principal)"
              value={activeState.amount}
              onChange={(v) => handleInputChange('amount', v)}
              placeholder="0.00"
              prefix={<span className="text-slate-500 font-mono">USDT</span>}
            />
            {/* Quick Helper for Standard Position */}
             <div className="mt-2 flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-800">
               <div className="flex items-center gap-2 text-xs text-slate-400">
                 <Info size={12} />
                 <span>Total Capital:</span>
                 <input 
                    type="number" 
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(e.target.value)}
                    className="bg-transparent border-b border-slate-600 w-16 text-slate-300 focus:outline-none focus:border-primary text-right"
                 />
               </div>
               <button 
                onClick={applyStandardPosition}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors"
               >
                 Set Standard (5%)
               </button>
             </div>
          </div>
        </div>

        {/* Results */}
        {result ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-widest">Targets</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <ResultCard data={result.tp1} side={side} index={1} />
            <ResultCard data={result.tp2} side={side} index={2} />
            <ResultCard data={result.tp3} side={side} index={3} />

            {/* Total Potential */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">Total Projected Profit</span>
                <span className="text-2xl font-mono font-bold text-success flex items-center">
                  <span className="text-sm mr-1">$</span>
                  {result.totalProfit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Simple Visualization */}
            <div className="h-48 w-full mt-6 bg-slate-900/50 rounded-2xl border border-slate-800 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [value.toFixed(4), 'Price']}
                  />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'entry' ? '#94a3b8' : (side === PositionSide.LONG ? '#10b981' : '#f43f5e')} 
                        fillOpacity={entry.type === 'entry' ? 0.3 : 1 - (index * 0.15)} // Fade out further TPs slightly
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 opacity-50">
            <div className="inline-block p-4 rounded-full bg-slate-800 mb-3">
              <Calculator size={32} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">Enter price and amount to calculate targets</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
