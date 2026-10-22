/**
 * The material each domain's practical task works from: the scenario, key
 * facts, and any downloadable dataset or starter file.
 *
 * Briefs in data/curriculum refer to "the dataset / scenario below"; this is
 * what they point at. Files live in public/practicals/<domain-id>/.
 */

export interface PracticalMaterial {
  label: string;
  href: string;
  description: string;
  size: string;
}

export interface PracticalBriefing {
  scenario: string[];
  facts?: { label: string; value: string }[];
  materials: PracticalMaterial[];
}

export const PRACTICAL_BRIEFINGS: Record<string, PracticalBriefing> = {
  "ai-ml": {
    scenario: [
      "StreamKart is an Indian video-streaming subscription service with Basic (₹299), Standard (₹499) and Premium (₹799) monthly plans. Too many subscribers are cancelling, and the product team wants to understand the data before anyone builds a churn model.",
      "The dataset below is an export of 1,000 subscribers. Each row is one customer; the churned column is 1 if they cancelled in the following billing cycle and 0 if they stayed. The export has not been cleaned, so expect gaps and a few suspicious values.",
    ],
    facts: [
      { label: "Rows × columns", value: "1,000 × 10" },
      { label: "Target column", value: "churned (1 = cancelled, 0 = stayed)" },
      { label: "Charges", value: "monthly_charge_inr, in rupees" },
      { label: "Activity", value: "support_tickets_90d, last_login_days" },
    ],
    materials: [
      {
        label: "customer_churn.csv",
        href: "/practicals/ai-ml/customer_churn.csv",
        description:
          "1,000 subscribers × 10 columns: tenure, plan, monthly charge, support tickets, payment method, auto-renew, days since last login, city and the churned flag.",
        size: "55 KB",
      },
    ],
  },

  "data-analytics": {
    scenario: [
      "UrbanCart is an online lifestyle retailer selling across four regions of India. The head of sales has asked for a dashboard-style review of 2025 so the leadership team can decide where to focus in 2026.",
      "The dataset below holds every order for 2025, with region, category, channel, discount and whether the order was returned. It has not been cleaned: look for duplicate rows and blank values before you calculate anything.",
    ],
    facts: [
      { label: "Rows × columns", value: "≈2,000 orders × 11" },
      { label: "Period", value: "1 January – 31 December 2025" },
      { label: "Regions", value: "North, South, East, West" },
      { label: "Revenue", value: "net_amount_inr = gross after discount" },
    ],
    materials: [
      {
        label: "retail_sales_2025.csv",
        href: "/practicals/data-analytics/retail_sales_2025.csv",
        description:
          "≈2,000 orders × 11 columns: date, region, category, channel, quantity, unit price, discount %, gross and net amount, and a returned flag.",
        size: "131 KB",
      },
    ],
  },

  "business-analytics": {
    scenario: [
      "GlowRoot is a direct-to-consumer skincare brand that sells through its own website and app. Revenue has more than doubled in two years and the founders are pleased, but the CFO has flagged that the business is now losing money every quarter.",
      "You are the analyst asked to prepare a business performance review for the next board meeting. The quarterly KPI sheet below is everything finance can share. Identify what is really going wrong, why, and what the company should do.",
    ],
    facts: [
      { label: "Period", value: "8 quarters, 2024-Q1 to 2025-Q4" },
      { label: "Units", value: "Revenue, COGS and EBITDA in ₹ crore; marketing in ₹ lakh" },
      { label: "Customer metrics", value: "New customers, repeat-purchase rate, CAC, NPS" },
    ],
    materials: [
      {
        label: "d2c_quarterly_kpis.csv",
        href: "/practicals/business-analytics/d2c_quarterly_kpis.csv",
        description:
          "8 quarters × 13 columns: revenue, orders, order value, new customers, repeat-purchase rate, CAC, marketing spend, discount, returns, COGS, EBITDA and NPS.",
        size: "1 KB",
      },
    ],
  },

  "full-stack-development": {
    scenario: [
      "Your team's project tool needs a Team Task List component: it shows a team's tasks, lets a user add, complete and delete them, and filters between all, active and done.",
      "Download the starter below and open it in any browser. It works, but it is incomplete: it has no loading, empty or error states, accepts blank titles, ignores the filter buttons, forgets new tasks on reload and has a bug that sometimes deletes the wrong task. A numbered TODO list at the top of the file describes each gap.",
      "Modify the starter (or rebuild it in React or Vue if you prefer) and explain your decisions. You do not need to fix every TODO, but your submission must cover the four requirements listed for this task.",
    ],
    facts: [
      { label: "Data source", value: "fakeApi.fetchTasks(): ~1 s delay, fails about 1 time in 5" },
      { label: "Title rules", value: "Required, not just spaces, at most 120 characters" },
      { label: "Runs in", value: "Any modern browser, no build step" },
    ],
    materials: [
      {
        label: "starter-task-list.html",
        href: "/practicals/full-stack-development/starter-task-list.html",
        description:
          "A single HTML file (HTML, CSS and vanilla JavaScript) containing the working-but-incomplete component and a numbered TODO list.",
        size: "7 KB",
      },
    ],
  },

  "software-testing": {
    scenario: [
      "The feature under test is the coupon code field on the checkout page of FreshBasket, an online grocery app. A shopper types a code, presses Apply, and the order total updates or an error message appears.",
      "Business rules: codes are 6 to 12 characters, letters and digits only, and are not case-sensitive. FRESH10 gives 10% off, capped at ₹150. FLAT100 gives ₹100 off and needs a minimum cart value of ₹499. NEWUSER50 gives 50% off up to ₹200 and is valid only on a customer's first order. Only one coupon can be applied per order. Expired codes show 'This coupon has expired'; unknown codes show 'Invalid coupon code'. The discount can never make the total less than ₹0.",
      "Write test cases for this feature using the rules and the sample data in the table.",
    ],
    facts: [
      { label: "Code length", value: "6–12 characters, A–Z and 0–9 only" },
      { label: "FRESH10", value: "10% off, maximum ₹150 discount" },
      { label: "FLAT100", value: "₹100 off, cart must be ₹499 or more" },
      { label: "NEWUSER50", value: "50% off up to ₹200, first order only" },
      { label: "Expired code", value: "SUMMER25 (expired 30 June 2025)" },
      { label: "Test accounts", value: "new.user@test.in (0 orders), regular@test.in (14 orders)" },
    ],
    materials: [],
  },

  "python-development": {
    scenario: [
      "Download the problem set below. It contains four practical problems drawn from everyday Indian apps (cleaning mobile numbers, splitting a bill in paise, finding common words in feedback, merging meeting-room bookings) and one object-oriented design task: a campus canteen wallet.",
      "Each problem is a function stub with a docstring, worked examples and the error conditions to handle. Run python problem_set.py at any time: it prints PASS or FAIL for each problem, and every check fails until you implement it.",
    ],
    facts: [
      { label: "Problems", value: "4 functions + 1 class (Wallet)" },
      { label: "Libraries", value: "Python standard library only" },
      { label: "Run with", value: "python problem_set.py (Python 3.9+)" },
    ],
    materials: [
      {
        label: "problem_set.py",
        href: "/practicals/python-development/problem_set.py",
        description:
          "Four stubbed problems and a Wallet class to design, with docstrings, examples and built-in checks that report PASS/FAIL.",
        size: "8 KB",
      },
    ],
  },

  "java-development": {
    scenario: [
      "CityPark runs multi-level parking in Pune malls. Each facility has floors, and each floor has spots of three types: bike, car and EV-charging car spots. A vehicle (bike, car or electric car) is issued a ticket on entry and pays on exit.",
      "Fees: bikes pay ₹20 per hour, cars ₹40 per hour, and electric cars ₹40 per hour plus ₹15 per kWh charged when parked in an EV spot. Any part of an hour counts as a full hour, and the first 15 minutes are free for every vehicle. Bikes may only use bike spots; electric cars may use car or EV spots; petrol and diesel cars may not use EV spots.",
      "Design and implement the core classes: vehicles, spots, the parking floor or facility, tickets and fee calculation. A command-line demo or unit tests showing a few entries and exits is enough; no UI or database is needed.",
    ],
    facts: [
      { label: "Bike", value: "₹20 per hour, bike spots only" },
      { label: "Car", value: "₹40 per hour, car spots only" },
      { label: "Electric car", value: "₹40 per hour + ₹15 per kWh in an EV spot" },
      { label: "Free period", value: "First 15 minutes; then each part-hour counts as a full hour" },
      { label: "Must fail cleanly", value: "No suitable spot free; exit with an unknown or already-closed ticket" },
    ],
    materials: [],
  },

  "iot-electronics": {
    scenario: [
      "A dairy cooperative near Nagpur stores milk and paneer in a 40 m² cold room that must stay between 2 °C and 6 °C. Today a worker checks a dial thermometer twice a day. Last month the compressor failed overnight and ₹3.2 lakh of stock was lost before anyone noticed.",
      "Design an IoT system that monitors the cold room around the clock and alerts staff before stock is at risk. The site has unreliable Wi-Fi, 4G coverage at two bars, and power cuts of up to 2 hours several times a week.",
      "The CSV below is one week of hourly readings from a trial temperature logger in the room. Use it to set sensible alert thresholds, and point to the compressor fault, the door openings and the gap in readings in your design.",
    ],
    facts: [
      { label: "Safe range", value: "2 °C – 6 °C" },
      { label: "Room", value: "40 m², one door, opened often 8 am – 8 pm" },
      { label: "Connectivity", value: "Unreliable Wi-Fi; 4G at two bars" },
      { label: "Power", value: "Cuts of up to 2 hours, several times a week" },
      { label: "Budget", value: "About ₹25,000 for hardware" },
    ],
    materials: [
      {
        label: "cold_room_readings.csv",
        href: "/practicals/iot-electronics/cold_room_readings.csv",
        description:
          "168 hourly readings × 7 columns: temperature, humidity, door-open flag, battery and signal strength from a trial logger.",
        size: "8 KB",
      },
    ],
  },

  sustainability: {
    scenario: [
      "Sahyadri Institute of Technology is a residential engineering college near Pune with about 4,200 students. Its management has committed to cutting the campus's environmental footprint by 2027 and has asked student interns to pick one challenge and propose an intervention.",
      "The CSV below holds 24 months of campus resource data: grid electricity, rooftop solar (installed in September 2024), diesel used by the backup generator, water, total and food waste, and the share of waste that is segregated at source. Choose one challenge visible in the data, such as summer electricity and diesel use, food waste from the hostel mess or poor waste segregation, and build your proposal around it.",
    ],
    facts: [
      { label: "Students", value: "≈4,200 (≈1,500 during June vacation)" },
      { label: "Period", value: "January 2024 – December 2025, monthly" },
      { label: "Grid tariff", value: "≈₹9 per kWh" },
      { label: "Diesel", value: "≈₹92 per litre" },
    ],
    materials: [
      {
        label: "campus_resource_use.csv",
        href: "/practicals/sustainability/campus_resource_use.csv",
        description:
          "24 months × 9 columns: students on campus, grid and solar electricity, generator diesel, water, total and food waste, and waste segregation %.",
        size: "1 KB",
      },
    ],
  },

  "sales-marketing": {
    scenario: [
      "BrewBuddy is launching a ₹1,499 compact cold-brew coffee maker, sold online through its own website, Amazon and Flipkart. It is new to the market: the brand has 8,000 Instagram followers and an email list of 12,000 past buyers of its coffee beans.",
      "Design the launch campaign for the first 30 days in Bengaluru, Pune and Hyderabad. Leadership wants 2,500 units sold in that period with a marketing budget of ₹6 lakh. Competing products cost between ₹1,200 and ₹3,500 and mostly promote convenience.",
    ],
    facts: [
      { label: "Product", value: "Cold-brew maker, ₹1,499, 800 ml, ready in 12 hours" },
      { label: "Launch cities", value: "Bengaluru, Pune, Hyderabad" },
      { label: "Goal", value: "2,500 units in 30 days" },
      { label: "Budget", value: "₹6,00,000" },
      { label: "Owned audience", value: "8,000 Instagram followers; 12,000 email subscribers" },
      { label: "Margin", value: "≈₹520 per unit before marketing" },
    ],
    materials: [],
  },

  "mechanical-engineering": {
    scenario: [
      "A small fabrication shop in Rajkot has been asked to supply a wall-mounted bracket that holds a 1.5 HP air-conditioner outdoor unit on the outside wall of apartment buildings. Brackets are exposed to rain, sun and coastal humidity, and installers fix them to brick or concrete with anchor bolts.",
      "Work through the design from requirements to a proposal the shop can manufacture in batches of 500 using its existing equipment.",
    ],
    facts: [
      { label: "Load", value: "Outdoor unit of 45 kg, centre of mass 250 mm from the wall" },
      { label: "Safety factor", value: "At least 3 on static load" },
      { label: "Unit footprint", value: "800 mm wide × 300 mm deep" },
      { label: "Environment", value: "Outdoor, 5 °C – 48 °C, humid, possibly coastal" },
      { label: "Shop equipment", value: "Shearing, press brake, MIG welding, drilling, powder coating" },
      { label: "Target cost", value: "Under ₹900 per pair of brackets" },
    ],
    materials: [],
  },

  "software-development": {
    scenario: [
      "A college clinic runs a token system. Students book a slot online, and a doctor's day is a list of booked appointments, each with a start and end time in minutes since midnight. Because bookings are made from several devices at once, the list can contain overlaps.",
      "Write a function that takes a doctor's appointments for one day and returns the minimum number of consultation rooms needed so that no two overlapping appointments share a room, plus the time at which the most rooms are in use. An appointment that ends at 600 and one that starts at 600 do not overlap.",
      "Example: [(540, 600), (570, 630), (600, 660), (700, 720)] needs 2 rooms; the peak of 2 first occurs at 570. Your solution should handle up to 100,000 appointments in under a second and reject invalid input (an end time not after its start time, or times outside 0 to 1440) with a clear error.",
    ],
    facts: [
      { label: "Input", value: "List of (start, end) minutes, unsorted, 0 ≤ start < end ≤ 1440" },
      { label: "Output", value: "Rooms needed and the first time the peak occurs" },
      { label: "Scale", value: "Up to 100,000 appointments, under 1 second" },
      { label: "Language", value: "Any mainstream language" },
    ],
    materials: [],
  },
};

export function getPracticalBriefing(
  domainId: string | null | undefined,
): PracticalBriefing | undefined {
  return domainId ? PRACTICAL_BRIEFINGS[domainId] : undefined;
}
