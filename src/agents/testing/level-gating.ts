import type { GradeLevel, SchoolGrade } from "../_shared/types";
import { schoolGradeLabel } from "../_shared/types";

const GRADE_ORDER: Record<SchoolGrade, number> = {
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
  p5: 5,
  p6: 6,
  sec1: 7,
  sec2: 8,
  sec3: 9,
  sec4: 10,
  sec5: 11,
  jc1: 12,
  jc2: 13,
};

const BAND_ORDER: Record<GradeLevel, number> = {
  primary: 1,
  secondary: 2,
  jc: 3,
};

const BAND_CEILING: Record<GradeLevel, SchoolGrade> = {
  primary: "p6",
  secondary: "sec5",
  jc: "jc2",
};

export type RequestedLevelAccess =
  | {
      status: "no-explicit-level";
      studentGrade: SchoolGrade;
    }
  | {
      status: "allowed";
      studentGrade: SchoolGrade;
      requestedGrade: SchoolGrade;
      levelNote?: string;
    }
  | {
      status: "blocked";
      studentGrade: SchoolGrade;
      requestedGrade: SchoolGrade;
      reason: string;
    };

function normaliseRequest(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function resolveStudentGrade(
  grade: SchoolGrade | null | undefined,
  gradeLevel: GradeLevel,
) {
  return grade ?? BAND_CEILING[gradeLevel];
}

export function parseRequestedSchoolGrade(request: string): SchoolGrade | null {
  const text = normaliseRequest(request).toLowerCase();

  const directPatterns: Array<[RegExp, SchoolGrade]> = [
    [/\bprimary\s*1\b|\bp1\b/i, "p1"],
    [/\bprimary\s*2\b|\bp2\b/i, "p2"],
    [/\bprimary\s*3\b|\bp3\b/i, "p3"],
    [/\bprimary\s*4\b|\bp4\b/i, "p4"],
    [/\bprimary\s*5\b|\bp5\b/i, "p5"],
    [/\bprimary\s*6\b|\bp6\b|\bpsle\b/i, "p6"],
    [/\bsecondary\s*1\b|\bsec\s*1\b/i, "sec1"],
    [/\bsecondary\s*2\b|\bsec\s*2\b/i, "sec2"],
    [/\bsecondary\s*3\b|\bsec\s*3\b/i, "sec3"],
    [/\bsecondary\s*4\b|\bsec\s*4\b|\bo-?level\b|\bn-?level\b/i, "sec4"],
    [/\bsecondary\s*5\b|\bsec\s*5\b/i, "sec5"],
    [/\bjc\s*1\b|\bjunior college\s*1\b/i, "jc1"],
    [/\bjc\s*2\b|\bjunior college\s*2\b|\bh1\b|\bh2\b|\ba-?level\b/i, "jc2"],
  ];

  for (const [pattern, grade] of directPatterns) {
    if (pattern.test(text)) return grade;
  }

  return null;
}

function gradeBand(grade: SchoolGrade): GradeLevel {
  if (grade.startsWith("p")) return "primary";
  if (grade.startsWith("sec")) return "secondary";
  return "jc";
}

export function evaluateRequestedLevelAccess(options: {
  studentGrade?: SchoolGrade | null;
  studentGradeLevel: GradeLevel;
  request: string;
}): RequestedLevelAccess {
  const studentGrade = resolveStudentGrade(
    options.studentGrade,
    options.studentGradeLevel,
  );
  const requestedGrade = parseRequestedSchoolGrade(options.request);

  if (!requestedGrade) {
    return {
      status: "no-explicit-level",
      studentGrade,
    };
  }

  if (GRADE_ORDER[requestedGrade] > GRADE_ORDER[studentGrade]) {
    return {
      status: "blocked",
      studentGrade,
      requestedGrade,
      reason: `The request targets ${schoolGradeLabel(requestedGrade)} content, which is above the student's current level of ${schoolGradeLabel(studentGrade)}. Offer ${schoolGradeLabel(studentGrade)} or lower instead.`,
    };
  }

  const requestedBand = gradeBand(requestedGrade);
  const studentBand = gradeBand(studentGrade);
  const levelNote =
    BAND_ORDER[requestedBand] < BAND_ORDER[studentBand]
      ? `This request is below the student's usual level (${schoolGradeLabel(studentGrade)}), so treat it as revision content.`
      : undefined;

  return {
    status: "allowed",
    studentGrade,
    requestedGrade,
    levelNote,
  };
}
