import { BarChart3, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";

/**
 * Public previews of the two college-facing surfaces.
 *
 * These are marketing illustrations, and they say so. The live figures are
 * behind the college login, computed from the institution's real cohort — the
 * PRD is explicit that real data is used only once the system is operational,
 * so nothing invented is presented here as an actual result.
 */

const DASHBOARD_TILES = [
  { label: "Students Enrolled", hint: "Whole-batch visibility" },
  { label: "Active", hint: "Currently progressing" },
  { label: "Completed", hint: "Requirements met" },
  { label: "Projects", hint: "Submitted and evaluated" },
  { label: "Avg Assessment", hint: "Cohort mean score" },
  { label: "Career Ready", hint: "Readiness of 75 or above" },
];

export function CampusDashboardPreview() {
  return (
    <div>
      <Reveal>
        <SectionHeading
          eyebrow="Roystian Campus Dashboard"
          title="See where your whole batch actually stands."
          description="Your placement team gets live data on student progress and career readiness — by department, by domain and by individual student."
        />
      </Reveal>

      <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_TILES.map((tile) => (
          <Reveal key={tile.label} child>
            <div className="lift-card rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start justify-between">
                <p className="text-[0.85rem] font-semibold text-foreground">
                  {tile.label}
                </p>
                <BarChart3
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-6 font-display text-3xl font-semibold text-muted-foreground/40">
                &mdash;
              </p>
              <p className="mt-2 text-[0.76rem] leading-relaxed text-muted-foreground">
                {tile.hint}
              </p>
            </div>
          </Reveal>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Figures populate from your own cohort once your institution is
          onboarded. We do not display sample numbers here.
        </p>
      </Reveal>
    </div>
  );
}

export function SkillGapPreview() {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
      <Reveal>
        <SectionHeading
          eyebrow="Institutional Skill Intelligence"
          title="A skill gap report, not just a completion list."
          description="The report ranks your cohort's strongest and weakest areas from the same five measures the student readiness score uses, then recommends interventions against the gaps it found."
        />
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2">
        <Reveal child>
          <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
              <h3 className="text-[0.9rem] font-semibold text-foreground">
                Student strengths
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The three areas where your students produce the strongest
              evidence, with the number of students behind each figure.
            </p>
          </div>
        </Reveal>

        <Reveal child>
          <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="h-4 w-4 text-warning-ink" aria-hidden="true" />
              <h3 className="text-[0.9rem] font-semibold text-foreground">
                Skill gaps
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The three weakest areas — the ones worth building a workshop
              around this semester.
            </p>
          </div>
        </Reveal>

        <Reveal child>
          <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <LineChart className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-[0.9rem] font-semibold text-foreground">
                Recommended interventions
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Each gap maps to a specific intervention — a bootcamp, a lab
              series, a challenge sprint, a mock interview drive or a mentored
              project — with the rationale and the delivery format stated.
            </p>
          </div>
        </Reveal>
      </Stagger>
    </div>
  );
}
