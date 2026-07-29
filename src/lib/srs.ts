/**
 * SM-2-style spaced repetition on a fixed interval ladder, driven by the
 * `srs_stage` column (the schema keeps a single stage int rather than a full
 * easiness factor).
 */
export const SRS_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 90, 180];

export type Grade = "again" | "hard" | "good" | "easy";

export const GRADES: { grade: Grade; label: string; hint: (stage: number) => string }[] = [
  { grade: "again", label: "Again", hint: () => "10 min" },
  { grade: "hard", label: "Hard", hint: (s) => intervalLabel(Math.max(0, s)) },
  { grade: "good", label: "Good", hint: (s) => intervalLabel(s + 1) },
  { grade: "easy", label: "Easy", hint: (s) => intervalLabel(s + 2) },
];

function clampStage(stage: number): number {
  return Math.max(0, Math.min(stage, SRS_INTERVALS_DAYS.length - 1));
}

export function intervalLabel(stage: number): string {
  const days = SRS_INTERVALS_DAYS[clampStage(stage)];
  if (days === 0) return "10 min";
  if (days < 30) return `${days} d`;
  return `${Math.round(days / 30)} mo`;
}

export function applyGrade(stage: number, grade: Grade): { stage: number; nextReviewAt: Date } {
  let next: number;
  switch (grade) {
    case "again":
      next = 0;
      break;
    case "hard":
      next = stage;
      break;
    case "good":
      next = stage + 1;
      break;
    case "easy":
      next = stage + 2;
      break;
  }
  next = clampStage(next);

  const days = SRS_INTERVALS_DAYS[next];
  const nextReviewAt = new Date();
  if (days === 0) nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  else nextReviewAt.setDate(nextReviewAt.getDate() + days);

  return { stage: next, nextReviewAt };
}
