import type { DomainCluster } from "@/types";

/**
 * V2 requires every domain page to answer five questions. Three of them
 * (what will I learn / build / how am I assessed) are already carried by the
 * curriculum files. The remaining two live here so the large curriculum
 * definitions stay focused on teaching material.
 *
 * `pathways` deliberately describes the kind of work the skills support — not
 * a job guarantee. Keep the wording capability-led for the same reason the
 * readiness score is never presented as an employment promise.
 */
export interface DomainCareerData {
  practise: string[];
  pathways: string[];
}

/** The finer-grained curriculum category → the three public clusters. */
export const CLUSTER_OF: Record<string, DomainCluster> = {
  Technology: "Technology",
  Data: "Data & Business",
  Business: "Data & Business",
  Engineering: "Emerging & Engineering",
  Impact: "Emerging & Engineering",
};

export const CLUSTERS: DomainCluster[] = [
  "Technology",
  "Data & Business",
  "Emerging & Engineering",
];

export const CLUSTER_BLURB: Record<DomainCluster, string> = {
  Technology:
    "Build and ship software. Languages, frameworks, testing and the habits of an engineering team.",
  "Data & Business":
    "Turn data and commercial context into decisions people can act on.",
  "Emerging & Engineering":
    "Hardware, systems and sustainability — where engineering meets the physical world.",
};

export const CAREER_DATA: Record<string, DomainCareerData> = {
  "ai-ml": {
    practise: [
      "Cleaning and splitting a raw dataset into model-ready features",
      "Training a baseline model and reading its evaluation metrics",
      "Diagnosing why a model underperforms on unseen data",
      "Writing up findings so a non-technical reader can follow them",
    ],
    pathways: [
      "Machine Learning Engineer (junior / trainee)",
      "Data Scientist",
      "AI Product Analyst",
      "Research Assistant — applied ML",
    ],
  },
  "data-analytics": {
    practise: [
      "Profiling a dataset for distribution, gaps and outliers",
      "Building a query-and-aggregate workflow over real records",
      "Designing a chart that answers one specific question",
      "Presenting an analysis with a clear recommendation",
    ],
    pathways: [
      "Data Analyst",
      "Business Intelligence Analyst",
      "Reporting & Insights Associate",
      "Operations Analyst",
    ],
  },
  "business-analytics": {
    practise: [
      "Translating a business question into a measurable metric",
      "Modelling a scenario and testing its assumptions",
      "Building a decision case from mixed quantitative evidence",
      "Communicating trade-offs to a commercial audience",
    ],
    pathways: [
      "Business Analyst",
      "Strategy & Operations Associate",
      "Product Analyst",
      "Consulting Analyst",
    ],
  },
  "full-stack-development": {
    practise: [
      "Building a working interface against a real API contract",
      "Designing and querying a relational schema",
      "Handling authentication, state and error paths end to end",
      "Reviewing your own code the way a team would",
    ],
    pathways: [
      "Full Stack Developer",
      "Frontend Engineer",
      "Backend Engineer",
      "Application Developer",
    ],
  },
  "python-development": {
    practise: [
      "Writing clean, testable Python modules rather than scripts",
      "Working with files, APIs and structured data",
      "Handling errors and edge cases deliberately",
      "Automating a repetitive task end to end",
    ],
    pathways: [
      "Python Developer",
      "Automation Engineer",
      "Backend Developer",
      "Data Engineering Associate",
    ],
  },
  "java-development": {
    practise: [
      "Modelling a problem with classes, interfaces and collections",
      "Applying object-oriented design to a working feature",
      "Reading and extending an unfamiliar Java codebase",
      "Writing unit tests around your own logic",
    ],
    pathways: [
      "Java Developer",
      "Backend Engineer",
      "Enterprise Application Developer",
      "Software Engineer (trainee)",
    ],
  },
  "software-testing": {
    practise: [
      "Writing test cases from an ambiguous requirement",
      "Finding, reproducing and reporting a defect precisely",
      "Deciding what to automate and what to test by hand",
      "Assessing release risk from test evidence",
    ],
    pathways: [
      "QA Engineer",
      "Test Automation Engineer",
      "SDET (trainee)",
      "Quality Analyst",
    ],
  },
  "software-development": {
    practise: [
      "Breaking a feature into buildable, reviewable pieces",
      "Using version control the way a team actually does",
      "Debugging a defect you did not write",
      "Documenting a change so the next person can follow it",
    ],
    pathways: [
      "Software Engineer",
      "Application Developer",
      "Platform Engineer (trainee)",
      "Technical Support Engineer",
    ],
  },
  "sales-marketing": {
    practise: [
      "Building a segmented outreach plan for a real product",
      "Writing positioning that survives a sceptical reader",
      "Measuring a funnel and finding where it leaks",
      "Running a structured discovery conversation",
    ],
    pathways: [
      "Marketing Associate",
      "Growth / Demand Generation Executive",
      "Inside Sales Associate",
      "Brand & Content Executive",
    ],
  },
  "iot-electronics": {
    practise: [
      "Wiring a sensor circuit and reading its output reliably",
      "Moving device data to a network destination",
      "Reasoning about power, latency and failure in the field",
      "Documenting a hardware build so it can be rebuilt",
    ],
    pathways: [
      "IoT Engineer (trainee)",
      "Embedded Systems Associate",
      "Hardware Test Engineer",
      "Automation & Instrumentation Associate",
    ],
  },
  "mechanical-engineering": {
    practise: [
      "Taking a design from requirement to dimensioned drawing",
      "Selecting materials against real constraints",
      "Checking a design against loads and tolerances",
      "Presenting a design decision with its reasoning",
    ],
    pathways: [
      "Design Engineer (trainee)",
      "Manufacturing Engineer",
      "Product Development Associate",
      "CAE / Simulation Assistant",
    ],
  },
  sustainability: {
    practise: [
      "Building a baseline footprint from messy operational data",
      "Testing an intervention for real rather than claimed impact",
      "Reading a disclosure framework and applying it",
      "Making a sustainability case that holds up commercially",
    ],
    pathways: [
      "Sustainability Analyst",
      "ESG Reporting Associate",
      "Environmental Compliance Assistant",
      "Impact & Programmes Associate",
    ],
  },
};

const FALLBACK: DomainCareerData = {
  practise: [
    "Hands-on assignments after every module",
    "A practical activity applying the full track",
    "A structured industry-style project",
  ],
  pathways: ["Associate and trainee roles in this field"],
};

export function careerDataFor(domainId: string): DomainCareerData {
  return CAREER_DATA[domainId] ?? FALLBACK;
}
