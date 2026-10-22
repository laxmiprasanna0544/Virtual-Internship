import type { RawDomain } from "./types";

export const partA: RawDomain[] = [
  {
    id: "ai-ml",
    name: "AI / ML",
    shortName: "AI / ML",
    code: "AIML",
    icon: "BrainCircuit",
    category: "Technology",
    tagline: "Understand how intelligent systems actually learn.",
    description:
      "Learn how artificial intelligence and machine learning systems are built, evaluated and applied to real problems.",
    longDescription:
      "This internship track moves from the vocabulary of artificial intelligence to the practical mechanics of training and evaluating a model. You work with concepts rather than hype: how data becomes features, how a model learns from those features, why models fail, and how teams decide whether a model is good enough to use. Every module pairs structured reading with a short assessment, and the track closes with a practical data-analysis activity.",
    whoFor: [
      "Students from engineering, computer applications, statistics or science backgrounds",
      "Learners who have heard of AI but have never worked through the pipeline end to end",
      "Anyone preparing for analytics, data science or ML-adjacent roles",
    ],
    whatYouLearn: [
      "The difference between AI, machine learning and deep learning",
      "Supervised, unsupervised and reinforcement learning and when each applies",
      "How datasets are cleaned, split and turned into model-ready features",
      "How models are evaluated with accuracy, precision, recall and error analysis",
      "Where AI is applied responsibly and where it breaks down",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Dataset observation report",
      brief:
        "Analyse the StreamKart customer churn dataset and explain three key observations using appropriate machine learning concepts.",
      requirements: [
        "State the shape of the dataset and the target variable you would predict",
        "Describe three concrete observations (distribution, correlation, imbalance, missing values or outliers)",
        "Name the ML concept that explains each observation and why it matters for modelling",
        "Recommend one modelling approach and one evaluation metric, with reasoning",
      ],
      deliverable:
        "A written report (400–700 words) or an uploaded notebook/document containing the same analysis.",
      evaluation: [
        "Correct use of machine learning vocabulary",
        "Observations are specific rather than generic",
        "Reasoning connects the data to a modelling decision",
      ],
    },
    modules: [
      {
        t: "Introduction to Artificial Intelligence",
        s: "What AI is, what it is not, and the vocabulary used across the industry.",
        o: [
          "Define artificial intelligence and distinguish it from automation",
          "Map the relationship between AI, machine learning and deep learning",
          "Describe three categories of real AI systems in use today",
        ],
        c: [
          "Artificial Intelligence|The broad field concerned with building systems that perform tasks normally requiring human intelligence, such as perception, reasoning or language.",
          "Machine Learning|A subset of AI in which a system improves its performance on a task by learning patterns from data instead of following hand-written rules.",
          "Deep Learning|A subset of machine learning that uses multi-layer neural networks to learn hierarchical representations directly from raw data.",
          "Narrow AI|A system designed and trained for one specific task, which cannot transfer its ability to unrelated tasks.",
        ],
      },
      {
        t: "Machine Learning Fundamentals",
        s: "The three learning paradigms and how a model is trained.",
        o: [
          "Explain supervised, unsupervised and reinforcement learning",
          "Describe the training loop in terms of predictions, loss and updates",
          "Choose a learning paradigm for a given business problem",
        ],
        c: [
          "Supervised Learning|Learning from labelled examples, where each input is paired with the correct output the model should produce.",
          "Unsupervised Learning|Learning structure from unlabelled data, for example by grouping similar records into clusters.",
          "Reinforcement Learning|Learning through trial and error, where an agent takes actions in an environment and receives rewards or penalties.",
          "Loss Function|A mathematical measure of how far a model's prediction is from the correct answer, used to guide the model's updates.",
        ],
      },
      {
        t: "Data & Model Concepts",
        s: "How raw data becomes a dataset a model can actually learn from.",
        o: [
          "Prepare a dataset through cleaning, encoding and scaling",
          "Split data correctly into training, validation and test sets",
          "Explain why leakage destroys the credibility of a result",
        ],
        c: [
          "Feature|An individual measurable input variable that the model uses to make a prediction.",
          "Training Set|The portion of the data the model learns from directly during fitting.",
          "Test Set|A held-out portion of the data, never used during training, that estimates real-world performance.",
          "Data Leakage|A flaw where information from outside the training set influences the model, producing scores that cannot be reproduced in production.",
        ],
      },
      {
        t: "Real-World AI Applications",
        s: "Where AI creates measurable value and where it is the wrong tool.",
        o: [
          "Describe AI use cases across healthcare, finance, retail and agriculture",
          "Identify the data requirements behind each use case",
          "Explain why some problems should not be solved with AI",
        ],
        c: [
          "Recommendation System|A system that ranks items for a specific user based on past behaviour of that user and of similar users.",
          "Computer Vision|The field concerned with extracting meaning from images and video, such as detecting objects or reading documents.",
          "Natural Language Processing|The field concerned with enabling systems to interpret, generate and reason over human language.",
          "Predictive Maintenance|Using sensor history to forecast equipment failure before it happens so that servicing can be scheduled.",
        ],
      },
      {
        t: "Model Evaluation & Metrics",
        s: "Deciding whether a model is genuinely good or just lucky.",
        o: [
          "Read a confusion matrix and derive metrics from it",
          "Select an appropriate metric for imbalanced problems",
          "Explain why accuracy alone can be misleading",
        ],
        c: [
          "Accuracy|The proportion of all predictions that the model got correct.",
          "Precision|Of the records the model flagged as positive, the proportion that were genuinely positive.",
          "Recall|Of all genuinely positive records, the proportion the model successfully flagged.",
          "Confusion Matrix|A table comparing predicted classes against actual classes, showing true and false positives and negatives.",
        ],
      },
      {
        t: "Overfitting, Underfitting & Generalisation",
        s: "Why models that look perfect in training fail in production.",
        o: [
          "Diagnose overfitting and underfitting from learning behaviour",
          "Apply regularisation and cross-validation as corrective techniques",
          "Explain the bias–variance trade-off in plain language",
        ],
        c: [
          "Overfitting|When a model memorises noise in the training data and therefore performs poorly on unseen data.",
          "Underfitting|When a model is too simple to capture the real pattern, performing poorly on both training and unseen data.",
          "Regularisation|A family of techniques that penalise unnecessary model complexity to improve performance on unseen data.",
          "Cross-Validation|A procedure that repeatedly splits the data into folds so performance is estimated on several different held-out sets.",
        ],
      },
      {
        t: "Core Algorithms in Practice",
        s: "The handful of algorithms that solve most practical problems.",
        o: [
          "Describe how linear and logistic regression make predictions",
          "Explain tree-based models and why ensembles improve them",
          "Match an algorithm family to a data shape and problem type",
        ],
        c: [
          "Linear Regression|An algorithm that predicts a continuous value by fitting a weighted straight-line relationship between inputs and output.",
          "Logistic Regression|An algorithm that predicts the probability of a category by passing a weighted sum through a logistic curve.",
          "Decision Tree|A model that splits data through a sequence of yes/no questions until it reaches a prediction at a leaf.",
          "Random Forest|An ensemble that trains many decision trees on varied samples and averages their predictions to reduce variance.",
        ],
      },
      {
        t: "Neural Networks Explained Simply",
        s: "What a neural network is doing underneath the terminology.",
        o: [
          "Describe neurons, layers, weights and activation functions",
          "Explain forward pass and backpropagation conceptually",
          "Identify problems where deep learning is worth the cost",
        ],
        c: [
          "Neuron|A unit that computes a weighted sum of its inputs and passes the result through an activation function.",
          "Activation Function|A non-linear function applied to a neuron's output so the network can represent complex relationships.",
          "Backpropagation|The algorithm that computes how much each weight contributed to the error and adjusts it accordingly.",
          "Epoch|One complete pass of the entire training dataset through the learning algorithm.",
        ],
      },
      {
        t: "Responsible & Ethical AI",
        s: "Bias, transparency and the limits of automated decisions.",
        o: [
          "Identify sources of bias in data and in model design",
          "Explain why explainability matters in regulated decisions",
          "Describe basic safeguards for deploying a model responsibly",
        ],
        c: [
          "Algorithmic Bias|Systematic unfairness in model outputs that arises from unrepresentative data or flawed problem framing.",
          "Explainability|The degree to which a human can understand why a model produced a particular output.",
          "Human-in-the-Loop|A design where a person reviews or approves model outputs before they take effect.",
          "Model Drift|The gradual decline in model performance as real-world data moves away from the data it was trained on.",
        ],
      },
      {
        t: "From Notebook to Deployment",
        s: "How a trained model becomes something a product can call.",
        o: [
          "Describe the lifecycle from experiment to monitored service",
          "Explain how a model is exposed through an API",
          "List the signals worth monitoring after release",
        ],
        c: [
          "Model Serving|Exposing a trained model behind an interface so applications can request predictions in real time.",
          "Inference|The act of using a trained model to produce a prediction for new, unseen input.",
          "Model Registry|A versioned store of trained models with their metrics and metadata so releases can be tracked and rolled back.",
          "Monitoring|Continuous measurement of live input data and prediction quality to detect degradation early.",
        ],
      },
    ],
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    shortName: "Data Analytics",
    code: "DA",
    icon: "BarChart3",
    category: "Data",
    tagline: "Turn raw data into decisions people trust.",
    description:
      "Work with real analytical thinking: cleaning data, asking sharp questions and building dashboards that answer them.",
    longDescription:
      "Data analytics is less about tools and more about disciplined thinking. This track teaches you to move from a vague business question to a defensible answer: framing the question, sourcing and cleaning data, exploring it honestly, and presenting the result so a decision-maker can act. You will work with spreadsheet logic, SQL thinking, statistical fundamentals and dashboard design, and finish by building a dashboard-style analysis of your own.",
    whoFor: [
      "Students who enjoy numbers, patterns and structured reasoning",
      "Commerce, science, engineering and management learners",
      "Anyone targeting analyst roles in product, operations or finance",
    ],
    whatYouLearn: [
      "How to frame a business question so it can actually be answered with data",
      "Cleaning, joining and aggregating data reliably",
      "SQL thinking and spreadsheet modelling",
      "Descriptive statistics and how to avoid misreading them",
      "Dashboard and chart design that communicates rather than decorates",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "documented",
    practicalTask: {
      title: "Dashboard analysis activity",
      brief:
        "Build a dashboard-style analysis from the UrbanCart 2025 sales dataset and explain what a decision-maker should do next.",
      requirements: [
        "Define the business question your analysis answers",
        "List the cleaning steps you applied and the assumptions behind them",
        "Describe at least four metrics or charts your dashboard would contain and why",
        "State one recommendation supported by the numbers, with its limitation",
      ],
      deliverable:
        "A written analysis (400–700 words) or an uploaded dashboard screenshot / spreadsheet with commentary.",
      evaluation: [
        "The question is specific and answerable",
        "Metric choices are justified, not decorative",
        "The recommendation follows from the evidence presented",
      ],
    },
    modules: [
      {
        t: "The Analytics Mindset",
        s: "Turning vague requests into answerable questions.",
        o: [
          "Convert a business request into a measurable question",
          "Distinguish descriptive, diagnostic, predictive and prescriptive analysis",
          "Identify the decision an analysis is meant to support",
        ],
        c: [
          "Descriptive Analysis|Analysis that summarises what happened over a period using counts, totals and averages.",
          "Diagnostic Analysis|Analysis that investigates why something happened by comparing segments and testing explanations.",
          "Predictive Analysis|Analysis that estimates what is likely to happen next based on historical patterns.",
          "Metric|A quantified measure tracked over time that reflects the health of a process or outcome.",
        ],
      },
      {
        t: "Data Sources & Structure",
        s: "Where data lives and what shape it arrives in.",
        o: [
          "Describe structured, semi-structured and unstructured data",
          "Explain rows, columns, keys and granularity",
          "Assess whether a source can answer the question asked",
        ],
        c: [
          "Structured Data|Data organised into fixed rows and columns with a defined schema, such as a database table.",
          "Unstructured Data|Data without a predefined model, such as free text, images or audio.",
          "Primary Key|A column or set of columns whose values uniquely identify each row in a table.",
          "Granularity|The level of detail a single row represents, for example one order, one day or one customer.",
        ],
      },
      {
        t: "Data Cleaning & Preparation",
        s: "The unglamorous work that determines whether the answer is right.",
        o: [
          "Handle missing values, duplicates and inconsistent formats",
          "Document cleaning decisions so results are reproducible",
          "Detect outliers and decide whether to keep them",
        ],
        c: [
          "Missing Value|An absent entry in a dataset that must be removed, imputed or explicitly accounted for before analysis.",
          "Imputation|Replacing a missing value with an estimate such as the mean, median or a modelled value.",
          "Deduplication|Identifying and removing repeated records that would otherwise inflate counts and totals.",
          "Outlier|An observation far outside the typical range, which may be an error or a genuinely important rare case.",
        ],
      },
      {
        t: "Spreadsheet Modelling",
        s: "Lookup logic, pivots and models that do not break.",
        o: [
          "Build lookup and conditional logic that survives new data",
          "Summarise data using pivot tables",
          "Structure a workbook so others can audit it",
        ],
        c: [
          "Pivot Table|An interactive summary that aggregates a dataset across chosen rows, columns and measures.",
          "Lookup Function|A formula that retrieves a value from another table by matching on a shared key.",
          "Absolute Reference|A cell reference locked to a fixed position so it does not shift when the formula is copied.",
          "Data Validation|A rule that restricts what can be entered into a cell, preventing invalid data at the source.",
        ],
      },
      {
        t: "SQL Thinking",
        s: "Asking a database precise questions.",
        o: [
          "Write selection, filtering and aggregation logic",
          "Combine tables with the correct join type",
          "Reason about grouping and row counts before running a query",
        ],
        c: [
          "SELECT|The clause that specifies which columns or expressions a query should return.",
          "WHERE|The clause that filters rows before any grouping or aggregation takes place.",
          "GROUP BY|The clause that collapses rows into groups so aggregate functions can be computed per group.",
          "INNER JOIN|A join that returns only the rows with a matching key in both tables.",
        ],
      },
      {
        t: "Descriptive Statistics",
        s: "Summarising data without lying to yourself.",
        o: [
          "Choose between mean, median and mode appropriately",
          "Interpret spread using range, variance and standard deviation",
          "Recognise when a distribution makes an average meaningless",
        ],
        c: [
          "Median|The middle value when observations are sorted, which is resistant to extreme values.",
          "Standard Deviation|A measure of how far values typically sit from the mean of the dataset.",
          "Skew|Asymmetry in a distribution, where one tail extends further than the other.",
          "Correlation|A measure of how strongly two variables move together, which does not by itself imply causation.",
        ],
      },
      {
        t: "Exploratory Data Analysis",
        s: "Systematically finding what the data is trying to tell you.",
        o: [
          "Run a structured EDA pass on an unfamiliar dataset",
          "Use segmentation to explain an aggregate movement",
          "Separate signal from noise before reporting",
        ],
        c: [
          "Exploratory Data Analysis|A structured first pass over a dataset to understand its distributions, relationships and quality issues.",
          "Segmentation|Splitting a population into meaningful groups so differences hidden by the aggregate become visible.",
          "Simpson's Paradox|A situation where a trend visible in every subgroup reverses when the groups are combined.",
          "Cohort|A group of records that share a common starting characteristic, usually a time period, and are tracked over time.",
        ],
      },
      {
        t: "Dashboard & Visualisation Design",
        s: "Charts that answer the question at a glance.",
        o: [
          "Choose the correct chart type for a comparison",
          "Lay out a dashboard by decision priority",
          "Remove elements that add ink but not meaning",
        ],
        c: [
          "Bar Chart|A chart that compares magnitudes across discrete categories using length on a common baseline.",
          "Line Chart|A chart that shows how a continuous measure changes across an ordered axis, usually time.",
          "KPI Tile|A compact display of one headline number with its context, such as a period comparison.",
          "Data-Ink Ratio|The proportion of a chart's visual elements that carry actual information rather than decoration.",
        ],
      },
      {
        t: "Storytelling With Data",
        s: "Getting a decision made, not just a chart admired.",
        o: [
          "Structure a findings narrative for a non-technical audience",
          "State limitations without undermining the recommendation",
          "Write an executive summary that stands alone",
        ],
        c: [
          "Executive Summary|A short opening that states the question, the answer and the recommended action before any detail.",
          "Insight|A finding that changes what someone will do, as opposed to a fact that merely describes the data.",
          "Assumption|A stated condition taken as true for the analysis, which the reader must know in order to judge the result.",
          "Confidence Statement|An explicit description of how certain a finding is and what would change the conclusion.",
        ],
      },
      {
        t: "Analytics in the Business",
        s: "How analysts operate inside real teams.",
        o: [
          "Describe how analytics requests are scoped and prioritised",
          "Explain reporting cadence and self-serve reporting",
          "Apply basic data governance and privacy practice",
        ],
        c: [
          "Single Source of Truth|One agreed, governed definition and location for a metric so teams do not report conflicting numbers.",
          "Self-Serve Analytics|Enabling non-analysts to answer routine questions themselves through curated dashboards and datasets.",
          "Data Governance|The policies and ownership that define how data is defined, accessed, retained and protected.",
          "Personally Identifiable Information|Data that can identify an individual and therefore requires restricted handling.",
        ],
      },
    ],
  },
  {
    id: "business-analytics",
    name: "Business Analytics",
    shortName: "Business Analytics",
    code: "BA",
    icon: "TrendingUp",
    category: "Business",
    tagline: "Connect numbers to business decisions.",
    description:
      "Learn to analyse business performance, model outcomes and make recommendations leadership can act on.",
    longDescription:
      "Business analytics sits between the data and the decision. This track covers how businesses are measured, how requirements are gathered, how processes are mapped and improved, and how a recommendation is built into a business case. The emphasis is on structured reasoning and communication as much as on numbers, because a business analyst's output is a decision, not a spreadsheet.",
    whoFor: [
      "Management, commerce and engineering students",
      "Learners aiming for business analyst, product or consulting roles",
      "Anyone who wants to reason about a business with evidence",
    ],
    whatYouLearn: [
      "How businesses define and track performance",
      "Requirement gathering and stakeholder management",
      "Process mapping and gap analysis",
      "Forecasting, scenario modelling and unit economics",
      "Building and presenting a business case",
    ],
    levels: ["beginner", "intermediate", "advanced"],
    curriculumSource: "demo",
    practicalTask: {
      title: "Business performance review",
      brief:
        "Analyse the GlowRoot business scenario and quarterly KPI sheet, identify the underlying problem and present a structured recommendation.",
      requirements: [
        "Summarise the business situation and the metric that is under pressure",
        "Provide a root-cause breakdown with at least three candidate causes",
        "Quantify the expected impact of your recommendation, stating assumptions",
        "List the risks and how you would measure success after implementation",
      ],
      deliverable:
        "A written business case (400–700 words) or an uploaded document / slide export covering the same points.",
      evaluation: [
        "Problem is framed around a measurable outcome",
        "Causes are structured rather than listed at random",
        "Recommendation is quantified and risk-aware",
      ],
    },
    modules: [
      {
        t: "How Businesses Are Measured",
        s: "Revenue, cost, margin and the metrics leadership watches.",
        o: [
          "Read a simple profit and loss structure",
          "Distinguish leading from lagging indicators",
          "Select a north-star metric for a given business",
        ],
        c: [
          "Gross Margin|Revenue minus the direct cost of delivering the product, expressed as a share of revenue.",
          "Leading Indicator|A measure that moves before the outcome it predicts, giving early warning.",
          "Lagging Indicator|A measure that confirms what has already happened, such as quarterly revenue.",
          "North-Star Metric|The single measure a team agrees best reflects the value it delivers to customers.",
        ],
      },
      {
        t: "Requirement Gathering",
        s: "Finding out what stakeholders actually need.",
        o: [
          "Run a structured stakeholder interview",
          "Separate stated wants from underlying needs",
          "Write requirements that can be verified",
        ],
        c: [
          "Stakeholder|Any person or group affected by, or able to influence, the outcome of an initiative.",
          "Functional Requirement|A statement of what a system or process must do, expressed so it can be tested.",
          "Non-Functional Requirement|A constraint on how well a system must perform, such as speed, availability or security.",
          "Acceptance Criteria|The specific conditions that must be met for a requirement to be considered delivered.",
        ],
      },
      {
        t: "Process Mapping & Gap Analysis",
        s: "Seeing the process as it is before redesigning it.",
        o: [
          "Map a current-state process end to end",
          "Identify bottlenecks, rework loops and handoff losses",
          "Define a realistic future state with a gap list",
        ],
        c: [
          "Current State|A documented description of how a process actually operates today, including its exceptions.",
          "Bottleneck|The step whose limited capacity constrains the throughput of the entire process.",
          "Gap Analysis|A structured comparison of current performance against a target to determine what must change.",
          "Handoff|A transfer of work between people or systems, a common point at which delay and errors are introduced.",
        ],
      },
      {
        t: "Unit Economics",
        s: "Whether the business makes money on each customer.",
        o: [
          "Calculate contribution per unit or per customer",
          "Relate acquisition cost to lifetime value",
          "Explain the break-even point of an initiative",
        ],
        c: [
          "Customer Acquisition Cost|The total sales and marketing spend divided by the number of customers acquired in that period.",
          "Lifetime Value|The total contribution a business expects to earn from a customer over the whole relationship.",
          "Contribution Margin|What remains from a unit's revenue after its variable costs, available to cover fixed costs.",
          "Break-Even Point|The volume at which total revenue exactly covers total costs, with no profit or loss.",
        ],
      },
      {
        t: "Forecasting & Scenario Planning",
        s: "Modelling what might happen, with honest ranges.",
        o: [
          "Build a simple driver-based forecast",
          "Create base, upside and downside scenarios",
          "Run sensitivity analysis on the biggest assumption",
        ],
        c: [
          "Driver-Based Forecast|A projection built from underlying operational drivers rather than from a single growth percentage.",
          "Scenario Analysis|Modelling several coherent sets of assumptions to understand the range of plausible outcomes.",
          "Sensitivity Analysis|Testing how much the result changes when one assumption is varied while others are held constant.",
          "Baseline|The reference projection against which alternatives and actual performance are compared.",
        ],
      },
      {
        t: "Customer & Market Analysis",
        s: "Understanding demand before designing a response.",
        o: [
          "Segment a market by need and behaviour",
          "Run a structured competitor comparison",
          "Size an opportunity with a defensible method",
        ],
        c: [
          "Market Segmentation|Dividing a market into groups that differ in needs or behaviour so each can be served differently.",
          "Total Addressable Market|The full revenue opportunity available if a product captured all relevant demand.",
          "Value Proposition|A clear statement of the benefit a customer receives and why it is better than the alternative.",
          "Churn Rate|The proportion of customers who stop using the product during a period.",
        ],
      },
      {
        t: "Dashboards for Decision Makers",
        s: "Reporting that shortens the path to a decision.",
        o: [
          "Design a management dashboard around decisions",
          "Apply comparison, target and variance framing",
          "Set an appropriate reporting cadence",
        ],
        c: [
          "Variance|The difference between an actual result and its plan or prior period, usually the first thing a manager looks for.",
          "Drill-Down|The ability to move from a summary number into the detail that explains it.",
          "Reporting Cadence|The agreed rhythm at which a report is produced and reviewed, such as weekly or monthly.",
          "Target|A committed value for a metric within a period, against which performance is judged.",
        ],
      },
      {
        t: "Root Cause Analysis",
        s: "Getting past the symptom to the actual cause.",
        o: [
          "Apply the five-whys and issue-tree techniques",
          "Structure causes so they are mutually exclusive",
          "Test a hypothesis with available data",
        ],
        c: [
          "Issue Tree|A hierarchical breakdown of a problem into mutually exclusive, collectively exhaustive components.",
          "Five Whys|A technique of repeatedly asking why an effect occurred until an addressable cause is reached.",
          "Hypothesis|A specific, testable proposed explanation stated before the supporting analysis is run.",
          "Correlation Trap|Treating two measures that move together as cause and effect without testing the mechanism.",
        ],
      },
      {
        t: "Building a Business Case",
        s: "Turning analysis into an approved decision.",
        o: [
          "Structure a business case from problem to ask",
          "Quantify benefit, cost and payback",
          "Present risks and mitigations credibly",
        ],
        c: [
          "Business Case|A structured argument that justifies an investment by comparing its expected benefits, costs and risks.",
          "Payback Period|The time required for the cumulative benefit of an investment to equal its cost.",
          "Return on Investment|The net benefit of an initiative expressed as a proportion of what it cost.",
          "Mitigation|A planned action that reduces the likelihood or impact of an identified risk.",
        ],
      },
      {
        t: "Communicating Recommendations",
        s: "Being understood by people who did not do the analysis.",
        o: [
          "Lead with the answer and support it afterwards",
          "Adapt depth to the audience",
          "Handle challenge without abandoning the evidence",
        ],
        c: [
          "Answer-First Structure|A communication pattern that states the recommendation first and then presents the supporting reasoning.",
          "Executive Audience|A reader who needs the decision, the impact and the risk, and who will ask for detail only if needed.",
          "Appendix|Supporting material kept out of the main narrative so the argument stays readable but remains verifiable.",
          "Decision Log|A record of what was decided, by whom, on what evidence, so the reasoning can be revisited later.",
        ],
      },
    ],
  },
];
