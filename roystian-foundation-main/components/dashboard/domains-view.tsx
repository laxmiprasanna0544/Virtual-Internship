"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  CreditCard,
  GraduationCap,
  Landmark,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DynamicIcon } from "@/components/shared/icon";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { PaymentProcessingDialog } from "@/components/checkout/payment-processing";
import { CompareProgramsButton } from "@/components/site/program-comparison";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAINS, getDomain } from "@/data/domains";
import { CLUSTERS } from "@/data/career-pathways";
import { PROGRAMS, getProgram } from "@/data/programs";
import { EXPERIENCE_LEVELS, EDUCATION_LEVELS } from "@/data/content";
import { buildRecommendation } from "@/lib/recommendation";
import { useStudentContext } from "@/lib/use-student";
import { PAYMENT_METHODS } from "@/lib/payments";
import { updateOwnProfile } from "@/lib/auth";
import { enrol, switchActiveDomain } from "@/lib/student-data";
import { formatINR, formatDate, cn } from "@/lib/utils";
import type {
  Domain,
  EducationLevel,
  ExperienceLevel,
  PaymentMethod,
  ProgramId,
  Registration,
} from "@/types";

type Step = "domains" | "experience" | "program" | "checkout" | "success";

export function DomainsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ctx = useStudentContext();

  const [step, setStep] = React.useState<Step>("domains");
  const [selectedDomainId, setSelectedDomainId] = React.useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = React.useState<ExperienceLevel>("beginner");
  const [selectedProgramId, setSelectedProgramId] = React.useState<ProgramId>("industry-led");
  const [activeCluster, setActiveCluster] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Student details for checkout (prefilled from current session)
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [city, setCity] = React.useState("");
  const [educationLevel, setEducationLevel] = React.useState<string>("undergraduate");

  // Payment method & simulation state
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = React.useState("rahul.sharma@okhdfcbank");
  const [cardNumber, setCardNumber] = React.useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = React.useState("12/28");
  const [cardCvv, setCardCvv] = React.useState("888");
  const [bank, setBank] = React.useState("hdfc");
  const [simulateFailure, setSimulateFailure] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [failureError, setFailureError] = React.useState<string | null>(null);

  // Success summary
  const [newRegistration, setNewRegistration] = React.useState<Registration | null>(null);

  // Prefill details from student context
  React.useEffect(() => {
    if (ctx.student) {
      setName(ctx.student.name || "");
      setEmail(ctx.student.email || "");
      setMobile(ctx.student.mobile || "");
      setCollege(ctx.student.college || "");
      setCourse(ctx.student.course || "");
      setCity(ctx.student.city || "");
      setEducationLevel(ctx.student.educationLevel || "undergraduate");
      if (ctx.student.experience) {
        setSelectedExperience(ctx.student.experience);
      }
    }
  }, [ctx.student]);

  // Handle URL pre-selection
  React.useEffect(() => {
    const domainFromUrl = searchParams.get("domain");
    if (domainFromUrl && getDomain(domainFromUrl)) {
      setSelectedDomainId(domainFromUrl);
      setStep("experience");
    }
  }, [searchParams]);

  if (!ctx.ready) return <LoadingState label="Loading domain catalogue" rows={3} />;
  if (!ctx.student) {
    return (
      <EmptyState
        title="Student account required"
        description="Please log in to browse and enroll in internship domains."
        actionLabel="Log In"
        actionHref="/login?next=/dashboard/domains"
      />
    );
  }

  const { student, registrations } = ctx;
  const enrolledDomainIds = new Set(registrations.map((r) => r.domainId));

  const filteredDomains = DOMAINS.filter((d) => {
    const matchesCluster = activeCluster === "all" || d.cluster === activeCluster;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.whatYouLearn.some((s: string) => s.toLowerCase().includes(q)) ||
      d.whatYouPractise.some((s: string) => s.toLowerCase().includes(q));
    return matchesCluster && matchesSearch;
  });

  const selectedDomain = selectedDomainId ? getDomain(selectedDomainId) : null;
  const selectedProgram = getProgram(selectedProgramId);
  const recommendation = selectedDomain
    ? buildRecommendation(
        selectedDomain.id,
        selectedExperience,
        educationLevel as any,
      )
    : null;

  function handleSelectDomainToEnroll(domainId: string) {
    setSelectedDomainId(domainId);
    setStep("experience");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSwitchActive(domainId: string) {
    if (!student) return;
    const targetDomain = getDomain(domainId);
    try {
      const success = await switchActiveDomain(domainId);
      if (success) {
        toast.success(`Switched active internship to ${targetDomain?.name ?? domainId}!`);
      } else {
        toast.error("That domain has no completed payment.");
      }
    } catch {
      toast.error("Unable to switch domain. Please try again.");
    }
  }

  function handleProceedToPayment() {
    if (!name.trim() || !email.trim() || !mobile.trim()) {
      toast.error("Please fill in your name, email, and mobile number.");
      return;
    }
    setFailureError(null);
    setIsProcessing(true);
  }

  async function handleSimulationComplete() {
    setIsProcessing(false);
    if (simulateFailure) {
      setFailureError(
        "Simulated payment declined. No amount has been charged. You can retry or uncheck the failure simulation box.",
      );
      toast.error("Payment failed: simulated failure");
      return;
    }

    try {
      if (!selectedDomain || !selectedProgram) return;

      const saved = await updateOwnProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        college: college.trim(),
        course: course.trim(),
        city: city.trim(),
        educationLevel: (educationLevel || student.educationLevel) as EducationLevel,
      });
      if (!saved.ok) throw new Error(saved.error);

      const registration = await enrol({
        domainId: selectedDomain.id,
        programId: selectedProgram.id,
        experience: selectedExperience,
        method: paymentMethod,
      });
      setNewRegistration(registration);
      setStep("success");
      toast.success(`Enrolled in ${selectedDomain.name} successfully!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Enrolment error:", err);
      setFailureError(
        err instanceof Error && err.message ? err.message : "Failed to complete registration. Please try again.",
      );
      toast.error("Registration failed");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Explore & Enroll in Domains"
        description="Expand your portfolio by adding new virtual internship domains to your account."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Explore & Enroll" },
        ]}
      />

      {/* Progress Stepper */}
      {step !== "domains" && step !== "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs sm:text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (step === "experience") setStep("domains");
              if (step === "program") setStep("experience");
              if (step === "checkout") setStep("program");
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex flex-1 items-center justify-center gap-2 text-center text-muted-foreground sm:gap-4">
            <span
              className={cn(
                "font-medium",
                step === "experience" && "font-semibold text-primary",
              )}
            >
              1. Experience & Track
            </span>
            <span>→</span>
            <span
              className={cn(
                "font-medium",
                step === "program" && "font-semibold text-primary",
              )}
            >
              2. Programme
            </span>
            <span>→</span>
            <span
              className={cn(
                "font-medium",
                step === "checkout" && "font-semibold text-primary",
              )}
            >
              3. Payment Gateway
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 1: DOMAIN LIST & EXPLORATION ────────────────────────────── */}
      {step === "domains" && (
        <div className="space-y-6">
          {/* Active / Enrolled summary strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Your Current Enrolment
              </p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <DynamicIcon name={ctx.domain?.icon ?? "Layers"} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {ctx.domain?.name ?? "No domain"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Internship · {registrations.length} total enrolled{" "}
                    {registrations.length === 1 ? "domain" : "domains"}
                  </p>
                </div>
              </div>
            </div>

            {registrations.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Switch domain:</span>
                {registrations.map((reg) => {
                  const regDom = getDomain(reg.domainId);
                  const isActive = reg.domainId === student.domainId;
                  return (
                    <Button
                      key={reg.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => !isActive && handleSwitchActive(reg.domainId)}
                      disabled={isActive}
                    >
                      <DynamicIcon name={regDom?.icon ?? "Layers"} className="h-3.5 w-3.5" />
                      {regDom?.shortName ?? reg.domainId}
                      {isActive && " (Active)"}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search and filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by domain, tech stack or keywords..."
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={activeCluster === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCluster("all")}
              >
                All (12)
              </Button>
              {CLUSTERS.map((cluster: string) => {
                const count = DOMAINS.filter((d) => d.cluster === cluster).length;
                return (
                  <Button
                    key={cluster}
                    variant={activeCluster === cluster ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCluster(cluster)}
                  >
                    {cluster} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDomains.map((domain) => {
              const isEnrolled = enrolledDomainIds.has(domain.id);
              const isActive = student.domainId === domain.id;

              return (
                <div
                  key={domain.id}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-soft transition-all",
                    isActive
                      ? "border-primary/50 bg-primary/[0.02] shadow-card ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DynamicIcon name={domain.icon} className="h-5 w-5" />
                      </span>
                      {isActive ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" /> Active Internship
                        </Badge>
                      ) : isEnrolled ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" /> Enrolled
                        </Badge>
                      ) : (
                        <Badge variant="outline">{domain.cluster}</Badge>
                      )}
                    </div>

                    <h3 className="mt-3.5 font-display text-base font-semibold text-foreground">
                      {domain.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {domain.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {domain.whatYouLearn.slice(0, 3).map((item: string) => (
                        <span
                          key={item}
                          className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        15-Day Curriculum · {domain.modules.length} Modules
                      </p>
                      <p className="mt-1 truncate text-[0.72rem]">
                        Capstone: {domain.practicalTask.title}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    {isActive ? (
                      <Button asChild className="w-full" size="sm" variant="outline">
                        <Link href="/dashboard/learning">
                          <BookOpen className="h-4 w-4" /> Go to Learning
                        </Link>
                      </Button>
                    ) : isEnrolled ? (
                      <Button
                        className="w-full"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSwitchActive(domain.id)}
                      >
                        Switch to this Domain
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={() => handleSelectDomainToEnroll(domain.id)}
                      >
                        Enroll in this Domain <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: EXPERIENCE LEVEL & RECOMMENDED TRACK ─────────────────── */}
      {step === "experience" && selectedDomain && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DynamicIcon name={selectedDomain.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Selected Domain</p>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {selectedDomain.name}
                </h3>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("domains")}>
              Change Domain
            </Button>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Select Your Current Experience Level
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We personalize your assessment rigor and recommended track based on your selection.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = selectedExperience === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSelectedExperience(level.value)}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-5 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/[0.04] shadow-card ring-1 ring-primary/40"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-semibold text-foreground">
                        {level.label}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-border pt-3 text-[0.72rem] text-muted-foreground">
                    <p>Effort: {level.effort}</p>
                    <p>Difficulty: {level.difficulty}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recommended Track Card */}
          {recommendation && (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                  Recommended Track Preview
                </h4>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                {recommendation.trackName}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {recommendation.rationale}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 text-xs border-t border-border pt-4">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-muted-foreground">Difficulty</p>
                  <p className="font-semibold text-foreground mt-0.5">{recommendation.difficulty}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-muted-foreground">Weekly Effort</p>
                  <p className="font-semibold text-foreground mt-0.5">{recommendation.effort}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-muted-foreground">Curriculum Length</p>
                  <p className="font-semibold text-foreground mt-0.5">15 Days · 10 Modules</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setStep("domains")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Domains
            </Button>
            <Button size="lg" onClick={() => setStep("program")}>
              Continue to Programme <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PROGRAMME SELECTION ─────────────────────────────────── */}
      {step === "program" && selectedDomain && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div>
              <p className="text-xs text-muted-foreground">Selected Track</p>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {selectedDomain.name} · {selectedExperience.toUpperCase()}
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("experience")}>
              Change Track
            </Button>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Choose Your Internship Programme
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Both tracks cover the identical 10-module curriculum and grant verified certificates upon meeting criteria.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {PROGRAMS.map((prog) => {
              const isSelected = selectedProgramId === prog.id;
              const isIndustryLed = prog.id === "industry-led";

              return (
                <div
                  key={prog.id}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-6 transition-all",
                    isSelected
                      ? "border-primary bg-primary/[0.03] shadow-card ring-2 ring-primary"
                      : "border-border bg-card shadow-soft hover:border-primary/40",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-lg font-semibold text-foreground">
                          {prog.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{prog.tagline}</p>
                      </div>
                      <span className="font-display text-2xl font-bold text-foreground">
                        {formatINR(prog.price)}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {prog.description}
                    </p>

                    <ul className="mt-5 space-y-2.5 text-xs">
                      {prog.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {isIndustryLed && (
                      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-primary leading-relaxed">
                        <p className="font-semibold">Important Guided Programme Requirement:</p>
                        <p className="mt-0.5 text-muted-foreground">
                          The certificate will be generated only after the completion of live classes, that is the duration period mentioned which is 15 days.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setSelectedProgramId(prog.id);
                        setStep("checkout");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {isSelected ? "Selected · Proceed to Checkout" : `Choose ${prog.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <CompareProgramsButton size="default" />
            <Button size="lg" onClick={() => setStep("checkout")}>
              Continue to Checkout <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: CHECKOUT & PAYMENT GATEWAY ────────────────────────────── */}
      {step === "checkout" && selectedDomain && selectedProgram && (
        <div className="space-y-6">
          {failureError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              <p className="font-semibold">Payment Unsuccessful</p>
              <p className="mt-1">{failureError}</p>
            </div>
          )}

          <div className="grid gap-7 lg:grid-cols-[1.3fr_1fr]">
            {/* Left: Details and Payment options */}
            <div className="space-y-6">
              {/* Student details */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Student Details
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm your enrolment profile for this domain.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="college">College / University</Label>
                    <Input
                      id="college"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. BMS College of Engineering"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="course">Degree / Course</Label>
                    <Input
                      id="course"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Payment Gateway
                  </h3>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> 256-bit Secure
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select payment mode to simulate online checkout.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = paymentMethod === m.value;
                    const Icon =
                      m.value === "upi"
                        ? Smartphone
                        : m.value === "card"
                        ? CreditCard
                        : Landmark;

                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaymentMethod(m.value)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all",
                          isSelected
                            ? "border-primary bg-primary/[0.05] ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className="mt-2 text-xs font-semibold text-foreground">
                          {m.label}
                        </span>
                        <span className="text-[0.68rem] text-muted-foreground">{m.hint}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Method specifics */}
                <div className="mt-5 border-t border-border pt-4">
                  {paymentMethod === "upi" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="upi">UPI ID / VPA</Label>
                        <Input
                          id="upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. student@okhdfcbank"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted px-2 py-1">Google Pay</span>
                        <span className="rounded-md bg-muted px-2 py-1">PhonePe</span>
                        <span className="rounded-md bg-muted px-2 py-1">Paytm</span>
                        <span className="rounded-md bg-muted px-2 py-1">BHIM UPI</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label htmlFor="cardno">Card Number</Label>
                        <Input
                          id="cardno"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 •••• •••• 4242"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                        <Input
                          id="expiry"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="888"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <div className="space-y-3">
                      <Label htmlFor="bank">Select Bank</Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger id="bank">
                          <SelectValue placeholder="Choose bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hdfc">HDFC Bank</SelectItem>
                          <SelectItem value="icici">ICICI Bank</SelectItem>
                          <SelectItem value="sbi">State Bank of India</SelectItem>
                          <SelectItem value="axis">Axis Bank</SelectItem>
                          <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Simulation controls */}
                <div className="mt-5 flex items-center space-x-2 border-t border-border pt-4">
                  <Checkbox
                    id="sim-fail"
                    checked={simulateFailure}
                    onCheckedChange={(v) => setSimulateFailure(Boolean(v))}
                  />
                  <Label htmlFor="sim-fail" className="text-xs text-muted-foreground font-normal">
                    Simulate a failed payment (for testing declined card / gateway failure)
                  </Label>
                </div>

                <Button
                  size="lg"
                  className="mt-6 w-full gap-2 text-base font-semibold"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  <Lock className="h-4 w-4" />
                  Pay {formatINR(selectedProgram.price)} Securely
                </Button>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Order Summary
                </h3>

                <div className="mt-4 flex items-center gap-3 border-b border-border pb-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <DynamicIcon name={selectedDomain.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      {selectedDomain.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedProgram.name} · {selectedExperience}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Programme Fee</span>
                    <span className="font-medium text-foreground">
                      {formatINR(selectedProgram.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST & Gateway Charges</span>
                    <span className="font-medium text-foreground">₹0 (Included)</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-display text-base font-bold text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatINR(selectedProgram.price)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-2 rounded-xl bg-muted/40 p-3.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">What you receive:</p>
                  <p className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" /> 10 comprehensive learning modules
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" /> Practical domain capstone submission
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" /> QR-verifiable certificate of completion
                  </p>
                  {selectedProgram.id === "industry-led" && (
                    <>
                      <p className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-primary" /> 15 days of live mentor sessions
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-primary" /> PehlaChance 1-month career accelerator
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment simulation modal */}
          <PaymentProcessingDialog
            open={isProcessing}
            amount={selectedProgram.price}
            method={paymentMethod}
            onComplete={handleSimulationComplete}
          />
        </div>
      )}

      {/* ── STEP 5: PAYMENT SUCCESS ─────────────────────────────────────── */}
      {step === "success" && selectedDomain && newRegistration && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-card text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <Badge variant="default" className="mb-2">
              Registration Confirmed
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Welcome to {selectedDomain.name}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment has been verified and your new virtual internship domain is active.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registration ID:</span>
              <span className="font-mono font-bold text-primary">
                {newRegistration.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain:</span>
              <span className="font-semibold text-foreground">{selectedDomain.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Programme:</span>
              <span className="font-semibold text-foreground">{selectedProgram?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold text-foreground">
                {formatINR(newRegistration.amount)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 p-4 text-xs text-muted-foreground text-left space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Automated Communications:
            </p>
            <p>✓ Welcome onboarding email dispatched to {email}</p>
            <p>✓ WhatsApp confirmation message with schedule link sent to {mobile}</p>
            <p>✓ Dashboard notifications and learning workspace initialized</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button asChild size="lg" className="flex-1 gap-2">
              <Link href="/dashboard/learning">
                <BookOpen className="h-4 w-4" /> Start Learning Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/dashboard">View Dashboard Overview</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
