export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface TradeState {
  price: string;
  amount: string; // Margin/Principal in USDT
}

export interface CalculationResult {
  tp1: TargetLevel;
  tp2: TargetLevel;
  tp3: TargetLevel;
  entryPrice: number;
  leverage: number;
  totalProfit: number;
}

export interface TargetLevel {
  price: number;
  pnl: number;
  roe: number; // Return on Equity percentage
  percentQty: number; // 50%, 30%, 20%
  label: string;
}
