import type { SafetyFlags } from './types';

export type SafetyVerdict =
  | { allowed: true }
  | { allowed: false; reason: string; category: 'medical' | 'age' };

/**
 * Evaluate a user's safety flags and return a blocking verdict for the MVP.
 * Fasting protocols in the beta are gated behind these checks.
 */
export function evaluateSafety(flags: SafetyFlags): SafetyVerdict {
  if (flags.under18) {
    return {
      allowed: false,
      category: 'age',
      reason:
        'Soma is only available to adults 18 and over. Fasting during adolescence can interfere with growth and development.',
    };
  }
  if (flags.pregnant) {
    return {
      allowed: false,
      category: 'medical',
      reason:
        'Fasting is not safe during pregnancy or breastfeeding. Please consult your physician before using Soma.',
    };
  }
  if (flags.eatingDisorderHistory) {
    return {
      allowed: false,
      category: 'medical',
      reason:
        'If you have a history of disordered eating, structured fasting can be harmful. Please work with a qualified clinician instead.',
    };
  }
  if (flags.diabetes) {
    return {
      allowed: false,
      category: 'medical',
      reason:
        'Fasting with diabetes requires medical supervision. Soma does not currently support this use case.',
    };
  }
  return { allowed: true };
}

export function emptySafetyFlags(): SafetyFlags {
  return {
    pregnant: false,
    eatingDisorderHistory: false,
    diabetes: false,
    under18: false,
  };
}
