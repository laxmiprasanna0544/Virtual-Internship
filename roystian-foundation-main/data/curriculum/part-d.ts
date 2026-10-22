import type { RawDomain } from "./types";

export const partD: RawDomain[] = [
  {
    id: "sales-marketing",
    name: "Sales & Marketing",
    shortName: "Sales & Marketing",
    code: "SM",
    icon: "Megaphone",
    category: "Business",
    tagline: "Understand demand, then build a campaign that meets it.",
    description:
      "Learn positioning, audience research, channel strategy, campaign design and sales fundamentals.",
    longDescription:
      "Marketing without a customer definition is guesswork, and selling without a qualification process is noise. This track covers segmentation and positioning, the modern channel mix, campaign planning and measurement, content and brand basics, and the structure of a real sales conversation. The practical activity asks you to design a basic marketing campaign end to end.",
    whoFor: [
      "Management, commerce, media and design students",
      "Learners targeting marketing, growth, sales or brand roles",
      "Founders who need to take a product to market",
    ],
    whatYouLearn: [
      "Segmentation, targeting and positioning",
      "Audience research and buyer personas",
      "Channel strategy across digital and offline",
      "Campaign planning, budgeting and measurement",
      "Sales pipeline fundamentals and qualification",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Campaign design activity",
      brief:
        "Design a launch campaign for the BrewBuddy product, including target audience, channels, message and measurement.",
      requirements: [
        "Define the target audience with at least four specific attributes",
        "State the core message and the positioning behind it",
        "Select two or three channels and justify each against the audience",
        "Set a budget split, a primary success metric and a target value",
      ],
      deliverable:
        "A written campaign plan (400–700 words) or an uploaded document / slide export.",
      evaluation: [
        "Audience is specific rather than 'everyone'",
        "Channel choices follow from the audience, not from habit",
        "A single primary metric is defined with a target",
      ],
    },
    modules: [
      {
        t: "Marketing Foundations",
        s: "The customer problem comes before the campaign.",
        o: [
          "Explain the marketing mix in a modern context",
          "Distinguish marketing, branding and sales",
          "Frame a product around a customer problem",
        ],
        c: [
          "Marketing Mix|The controllable levers a business uses to reach its market, traditionally product, price, place and promotion.",
          "Positioning|The specific place a product occupies in a customer's mind relative to alternatives.",
          "Brand|The accumulated set of associations and expectations a customer holds about an organisation.",
          "Demand Generation|Activity designed to create awareness and interest that eventually produces qualified buyers.",
        ],
      },
      {
        t: "Audience Research & Personas",
        s: "Knowing who you are talking to, precisely.",
        o: [
          "Build a persona from evidence rather than assumption",
          "Map a customer journey with its decision moments",
          "Identify the real buying trigger",
        ],
        c: [
          "Buyer Persona|A research-based profile of a representative customer, covering goals, constraints and objections.",
          "Customer Journey|The sequence of stages a person moves through from first awareness to purchase and beyond.",
          "Pain Point|A specific frustration a customer experiences that a product can credibly relieve.",
          "Buying Trigger|The event that moves someone from passive interest to active search for a solution.",
        ],
      },
      {
        t: "Segmentation, Targeting & Positioning",
        s: "Choosing who you will not serve.",
        o: [
          "Segment a market on meaningful variables",
          "Evaluate segments by size, fit and reachability",
          "Write a positioning statement that is falsifiable",
        ],
        c: [
          "Segmentation|Dividing a market into groups with distinct needs, behaviours or characteristics.",
          "Targeting|Selecting which segments to serve based on attractiveness and the organisation's ability to win.",
          "Differentiation|The specific reason a customer would choose this option over the closest alternative.",
          "Positioning Statement|A structured sentence naming the audience, the category, the benefit and the reason to believe.",
        ],
      },
      {
        t: "Digital Channels",
        s: "Search, social, email and where each actually works.",
        o: [
          "Compare paid, owned and earned channels",
          "Match channel to funnel stage",
          "Estimate reach and cost for a channel",
        ],
        c: [
          "Owned Media|Channels the organisation controls directly, such as its website, app and email list.",
          "Paid Media|Channels where reach is purchased, such as search ads, social ads or sponsorships.",
          "Earned Media|Attention gained without direct payment, such as press coverage, reviews and word of mouth.",
          "Click-Through Rate|The proportion of people who saw something and then clicked it.",
        ],
      },
      {
        t: "Content & Creative",
        s: "Messages people actually read.",
        o: [
          "Write a message hierarchy for a campaign",
          "Adapt one message across formats without diluting it",
          "Brief a designer or video editor effectively",
        ],
        c: [
          "Message Hierarchy|An ordered structure placing the single most important idea first and supporting points beneath it.",
          "Call to Action|A specific instruction telling the audience exactly what to do next.",
          "Creative Brief|A short document defining the audience, message, constraints and success criteria for a creative task.",
          "Tone of Voice|The consistent personality and register an organisation uses across its communication.",
        ],
      },
      {
        t: "Campaign Planning",
        s: "Objectives, budget, calendar and owners.",
        o: [
          "Set a single measurable campaign objective",
          "Allocate budget across channels with reasoning",
          "Build a launch calendar with dependencies",
        ],
        c: [
          "Campaign Objective|One measurable outcome a campaign is accountable for within a defined period.",
          "Budget Allocation|The distribution of available spend across channels and activities according to expected return.",
          "Flighting|Scheduling campaign activity in concentrated bursts rather than spreading it evenly.",
          "Dependency|A task that must complete before another can begin, which determines the critical path of a launch.",
        ],
      },
      {
        t: "Measurement & Analytics",
        s: "Knowing whether it worked.",
        o: [
          "Choose a primary metric and guardrail metrics",
          "Explain attribution and its limits",
          "Read a funnel to find the weakest step",
        ],
        c: [
          "Conversion Rate|The proportion of people at one funnel stage who progress to the next.",
          "Attribution|The method used to assign credit for a conversion across the touchpoints that preceded it.",
          "Return on Ad Spend|Revenue generated divided by the advertising cost that produced it.",
          "Guardrail Metric|A secondary measure watched to ensure improving the primary metric does not cause harm elsewhere.",
        ],
      },
      {
        t: "Sales Fundamentals",
        s: "Pipeline, qualification and the conversation itself.",
        o: [
          "Map a sales pipeline with clear stage definitions",
          "Qualify a lead using a structured framework",
          "Handle objections without discounting immediately",
        ],
        c: [
          "Sales Pipeline|The set of stages an opportunity moves through from first contact to a closed outcome.",
          "Lead Qualification|Assessing whether a prospect has the need, authority, budget and timing to buy.",
          "Objection Handling|Responding to a prospect's stated concern by clarifying it before attempting to resolve it.",
          "Win Rate|The proportion of qualified opportunities that end in a successful sale.",
        ],
      },
      {
        t: "Retention & Growth",
        s: "Keeping customers is cheaper than finding them.",
        o: [
          "Design onboarding that reduces early churn",
          "Build a referral or loyalty mechanism",
          "Use cohort analysis to see retention honestly",
        ],
        c: [
          "Retention Rate|The proportion of customers who remain active over a defined period.",
          "Churn|The loss of customers over a period, usually expressed as a percentage of the starting base.",
          "Referral Loop|A mechanism where existing customers bring new ones, reducing acquisition cost.",
          "Cohort Analysis|Tracking groups that started in the same period to see how behaviour changes over their lifetime.",
        ],
      },
      {
        t: "Ethics & Compliance in Marketing",
        s: "Claims you can stand behind.",
        o: [
          "Apply truthful advertising standards",
          "Handle personal data lawfully in campaigns",
          "Disclose partnerships and sponsorship correctly",
        ],
        c: [
          "Substantiation|Holding evidence that supports a factual claim before it is published.",
          "Consent|Explicit permission from an individual before their personal data is collected or used for marketing.",
          "Disclosure|Clearly stating a commercial relationship so the audience can judge the message in context.",
          "Dark Pattern|An interface designed to push users into choices they would not knowingly make.",
        ],
      },
    ],
  },
  {
    id: "mechanical-engineering",
    name: "Mechanical & Engineering",
    shortName: "Mechanical",
    code: "ME",
    icon: "Cog",
    category: "Engineering",
    tagline: "Design, analyse and manufacture physical systems.",
    description:
      "Cover design fundamentals, materials, CAD, manufacturing processes and quality in mechanical engineering.",
    longDescription:
      "This demo curriculum covers the arc of mechanical product development: understanding loads and materials, expressing a design in CAD and drawings, selecting a manufacturing process, and controlling quality. It also addresses thermal and fluid fundamentals and the maintenance realities of equipment in service.",
    whoFor: [
      "Mechanical, production, automobile and industrial engineering students",
      "Diploma holders strengthening their design fundamentals",
      "Learners moving toward design, manufacturing or quality roles",
    ],
    whatYouLearn: [
      "Engineering design process and requirement definition",
      "Materials, stress, strain and failure modes",
      "CAD modelling, drawings and tolerancing",
      "Manufacturing processes and design for manufacturability",
      "Quality control, maintenance and safety practice",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "demo",
    practicalTask: {
      title: "Engineering design activity",
      brief:
        "Work through the AC outdoor-unit bracket design problem, from requirements to a manufacturable proposal.",
      requirements: [
        "State the functional requirements and the operating constraints",
        "Select a material and justify it against at least two properties",
        "Describe the manufacturing process and one design-for-manufacture decision",
        "Identify the most likely failure mode and how your design mitigates it",
      ],
      deliverable:
        "A written design note (400–700 words) or an uploaded sketch / CAD export with commentary.",
      evaluation: [
        "Requirements are quantified where possible",
        "Material and process choices are justified",
        "Failure analysis is specific to the design",
      ],
    },
    modules: [
      {
        t: "The Engineering Design Process",
        s: "From a vague need to a specification.",
        o: [
          "Translate a need into functional requirements",
          "Generate and evaluate concepts systematically",
          "Document design decisions and their rationale",
        ],
        c: [
          "Functional Requirement|A statement of what the design must achieve, expressed so it can be verified by test.",
          "Design Constraint|A fixed limitation such as cost, size, weight or regulation that bounds acceptable solutions.",
          "Concept Selection|A structured comparison of candidate concepts against weighted criteria.",
          "Design Review|A formal checkpoint where a design is examined against requirements before work proceeds.",
        ],
      },
      {
        t: "Engineering Materials",
        s: "Choosing what the part is made of.",
        o: [
          "Compare metals, polymers, ceramics and composites",
          "Read a stress-strain curve",
          "Select material against service conditions",
        ],
        c: [
          "Yield Strength|The stress at which a material begins to deform permanently rather than elastically.",
          "Ductility|A material's ability to deform plastically before fracturing.",
          "Fatigue|Progressive damage and eventual failure caused by repeated cyclic loading below the static strength.",
          "Corrosion Resistance|A material's ability to withstand chemical or electrochemical degradation in its environment.",
        ],
      },
      {
        t: "Statics & Strength of Materials",
        s: "Whether the part will hold.",
        o: [
          "Resolve forces and moments on a body",
          "Calculate stress and deflection in simple members",
          "Apply a factor of safety appropriately",
        ],
        c: [
          "Stress|Internal force per unit area developed within a material in response to an applied load.",
          "Strain|The proportional deformation a material undergoes relative to its original dimension.",
          "Bending Moment|The internal moment at a section of a beam that causes it to bend.",
          "Factor of Safety|The ratio of a material's capacity to the load it is expected to carry in service.",
        ],
      },
      {
        t: "CAD & Technical Drawing",
        s: "Communicating a design unambiguously.",
        o: [
          "Model a part parametrically",
          "Produce drawings with correct views and sections",
          "Apply dimensioning and tolerancing conventions",
        ],
        c: [
          "Parametric Modelling|Building a model from dimensions and relationships so changes propagate automatically.",
          "Orthographic Projection|Representing a three-dimensional object through aligned two-dimensional views.",
          "Tolerance|The permissible variation in a dimension within which a part is still acceptable.",
          "Assembly Constraint|A relationship that fixes how components are positioned relative to each other.",
        ],
      },
      {
        t: "Thermal & Fluid Fundamentals",
        s: "Heat and flow in mechanical systems.",
        o: [
          "Apply conduction, convection and radiation concepts",
          "Explain flow regimes and pressure loss",
          "Size a basic thermal or flow element",
        ],
        c: [
          "Conduction|Heat transfer through a material by direct molecular interaction without bulk movement.",
          "Convection|Heat transfer between a surface and a moving fluid carrying energy away or toward it.",
          "Laminar Flow|Smooth fluid flow in parallel layers with minimal mixing between them.",
          "Pressure Drop|The loss of fluid pressure along a flow path caused by friction and fittings.",
        ],
      },
      {
        t: "Manufacturing Processes",
        s: "How the part is actually made.",
        o: [
          "Compare casting, machining, forming and additive processes",
          "Match process to volume, tolerance and material",
          "Estimate the cost drivers of a process",
        ],
        c: [
          "Casting|Forming a part by pouring molten material into a mould and allowing it to solidify.",
          "Machining|Removing material from a workpiece with cutting tools to reach the final geometry.",
          "Additive Manufacturing|Building a part layer by layer directly from a digital model.",
          "Tooling Cost|The upfront cost of moulds, dies or fixtures, which is amortised across production volume.",
        ],
      },
      {
        t: "Design for Manufacturability",
        s: "Designing parts that can be made affordably.",
        o: [
          "Simplify geometry to reduce process steps",
          "Apply standard parts and features",
          "Balance tolerance against cost",
        ],
        c: [
          "Design for Manufacturability|Designing parts so they are straightforward and economical to produce with the chosen process.",
          "Draft Angle|A slight taper added to moulded or cast features so the part can be removed from the tool.",
          "Standardisation|Reusing common components and features to reduce inventory, tooling and error.",
          "Part Consolidation|Combining several components into one to reduce assembly steps and failure points.",
        ],
      },
      {
        t: "Quality & Metrology",
        s: "Confirming the part matches the drawing.",
        o: [
          "Select measuring instruments for a tolerance",
          "Apply statistical process control basics",
          "Investigate a non-conformance",
        ],
        c: [
          "Metrology|The science of measurement, including instrument selection, calibration and uncertainty.",
          "Statistical Process Control|Monitoring process variation over time to detect drift before defects are produced.",
          "Process Capability|A measure of how well a process's natural variation fits within the specified tolerance.",
          "Non-Conformance|A product or process condition that fails to meet the specified requirement.",
        ],
      },
      {
        t: "Maintenance & Reliability",
        s: "Keeping equipment working in service.",
        o: [
          "Compare preventive, predictive and corrective maintenance",
          "Read vibration and condition indicators",
          "Plan a maintenance schedule around criticality",
        ],
        c: [
          "Preventive Maintenance|Servicing performed on a fixed schedule to reduce the chance of unplanned failure.",
          "Predictive Maintenance|Servicing triggered by measured condition indicators rather than by a fixed calendar.",
          "Root Cause Failure Analysis|A structured investigation identifying the underlying reason a component failed.",
          "Downtime|Time during which equipment is unavailable for production because of failure or servicing.",
        ],
      },
      {
        t: "Safety & Standards",
        s: "Engineering within codes and responsibility.",
        o: [
          "Apply risk assessment to a mechanical design",
          "Reference standards correctly in documentation",
          "Design guards and interlocks appropriately",
        ],
        c: [
          "Risk Assessment|A structured evaluation of hazards by likelihood and severity, leading to control measures.",
          "Engineering Standard|A published technical specification defining accepted requirements and test methods.",
          "Interlock|A safety mechanism that prevents operation unless required conditions are satisfied.",
          "Hierarchy of Controls|An ordered approach that prefers eliminating a hazard over relying on protective equipment.",
        ],
      },
    ],
  },
  {
    id: "software-development",
    name: "Software Development",
    shortName: "Software Dev",
    code: "SD",
    icon: "Terminal",
    category: "Technology",
    tagline: "The engineering practices behind working software.",
    description:
      "Cover problem solving, data structures, system design basics, version control and delivery practices.",
    longDescription:
      "This demo curriculum covers the craft shared by every software role regardless of language: solving problems methodically, choosing data structures, designing systems that can grow, writing code that others can maintain, and shipping it through a pipeline with tests and review. It is language-agnostic by design.",
    whoFor: [
      "Students across computer science, IT and allied branches",
      "Career changers building fundamentals before specialising",
      "Developers preparing for technical interviews and first roles",
    ],
    whatYouLearn: [
      "Structured problem solving and algorithmic thinking",
      "Core data structures and complexity reasoning",
      "Clean code, refactoring and code review practice",
      "System design fundamentals and API boundaries",
      "Version control, testing and continuous delivery",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "demo",
    practicalTask: {
      title: "Applied development task",
      brief:
        "Solve the clinic room-allocation problem and document your approach, trade-offs and testing strategy.",
      requirements: [
        "Describe your approach before the code, including the data structure you chose",
        "Provide a working solution with meaningful names and structure",
        "State the time and space complexity of your solution",
        "List the test cases you would write, including edge cases",
      ],
      deliverable:
        "Code plus written explanation as a text response, or an uploaded file.",
      evaluation: [
        "Correctness including edge cases",
        "Justified data structure and complexity reasoning",
        "Readable, reviewable code",
      ],
    },
    modules: [
      {
        t: "Problem Solving Fundamentals",
        s: "A repeatable method instead of guessing.",
        o: [
          "Restate a problem with inputs, outputs and constraints",
          "Work an example by hand before coding",
          "Decompose a problem into solvable pieces",
        ],
        c: [
          "Problem Decomposition|Breaking a large problem into smaller independent parts that can each be solved and tested.",
          "Edge Case|An input at the boundary of what is valid, where naive solutions commonly fail.",
          "Brute Force|A straightforward solution that checks all possibilities, useful as a correct baseline to optimise from.",
          "Invariant|A condition that remains true throughout an algorithm's execution and can be used to reason about correctness.",
        ],
      },
      {
        t: "Data Structures",
        s: "Picking the structure that makes the problem easy.",
        o: [
          "Compare arrays, lists, stacks, queues, maps and sets",
          "Select a structure from the required operations",
          "Reason about memory as well as speed",
        ],
        c: [
          "Array|A contiguous block of elements offering constant-time access by index.",
          "Stack|A collection where the most recently added element is the first removed.",
          "Queue|A collection where the earliest added element is the first removed.",
          "Hash Table|A structure that maps keys to values using a hash function for near constant-time lookup.",
        ],
      },
      {
        t: "Algorithms & Complexity",
        s: "Knowing how a solution behaves as data grows.",
        o: [
          "Express cost in big-O notation",
          "Apply sorting and searching appropriately",
          "Recognise recursion and its base cases",
        ],
        c: [
          "Big-O Notation|A notation describing the upper bound of how an algorithm's cost grows with input size.",
          "Binary Search|An algorithm that repeatedly halves a sorted range to locate a value in logarithmic time.",
          "Recursion|A technique where a function solves a problem by calling itself on smaller inputs until a base case.",
          "Space Complexity|A description of how much additional memory an algorithm requires as input size grows.",
        ],
      },
      {
        t: "Clean Code & Refactoring",
        s: "Writing for the next person who reads it.",
        o: [
          "Name things so comments become unnecessary",
          "Keep functions small and single-purpose",
          "Refactor safely behind tests",
        ],
        c: [
          "Refactoring|Improving the internal structure of code without changing its external behaviour.",
          "Code Smell|A surface indication in code that usually points to a deeper design problem.",
          "Single Responsibility|The principle that a unit of code should have one reason to change.",
          "Technical Debt|The future cost incurred by choosing a quick solution over a sound one today.",
        ],
      },
      {
        t: "Version Control in Practice",
        s: "Collaborating without stepping on each other.",
        o: [
          "Use a branching strategy consistently",
          "Write reviewable, atomic commits",
          "Recover from common version control mistakes",
        ],
        c: [
          "Atomic Commit|A commit containing one coherent change that can be understood and reverted on its own.",
          "Rebase|Reapplying commits onto a new base to produce a linear history.",
          "Tag|A fixed marker on a specific commit, typically used to identify a release.",
          "Revert|Creating a new commit that undoes the changes of a previous one without rewriting history.",
        ],
      },
      {
        t: "Testing & Code Review",
        s: "Two habits that prevent most production incidents.",
        o: [
          "Write tests at the right level of the pyramid",
          "Give and receive review feedback constructively",
          "Use tests to make refactoring safe",
        ],
        c: [
          "Test Pyramid|A guideline favouring many fast unit tests, fewer integration tests and very few end-to-end tests.",
          "Code Review|A structured examination of proposed changes by another engineer before they are merged.",
          "Regression Suite|The collection of existing tests re-run to confirm new work has not broken old behaviour.",
          "Test-Driven Development|Writing a failing test that specifies the desired behaviour before writing the code.",
        ],
      },
      {
        t: "System Design Basics",
        s: "Designing something that will still work at ten times the load.",
        o: [
          "Separate concerns across services and layers",
          "Reason about caching, queues and statelessness",
          "Identify a single point of failure",
        ],
        c: [
          "Statelessness|Designing a service so any instance can handle any request, making horizontal scaling possible.",
          "Caching|Storing the result of an expensive operation so subsequent requests can be served faster.",
          "Message Queue|A buffer that decouples producers from consumers so work can be processed asynchronously.",
          "Single Point of Failure|A component whose failure alone would bring down the entire system.",
        ],
      },
      {
        t: "APIs & Integration",
        s: "Boundaries that other teams depend on.",
        o: [
          "Design an API contract and version it",
          "Handle errors and retries predictably",
          "Document an interface so it can be consumed without help",
        ],
        c: [
          "API Contract|The agreed definition of an interface's inputs, outputs and behaviour that consumers rely on.",
          "Versioning|Publishing changes to an interface in a way that does not break existing consumers.",
          "Rate Limiting|Restricting how many requests a client may make within a period to protect a service.",
          "Backward Compatibility|The property that existing clients continue to work after a change is deployed.",
        ],
      },
      {
        t: "Delivery & DevOps Basics",
        s: "Getting the change to users reliably.",
        o: [
          "Describe a CI/CD pipeline's stages",
          "Use environments and feature flags",
          "Plan a safe release and rollback",
        ],
        c: [
          "Continuous Integration|Automatically building and testing every change as it merges to catch problems early.",
          "Feature Flag|A switch that enables or disables functionality at runtime without a new deployment.",
          "Staging Environment|A production-like environment used to validate a release before it reaches users.",
          "Blue-Green Deployment|Running two production environments and switching traffic between them to release with instant rollback.",
        ],
      },
      {
        t: "Working as a Software Engineer",
        s: "The professional habits that compound.",
        o: [
          "Estimate work and communicate progress honestly",
          "Write technical documentation that is actually read",
          "Debug systematically under pressure",
        ],
        c: [
          "Estimation|Providing a considered range for how long work will take, with the assumptions it depends on.",
          "Runbook|A short operational document describing how to respond to a specific known situation.",
          "Post-Mortem|A blameless review after an incident that identifies contributing causes and corrective actions.",
          "Rubber Duck Debugging|Explaining a problem step by step aloud to expose the faulty assumption in your reasoning.",
        ],
      },
    ],
  },
];
