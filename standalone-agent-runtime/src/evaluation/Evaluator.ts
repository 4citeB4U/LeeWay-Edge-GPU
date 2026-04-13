/*
LEEWAY HEADER — DO NOT REMOVE
REGION: EVALUATION
TAG: CORE.EVALUATOR
5WH:
  WHAT = Success scoring and evaluation engine
  WHY = Measures accuracy and ensures output quality
  WHO = LeeWay Innovations
*/

export interface EvaluationResult {
  accuracy: number;
  passed: boolean;
}

export class Evaluator {
  evaluate(results: any[]): EvaluationResult {
    const successCount = results.filter(r => r && r.ok).length;
    const total = results.length;

    const accuracy = total > 0 ? successCount / total : 0;

    return {
      accuracy,
      passed: successCount === total && total > 0
    };
  }
}
