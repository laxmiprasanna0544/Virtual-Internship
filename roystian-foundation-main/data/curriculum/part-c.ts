import type { RawDomain } from "./types";

export const partC: RawDomain[] = [
  {
    id: "java-development",
    name: "Java Development",
    shortName: "Java",
    code: "JV",
    icon: "Coffee",
    category: "Technology",
    tagline: "Build reliable backend systems with Java.",
    description:
      "Learn Java from core syntax through object-oriented design, collections and backend application structure.",
    longDescription:
      "Java remains the backbone of enterprise systems. This demo curriculum covers the language core, the object model, the collections framework, exception handling and concurrency basics, and finishes with how a Java backend service is structured and tested. Content is written for learning purposes and is clearly labelled as a demonstration curriculum.",
    whoFor: [
      "Engineering and computer applications students",
      "Learners preparing for backend or enterprise development roles",
      "Developers moving to Java from another language",
    ],
    whatYouLearn: [
      "Java syntax, types and the JVM execution model",
      "Object-oriented design with classes, interfaces and generics",
      "The collections framework and when to use each structure",
      "Exception handling, streams and concurrency fundamentals",
      "How a layered backend service is organised and tested",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "demo",
    practicalTask: {
      title: "Object-oriented design task",
      brief:
        "Design and implement a small Java class hierarchy for the provided scenario and justify your design.",
      requirements: [
        "Model the scenario with at least three classes or interfaces",
        "Demonstrate encapsulation and one use of polymorphism",
        "Handle at least two failure conditions with appropriate exceptions",
        "Explain why you chose inheritance or composition in one key decision",
      ],
      deliverable:
        "Your code and design rationale as a text response, or an uploaded .java file / archive.",
      evaluation: [
        "Sound separation of responsibilities",
        "Correct use of the object model",
        "Clear reasoning for design trade-offs",
      ],
    },
    modules: [
      {
        t: "Java & the JVM",
        s: "How Java code becomes something that runs anywhere.",
        o: [
          "Explain compilation to bytecode and JVM execution",
          "Set up a project and run it from the command line",
          "Describe the roles of JDK, JRE and JVM",
        ],
        c: [
          "Bytecode|Platform-independent intermediate instructions produced by the Java compiler for the JVM to execute.",
          "JVM|The runtime that loads bytecode, manages memory and executes Java programs on any supported platform.",
          "JDK|The development kit containing the compiler, tools and runtime needed to build Java applications.",
          "Garbage Collection|Automatic reclamation of memory occupied by objects that are no longer reachable.",
        ],
      },
      {
        t: "Core Syntax & Types",
        s: "Primitives, references and control flow.",
        o: [
          "Use primitive and reference types correctly",
          "Apply control flow and loops idiomatically",
          "Understand how strings are stored and compared",
        ],
        c: [
          "Primitive Type|A built-in type such as int or boolean that stores a value directly rather than a reference.",
          "Reference Type|A type whose variable stores the address of an object rather than the object's value.",
          "Immutable String|A string object whose contents cannot change after creation, so modification produces a new object.",
          "Autoboxing|Automatic conversion between a primitive type and its corresponding wrapper class.",
        ],
      },
      {
        t: "Object-Oriented Java",
        s: "Classes, interfaces and the contracts between them.",
        o: [
          "Design classes with constructors and encapsulated state",
          "Use interfaces and abstract classes appropriately",
          "Apply polymorphism to remove conditional branching",
        ],
        c: [
          "Interface|A contract declaring methods a class must provide, without specifying how they are implemented.",
          "Abstract Class|A partially implemented class that cannot be instantiated and is intended to be extended.",
          "Polymorphism|The ability to invoke the same method on different types and get type-appropriate behaviour.",
          "Constructor|A special method that initialises a newly created object's state.",
        ],
      },
      {
        t: "Collections Framework",
        s: "Lists, sets, maps and their performance characteristics.",
        o: [
          "Choose the right collection for access patterns",
          "Sort and search using comparators",
          "Reason about the cost of common operations",
        ],
        c: [
          "ArrayList|A resizable array offering fast index access but slower insertion in the middle.",
          "HashMap|A key-value structure providing near constant-time lookup using hash codes.",
          "LinkedList|A sequence of linked nodes offering cheap insertion and removal but slow index access.",
          "Comparator|An object that defines an ordering between two elements for sorting purposes.",
        ],
      },
      {
        t: "Exception Handling",
        s: "Checked, unchecked and how to fail well.",
        o: [
          "Distinguish checked from unchecked exceptions",
          "Use try-with-resources for cleanup",
          "Design exception boundaries in an application",
        ],
        c: [
          "Checked Exception|An exception the compiler requires a method to either handle or declare.",
          "Unchecked Exception|A runtime exception that the compiler does not force callers to handle.",
          "Try-With-Resources|A construct that automatically closes resources declared in its header when the block exits.",
          "Stack Trace|The recorded sequence of method calls leading to the point where an exception was thrown.",
        ],
      },
      {
        t: "Generics & Type Safety",
        s: "Reusable code that still catches errors at compile time.",
        o: [
          "Write generic classes and methods",
          "Apply bounded type parameters",
          "Explain type erasure and its consequences",
        ],
        c: [
          "Generic Type|A type parameterised by another type so the same code works safely with different element types.",
          "Bounded Type Parameter|A generic parameter restricted to subtypes of a given type, enabling safe method calls on it.",
          "Type Erasure|The process by which generic type information is removed at compile time and not retained at runtime.",
          "Wildcard|A generic placeholder used when the exact type parameter is unknown or flexible.",
        ],
      },
      {
        t: "Streams & Functional Java",
        s: "Declarative data processing pipelines.",
        o: [
          "Transform collections with map, filter and reduce",
          "Use lambdas and method references",
          "Recognise when a stream hurts readability",
        ],
        c: [
          "Stream|A sequence of elements supporting chained operations that are evaluated lazily until a terminal step.",
          "Lambda Expression|A concise anonymous function that can be passed as a value.",
          "Terminal Operation|The stream step that triggers evaluation and produces a result or side effect.",
          "Optional|A container type that explicitly represents the possible absence of a value.",
        ],
      },
      {
        t: "Concurrency Basics",
        s: "Doing several things at once without corrupting state.",
        o: [
          "Explain threads, executors and shared state",
          "Identify race conditions and how to prevent them",
          "Use thread-safe collections appropriately",
        ],
        c: [
          "Thread|An independent path of execution within a program that shares memory with other threads.",
          "Race Condition|A defect where the result depends on the unpredictable timing of concurrent operations.",
          "Synchronisation|Coordinating threads so only one accesses shared mutable state at a time.",
          "Executor Service|A managed pool that schedules and runs tasks on a controlled set of threads.",
        ],
      },
      {
        t: "Backend Application Structure",
        s: "Layering a service so it stays maintainable.",
        o: [
          "Separate controller, service and repository layers",
          "Apply dependency injection",
          "Map requests to domain operations cleanly",
        ],
        c: [
          "Dependency Injection|Supplying a component's dependencies from outside rather than having it construct them itself.",
          "Service Layer|The layer holding business logic, kept independent of transport and storage details.",
          "Repository|An abstraction over data access that hides the storage mechanism from business logic.",
          "DTO|A simple object used to carry data across a boundary without exposing internal domain models.",
        ],
      },
      {
        t: "Testing & Build Tools",
        s: "Automating the build and proving correctness.",
        o: [
          "Write unit tests with assertions and mocks",
          "Use a build tool to manage dependencies",
          "Integrate tests into a build pipeline",
        ],
        c: [
          "Build Tool|A program that compiles code, resolves dependencies and packages the application reproducibly.",
          "Unit Test|An automated check verifying one class or method behaves correctly in isolation.",
          "Mocking Framework|A library that produces stand-in implementations of dependencies for tests.",
          "Artifact|The packaged output of a build, such as a JAR, that can be deployed or published.",
        ],
      },
    ],
  },
  {
    id: "iot-electronics",
    name: "IoT & Electronics",
    shortName: "IoT & Electronics",
    code: "IOT",
    icon: "Cpu",
    category: "Engineering",
    tagline: "Connect the physical world to software.",
    description:
      "Understand sensors, microcontrollers, connectivity and the data pipeline behind connected devices.",
    longDescription:
      "An IoT system spans electronics, embedded firmware, networking and cloud data. This demo curriculum walks that chain: how a sensor produces a signal, how a microcontroller reads and conditions it, how the reading travels over a network protocol, and how it becomes a dashboard or an alert. It also covers power, reliability and security considerations that decide whether a deployment survives in the field.",
    whoFor: [
      "Electronics, electrical, instrumentation and mechatronics students",
      "Computer science learners curious about embedded systems",
      "Makers who want structure behind their prototypes",
    ],
    whatYouLearn: [
      "Sensors, actuators and signal conditioning",
      "Microcontroller programming and GPIO fundamentals",
      "IoT communication protocols and network architecture",
      "Edge versus cloud processing and data pipelines",
      "Power budgeting, reliability and device security",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "demo",
    practicalTask: {
      title: "IoT system design activity",
      brief:
        "Design an IoT solution for the provided scenario, from sensor selection to dashboard output.",
      requirements: [
        "Specify the sensors and actuators required and the quantity each measures",
        "Describe the microcontroller, connectivity choice and why it suits the environment",
        "Define the data pipeline from device reading to stored record to alert",
        "State the power strategy and one failure mode with its mitigation",
      ],
      deliverable:
        "A written design (400–700 words) or an uploaded block diagram with commentary.",
      evaluation: [
        "Component choices match the stated constraints",
        "The data path is complete and plausible",
        "Reliability and power are addressed, not ignored",
      ],
    },
    modules: [
      {
        t: "Introduction to IoT Systems",
        s: "The four layers every connected product shares.",
        o: [
          "Describe the device, network, platform and application layers",
          "Map a real product onto those layers",
          "Identify where value is created in an IoT system",
        ],
        c: [
          "Internet of Things|A network of physical devices with sensing, processing and connectivity that exchange data with systems and each other.",
          "Edge Device|Hardware at the point of measurement that collects and often pre-processes data before transmission.",
          "Telemetry|Measurements collected automatically at a remote source and transmitted for monitoring.",
          "Actuator|A component that converts an electrical signal into physical action such as motion, heat or flow.",
        ],
      },
      {
        t: "Electronics Fundamentals",
        s: "Voltage, current and reading a circuit.",
        o: [
          "Apply Ohm's law to simple circuits",
          "Read a schematic and identify components",
          "Use a multimeter safely for basic measurements",
        ],
        c: [
          "Voltage|The electrical potential difference between two points, which drives current through a circuit.",
          "Current|The rate of flow of electric charge through a conductor.",
          "Resistance|The opposition a component presents to current flow, converting some energy into heat.",
          "Ohm's Law|The relationship stating that voltage equals current multiplied by resistance.",
        ],
      },
      {
        t: "Sensors & Signal Conditioning",
        s: "Getting a trustworthy number out of the physical world.",
        o: [
          "Select sensors by range, accuracy and interface",
          "Apply filtering and calibration",
          "Convert analog signals to digital reliably",
        ],
        c: [
          "Analog Signal|A continuously varying electrical signal whose value represents a physical quantity.",
          "ADC|A circuit that converts a continuous analog signal into a discrete digital value.",
          "Calibration|Adjusting a sensor's readings against a known reference so its output is accurate.",
          "Sampling Rate|How many measurements are taken per second, which must be high enough to capture the signal.",
        ],
      },
      {
        t: "Microcontrollers & GPIO",
        s: "The small computer that runs the device.",
        o: [
          "Read inputs and drive outputs through GPIO",
          "Use timers, interrupts and PWM",
          "Structure firmware as a predictable loop",
        ],
        c: [
          "Microcontroller|A compact integrated circuit combining processor, memory and peripherals for embedded control.",
          "GPIO|General-purpose pins that firmware can configure as digital inputs or outputs.",
          "Interrupt|A signal that pauses normal execution so the processor can respond immediately to an event.",
          "PWM|A technique that varies the duty cycle of a square wave to control average power delivered to a load.",
        ],
      },
      {
        t: "Communication Protocols",
        s: "How devices talk to each other and to the cloud.",
        o: [
          "Compare I2C, SPI and UART for board-level links",
          "Choose between Wi-Fi, BLE and LoRaWAN",
          "Explain publish-subscribe messaging",
        ],
        c: [
          "I2C|A two-wire serial bus that lets one controller address many peripheral chips on the same board.",
          "MQTT|A lightweight publish-subscribe messaging protocol widely used for constrained IoT devices.",
          "LoRaWAN|A low-power wide-area network protocol suited to small payloads sent over long distances.",
          "Payload Size|The amount of data carried in a single message, a critical constraint on low-power networks.",
        ],
      },
      {
        t: "Edge vs Cloud Processing",
        s: "Deciding where the computation should happen.",
        o: [
          "Weigh latency, bandwidth, cost and privacy",
          "Design local buffering for connectivity loss",
          "Place rules and alerts at the right layer",
        ],
        c: [
          "Edge Computing|Processing data on or near the device to reduce latency, bandwidth use and dependence on connectivity.",
          "Store and Forward|Buffering readings locally when the network is unavailable and transmitting them once it returns.",
          "Latency Budget|The maximum acceptable delay between an event occurring and the system responding to it.",
          "Data Aggregation|Combining many raw readings into summaries before transmission to reduce volume.",
        ],
      },
      {
        t: "IoT Data Pipelines",
        s: "From a reading to a dashboard or an alert.",
        o: [
          "Design ingestion, storage and visualisation stages",
          "Handle time-series data and retention",
          "Define alert thresholds that avoid false alarms",
        ],
        c: [
          "Time-Series Data|Measurements recorded with timestamps, queried mainly by time range and aggregation.",
          "Ingestion|The stage that receives incoming device messages and writes them into storage.",
          "Retention Policy|A rule determining how long data is kept at full resolution before being summarised or deleted.",
          "Threshold Alert|A notification triggered when a measured value crosses a configured boundary.",
        ],
      },
      {
        t: "Power & Reliability",
        s: "Designing devices that keep running unattended.",
        o: [
          "Build a simple power budget",
          "Apply sleep modes and duty cycling",
          "Design for graceful recovery after failure",
        ],
        c: [
          "Power Budget|A calculation of average current draw over time, used to size a battery or energy source.",
          "Duty Cycling|Keeping a device asleep most of the time and waking it only briefly to measure and transmit.",
          "Watchdog Timer|A circuit that resets the device if firmware stops responding within an expected interval.",
          "Mean Time Between Failures|The average operating time between one failure and the next for a deployed device.",
        ],
      },
      {
        t: "Device Security",
        s: "Connected devices are attack surface.",
        o: [
          "Secure device identity and provisioning",
          "Encrypt data in transit and at rest",
          "Deliver firmware updates safely",
        ],
        c: [
          "Device Identity|A unique cryptographic credential that lets a platform verify which device sent a message.",
          "Transport Encryption|Protecting data as it travels over a network so it cannot be read or altered.",
          "Over-The-Air Update|Delivering new firmware to deployed devices remotely, with verification and rollback.",
          "Secure Boot|A mechanism ensuring a device only runs firmware signed by a trusted authority.",
        ],
      },
      {
        t: "From Prototype to Deployment",
        s: "What changes when you leave the workbench.",
        o: [
          "Plan enclosure, environment and field testing",
          "Define a fleet monitoring approach",
          "Estimate unit and running cost",
        ],
        c: [
          "Ingress Protection Rating|A standard rating describing how well an enclosure resists dust and water.",
          "Fleet Management|Monitoring, configuring and updating a large population of deployed devices centrally.",
          "Field Trial|A limited real-world deployment run to expose problems that bench testing cannot reveal.",
          "Bill of Materials|The itemised list of every component and its cost required to build one unit.",
        ],
      },
    ],
  },
  {
    id: "sustainability",
    name: "Sustainability",
    shortName: "Sustainability",
    code: "SUS",
    icon: "Leaf",
    category: "Impact",
    tagline: "Analyse environmental problems and design real interventions.",
    description:
      "Learn to assess environmental challenges with data and design structured, measurable interventions.",
    longDescription:
      "Sustainability work fails when it stays at the level of intention. This track teaches the analytical spine: understanding climate and resource systems, measuring footprints, applying circular design, reading ESG reporting frameworks, and structuring an intervention with baselines, targets and verification. The practical activity asks you to analyse a real environmental challenge and propose a structured response.",
    whoFor: [
      "Students across engineering, science, commerce and management",
      "Learners aiming for ESG, CSR or sustainability analyst roles",
      "Anyone who wants to work on climate and resource problems rigorously",
    ],
    whatYouLearn: [
      "Climate systems, emissions and the language of sustainability",
      "Carbon footprinting and life cycle assessment basics",
      "Circular economy and resource efficiency principles",
      "ESG frameworks, reporting and greenwashing red flags",
      "Designing interventions with baselines, targets and measurement",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Environmental challenge analysis",
      brief:
        "Analyse an environmental challenge and propose a structured intervention with measurable outcomes.",
      requirements: [
        "Describe the challenge, affected stakeholders and current baseline",
        "Identify the main drivers using system thinking rather than a single cause",
        "Propose an intervention with a target, a timeline and a cost consideration",
        "Define how impact would be measured and what would count as failure",
      ],
      deliverable:
        "A written proposal (400–700 words) or an uploaded document covering the same structure.",
      evaluation: [
        "The baseline is quantified or credibly estimated",
        "The intervention is specific and implementable",
        "Measurement and failure conditions are defined honestly",
      ],
    },
    modules: [
      {
        t: "Sustainability Fundamentals",
        s: "The vocabulary and the systems behind it.",
        o: [
          "Define sustainability across environmental, social and economic dimensions",
          "Explain planetary boundaries and the Sustainable Development Goals",
          "Distinguish sustainability from corporate social responsibility",
        ],
        c: [
          "Sustainability|Meeting present needs without reducing the ability of future generations to meet their own.",
          "Planetary Boundaries|Scientifically proposed environmental limits within which humanity can operate safely.",
          "Sustainable Development Goals|A set of global goals adopted to address poverty, inequality and environmental decline by 2030.",
          "Triple Bottom Line|An accounting framework that evaluates performance across people, planet and profit.",
        ],
      },
      {
        t: "Climate Systems & Emissions",
        s: "What is actually being measured and why it matters.",
        o: [
          "Explain the greenhouse effect and radiative forcing",
          "Distinguish Scope 1, 2 and 3 emissions",
          "Read an emissions inventory",
        ],
        c: [
          "Greenhouse Gas|A gas that absorbs and re-emits infrared radiation, trapping heat in the atmosphere.",
          "Scope 1 Emissions|Direct emissions from sources an organisation owns or controls.",
          "Scope 2 Emissions|Indirect emissions from the generation of purchased electricity, steam, heating or cooling.",
          "Scope 3 Emissions|All other indirect emissions across an organisation's value chain, upstream and downstream.",
        ],
      },
      {
        t: "Carbon Footprinting",
        s: "Turning activity data into an emissions number.",
        o: [
          "Collect activity data and apply emission factors",
          "Set an appropriate organisational boundary",
          "Present a footprint with its uncertainty",
        ],
        c: [
          "Emission Factor|A coefficient converting a unit of activity, such as a litre of fuel, into emitted greenhouse gases.",
          "Activity Data|The measured quantity of an activity, such as kilowatt-hours consumed or kilometres travelled.",
          "Carbon Dioxide Equivalent|A common unit expressing the warming effect of any greenhouse gas relative to carbon dioxide.",
          "Organisational Boundary|The definition of which operations and facilities are included in an emissions inventory.",
        ],
      },
      {
        t: "Life Cycle Assessment",
        s: "Impact across the whole life of a product.",
        o: [
          "Define goal, scope and functional unit",
          "Build a simple inventory across life stages",
          "Avoid shifting burden from one stage to another",
        ],
        c: [
          "Life Cycle Assessment|A method for evaluating environmental impact across every stage from raw material to disposal.",
          "Functional Unit|The quantified service a product delivers, used to compare alternatives on equal terms.",
          "Cradle to Grave|An assessment boundary spanning raw material extraction through to end-of-life disposal.",
          "Burden Shifting|Reducing impact at one life stage while unintentionally increasing it at another.",
        ],
      },
      {
        t: "Circular Economy",
        s: "Designing waste out of the system.",
        o: [
          "Apply the reduce, reuse, recycle hierarchy correctly",
          "Design products for repair and disassembly",
          "Evaluate a circular business model",
        ],
        c: [
          "Circular Economy|An economic model that keeps materials in use through reuse, repair and recycling rather than disposal.",
          "Linear Economy|The conventional take-make-dispose model in which materials leave the system as waste.",
          "Design for Disassembly|Designing products so components can be separated easily for repair, reuse or recycling.",
          "Product as a Service|A model where customers pay for the use of a product while the producer retains ownership and responsibility.",
        ],
      },
      {
        t: "Energy & Resource Efficiency",
        s: "Where the savings actually are.",
        o: [
          "Run a basic energy audit",
          "Prioritise measures by payback and impact",
          "Evaluate renewable options realistically",
        ],
        c: [
          "Energy Audit|A structured survey of where and how energy is used in order to identify savings opportunities.",
          "Baseline Consumption|The measured level of use before an intervention, against which savings are calculated.",
          "Marginal Abatement Cost|The cost of avoiding one additional unit of emissions through a given measure.",
          "Rebound Effect|The tendency for efficiency gains to be partly offset by increased consumption.",
        ],
      },
      {
        t: "Water, Waste & Biodiversity",
        s: "The impacts beyond carbon.",
        o: [
          "Assess water stress and consumption",
          "Apply waste segregation and diversion principles",
          "Recognise biodiversity impacts in a project",
        ],
        c: [
          "Water Footprint|The total volume of freshwater consumed or polluted to produce a good or run an operation.",
          "Waste Diversion|The proportion of waste kept out of landfill through reuse, recycling or composting.",
          "Biodiversity|The variety of living species within an ecosystem, which underpins its resilience and function.",
          "Ecosystem Service|A benefit people obtain from natural systems, such as pollination, flood control or clean water.",
        ],
      },
      {
        t: "ESG & Reporting Frameworks",
        s: "How organisations disclose and are held to account.",
        o: [
          "Describe major reporting frameworks at a high level",
          "Run a materiality assessment",
          "Spot greenwashing in a disclosure",
        ],
        c: [
          "ESG|A framework assessing an organisation on environmental, social and governance performance.",
          "Materiality Assessment|A process identifying which sustainability issues matter most to stakeholders and the business.",
          "Assurance|Independent verification that reported sustainability data is accurate and complete.",
          "Greenwashing|Presenting an organisation or product as more environmentally responsible than the evidence supports.",
        ],
      },
      {
        t: "Designing an Intervention",
        s: "Moving from a diagnosis to a plan that can be executed.",
        o: [
          "Set a baseline, target and timeline",
          "Map stakeholders and incentives",
          "Plan for monitoring and verification",
        ],
        c: [
          "Theory of Change|An explicit statement of how a set of activities is expected to produce a desired outcome.",
          "Baseline|The measured starting condition against which the effect of an intervention is judged.",
          "Monitoring and Verification|Ongoing measurement and independent checking that claimed results actually occurred.",
          "Co-Benefit|An additional positive outcome of an intervention beyond its primary objective.",
        ],
      },
      {
        t: "Careers in Sustainability",
        s: "Where this work happens and what it demands.",
        o: [
          "Map roles across consulting, corporate and development sectors",
          "Identify the technical skills each role needs",
          "Build a credible portfolio of applied work",
        ],
        c: [
          "Sustainability Analyst|A role that collects, verifies and reports environmental and social performance data.",
          "Carbon Accounting|The discipline of measuring, reporting and verifying an organisation's greenhouse gas emissions.",
          "Impact Measurement|Assessing the actual social or environmental change produced by a programme.",
          "Stakeholder Engagement|Structured consultation with affected groups to shape and legitimise a programme.",
        ],
      },
    ],
  },
];
