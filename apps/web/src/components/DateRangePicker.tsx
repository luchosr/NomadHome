import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import type { BlockedRange } from "../api/listings.js";

// Parse "YYYY-MM-DD" as local midnight to avoid UTC offset shifting the date.
function toLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function toDateStr(date: Date): string {
  return date.toLocaleDateString("en-CA"); // yields YYYY-MM-DD in local time
}

interface Props {
  checkIn: string;
  checkOut: string;
  blockedRanges: BlockedRange[];
  onChange: (checkIn: string, checkOut: string) => void;
}

export function DateRangePicker({ checkIn, checkOut, blockedRanges, onChange }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDisabled = (date: Date): boolean => {
    if (date < today) return true;
    return blockedRanges.some((b) => {
      const start = toLocal(b.startDate);
      const end = toLocal(b.endDate);
      return date >= start && date < end;
    });
  };

  const selected: DateRange | undefined = checkIn
    ? { from: toLocal(checkIn), to: checkOut ? toLocal(checkOut) : undefined }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range?.from ? toDateStr(range.from) : "", range?.to ? toDateStr(range.to) : "");
  };

  return (
    <div
      style={
        {
          // Ember accent with stone range fill; text on ember is ink (paper on ember is 3.19:1)
          // and today's date is ink, because orange is never a text colour on paper.
          "--rdp-accent-color": "var(--ember)",
          "--rdp-accent-background-color": "var(--stone)",
          "--rdp-range_start-color": "var(--ink)",
          "--rdp-range_end-color": "var(--ink)",
          "--rdp-today-color": "var(--ink)",
        } as React.CSSProperties
      }
    >
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={isDisabled}
        excludeDisabled
        startMonth={today}
      />
    </div>
  );
}
