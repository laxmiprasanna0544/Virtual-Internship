import type { RawDomain } from "./types";

export const partB: RawDomain[] = [
  {
    id: "full-stack-development",
    name: "Full Stack Development",
    shortName: "Full Stack",
    code: "FS",
    icon: "Layers",
    category: "Technology",
    tagline: "Build the whole thing — interface, logic and data.",
    description:
      "Understand how modern web applications are structured from the browser through the API to the database.",
    longDescription:
      "A full stack developer has to reason across layers. This track walks the request from a rendered component, through state and API boundaries, into the database and back, and covers the discipline that keeps a codebase workable: version control, testing, and deployment. The practical activity asks you to build or modify a real component and explain the decisions behind it.",
    whoFor: [
      "Computer science, IT and computer applications students",
      "Self-taught developers who want a structured mental model",
      "Anyone preparing for web development internships",
    ],
    whatYouLearn: [
      "How HTML, CSS and JavaScript combine into a component model",
      "Client state, rendering and the browser event loop",
      "Designing and consuming REST APIs",
      "Relational and document data modelling",
      "Authentication, deployment and basic production hygiene",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Build or modify a web application component",
      brief:
        "Build a small web application component, or modify a provided one, and explain your implementation decisions.",
      requirements: [
        "Describe the component's responsibility and its props or inputs",
        "Explain how state is held and why it lives at that level",
        "Handle the loading, empty and error states explicitly",
        "Note one accessibility consideration and one performance consideration",
      ],
      deliverable:
        "A written explanation (400–700 words) with code snippets, or an uploaded file containing the component.",
      evaluation: [
        "Clear separation of responsibility",
        "All UI states are handled, not just the happy path",
        "Decisions are explained rather than asserted",
      ],
    },
    modules: [
      {
        t: "How the Web Actually Works",
        s: "From typing a URL to pixels on screen.",
        o: [
          "Trace an HTTP request from browser to server and back",
          "Explain the roles of DNS, HTTP and the rendering engine",
          "Read status codes and headers correctly",
        ],
        c: [
          "HTTP Request|A structured message a client sends to a server specifying a method, path, headers and optional body.",
          "Status Code|A three-digit number in a response that signals the outcome class, such as success, redirect or error.",
          "DNS|The system that resolves a human-readable domain name into the IP address of a server.",
          "Rendering Engine|The browser component that turns HTML and CSS into the visual layout displayed on screen.",
        ],
      },
      {
        t: "HTML & CSS Foundations",
        s: "Semantic structure and layout that holds up on every screen.",
        o: [
          "Write semantic markup that assistive technology can navigate",
          "Lay out interfaces with flexbox and grid",
          "Build responsive behaviour without fragile breakpoints",
        ],
        c: [
          "Semantic HTML|Using elements according to their meaning so browsers and assistive technology can interpret structure.",
          "Flexbox|A one-dimensional layout model that distributes space along a single row or column.",
          "CSS Grid|A two-dimensional layout model that positions items across explicit rows and columns simultaneously.",
          "Media Query|A CSS rule that applies styles only when conditions such as viewport width are met.",
        ],
      },
      {
        t: "JavaScript Essentials",
        s: "The language behaviours that cause most real bugs.",
        o: [
          "Use scope, closures and the event loop deliberately",
          "Work with promises and async/await correctly",
          "Manipulate arrays and objects immutably",
        ],
        c: [
          "Closure|A function that retains access to the variables of the scope in which it was created.",
          "Event Loop|The mechanism that lets single-threaded JavaScript handle asynchronous work without blocking.",
          "Promise|An object representing a value that will be available later, or a reason why it could not be produced.",
          "Immutability|Producing new values instead of modifying existing ones, which makes change detection reliable.",
        ],
      },
      {
        t: "Component-Based Frontends",
        s: "Composing interfaces from reusable units.",
        o: [
          "Split an interface into components with single responsibilities",
          "Decide where a piece of state should live",
          "Manage side effects without infinite loops",
        ],
        c: [
          "Component|A self-contained unit of interface that takes inputs and returns the markup it should render.",
          "Props|Read-only inputs passed from a parent component to configure a child's behaviour or content.",
          "State|Data owned by a component that changes over time and triggers a re-render when updated.",
          "Lifting State Up|Moving shared state to the nearest common parent so multiple children stay synchronised.",
        ],
      },
      {
        t: "APIs & Data Fetching",
        s: "Talking to a server without breaking the interface.",
        o: [
          "Design REST endpoints around resources",
          "Handle loading, empty, error and success states",
          "Apply caching and avoid duplicate requests",
        ],
        c: [
          "REST|An API style that models functionality as resources addressed by URLs and manipulated with standard HTTP methods.",
          "Endpoint|A specific URL that accepts requests for one resource or action within an API.",
          "JSON|A lightweight text format for representing structured data, widely used for API payloads.",
          "Idempotency|The property that repeating the same request produces the same result as making it once.",
        ],
      },
      {
        t: "Server-Side Fundamentals",
        s: "Routing, middleware and where business logic belongs.",
        o: [
          "Structure a server around routes and handlers",
          "Use middleware for cross-cutting concerns",
          "Validate input at the boundary",
        ],
        c: [
          "Route Handler|A server function bound to a path and method, responsible for producing the response.",
          "Middleware|A function that runs before or after handlers to apply shared behaviour such as logging or auth.",
          "Input Validation|Checking incoming data against an expected shape before it reaches business logic.",
          "Environment Variable|A configuration value supplied at runtime so secrets and settings stay out of source code.",
        ],
      },
      {
        t: "Databases & Data Modelling",
        s: "Designing storage you will not regret in six months.",
        o: [
          "Model entities and relationships in a relational schema",
          "Choose between relational and document storage",
          "Use indexes to make queries fast",
        ],
        c: [
          "Normalisation|Organising tables so each fact is stored once, reducing redundancy and update anomalies.",
          "Foreign Key|A column that references the primary key of another table, enforcing a relationship between them.",
          "Index|An auxiliary structure that speeds up lookups on a column at the cost of extra writes and storage.",
          "Transaction|A group of operations that either all succeed or all roll back, leaving data consistent.",
        ],
      },
      {
        t: "Authentication & Security Basics",
        s: "Keeping accounts and data safe by default.",
        o: [
          "Explain session and token-based authentication",
          "Store credentials safely",
          "Defend against the most common web vulnerabilities",
        ],
        c: [
          "Hashing|Transforming a password into a fixed-length irreversible value so the original is never stored.",
          "Session|Server-recognised state that identifies a logged-in user across multiple requests.",
          "Access Token|A signed credential presented with each request to prove identity and permissions.",
          "Cross-Site Scripting|A vulnerability where untrusted input is rendered as executable script in another user's browser.",
        ],
      },
      {
        t: "Version Control & Collaboration",
        s: "Working in a team without losing work.",
        o: [
          "Use branches, commits and pull requests effectively",
          "Resolve merge conflicts calmly",
          "Write commit messages that help future readers",
        ],
        c: [
          "Branch|An independent line of development that can be merged back once the work is ready.",
          "Commit|A recorded snapshot of changes with a message explaining the intent behind them.",
          "Pull Request|A proposal to merge a branch, providing a place for review and discussion before integration.",
          "Merge Conflict|A state where two branches changed the same lines and a human must choose the outcome.",
        ],
      },
      {
        t: "Deployment & Production Hygiene",
        s: "Shipping, then keeping it healthy.",
        o: [
          "Describe build, preview and production environments",
          "Apply basic performance budgets",
          "Set up error tracking and useful logging",
        ],
        c: [
          "Build Step|The process that transforms source code into optimised assets ready to be served.",
          "Continuous Deployment|Automatically releasing changes to production once they pass the agreed checks.",
          "Rollback|Reverting to the previous known-good release when a deployment causes problems.",
          "Observability|The ability to understand what a running system is doing from its logs, metrics and traces.",
        ],
      },
    ],
  },
  {
    id: "software-testing",
    name: "Software Testing",
    shortName: "Software Testing",
    code: "ST",
    icon: "ShieldCheck",
    category: "Technology",
    tagline: "Find the defect before the user does.",
    description:
      "Learn structured testing: designing cases, running them, reporting defects and automating the repetitive parts.",
    longDescription:
      "Testing is a design discipline. This track covers the full quality cycle: reading a requirement critically, designing cases that cover positive, negative and edge conditions, executing them, writing a defect report a developer can act on, and knowing which checks are worth automating. The practical activity asks you to write a real test case set.",
    whoFor: [
      "Students targeting QA, SDET or quality engineering roles",
      "Developers who want to write better tests",
      "Detail-oriented learners who enjoy breaking things methodically",
    ],
    whatYouLearn: [
      "The software testing life cycle and where testing fits in delivery",
      "Test case design techniques including boundary and equivalence analysis",
      "Writing defect reports that get fixed quickly",
      "Functional, regression, performance and security testing basics",
      "What to automate and what to keep manual",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Test case design activity",
      brief:
        "Write test cases for the provided feature covering positive, negative and edge cases.",
      requirements: [
        "Write at least four positive cases with expected results",
        "Write at least four negative cases including invalid input handling",
        "Write at least three edge cases using boundary value analysis",
        "State preconditions and test data for each case, and note one case you would automate first",
      ],
      deliverable:
        "A test case table (as text or an uploaded spreadsheet/document) with ID, title, steps, data and expected result.",
      evaluation: [
        "Coverage across positive, negative and boundary conditions",
        "Expected results are specific and verifiable",
        "Cases are independent and repeatable",
      ],
    },
    modules: [
      {
        t: "Introduction to Software Quality",
        s: "What quality means and who is responsible for it.",
        o: [
          "Describe the software testing life cycle",
          "Distinguish verification from validation",
          "Explain the cost of finding defects late",
        ],
        c: [
          "Verification|Checking that the product was built according to its specification.",
          "Validation|Checking that the product actually solves the user's real problem.",
          "Defect|A deviation between actual behaviour and expected behaviour as defined by a requirement.",
          "Shift Left|Moving testing activity earlier in the delivery cycle so defects are found when they are cheap to fix.",
        ],
      },
      {
        t: "Test Case Design Techniques",
        s: "Systematic ways to get maximum coverage from minimum cases.",
        o: [
          "Apply equivalence partitioning to reduce redundant cases",
          "Use boundary value analysis on numeric and length limits",
          "Build a decision table for combined conditions",
        ],
        c: [
          "Equivalence Partitioning|Grouping inputs that should be treated identically so one representative value tests the whole group.",
          "Boundary Value Analysis|Testing at and around the edges of valid ranges, where defects cluster most often.",
          "Decision Table|A structured grid mapping every combination of input conditions to its expected outcome.",
          "Negative Test|A case that supplies invalid input to confirm the system rejects it gracefully.",
        ],
      },
      {
        t: "Writing Test Cases",
        s: "Cases another tester can run and get the same result.",
        o: [
          "Write clear preconditions, steps and expected results",
          "Design independent, repeatable cases",
          "Prepare and manage test data",
        ],
        c: [
          "Precondition|The state the system must be in before a test case can be executed meaningfully.",
          "Expected Result|The specific, observable outcome that determines whether a test passes or fails.",
          "Test Data|The specific input values prepared for a case, chosen to exercise a particular condition.",
          "Traceability|A mapping from each requirement to the tests that verify it, used to prove coverage.",
        ],
      },
      {
        t: "Defect Reporting",
        s: "Reports that get fixed instead of returned.",
        o: [
          "Write reproducible defect reports",
          "Assign severity and priority correctly",
          "Manage a defect through its life cycle",
        ],
        c: [
          "Severity|How badly the defect affects the system's functionality, judged independently of business urgency.",
          "Priority|How urgently the defect should be fixed relative to other work, judged by business impact.",
          "Reproduction Steps|The exact ordered actions required to make the defect appear again reliably.",
          "Regression|A defect where previously working functionality breaks after a change elsewhere.",
        ],
      },
      {
        t: "Functional & Non-Functional Testing",
        s: "Testing what it does and how well it does it.",
        o: [
          "Plan smoke, sanity and regression passes",
          "Describe performance, usability and compatibility testing",
          "Choose the right test type for a release risk",
        ],
        c: [
          "Smoke Test|A quick shallow pass confirming the build is stable enough to justify deeper testing.",
          "Regression Testing|Re-running existing tests after a change to confirm nothing previously working has broken.",
          "Load Testing|Measuring how the system behaves under an expected volume of concurrent usage.",
          "Usability Testing|Evaluating how easily a real user can complete their intended task with the product.",
        ],
      },
      {
        t: "Levels of Testing",
        s: "Unit, integration, system and acceptance.",
        o: [
          "Explain what each level is responsible for",
          "Place a given check at the correct level",
          "Apply the test pyramid to a real project",
        ],
        c: [
          "Unit Test|A fast automated test that verifies one small piece of logic in isolation from its dependencies.",
          "Integration Test|A test that verifies two or more components work correctly together across their interface.",
          "System Test|End-to-end testing of the complete, integrated product against its requirements.",
          "User Acceptance Testing|Final validation by the business or user confirming the product is fit to release.",
        ],
      },
      {
        t: "API Testing",
        s: "Testing beneath the user interface.",
        o: [
          "Test endpoints for contract, status and payload correctness",
          "Validate error handling and authorisation",
          "Chain requests to test a real workflow",
        ],
        c: [
          "Contract Test|A test that confirms an API still returns the agreed structure and types its consumers depend on.",
          "Payload|The body of data carried in a request or response, separate from headers and metadata.",
          "Authorisation Test|A check that a user can access exactly the resources their role permits and nothing more.",
          "Schema Validation|Automatically checking a response against a formal definition of its expected structure.",
        ],
      },
      {
        t: "Test Automation Fundamentals",
        s: "Automating the checks that earn their maintenance cost.",
        o: [
          "Decide what is worth automating",
          "Structure automation with the page object pattern",
          "Recognise and fix flaky tests",
        ],
        c: [
          "Test Automation|Using code to execute and verify checks repeatedly without manual effort.",
          "Flaky Test|A test that passes and fails intermittently without any change in the code under test.",
          "Page Object Model|A pattern that wraps screen structure in a reusable class so tests are insulated from UI changes.",
          "Assertion|The statement in a test that declares what must be true for the test to pass.",
        ],
      },
      {
        t: "Security & Performance Awareness",
        s: "The non-functional risks testers are expected to catch.",
        o: [
          "Identify common input-handling vulnerabilities",
          "Read basic performance metrics",
          "Report non-functional risk in business language",
        ],
        c: [
          "Input Sanitisation|Cleaning or rejecting untrusted input so it cannot be interpreted as code or commands.",
          "Throughput|The number of requests or transactions a system successfully handles per unit of time.",
          "Latency|The time between a request being made and its response being received.",
          "Penetration Test|An authorised simulated attack used to discover exploitable weaknesses before an attacker does.",
        ],
      },
      {
        t: "Testing in Agile Delivery",
        s: "Quality as a continuous activity, not a final phase.",
        o: [
          "Work from acceptance criteria within a sprint",
          "Participate usefully in refinement and review",
          "Report quality status without noise",
        ],
        c: [
          "Definition of Done|The shared checklist a team agrees an item must satisfy before it counts as complete.",
          "Sprint|A fixed short period in which a team delivers an increment of working, tested software.",
          "Continuous Integration|Automatically building and testing every change as it is merged, to catch breakage early.",
          "Exploratory Testing|Simultaneous learning, test design and execution, guided by the tester's judgement rather than a script.",
        ],
      },
    ],
  },
  {
    id: "python-development",
    name: "Python Development",
    shortName: "Python",
    code: "PY",
    icon: "Code2",
    category: "Technology",
    tagline: "Write Python that is correct, readable and reusable.",
    description:
      "Build practical Python skills through core language features, object-oriented design, file handling and problem solving.",
    longDescription:
      "This track builds Python capability the way it is actually used: solving problems, structuring code into functions and classes, handling files and data, working with libraries, and writing code that others can read. The practical activity asks you to solve programming problems and an object-oriented design task.",
    whoFor: [
      "Beginners writing their first serious programs",
      "Students preparing for development, automation or data roles",
      "Learners who can write scripts but want structure and rigour",
    ],
    whatYouLearn: [
      "Core syntax, data structures and control flow",
      "Functions, modules and code organisation",
      "Object-oriented programming in Python",
      "File handling, error handling and working with JSON and CSV",
      "Writing tests and using the standard library effectively",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Programming and OOP problem set",
      brief:
        "Solve the provided practical programming problems and complete an object-oriented design task.",
      requirements: [
        "Solve the given problems with working, readable code",
        "Design one class with clear attributes, methods and encapsulation",
        "Handle at least two error conditions explicitly rather than letting them crash",
        "Explain the time complexity of your main solution in one short paragraph",
      ],
      deliverable:
        "Your code and explanation as a text response, or an uploaded .py file / notebook.",
      evaluation: [
        "Correctness on normal and edge inputs",
        "Readable naming and structure",
        "Sound object-oriented design decisions",
      ],
    },
    modules: [
      {
        t: "Python Basics",
        s: "Syntax, types and the interpreter's mental model.",
        o: [
          "Work confidently with Python's core data types",
          "Use control flow and comprehensions idiomatically",
          "Read and fix a traceback",
        ],
        c: [
          "Variable|A name bound to an object in memory, which in Python carries no fixed type of its own.",
          "List Comprehension|A concise expression that builds a new list by transforming and filtering an iterable.",
          "Traceback|The report Python prints when an exception propagates, showing the call path to the failure.",
          "Mutability|Whether an object's contents can be changed in place after it has been created.",
        ],
      },
      {
        t: "Data Structures in Python",
        s: "Picking the right container for the job.",
        o: [
          "Choose between list, tuple, set and dict deliberately",
          "Reason about lookup cost in each structure",
          "Nest structures to model real records",
        ],
        c: [
          "Dictionary|A mapping of unique keys to values offering fast lookup by key.",
          "Set|An unordered collection of unique elements supporting fast membership tests and set operations.",
          "Tuple|An ordered immutable sequence, often used for fixed records or as dictionary keys.",
          "Time Complexity|A description of how an operation's cost grows as the size of the input increases.",
        ],
      },
      {
        t: "Functions & Modules",
        s: "Organising code so it can be reused and tested.",
        o: [
          "Write functions with clear inputs and a single purpose",
          "Use default, keyword and variadic arguments correctly",
          "Split code across modules and packages",
        ],
        c: [
          "Pure Function|A function whose output depends only on its inputs and which causes no side effects.",
          "Keyword Argument|An argument passed by name rather than position, improving readability at the call site.",
          "Module|A single Python file whose definitions can be imported and reused elsewhere.",
          "Scope|The region of code in which a given name is visible and can be resolved.",
        ],
      },
      {
        t: "Object-Oriented Programming",
        s: "Modelling problems with classes and behaviour.",
        o: [
          "Design classes with meaningful state and behaviour",
          "Apply inheritance and composition appropriately",
          "Use dunder methods to integrate with Python's protocols",
        ],
        c: [
          "Class|A blueprint that defines the attributes and methods shared by objects of a given kind.",
          "Encapsulation|Keeping internal state private and exposing behaviour through a controlled interface.",
          "Inheritance|Deriving a class from another so it reuses and extends the parent's behaviour.",
          "Composition|Building behaviour by holding references to other objects rather than inheriting from them.",
        ],
      },
      {
        t: "Error Handling",
        s: "Failing safely and informatively.",
        o: [
          "Use try, except, else and finally correctly",
          "Raise and define meaningful exceptions",
          "Avoid swallowing errors silently",
        ],
        c: [
          "Exception|An object representing an error condition that interrupts normal execution until it is handled.",
          "Try Block|The section of code whose exceptions will be caught by the handlers that follow it.",
          "Finally Clause|A block that always runs whether or not an exception occurred, used for cleanup.",
          "Custom Exception|A user-defined exception class that gives a specific failure its own identifiable type.",
        ],
      },
      {
        t: "Files, JSON & CSV",
        s: "Reading and writing the formats you will actually meet.",
        o: [
          "Read and write files safely with context managers",
          "Parse and produce JSON and CSV",
          "Handle encoding and malformed rows",
        ],
        c: [
          "Context Manager|A construct used with the with statement that guarantees setup and cleanup around a block.",
          "Serialisation|Converting an in-memory object into a format that can be stored or transmitted.",
          "CSV|A plain-text tabular format where fields are separated by a delimiter and rows by line breaks.",
          "Encoding|The scheme mapping characters to bytes, which must match between writer and reader.",
        ],
      },
      {
        t: "Working With Libraries",
        s: "Standing on the standard library and the ecosystem.",
        o: [
          "Use virtual environments and dependency files",
          "Apply key standard library modules",
          "Read documentation to adopt a new library quickly",
        ],
        c: [
          "Virtual Environment|An isolated Python installation for one project so its dependencies do not conflict with others.",
          "Package Manager|A tool that installs, upgrades and records the external libraries a project depends on.",
          "Standard Library|The large set of modules shipped with Python itself, requiring no external installation.",
          "Dependency Pinning|Recording exact library versions so the same code installs identically elsewhere.",
        ],
      },
      {
        t: "Writing Testable Python",
        s: "Proving your code does what you claim.",
        o: [
          "Write unit tests for functions and classes",
          "Structure code so it is easy to test",
          "Use fixtures and parameterised cases",
        ],
        c: [
          "Unit Test|An automated check that verifies one unit of code behaves correctly in isolation.",
          "Fixture|Reusable setup that prepares the state or data a test needs before it runs.",
          "Mock|A stand-in object that replaces a real dependency so a unit can be tested in isolation.",
          "Test Coverage|The proportion of code executed by the test suite, which indicates but does not guarantee quality.",
        ],
      },
      {
        t: "Automation & Scripting",
        s: "Using Python to remove repetitive work.",
        o: [
          "Build command-line scripts with arguments",
          "Automate file, data and report tasks",
          "Schedule and log a script safely",
        ],
        c: [
          "Command-Line Interface|A text interface through which a script receives arguments and reports results.",
          "Argument Parser|A component that reads, validates and documents the options a script accepts.",
          "Logging|Recording structured runtime messages so a script's behaviour can be understood after the fact.",
          "Idempotent Script|A script that can be run repeatedly without causing additional or unintended changes.",
        ],
      },
      {
        t: "Clean Code & Performance",
        s: "Code your team can read, at a speed the job needs.",
        o: [
          "Apply naming and structure conventions consistently",
          "Profile before optimising",
          "Use generators to handle large data efficiently",
        ],
        c: [
          "PEP 8|The style guide describing Python's conventions for formatting, naming and layout.",
          "Generator|A function that yields values lazily, allowing large sequences to be processed without loading them all.",
          "Profiling|Measuring where a program actually spends its time before deciding what to optimise.",
          "Premature Optimisation|Restructuring code for speed before evidence shows where the real cost lies.",
        ],
      },
    ],
  },
];
