import { getDomain } from "@/data/domains";
import { getTrainerForDomain } from "@/data/trainers";
import { FIFTEEN_DAY_PHASES } from "@/data/content";
import { addDays } from "@/lib/utils";
import type { ScheduleItem } from "@/types";

const PHASE_FOR_DAY = (day: number): string => {
  if (day <= 3) return FIFTEEN_DAY_PHASES[0].title;
  if (day <= 7) return FIFTEEN_DAY_PHASES[1].title;
  if (day <= 11) return FIFTEEN_DAY_PHASES[2].title;
  if (day <= 14) return FIFTEEN_DAY_PHASES[3].title;
  return FIFTEEN_DAY_PHASES[4].title;
};

const TYPE_FOR_DAY = (day: number): ScheduleItem["type"] => {
  if (day === 15) return "evaluation";
  if (day % 5 === 0) return "review";
  if (day >= 8 && day <= 11) return "workshop";
  return "session";
};

/**
 * Builds the 15-day schedule for an industry-led registration. The topics come
 * from the domain's own module list so the schedule always matches the track.
 */
export function buildSchedule(
  domainId: string | null | undefined,
  startDate: string | null | undefined,
): ScheduleItem[] {
  const domain = getDomain(domainId);
  if (!domain || !startDate) return [];
  const trainer = getTrainerForDomain(domainId);
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  const now = Date.now();

  return Array.from({ length: 15 }, (_, index) => {
    const day = index + 1;
    const date = addDays(start, index);
    const moduleForDay = domain.modules[Math.min(index, domain.modules.length - 1)];
    const type = TYPE_FOR_DAY(day);

    const topic =
      day === 15
        ? "Final Evaluation & Certificate Release"
        : type === "workshop"
          ? `Practical Workshop — ${moduleForDay.title}`
          : type === "review"
            ? `Review & Q&A — ${moduleForDay.title}`
            : moduleForDay.title;

    const dayStart = new Date(date);
    dayStart.setHours(18, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(19, 30, 0, 0);

    const status: ScheduleItem["status"] =
      now > dayEnd.getTime()
        ? "completed"
        : now >= dayStart.getTime()
          ? "live"
          : "upcoming";

    return {
      id: `${domain.id}-day-${day}`,
      day,
      date: date.toISOString(),
      topic,
      phase: PHASE_FOR_DAY(day),
      trainerId: trainer.id,
      time: "18:00 – 19:30 IST",
      status,
      type,
    };
  });
}
