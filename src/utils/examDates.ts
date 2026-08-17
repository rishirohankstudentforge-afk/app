/**
 * Utility functions for checking exam schedule dates, expiration windows, and registration status.
 */

export function isExamDatePassed(examDateStr?: string, examTimeStr?: string): boolean {
  if (!examDateStr) return false;
  try {
    const now = new Date();
    
    // Support date ranges like "18-10-2026 to 19-10-2026" or "18-10-2026 · 11:00 AM to 19-10-2026 12:00 PM IST"
    const combined = `${examDateStr} ${examTimeStr || ""}`;
    const rangeParts = combined.split(/\s+(?:to|-)\s+/i);
    const endTarget = (rangeParts[rangeParts.length - 1] || examDateStr).trim();

    // Check for DD-MM-YYYY format
    const ddmmyyyy = endTarget.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    let endDate: Date;
    
    if (ddmmyyyy) {
      const timeMatch = endTarget.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i) || (examTimeStr && examTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i));
      let hours = 23;
      let minutes = 59;
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = parseInt(timeMatch[2], 10);
        const meridian = timeMatch[3]?.toUpperCase();
        if (meridian === "PM" && h < 12) h += 12;
        if (meridian === "AM" && h === 12) h = 0;
        hours = h;
        minutes = m;
      }
      endDate = new Date(parseInt(ddmmyyyy[3], 10), parseInt(ddmmyyyy[2], 10) - 1, parseInt(ddmmyyyy[1], 10), hours, minutes, 59);
    } else {
      // Check standard ISO / YYYY-MM-DD format e.g. "2026-08-10"
      const isIso = endTarget.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isIso) {
        endDate = new Date(parseInt(isIso[1], 10), parseInt(isIso[2], 10) - 1, parseInt(isIso[3], 10), 23, 59, 59);
      } else {
        endDate = new Date(endTarget);
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
        }
      }
    }

    if (!isNaN(endDate.getTime())) {
      return now.getTime() > endDate.getTime();
    }
  } catch {
    return false;
  }
  return false;
}

export function isExamRegistrationClosed(exam: { registration_closed?: boolean; date?: string; time?: string } | null | undefined): boolean {
  if (!exam) return true;
  if (exam.registration_closed) return true;
  return isExamDatePassed(exam.date, exam.time);
}
