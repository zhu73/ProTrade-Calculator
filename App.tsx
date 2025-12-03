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
  const [longState, setLongState] = useState<TradeState>({ price: '', amount: '', stopLoss: '' });
  const [shortState, setShortState] = useState<TradeState>({ price: '', amount: '', stopLoss: '' });
  
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
    const stopLossPrice = parseFloat(activeState.stopLoss);
    
    if (isNaN(entryPrice) || isNaN(margin) || entryPrice <= 0 || margin <= 0) {
      return null;
    }
    
    if (isNaN(stopLossPrice) || stopLossPrice <= 0) {
      return null;
    }

    // Validate stop loss direction
    if (side === PositionSide.LONG && stopLossPrice >= entryPrice) {
      return null; // Stop loss must be below entry for long
    }
    if (side === PositionSide.SHORT && stopLossPrice <= entryPrice) {
      return null; // Stop loss must be above entry for short
    }

    // Calculate risk (distance from entry to stop loss)
    const riskPriceMove = Math.abs(entryPrice - stopLossPrice);
    const riskPercent = riskPriceMove / entryPrice;
    const riskAmount = margin * riskPercent * leverage; // Actual dollar risk

    // Calculate targets based on risk/reward ratios
    const calculateTarget = (rrRatio: number, qtyPercent: number, label: string): TargetLevel => {
      const rewardPriceMove = riskPriceMove * rrRatio;
      
      let targetPrice: number;
      if (side === PositionSide.LONG) {
        targetPrice = entryPrice + rewardPriceMove;
      } else {
        targetPrice = entryPrice - rewardPriceMove;
      }

      // PnL for this target (based on the position quantity sold at this level)
      const rewardAmount = riskAmount * rrRatio;
      const pnl = rewardAmount * qtyPercent;

      return {
        price: targetPrice,
        pnl: pnl,
        roe: (rewardAmount / margin) * 100, // ROE as percentage
        percentQty: qtyPercent,
        label
      };
    };

    const tp1 = calculateTarget(1.0, 0.5, 'TP1 (1:1) 50%仓位');
    const tp2 = calculateTarget(1.5, 0.3, 'TP2 (1:1.5) 30%仓位');
    const tp3 = calculateTarget(2.0, 0.2, 'TP3 (1:2) 20%仓位');

    const totalProfit = tp1.pnl + tp2.pnl + tp3.pnl;

    return {
      tp1,
      tp2,
      tp3,
      stopLoss: stopLossPrice,
      entryPrice,
      leverage,
      totalProfit,
      riskAmount
    };

  }, [activeState, leverage, side]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'SL', price: result.stopLoss, type: 'sl' },
      { name: 'Entry', price: result.entryPrice, type: 'entry' },
      { name: 'TP1', price: result.tp1.price, type: 'tp' },
      { name: 'TP2', price: result.tp2.price, type: 'tp' },
      { name: 'TP3', price: result.tp3.price, type: 'tp' },
    ].sort((a, b) => side === PositionSide.LONG ? a.price - b.price : b.price - a.price);
  }, [result, side]);

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
          v2.0
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
          
          <InputGroup
            label="Stop Loss Price"
            value={activeState.stopLoss}
            onChange={(v) => handleInputChange('stopLoss', v)}
            placeholder="0.00"
            suffix={<span className="text-slate-500 text-sm">USDT</span>}
          />
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

            {/* Risk & Reward Summary */}
            <div className="mt-6 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-red-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">止损价格 (Stop Loss)</span>
                  <span className="text-lg font-mono font-bold text-red-400">
                    ${result.stopLoss.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500">风险金额 (Risk)</span>
                  <span className="text-sm font-mono text-red-300">
                    -${result.riskAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">总预期盈利 (Total Profit)</span>
                  <span className="text-2xl font-mono font-bold text-success flex items-center">
                    <span className="text-sm mr-1">$</span>
                    {result.totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500">盈亏比 (Risk:Reward)</span>
                  <span className="text-sm font-mono text-emerald-300">
                    1:{(result.totalProfit / result.riskAmount).toFixed(2)}
                  </span>
                </div>
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
                    {chartData.map((entry, index) => {
                      let fill = '#94a3b8';
                      let opacity = 0.3;
                      
                      if (entry.type === 'sl') {
                        fill = '#ef4444';
                        opacity = 0.8;
                      } else if (entry.type === 'entry') {
                        fill = '#94a3b8';
                        opacity = 0.5;
                      } else if (entry.type === 'tp') {
                        fill = side === PositionSide.LONG ? '#10b981' : '#f43f5e';
                        opacity = 1;
                      }
                      
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fill} 
                          fillOpacity={opacity}
                        />
                      );
                    })}
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
