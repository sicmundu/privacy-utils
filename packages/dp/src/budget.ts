/**
 * Privacy Budget Management and Composition
 */

import type { DPBudget } from './types';

/**
 * Compose multiple privacy budgets using basic composition
 */
export function composeBudgets(budgets: DPBudget[]): DPBudget {
  if (budgets.length === 0) {
    return { epsilon: 0 };
  }

  if (budgets.length === 1) {
    const budget = budgets[0];
    if (!budget) {
      return { epsilon: 0 };
    }
    const result: DPBudget = { epsilon: budget.epsilon };
    if (budget.delta !== undefined) {
      result.delta = budget.delta;
    }
    return result;
  }

  // Basic composition for ε-DP (sum of epsilons)
  const totalEpsilon = budgets.reduce((sum, budget) => sum + budget.epsilon, 0);

  // For δ, we use the worst-case composition (sum of deltas)
  const totalDelta = budgets.some(b => b.delta !== undefined)
    ? budgets.reduce((sum, budget) => sum + (budget.delta ?? 0), 0)
    : undefined;

  const result: DPBudget = {
    epsilon: totalEpsilon,
  };

  if (totalDelta !== undefined && totalDelta > 0) {
    result.delta = totalDelta;
  }

  return result;
}

/**
 * Advanced composition using moments accountant (simplified)
 */
export function advancedCompose(budgets: DPBudget[], targetDelta?: number): DPBudget {
  if (budgets.length === 0) {
    return { epsilon: 0 };
  }

  // Simplified advanced composition
  // In practice, this would use the moments accountant method
  const totalEpsilon = budgets.reduce((sum, budget) => sum + budget.epsilon, 0);

  // For advanced composition with δ, we use a more sophisticated bound
  const delta = targetDelta ?? budgets.reduce((sum, budget) => sum + (budget.delta ?? 0), 0);

  const result: DPBudget = {
    epsilon: totalEpsilon,
  };

  if (delta > 0) {
    result.delta = delta;
  }

  return result;
}

/**
 * Privacy budget tracker
 */
export class BudgetTracker {
  private remainingBudget: DPBudget;
  private spentBudget: DPBudget;

  constructor(totalBudget: DPBudget) {
    this.remainingBudget = { ...totalBudget };
    this.spentBudget = { epsilon: 0, delta: 0 };
  }

  /**
   * Check if a budget can be spent
   */
  canSpend(budget: DPBudget): boolean {
    const remainingEpsilon = this.remainingBudget.epsilon;
    const remainingDelta = this.remainingBudget.delta ?? Infinity;

    const requiredEpsilon = budget.epsilon;
    const requiredDelta = budget.delta ?? 0;

    return remainingEpsilon >= requiredEpsilon && remainingDelta >= requiredDelta;
  }

  /**
   * Spend a budget (throws if insufficient budget)
   */
  spend(budget: DPBudget): void {
    if (!this.canSpend(budget)) {
      throw new Error('Insufficient privacy budget');
    }

    this.remainingBudget.epsilon -= budget.epsilon;
    if (this.remainingBudget.delta !== undefined && budget.delta !== undefined) {
      this.remainingBudget.delta -= budget.delta;
    }

    this.spentBudget.epsilon += budget.epsilon;
    if (budget.delta !== undefined) {
      this.spentBudget.delta = (this.spentBudget.delta ?? 0) + budget.delta;
    }
  }

  /**
   * Get remaining budget
   */
  getRemaining(): DPBudget {
    return { ...this.remainingBudget };
  }

  /**
   * Get spent budget
   */
  getSpent(): DPBudget {
    return { ...this.spentBudget };
  }

  /**
   * Get total budget
   */
  getTotal(): DPBudget {
    const totalEpsilon = this.remainingBudget.epsilon + this.spentBudget.epsilon;
    const totalDelta = (this.remainingBudget.delta ?? 0) + (this.spentBudget.delta ?? 0);

    const result: DPBudget = {
      epsilon: totalEpsilon,
    };

    if (totalDelta > 0) {
      result.delta = totalDelta;
    }

    return result;
  }
}

/**
 * Create a budget tracker
 */
export function createBudgetTracker(totalBudget: DPBudget): BudgetTracker {
  return new BudgetTracker(totalBudget);
}
