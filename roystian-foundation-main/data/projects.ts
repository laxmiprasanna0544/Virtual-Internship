import type { ProjectBrief } from "@/types";

/**
 * Structured, industry-style project briefs.
 *
 * The distinction the PRD draws is deliberate: a practical task asks the
 * student to apply a concept, whereas a project hands them a problem
 * statement, a dataset, explicit requirements and the criteria they will be
 * marked against — then expects analysis, recommendations and a report back.
 *
 * Every domain carries a `core` brief (available on both programmes) and an
 * `advanced` brief (Industry-Led only, per the programme comparison).
 */

interface BriefSeed {
  domainId: string;
  core: Omit<ProjectBrief, "id" | "domainId" | "tier">;
  advanced: Omit<ProjectBrief, "id" | "domainId" | "tier">;
}

const STANDARD_DELIVERABLES = [
  "A written analysis explaining your approach and reasoning",
  "Results with clear, specific recommendations",
  "A project report suitable for a portfolio",
];

const seeds: BriefSeed[] = [
  {
    domainId: "ai-ml",
    core: {
      title: "Customer Churn Prediction",
      scenario:
        "A subscription business has been losing customers faster than it replaces them. Leadership wants to know who is likely to leave and what to do about it.",
      problemStatement:
        "Using the provided subscription dataset, identify which customers are most at risk of cancelling in the next billing cycle, and explain which factors drive that risk.",
      dataset: {
        name: "subscriptions_12mo.csv",
        description:
          "Twelve months of anonymised subscription records — tenure, plan, monthly charge, support contacts, payment method and churn flag.",
        rows: "≈7,000 rows · 21 columns",
        format: "CSV",
      },
      requirements: [
        "Profile the dataset and state the target variable and class balance",
        "Handle missing values and encode categorical features, explaining each choice",
        "Train at least two models and compare them on the same holdout split",
        "Report precision, recall and F1 — not accuracy alone — and justify which matters here",
        "Identify the five features most associated with churn",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Data preparation",
          weight: 20,
          detail: "Cleaning and feature decisions are deliberate and explained.",
        },
        {
          label: "Modelling approach",
          weight: 25,
          detail: "Model choice suits the problem; comparison is fair.",
        },
        {
          label: "Evaluation rigour",
          weight: 25,
          detail: "Correct metrics for an imbalanced problem, read correctly.",
        },
        {
          label: "Business recommendation",
          weight: 20,
          detail: "Findings become an action the business could actually take.",
        },
        {
          label: "Report clarity",
          weight: 10,
          detail: "A non-technical reader can follow the argument.",
        },
      ],
      skillsDemonstrated: [
        "Data preparation",
        "Model evaluation",
        "Feature analysis",
        "Business communication",
      ],
      estimatedHours: 10,
    },
    advanced: {
      title: "Model Fairness & Deployment Readiness Review",
      scenario:
        "Your churn model is about to be used to decide who receives retention discounts. Compliance has asked for a review before it goes live.",
      problemStatement:
        "Assess whether the model behaves equitably across customer segments, and recommend whether it is safe to deploy.",
      dataset: {
        name: "subscriptions_12mo_segmented.csv",
        description:
          "The churn dataset extended with region, tenure band and account-size segments.",
        rows: "≈7,000 rows · 25 columns",
        format: "CSV",
      },
      requirements: [
        "Measure model performance separately for each segment",
        "Identify any segment where the error profile differs materially",
        "Explain the business consequence of each disparity you find",
        "Recommend mitigations, with their trade-offs stated honestly",
        "Give a clear deploy / do-not-deploy recommendation and defend it",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Segment analysis",
          weight: 30,
          detail: "Disparities are found and quantified, not asserted.",
        },
        {
          label: "Consequence reasoning",
          weight: 25,
          detail: "Connects a statistical gap to a real-world harm.",
        },
        {
          label: "Mitigation quality",
          weight: 25,
          detail: "Proposals are concrete and their costs acknowledged.",
        },
        {
          label: "Recommendation",
          weight: 20,
          detail: "A defensible position, not a hedge.",
        },
      ],
      skillsDemonstrated: [
        "Responsible AI",
        "Segment analysis",
        "Risk assessment",
        "Technical judgement",
      ],
      estimatedHours: 14,
    },
  },
  {
    domainId: "data-analytics",
    core: {
      title: "Retail Sales Performance Analysis",
      scenario:
        "A retail chain cannot explain why revenue is flat while footfall is up. The analytics team has been asked for an answer by Friday.",
      problemStatement:
        "Analyse eighteen months of transaction data to explain the gap between rising footfall and flat revenue, and recommend where to intervene.",
      dataset: {
        name: "retail_transactions.csv",
        description:
          "Transaction-level retail data across stores, categories and time — basket value, units, discount, store and date.",
        rows: "≈45,000 rows · 14 columns",
        format: "CSV",
      },
      requirements: [
        "Establish the revenue trend and decompose it into price, volume and mix",
        "Identify which stores or categories account for most of the gap",
        "Quantify the effect of discounting on basket value",
        "Build at least three charts, each answering one specific question",
        "State the single highest-impact intervention you would recommend",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Analytical decomposition",
          weight: 30,
          detail: "The gap is explained mechanically, not described.",
        },
        {
          label: "Evidence quality",
          weight: 25,
          detail: "Claims trace back to the data.",
        },
        {
          label: "Visual design",
          weight: 20,
          detail: "Each chart answers a question and is readable.",
        },
        {
          label: "Recommendation",
          weight: 25,
          detail: "Specific, prioritised and justified.",
        },
      ],
      skillsDemonstrated: [
        "Exploratory analysis",
        "Data visualisation",
        "Commercial reasoning",
        "Reporting",
      ],
      estimatedHours: 9,
    },
    advanced: {
      title: "Executive Reporting Layer",
      scenario:
        "The weekly trading meeting runs on a spreadsheet nobody trusts. You have been asked to replace it.",
      problemStatement:
        "Design a reporting layer that gives the trading meeting a single reliable view, and document the metric definitions behind it.",
      dataset: {
        name: "retail_transactions_extended.csv",
        description:
          "The transaction dataset joined to stock, returns and staffing tables.",
        rows: "≈45,000 rows across 4 tables",
        format: "CSV",
      },
      requirements: [
        "Define each metric precisely, including edge cases such as returns",
        "Design the report layout and justify what is on the first screen",
        "Identify the data quality issues that would break the report",
        "Specify a refresh and ownership model",
        "Show the report answering three real trading questions",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Metric definitions",
          weight: 30,
          detail: "Unambiguous, including the awkward cases.",
        },
        {
          label: "Information design",
          weight: 25,
          detail: "The first screen answers the most important question.",
        },
        {
          label: "Data quality handling",
          weight: 25,
          detail: "Failure modes are anticipated.",
        },
        {
          label: "Operational model",
          weight: 20,
          detail: "Someone could actually run this weekly.",
        },
      ],
      skillsDemonstrated: [
        "Metric design",
        "Information architecture",
        "Data governance",
        "Stakeholder communication",
      ],
      estimatedHours: 13,
    },
  },
  {
    domainId: "business-analytics",
    core: {
      title: "Market Entry Decision Case",
      scenario:
        "A D2C brand has budget to enter one of three new cities and cannot afford to be wrong.",
      problemStatement:
        "Build the analytical case for which city the brand should enter, and state what would change your answer.",
      dataset: {
        name: "market_entry_inputs.csv",
        description:
          "City-level demand indicators, cost structures, competitor density and logistics data for three candidate cities.",
        rows: "3 cities · 34 indicators",
        format: "CSV",
      },
      requirements: [
        "Define the decision criteria before looking at the answer",
        "Build a comparable model across all three cities",
        "Run a sensitivity check on your two biggest assumptions",
        "State the break-even point for the recommended city",
        "Name the evidence that would reverse your recommendation",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Framing",
          weight: 25,
          detail: "Criteria are set before the conclusion.",
        },
        {
          label: "Model quality",
          weight: 25,
          detail: "Comparable, transparent and arithmetically sound.",
        },
        {
          label: "Sensitivity analysis",
          weight: 25,
          detail: "Assumptions are tested rather than asserted.",
        },
        {
          label: "Decision quality",
          weight: 25,
          detail: "A clear call with its conditions stated.",
        },
      ],
      skillsDemonstrated: [
        "Decision modelling",
        "Sensitivity analysis",
        "Commercial judgement",
        "Executive communication",
      ],
      estimatedHours: 10,
    },
    advanced: {
      title: "Unit Economics Turnaround Plan",
      scenario:
        "The brand is growing revenue but losing money on every order. The board wants a path to contribution positive within two quarters.",
      problemStatement:
        "Diagnose where unit economics break down and build a costed plan to reach contribution-positive orders.",
      dataset: {
        name: "unit_economics.csv",
        description:
          "Order-level revenue, COGS, delivery, returns, discount and acquisition cost.",
        rows: "≈20,000 orders · 17 columns",
        format: "CSV",
      },
      requirements: [
        "Build the contribution margin bridge per order",
        "Segment orders to find where losses concentrate",
        "Cost each proposed intervention and estimate its margin effect",
        "Sequence the plan across two quarters with checkpoints",
        "State the risk of each intervention to revenue",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Diagnosis",
          weight: 30,
          detail: "Losses are located precisely.",
        },
        {
          label: "Intervention costing",
          weight: 25,
          detail: "Each action carries a number.",
        },
        {
          label: "Sequencing",
          weight: 25,
          detail: "The plan is executable in order.",
        },
        {
          label: "Risk handling",
          weight: 20,
          detail: "Revenue downside is acknowledged.",
        },
      ],
      skillsDemonstrated: [
        "Unit economics",
        "Margin analysis",
        "Planning",
        "Risk assessment",
      ],
      estimatedHours: 14,
    },
  },
  {
    domainId: "full-stack-development",
    core: {
      title: "Internship Tracker Application",
      scenario:
        "A college placement cell tracks student applications in a shared spreadsheet that keeps breaking.",
      problemStatement:
        "Build a working application that lets a placement officer record students, track application stages and see where the cohort stands.",
      dataset: {
        name: "placement_seed.json",
        description:
          "Seed records for students, companies and application stages to build against.",
        rows: "120 students · 40 companies",
        format: "JSON",
      },
      requirements: [
        "Design the data model before writing interface code",
        "Implement create, read, update and delete for applications",
        "Handle loading, empty and error states explicitly",
        "Add one aggregate view showing cohort progress",
        "Make it usable on a phone",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Data modelling",
          weight: 20,
          detail: "The schema fits the problem and will extend.",
        },
        {
          label: "Functional completeness",
          weight: 25,
          detail: "The core flows work end to end.",
        },
        {
          label: "State handling",
          weight: 20,
          detail: "Loading, empty and error paths are all handled.",
        },
        {
          label: "Code quality",
          weight: 20,
          detail: "Readable, consistent, reviewable.",
        },
        {
          label: "Responsive design",
          weight: 15,
          detail: "Works on a small screen without breaking.",
        },
      ],
      skillsDemonstrated: [
        "Data modelling",
        "CRUD implementation",
        "State management",
        "Responsive UI",
      ],
      estimatedHours: 14,
    },
    advanced: {
      title: "Authentication & Role-Based Access",
      scenario:
        "The tracker now holds personal student data. Three different roles need three different views, and the data must not leak between them.",
      problemStatement:
        "Add authentication and role-based access control to the tracker without breaking existing functionality.",
      dataset: {
        name: "roles_matrix.json",
        description:
          "The permission matrix for student, officer and administrator roles.",
        rows: "3 roles · 18 permissions",
        format: "JSON",
      },
      requirements: [
        "Implement session handling with a clear expiry policy",
        "Enforce permissions at the data layer, not only in the interface",
        "Show that a student cannot reach another student's record",
        "Handle the unauthorised and expired-session cases gracefully",
        "Document the threat you are defending against",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Access enforcement",
          weight: 35,
          detail: "Permissions hold at the data layer.",
        },
        {
          label: "Session handling",
          weight: 25,
          detail: "Expiry and renewal behave correctly.",
        },
        {
          label: "Failure paths",
          weight: 20,
          detail: "Unauthorised access fails safely and clearly.",
        },
        {
          label: "Security reasoning",
          weight: 20,
          detail: "The student can explain what they defended against.",
        },
      ],
      skillsDemonstrated: [
        "Authentication",
        "Authorisation",
        "Security reasoning",
        "Refactoring",
      ],
      estimatedHours: 16,
    },
  },
  {
    domainId: "python-development",
    core: {
      title: "Report Automation Pipeline",
      scenario:
        "An operations team spends six hours every Monday assembling the same report by hand.",
      problemStatement:
        "Automate the weekly report end to end, from raw files to a formatted output, with failures reported rather than silent.",
      dataset: {
        name: "weekly_ops_files.zip",
        description:
          "Four weeks of raw operational exports, including two deliberately malformed files.",
        rows: "4 weeks · 12 files",
        format: "CSV / XLSX",
      },
      requirements: [
        "Read every input format the team actually receives",
        "Validate inputs and fail loudly on malformed data",
        "Produce the formatted output file automatically",
        "Write unit tests for the transformation logic",
        "Log what ran, what was skipped and why",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Correctness",
          weight: 25,
          detail: "Output matches the manual process.",
        },
        {
          label: "Error handling",
          weight: 25,
          detail: "Malformed inputs are caught, not swallowed.",
        },
        {
          label: "Testing",
          weight: 25,
          detail: "The logic is covered by meaningful tests.",
        },
        {
          label: "Code structure",
          weight: 25,
          detail: "Modules, not one long script.",
        },
      ],
      skillsDemonstrated: [
        "Automation",
        "Data validation",
        "Unit testing",
        "Error handling",
      ],
      estimatedHours: 11,
    },
    advanced: {
      title: "Resilient API Integration Service",
      scenario:
        "The pipeline now depends on a third-party API that is slow, rate-limited and occasionally down.",
      problemStatement:
        "Build an integration layer that keeps the pipeline working when the upstream API misbehaves.",
      dataset: {
        name: "api_contract.json",
        description:
          "The upstream API contract, including its rate limits and documented failure responses.",
        rows: "9 endpoints",
        format: "JSON",
      },
      requirements: [
        "Implement retry with backoff and a cap",
        "Respect the documented rate limit without hard-coding sleeps",
        "Cache responses where the contract allows it",
        "Degrade gracefully when the API is fully unavailable",
        "Prove the behaviour with tests that simulate failure",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Resilience",
          weight: 30,
          detail: "Failures are absorbed, not propagated blindly.",
        },
        {
          label: "Rate limit handling",
          weight: 25,
          detail: "Correct and adaptive.",
        },
        {
          label: "Test realism",
          weight: 25,
          detail: "Failure is simulated, not assumed away.",
        },
        {
          label: "Design",
          weight: 20,
          detail: "The integration is isolated from business logic.",
        },
      ],
      skillsDemonstrated: [
        "API integration",
        "Resilience patterns",
        "Caching",
        "Test design",
      ],
      estimatedHours: 15,
    },
  },
  {
    domainId: "java-development",
    core: {
      title: "Library Lending System",
      scenario:
        "A college library needs to replace a paper register that cannot tell anyone which books are overdue.",
      problemStatement:
        "Design and build a lending system that models members, titles, copies and loans, and can answer who has what.",
      dataset: {
        name: "library_catalogue.csv",
        description:
          "Catalogue records with titles, copies, members and historical loans.",
        rows: "≈2,400 titles · 800 members",
        format: "CSV",
      },
      requirements: [
        "Model the domain with classes and interfaces, not one large class",
        "Enforce lending rules such as copy limits and overdue blocks",
        "Handle the concurrent-borrow case correctly",
        "Write unit tests for every lending rule",
        "Provide a query for all overdue loans",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Object-oriented design",
          weight: 30,
          detail: "Responsibilities are separated sensibly.",
        },
        {
          label: "Rule enforcement",
          weight: 25,
          detail: "Business rules hold under edge cases.",
        },
        {
          label: "Testing",
          weight: 25,
          detail: "Rules are covered, including failure cases.",
        },
        {
          label: "Code quality",
          weight: 20,
          detail: "Idiomatic, readable Java.",
        },
      ],
      skillsDemonstrated: [
        "Object-oriented design",
        "Business rule modelling",
        "Unit testing",
        "Collections",
      ],
      estimatedHours: 12,
    },
    advanced: {
      title: "Legacy Refactor & Extension",
      scenario:
        "You inherit a working but poorly structured version of the lending system, and a request for a reservations feature.",
      problemStatement:
        "Refactor the existing codebase so the reservations feature can be added safely, then add it.",
      dataset: {
        name: "legacy_lending_src.zip",
        description:
          "A working implementation with tangled responsibilities and no tests.",
        rows: "≈1,800 lines",
        format: "Java source",
      },
      requirements: [
        "Characterise existing behaviour with tests before changing anything",
        "Refactor in small steps, keeping tests green",
        "Add reservations without breaking lending",
        "Document each refactoring decision and why",
        "Show the before and after structure",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Safety net first",
          weight: 30,
          detail: "Tests exist before the refactor begins.",
        },
        {
          label: "Refactoring discipline",
          weight: 25,
          detail: "Small, reversible steps.",
        },
        {
          label: "Feature correctness",
          weight: 25,
          detail: "Reservations work and lending still does.",
        },
        {
          label: "Reasoning",
          weight: 20,
          detail: "Decisions are explained, not just made.",
        },
      ],
      skillsDemonstrated: [
        "Refactoring",
        "Characterisation testing",
        "Legacy code",
        "Design improvement",
      ],
      estimatedHours: 16,
    },
  },
  {
    domainId: "software-testing",
    core: {
      title: "Test Strategy for a Checkout Flow",
      scenario:
        "An e-commerce checkout has shipped three payment bugs in two months. QA has been asked what went wrong.",
      problemStatement:
        "Build a complete test strategy for the checkout flow and find the defects the existing suite misses.",
      dataset: {
        name: "checkout_spec_and_build.zip",
        description:
          "The checkout specification, the current test suite and a build containing seeded defects.",
        rows: "24 requirements · 11 existing tests",
        format: "Spec + build",
      },
      requirements: [
        "Derive test cases from the specification, including ambiguous clauses",
        "Identify what the existing suite does not cover",
        "Find and report at least three defects with reproduction steps",
        "Decide what to automate and justify the split",
        "Give a release-risk assessment",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Coverage reasoning",
          weight: 25,
          detail: "Gaps are identified systematically.",
        },
        {
          label: "Defect reports",
          weight: 30,
          detail: "Reproducible, precise, correctly prioritised.",
        },
        {
          label: "Automation judgement",
          weight: 25,
          detail: "The split is justified, not reflexive.",
        },
        {
          label: "Risk assessment",
          weight: 20,
          detail: "A clear, defensible release position.",
        },
      ],
      skillsDemonstrated: [
        "Test design",
        "Defect reporting",
        "Automation strategy",
        "Risk assessment",
      ],
      estimatedHours: 10,
    },
    advanced: {
      title: "Automated Regression Suite",
      scenario:
        "Checkout changes weekly and manual regression now takes two days the team does not have.",
      problemStatement:
        "Build an automated regression suite that runs in under ten minutes and is trusted enough to gate a release.",
      dataset: {
        name: "checkout_build_matrix.zip",
        description:
          "Three builds of the checkout flow — one clean, two with regressions.",
        rows: "3 builds",
        format: "Build artefacts",
      },
      requirements: [
        "Automate the highest-risk paths first and say why they are highest risk",
        "Keep total runtime under ten minutes",
        "Eliminate flakiness — a failure must mean a defect",
        "Correctly pass the clean build and fail both regressed builds",
        "Report results in a form a release manager can read",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Risk prioritisation",
          weight: 25,
          detail: "The right paths were automated first.",
        },
        {
          label: "Reliability",
          weight: 30,
          detail: "No flaky tests; failures are real.",
        },
        {
          label: "Detection accuracy",
          weight: 25,
          detail: "Catches both regressions, passes the clean build.",
        },
        {
          label: "Reporting",
          weight: 20,
          detail: "Results are actionable.",
        },
      ],
      skillsDemonstrated: [
        "Test automation",
        "Flakiness elimination",
        "CI thinking",
        "Release reporting",
      ],
      estimatedHours: 15,
    },
  },
  {
    domainId: "software-development",
    core: {
      title: "Feature Delivery in an Existing Codebase",
      scenario:
        "You join a team mid-sprint and are handed a feature request against code you have never seen.",
      problemStatement:
        "Deliver the requested feature in the existing codebase, following the team's conventions rather than your own.",
      dataset: {
        name: "team_codebase.zip",
        description:
          "A working application with an established style, test suite and contribution guide.",
        rows: "≈4,000 lines · 38 tests",
        format: "Source",
      },
      requirements: [
        "Read the contribution guide and follow it",
        "Break the feature into reviewable commits",
        "Add tests matching the existing suite's style",
        "Keep the whole suite green",
        "Write the pull request description a reviewer would want",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Convention adherence",
          weight: 25,
          detail: "The change reads like the surrounding code.",
        },
        {
          label: "Commit hygiene",
          weight: 25,
          detail: "Each commit is a reviewable unit.",
        },
        {
          label: "Test quality",
          weight: 25,
          detail: "Tests match house style and cover the change.",
        },
        {
          label: "Communication",
          weight: 25,
          detail: "The pull request explains what and why.",
        },
      ],
      skillsDemonstrated: [
        "Codebase navigation",
        "Version control",
        "Testing",
        "Technical writing",
      ],
      estimatedHours: 12,
    },
    advanced: {
      title: "Production Incident Investigation",
      scenario:
        "A service degraded for forty minutes last night. You have the logs, the metrics and an expectation of a written post-mortem.",
      problemStatement:
        "Determine the root cause of the incident and produce a blameless post-mortem with concrete preventive actions.",
      dataset: {
        name: "incident_artifacts.zip",
        description:
          "Application logs, metric exports, deploy history and the on-call timeline.",
        rows: "≈180,000 log lines",
        format: "Logs + CSV",
      },
      requirements: [
        "Build a timeline from the evidence, not from assumption",
        "Distinguish the trigger from the underlying cause",
        "Explain why existing monitoring did not catch it sooner",
        "Propose preventive actions with owners and effort estimates",
        "Keep the write-up blameless and factual",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Evidence handling",
          weight: 30,
          detail: "Conclusions trace to log or metric evidence.",
        },
        {
          label: "Root cause analysis",
          weight: 30,
          detail: "Trigger and cause are correctly separated.",
        },
        {
          label: "Preventive actions",
          weight: 25,
          detail: "Specific, owned and proportionate.",
        },
        {
          label: "Write-up quality",
          weight: 15,
          detail: "Blameless, clear, useful to the team.",
        },
      ],
      skillsDemonstrated: [
        "Debugging",
        "Log analysis",
        "Root cause analysis",
        "Incident communication",
      ],
      estimatedHours: 13,
    },
  },
  {
    domainId: "sales-marketing",
    core: {
      title: "Campaign Funnel Diagnosis",
      scenario:
        "A campaign spent its entire budget, generated plenty of traffic and produced almost no qualified leads.",
      problemStatement:
        "Find where the funnel leaks, quantify the loss at each stage, and recommend what to change before the next campaign.",
      dataset: {
        name: "campaign_funnel.csv",
        description:
          "Channel-level spend, impressions, clicks, sign-ups, qualified leads and closed deals.",
        rows: "≈12,000 rows · 16 columns",
        format: "CSV",
      },
      requirements: [
        "Build the full funnel with conversion rates at every stage",
        "Identify the stage responsible for most of the loss",
        "Compare channels on cost per qualified lead, not cost per click",
        "Distinguish a traffic quality problem from a landing page problem",
        "Recommend a reallocated budget with expected effect",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Funnel construction",
          weight: 25,
          detail: "Stages and rates are computed correctly.",
        },
        {
          label: "Diagnosis",
          weight: 30,
          detail: "The real bottleneck is identified and evidenced.",
        },
        {
          label: "Channel economics",
          weight: 25,
          detail: "Judged on qualified outcomes, not vanity metrics.",
        },
        {
          label: "Recommendation",
          weight: 20,
          detail: "Reallocation is specific and justified.",
        },
      ],
      skillsDemonstrated: [
        "Funnel analysis",
        "Channel economics",
        "Campaign strategy",
        "Data-led recommendation",
      ],
      estimatedHours: 9,
    },
    advanced: {
      title: "Positioning & Go-To-Market Plan",
      scenario:
        "The product is good, the category is crowded, and nobody can explain in one sentence why they should buy.",
      problemStatement:
        "Develop positioning that differentiates the product and a ninety-day go-to-market plan to take it to the market.",
      dataset: {
        name: "market_research.zip",
        description:
          "Competitor messaging, win/loss interviews and customer survey responses.",
        rows: "14 competitors · 40 interviews",
        format: "CSV + transcripts",
      },
      requirements: [
        "Map competitor positioning and find the genuine gap",
        "Write positioning that a sceptical buyer would accept",
        "Define the target segment precisely enough to buy media against",
        "Build a ninety-day plan with channels, messages and milestones",
        "State how you will know within thirty days if it is wrong",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Competitive analysis",
          weight: 25,
          detail: "The gap is real, not invented.",
        },
        {
          label: "Positioning quality",
          weight: 30,
          detail: "Specific, defensible, survives scepticism.",
        },
        {
          label: "Plan executability",
          weight: 25,
          detail: "Someone could run this on Monday.",
        },
        {
          label: "Falsifiability",
          weight: 20,
          detail: "Early failure signals are defined.",
        },
      ],
      skillsDemonstrated: [
        "Positioning",
        "Competitive analysis",
        "Go-to-market planning",
        "Segmentation",
      ],
      estimatedHours: 14,
    },
  },
  {
    domainId: "iot-electronics",
    core: {
      title: "Environmental Monitoring Node",
      scenario:
        "A campus wants to know whether its lecture halls are too warm and too stuffy to concentrate in.",
      problemStatement:
        "Design a sensor node that measures temperature, humidity and CO₂ reliably, and gets that data somewhere useful.",
      dataset: {
        name: "sensor_specs_and_logs.zip",
        description:
          "Component datasheets and two weeks of reference sensor logs including dropout periods.",
        rows: "≈40,000 readings",
        format: "PDF + CSV",
      },
      requirements: [
        "Specify the circuit and justify each component choice",
        "Define the sampling rate against power and accuracy needs",
        "Handle sensor dropout without corrupting the record",
        "Design the data path from device to storage",
        "Estimate battery life and show the calculation",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Circuit design",
          weight: 25,
          detail: "Components are chosen for stated reasons.",
        },
        {
          label: "Sampling strategy",
          weight: 20,
          detail: "Balances accuracy against power.",
        },
        {
          label: "Failure handling",
          weight: 25,
          detail: "Dropouts are detected and recorded honestly.",
        },
        {
          label: "Power budget",
          weight: 30,
          detail: "The calculation is shown and plausible.",
        },
      ],
      skillsDemonstrated: [
        "Circuit design",
        "Sensor integration",
        "Power budgeting",
        "Data pipeline design",
      ],
      estimatedHours: 12,
    },
    advanced: {
      title: "Field Deployment & Reliability Plan",
      scenario:
        "Twelve nodes go outdoors across campus for six months with no maintenance budget.",
      problemStatement:
        "Plan the deployment so the fleet survives six months unattended, and specify how you will know when a node dies.",
      dataset: {
        name: "deployment_conditions.csv",
        description:
          "Site conditions, network coverage and seasonal weather data for twelve locations.",
        rows: "12 sites · 6 months",
        format: "CSV",
      },
      requirements: [
        "Assess each site for power, connectivity and environmental risk",
        "Specify enclosure and mounting against the conditions",
        "Design a heartbeat scheme that distinguishes dead from unreachable",
        "Plan over-the-air updates and their rollback",
        "Give an expected failure rate with reasoning",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Site assessment",
          weight: 25,
          detail: "Risks are site-specific, not generic.",
        },
        {
          label: "Reliability design",
          weight: 30,
          detail: "The fleet degrades gracefully.",
        },
        {
          label: "Monitoring",
          weight: 25,
          detail: "Dead and unreachable are distinguishable.",
        },
        {
          label: "Update strategy",
          weight: 20,
          detail: "Safe, with a rollback path.",
        },
      ],
      skillsDemonstrated: [
        "Deployment planning",
        "Reliability engineering",
        "Remote monitoring",
        "Risk assessment",
      ],
      estimatedHours: 14,
    },
  },
  {
    domainId: "mechanical-engineering",
    core: {
      title: "Bracket Design & Validation",
      scenario:
        "A mounting bracket keeps failing in the field and nobody documented why the original was designed the way it was.",
      problemStatement:
        "Redesign the bracket to survive the real load case, and show your work.",
      dataset: {
        name: "bracket_requirements.zip",
        description:
          "Load cases, material options, failure photographs and the original drawing.",
        rows: "4 load cases · 6 materials",
        format: "PDF + DWG",
      },
      requirements: [
        "Establish the governing load case from the evidence",
        "Select a material and justify it against cost and manufacturability",
        "Produce a dimensioned drawing with tolerances",
        "Show the stress calculation and safety factor",
        "Explain why the original design failed",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Load analysis",
          weight: 25,
          detail: "The governing case is correctly identified.",
        },
        {
          label: "Material selection",
          weight: 20,
          detail: "Justified against real constraints.",
        },
        {
          label: "Drawing quality",
          weight: 25,
          detail: "Manufacturable, with sensible tolerances.",
        },
        {
          label: "Failure explanation",
          weight: 30,
          detail: "The original failure is explained mechanically.",
        },
      ],
      skillsDemonstrated: [
        "Design for load",
        "Material selection",
        "Technical drawing",
        "Failure analysis",
      ],
      estimatedHours: 12,
    },
    advanced: {
      title: "Design for Manufacture Review",
      scenario:
        "The redesigned bracket works but quotes came back at three times the target cost.",
      problemStatement:
        "Re-engineer the design for manufacturability without losing structural performance.",
      dataset: {
        name: "manufacturing_quotes.csv",
        description:
          "Supplier quotes broken down by process, tooling, material and volume.",
        rows: "5 suppliers · 3 processes",
        format: "CSV",
      },
      requirements: [
        "Identify which design features drive most of the cost",
        "Propose changes and quantify the saving for each",
        "Verify structural performance is retained after each change",
        "Recommend a process for the stated production volume",
        "State what you would not change, and why",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Cost driver analysis",
          weight: 30,
          detail: "Cost is traced to specific features.",
        },
        {
          label: "Design changes",
          weight: 25,
          detail: "Each change carries a quantified saving.",
        },
        {
          label: "Performance retention",
          weight: 25,
          detail: "Structural verification is shown.",
        },
        {
          label: "Process selection",
          weight: 20,
          detail: "Appropriate to the volume.",
        },
      ],
      skillsDemonstrated: [
        "Design for manufacture",
        "Cost engineering",
        "Process selection",
        "Trade-off analysis",
      ],
      estimatedHours: 14,
    },
  },
  {
    domainId: "sustainability",
    core: {
      title: "Campus Carbon Baseline",
      scenario:
        "A college has committed publicly to reducing emissions but has never measured them.",
      problemStatement:
        "Build a defensible carbon baseline for the campus and identify where the largest reductions are available.",
      dataset: {
        name: "campus_utilities.csv",
        description:
          "Two years of electricity, fuel, water, waste and travel records — with gaps.",
        rows: "≈9,000 records · 11 columns",
        format: "CSV",
      },
      requirements: [
        "Classify emissions by scope and state your boundary",
        "Handle the data gaps explicitly rather than ignoring them",
        "Convert to CO₂e with stated emission factors and sources",
        "Rank reduction opportunities by tonnes saved per rupee spent",
        "State the uncertainty in your baseline",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Boundary and scoping",
          weight: 25,
          detail: "Clear, defensible, conventionally correct.",
        },
        {
          label: "Data gap handling",
          weight: 25,
          detail: "Gaps are estimated transparently.",
        },
        {
          label: "Conversion rigour",
          weight: 20,
          detail: "Factors are cited and correctly applied.",
        },
        {
          label: "Prioritisation",
          weight: 30,
          detail: "Opportunities ranked on real cost-effectiveness.",
        },
      ],
      skillsDemonstrated: [
        "Carbon accounting",
        "Data estimation",
        "Impact prioritisation",
        "Technical reporting",
      ],
      estimatedHours: 11,
    },
    advanced: {
      title: "Intervention Impact Verification",
      scenario:
        "The campus installed rooftop solar and claims a forty percent emissions reduction. The claim has not been checked.",
      problemStatement:
        "Verify whether the claimed reduction is real, and report what the defensible figure actually is.",
      dataset: {
        name: "post_intervention.csv",
        description:
          "Generation data, grid draw, weather normalisation inputs and occupancy records.",
        rows: "18 months post-install",
        format: "CSV",
      },
      requirements: [
        "Normalise for weather and occupancy before comparing periods",
        "Separate the solar effect from unrelated behaviour change",
        "State the defensible reduction figure with its confidence interval",
        "Identify what would make the claim unsupportable",
        "Recommend what to measure going forward",
      ],
      deliverables: STANDARD_DELIVERABLES,
      evaluationCriteria: [
        {
          label: "Normalisation",
          weight: 30,
          detail: "Confounders are handled properly.",
        },
        {
          label: "Attribution",
          weight: 25,
          detail: "The solar effect is isolated.",
        },
        {
          label: "Honest reporting",
          weight: 25,
          detail: "Uncertainty is stated, not buried.",
        },
        {
          label: "Forward measurement",
          weight: 20,
          detail: "Practical and sufficient.",
        },
      ],
      skillsDemonstrated: [
        "Impact verification",
        "Statistical normalisation",
        "Claim assessment",
        "ESG reporting",
      ],
      estimatedHours: 13,
    },
  },
];

function toBrief(
  seed: BriefSeed,
  tier: "core" | "advanced",
): ProjectBrief {
  const source = tier === "core" ? seed.core : seed.advanced;
  return {
    id: `${seed.domainId}-project-${tier}`,
    domainId: seed.domainId,
    tier,
    ...source,
  };
}

export const PROJECTS: ProjectBrief[] = seeds.flatMap((seed) => [
  toBrief(seed, "core"),
  toBrief(seed, "advanced"),
]);

export function projectsForDomain(domainId: string): ProjectBrief[] {
  return PROJECTS.filter((p) => p.domainId === domainId);
}

export function getProject(id: string | null | undefined): ProjectBrief | undefined {
  if (!id) return undefined;
  return PROJECTS.find((p) => p.id === id);
}

/**
 * Advanced briefs are part of what Industry-Led adds, so Self-Paced students
 * see them locked rather than hidden — the upgrade path stays visible.
 */
export function isProjectUnlocked(
  project: ProjectBrief,
  programId: string | null | undefined,
): boolean {
  if (project.tier === "core") return true;
  return programId === "industry-led";
}
