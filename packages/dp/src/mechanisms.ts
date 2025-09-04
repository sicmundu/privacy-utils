/**
 * Differential Privacy Mechanisms
 * Implementation of Laplace, Gaussian, and Discrete Gaussian mechanisms
 */

import { random } from 'privacy-utils-core-crypto';
import type { Mechanism, DPBudget, NoiseParameters } from './types';

/**
 * Calculate Laplace noise scale from sensitivity and privacy budget
 */
export function calculateLaplaceScale(sensitivity: number, epsilon: number): number {
  return sensitivity / epsilon;
}

/**
 * Calculate Gaussian noise scale from sensitivity and privacy budget
 */
export function calculateGaussianScale(sensitivity: number, epsilon: number, delta: number): number {
  // Using the formula from Dwork & Rothbook: σ = (sensitivity * sqrt(2 * ln(1.25 / δ))) / ε
  const sqrtTerm = Math.sqrt(2 * Math.log(1.25 / delta));
  return (sensitivity * sqrtTerm) / epsilon;
}

/**
 * Sample Laplace noise
 */
export function sampleLaplace(scale: number): number {
  // Laplace distribution: p(x) = (1/(2b)) * exp(-|x|/b) where b = scale
  const u = random() - 0.5; // Uniform(-0.5, 0.5)
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Sample Gaussian noise using Box-Muller transform
 */
export function sampleGaussian(scale: number): number {
  // Box-Muller transform for normal distribution
  const u1 = random();
  const u2 = random();

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * scale;
}

/**
 * Sample discrete Gaussian noise (approximation)
 */
export function sampleDiscreteGaussian(scale: number): number {
  // Using simple approximation: sample continuous Gaussian and round
  const continuous = sampleGaussian(scale);
  return Math.round(continuous);
}

/**
 * Generic noise sampling function
 */
export function sampleNoise(mechanism: Mechanism, scale: number): number {
  switch (mechanism) {
    case 'laplace':
      return sampleLaplace(scale);
    case 'gaussian':
      return sampleGaussian(scale);
    case 'discrete-gaussian':
      return sampleDiscreteGaussian(scale);
    default:
      throw new Error(`Unknown mechanism: ${mechanism}`);
  }
}

/**
 * Calculate noise parameters for given mechanism and budget
 */
export function calibrateNoise(
  mechanism: Mechanism,
  sensitivity: number,
  budget: DPBudget
): NoiseParameters {
  let scale: number;

  switch (mechanism) {
    case 'laplace':
      if (budget.delta !== undefined) {
        throw new Error('Laplace mechanism does not use delta parameter');
      }
      scale = calculateLaplaceScale(sensitivity, budget.epsilon);
      break;

    case 'gaussian':
    case 'discrete-gaussian':
      if (budget.delta === undefined) {
        throw new Error('Gaussian mechanisms require delta parameter');
      }
      scale = calculateGaussianScale(sensitivity, budget.epsilon, budget.delta);
      break;

    default:
      throw new Error(`Unknown mechanism: ${mechanism}`);
  }

  return {
    scale,
    mechanism,
    sensitivity,
    budget: { ...budget },
  };
}
