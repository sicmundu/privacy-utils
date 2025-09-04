/**
 * Differential Privacy types and interfaces
 */

export type Mechanism = 'laplace' | 'gaussian' | 'discrete-gaussian';

export interface DPBudget {
  epsilon: number;
  delta?: number; // Only used for (ε, δ)-DP
}

export interface DPResult<T> {
  value: T;
  noise: number;
  mechanism: Mechanism;
  budget: DPBudget;
  sensitivity: number;
}

export interface ClippingOptions {
  enabled: boolean;
  lower?: number;
  upper?: number;
  norm?: 'l1' | 'l2' | 'linf';
}

export interface NoiseParameters {
  scale: number;
  mechanism: Mechanism;
  sensitivity: number;
  budget: DPBudget;
}
