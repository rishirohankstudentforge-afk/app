import { BUSINESS_ANALYSIS_QUESTIONS } from "./businessAnalysisQuestions";

export const BUSINESS_ANALYSIS_ANSWER_KEY: Record<number, string> = {
  6001: "B",
  6002: "B",
  6003: "C",
  6004: "C",
  6005: "B",
  6006: "B",
  6007: "A",
  6008: "C",
  6009: "C",
  6010: "B",
  6011: "C",
  6012: "A",
  6013: "B",
  6014: "B",
  6015: "C",
  6016: "B",
  6017: "C",
  6018: "B",
  6019: "C",
  6020: "B",
  6021: "B",
  6022: "C",
  6023: "B",
  6024: "B",
  6025: "B",
  6026: "A",
  6027: "B",
  6028: "C",
  6029: "C",
  6030: "B",
  6031: "C",
  6032: "B",
  6033: "C",
  6034: "C",
  6035: "C",
  6036: "C",
  6037: "C",
  6038: "B",
  6039: "B",
  6040: "B",
  6041: "B",
  6042: "C",
  6043: "B",
  6044: "B",
  6045: "C",
  6046: "B",
  6047: "B",
  6048: "B",
  6049: "D",
  6050: "C"
};

export function gradeBusinessAnalysisMCQ(qid: number, selectedAnswer: string): boolean {
  const correct = BUSINESS_ANALYSIS_ANSWER_KEY[qid];
  if (!correct || !selectedAnswer) return false;
  const cleanAns = selectedAnswer.trim().toUpperCase();
  return cleanAns.startsWith(correct);
}

export interface BusinessAnalysisGradingResult {
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

export function gradeBusinessAnalysisFull(answers: Record<number, string>): BusinessAnalysisGradingResult {
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalMarks = 0;

  const questionDetails = BUSINESS_ANALYSIS_QUESTIONS.map((q) => {
    const userAns = answers[q.id] || "";
    const isAttempted = userAns.trim() !== "";
    if (isAttempted) totalAttempted++;

    const isCorrect = gradeBusinessAnalysisMCQ(q.id, userAns);
    const marksObtained = isCorrect ? q.marks : 0;
    if (isCorrect) totalCorrect++;
    totalMarks += marksObtained;

    return {
      id: q.id,
      number: q.number,
      questionText: q.questionText,
      selectedOption: userAns,
      correctOption: BUSINESS_ANALYSIS_ANSWER_KEY[q.id] || "N/A",
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
