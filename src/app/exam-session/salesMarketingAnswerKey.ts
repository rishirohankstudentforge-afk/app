import { SALES_MARKETING_QUESTIONS } from "./salesMarketingQuestions";

export const SALES_MARKETING_ANSWER_KEY: Record<number, string> = {
  7001: "C",
  7002: "C",
  7003: "B",
  7004: "C",
  7005: "C",
  7006: "C",
  7007: "B",
  7008: "C",
  7009: "C",
  7010: "B",
  7011: "B",
  7012: "B",
  7013: "B",
  7014: "B",
  7015: "B",
  7016: "C",
  7017: "B",
  7018: "B",
  7019: "B",
  7020: "B",
  7021: "B",
  7022: "A",
  7023: "A",
  7024: "B",
  7025: "B",
  7026: "A",
  7027: "C",
  7028: "B",
  7029: "C",
  7030: "C",
  7031: "B",
  7032: "A",
  7033: "C",
  7034: "B",
  7035: "A",
  7036: "A",
  7037: "B",
  7038: "B",
  7039: "B",
  7040: "A",
  7041: "B",
  7042: "B",
  7043: "B",
  7044: "B",
  7045: "B",
  7046: "B",
  7047: "A",
  7048: "C",
  7049: "C",
  7050: "C"
};

export function gradeSalesMarketingMCQ(qid: number, selectedAnswer: string): boolean {
  const correct = SALES_MARKETING_ANSWER_KEY[qid];
  if (!correct || !selectedAnswer) return false;
  const cleanAns = selectedAnswer.trim().toUpperCase();
  return cleanAns.startsWith(correct);
}

export interface SalesMarketingGradingResult {
  totalAttempted: number;
  totalCorrect: number;
  totalMarks: number;
  percentage: number;
  isPass: boolean;
  questionDetails: Array<{
    id: number;
    number: number;
    questionText: string;
    selectedOption: string;
    correctOption: string;
    isCorrect: boolean;
    marks: number;
  }>;
}

export function gradeSalesMarketingFull(answers: Record<number, string>): SalesMarketingGradingResult {
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalMarks = 0;

  const questionDetails = SALES_MARKETING_QUESTIONS.map((q) => {
    const userAns = answers[q.id] || "";
    const isAttempted = userAns.trim() !== "";
    if (isAttempted) totalAttempted++;

    const isCorrect = gradeSalesMarketingMCQ(q.id, userAns);
    const marksObtained = isCorrect ? q.marks : 0;
    if (isCorrect) totalCorrect++;
    totalMarks += marksObtained;

    return {
      id: q.id,
      number: q.number,
      questionText: q.questionText,
      selectedOption: userAns,
      correctOption: SALES_MARKETING_ANSWER_KEY[q.id] || "N/A",
      isCorrect,
      marks: marksObtained,
    };
  });

  const percentage = Math.round((totalMarks / 100) * 100);
  const isPass = totalMarks >= 40;

  return {
    totalAttempted,
    totalCorrect,
    totalMarks,
    percentage,
    isPass,
    questionDetails,
  };
}
