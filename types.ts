export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface TradeState {
  price: string;
  amount: string; // Margin/Principal in USDT
  stopLoss: string; // Stop Loss Price
}

export interface CalculationResult {
  tp1: TargetLevel;
  tp2: TargetLevel;
  tp3: TargetLevel;
  stopLoss: number;
  entryPrice: number;
  leverage: number;
  totalProfit: number;
  riskAmount: number;
}

export interface TargetLevel {
  price: number;
  pnl: number;
  roe: number; // Return on Equity percentage
  percentQty: number; // 50%, 30%, 20%
  label: string;
}
