import React from 'react';
import { TargetLevel, PositionSide } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface ResultCardProps {
  data: TargetLevel;
  side: PositionSide;
  index: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, side, index }) => {
  const isLong = side === PositionSide.LONG;
  const colorClass = isLong ? 'text-emerald-400' : 'text-rose-400';
  const bgClass = isLong ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${bgClass} p-4 transition-all duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLong ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            <Target size={16} className={colorClass} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">
              {data.label}
            </h3>
            <span className="text-xs text-slate-400">Sell {data.percentQty * 100}% Qty</span>
          </div>
        </div>
        <div className={`text-2xl font-mono font-bold ${colorClass}`}>
          {data.price.toFixed(4)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <div>
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Est. Profit</p>
          <div className="flex items-center text-slate-200 font-mono">
            <DollarSign size={12} className="mr-0.5" />
            {data.pnl.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">ROE</p>
           <div className={`font-mono font-medium ${colorClass}`}>
             {data.roe > 0 ? '+' : ''}{(data.roe * 100).toFixed(0)}%
           </div>
        </div>
      </div>
    </div>
  );
};
