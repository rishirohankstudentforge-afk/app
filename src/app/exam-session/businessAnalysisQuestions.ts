import { Question } from "./questions";

export const BUSINESS_ANALYSIS_QUESTIONS: Question[] = [
  // ── Section A — Quantitative & Business Aptitude ──────────────────────────
  {
    id: 6001,
    type: "mcq",
    section: "A",
    number: 1,
    questionText: "A company’s revenue increased from ₹80 lakh to ₹100 lakh in Year 1. In Year 2, revenue increased by 15% over Year 1. What is the overall percentage increase from the original revenue?",
    options: [
      "A. 35%",
      "B. 36.25%",
      "C. 37.5%",
      "D. 40%"
    ],
    marks: 2
  },
  {
    id: 6002,
    type: "mcq",
    section: "A",
    number: 2,
    questionText: "A product is sold for ₹2,500. The company earns a profit margin of 20% on the selling price. What is the cost price?",
    options: [
      "A. ₹1,800",
      "B. ₹2,000",
      "C. ₹2,050",
      "D. ₹2,125"
    ],
    marks: 2
  },
  {
    id: 6003,
    type: "mcq",
    section: "A",
    number: 3,
    questionText: "A product's price is increased by 25% and subsequently discounted by 20%. Compared with the original price, the final price is:",
    options: [
      "A. 5% higher",
      "B. 5% lower",
      "C. Exactly the same",
      "D. 10% higher"
    ],
    marks: 2
  },
  {
    id: 6004,
    type: "mcq",
    section: "A",
    number: 4,
    questionText: "A company has fixed costs of ₹12 lakh. Each unit sells for ₹2,000 and has a variable cost of ₹800. How many units must be sold to break even?",
    options: [
      "A. 6,000",
      "B. 8,000",
      "C. 10,000",
      "D. 15,000"
    ],
    marks: 2
  },
  {
    id: 6005,
    type: "mcq",
    section: "A",
    number: 5,
    questionText: "A product sells for ₹5,000 and has a variable cost of ₹3,200. What is its contribution margin percentage?",
    options: [
      "A. 32%",
      "B. 36%",
      "C. 56.25%",
      "D. 64%"
    ],
    marks: 2
  },
  {
    id: 6006,
    type: "mcq",
    section: "A",
    number: 6,
    questionText: "A company's customer base grows from 10,000 to 13,310 over three years. Assuming the same annual compound growth rate, approximately what is the annual growth rate?",
    options: [
      "A. 8%",
      "B. 10%",
      "C. 11%",
      "D. 13.1%"
    ],
    marks: 2
  },
  {
    id: 6007,
    type: "mcq",
    section: "A",
    number: 7,
    questionText: "A company has three customer segments:\n• Enterprise: 100 customers with average revenue ₹50,000\n• Mid-market: 200 customers with average revenue ₹20,000\n• SMB: 700 customers with average revenue ₹5,000\n\nWhat is the approximate average revenue per customer?",
    options: [
      "A. ₹12,500",
      "B. ₹11,000",
      "C. ₹12,000",
      "D. ₹15,000"
    ],
    marks: 2
  },
  {
    id: 6008,
    type: "mcq",
    section: "A",
    number: 8,
    questionText: "A team has 8 analysts. Each analyst can effectively process 15 cases per day. Demand is 150 cases per day. Assuming each analyst works at full capacity, what is the daily shortfall?",
    options: [
      "A. 20",
      "B. 25",
      "C. 30",
      "D. 35"
    ],
    marks: 2
  },
  {
    id: 6009,
    type: "mcq",
    section: "A",
    number: 9,
    questionText: "A process currently requires 10 employees to process 2,000 transactions per day. Automation increases productivity by 40% without increasing staff. What is the new theoretical capacity?",
    options: [
      "A. 2,400",
      "B. 2,600",
      "C. 2,800",
      "D. 3,000"
    ],
    marks: 2
  },
  {
    id: 6010,
    type: "mcq",
    section: "A",
    number: 10,
    questionText: "A company spends ₹50 lakh annually on a process. A proposed optimization reduces processing costs by 18%. Implementation costs ₹4 lakh. What is the first-year net saving?",
    options: [
      "A. ₹5 lakh",
      "B. ₹9 lakh",
      "C. ₹11 lakh",
      "D. ₹13 lakh"
    ],
    marks: 2
  },

  // ── Section B — Data Interpretation & Analytical Reasoning ───────────────
  {
    id: 6011,
    type: "mcq",
    section: "A",
    number: 11,
    questionText: "A sales funnel contains:\n• Leads: 5,000\n• Qualified: 2,000\n• Opportunities: 800\n• Customers: 160\n\nWhich stage has the lowest conversion rate?",
    options: [
      "A. Lead → Qualified",
      "B. Qualified → Opportunity",
      "C. Opportunity → Customer",
      "D. Lead → Customer"
    ],
    marks: 2
  },
  {
    id: 6012,
    type: "mcq",
    section: "A",
    number: 12,
    questionText: "Using the funnel from Q11 (5,000 Leads → 2,000 Qualified → 800 Opportunities → 160 Customers), the company can improve only one conversion stage by 10 percentage points.\n\nWhich improvement produces the greatest increase in final customers?",
    options: [
      "A. Lead → Qualified",
      "B. Qualified → Opportunity",
      "C. Opportunity → Customer",
      "D. All produce exactly the same increase"
    ],
    marks: 2
  },
  {
    id: 6013,
    type: "mcq",
    section: "A",
    number: 13,
    questionText: "Two sales channels produce:\n• Channel A: 1,000 Leads | 5% Conversion | ₹20,000 Avg Deal\n• Channel B: 400 Leads | 10% Conversion | ₹30,000 Avg Deal\n\nWhich channel generates greater expected revenue?",
    options: [
      "A. Channel A",
      "B. Channel B",
      "C. Both are equal",
      "D. Cannot be determined"
    ],
    marks: 2
  },
  {
    id: 6014,
    type: "mcq",
    section: "A",
    number: 14,
    questionText: "A company begins the year with 10,000 customers, acquires 2,000 new customers, and ends with 10,800 customers. Assuming no other changes, how many existing customers were lost?",
    options: [
      "A. 800",
      "B. 1,200",
      "C. 1,000",
      "D. 2,000"
    ],
    marks: 2
  },
  {
    id: 6015,
    type: "mcq",
    section: "A",
    number: 15,
    questionText: "A SaaS company starts a month with 5,000 customers and loses 250 customers during the month. What is the monthly customer churn rate?",
    options: [
      "A. 2%",
      "B. 4%",
      "C. 5%",
      "D. 5.26%"
    ],
    marks: 2
  },
  {
    id: 6016,
    type: "mcq",
    section: "A",
    number: 16,
    questionText: "A product's monthly active users increase by 30%, but revenue increases by only 5%. What is the most important first hypothesis?",
    options: [
      "A. The product definitely became more profitable",
      "B. Revenue per active user may have decreased",
      "C. Customer acquisition became more expensive",
      "D. Churn must have increased"
    ],
    marks: 2
  },
  {
    id: 6017,
    type: "mcq",
    section: "A",
    number: 17,
    questionText: "After launching a new training program, employee productivity increases by 15%. During the same period, the company also introduced automation.\n\nWhat is the most analytically correct conclusion?",
    options: [
      "A. Training caused the entire increase",
      "B. Automation caused the entire increase",
      "C. Training and automation may both have contributed; causality is not established",
      "D. Productivity cannot be measured"
    ],
    marks: 2
  },
  {
    id: 6018,
    type: "mcq",
    section: "A",
    number: 18,
    questionText: "Monthly sales are:\n₹10L, ₹11L, ₹10.5L, ₹12L, ₹11.2L, ₹50L\n\nWhich measure best represents the typical monthly sales?",
    options: [
      "A. Mean",
      "B. Median",
      "C. Maximum",
      "D. Range"
    ],
    marks: 2
  },
  {
    id: 6019,
    type: "mcq",
    section: "A",
    number: 19,
    questionText: "Five employees complete 10, 10, 10, 10, and 60 tasks respectively. Which statement is correct?",
    options: [
      "A. Average productivity is 10",
      "B. Median productivity is 20",
      "C. Mean productivity is 20",
      "D. Mean and median are equal"
    ],
    marks: 2
  },
  {
    id: 6020,
    type: "mcq",
    section: "A",
    number: 20,
    questionText: "A support department wants to measure whether customer issues are being resolved efficiently. Which combination is most useful?",
    options: [
      "A. Number of employees and office size",
      "B. First response time, resolution time, backlog, and customer satisfaction",
      "C. Number of meetings and emails",
      "D. Revenue and marketing impressions"
    ],
    marks: 2
  },

  // ── Section C — Logical & Critical Reasoning ──────────────────────────────
  {
    id: 6021,
    type: "mcq",
    section: "A",
    number: 21,
    questionText: "A BA receives four requests:\n• A: ₹10L potential revenue, low urgency\n• B: ₹2L potential revenue, regulatory deadline tomorrow\n• C: ₹15L potential revenue, deadline next month\n• D: ₹5L potential revenue, internal convenience\n\nWhich should generally be prioritized first?",
    options: [
      "A. A",
      "B. B",
      "C. C",
      "D. D"
    ],
    marks: 2
  },
  {
    id: 6022,
    type: "mcq",
    section: "A",
    number: 22,
    questionText: "A Sales Manager says: 'The system must allow unrestricted editing of customer data.'\nThe Compliance Manager says: 'Customer data changes must be controlled and auditable.'\n\nWhat should the BA do first?",
    options: [
      "A. Implement Sales' requirement",
      "B. Implement Compliance's requirement",
      "C. Investigate the underlying business need and constraints",
      "D. Reject both requirements"
    ],
    marks: 2
  },
  {
    id: 6023,
    type: "mcq",
    section: "A",
    number: 23,
    questionText: "A company's customer complaints increased by 40%. Management immediately proposes hiring more support staff. What should the BA do first?",
    options: [
      "A. Approve recruitment",
      "B. Determine the root cause and analyze complaint categories",
      "C. Reduce customer support hours",
      "D. Increase product prices"
    ],
    marks: 2
  },
  {
    id: 6024,
    type: "mcq",
    section: "A",
    number: 24,
    questionText: "Customers are abandoning checkout.\nWhy? Payment failures.\nWhy? Payment gateway timeouts.\nWhy? Requests exceed timeout threshold.\nWhy? API response time increased.\n\nWhat should the BA investigate next?",
    options: [
      "A. Customer demographics",
      "B. Why API response time increased",
      "C. Sales commission",
      "D. Marketing campaign design"
    ],
    marks: 2
  },
  {
    id: 6025,
    type: "mcq",
    section: "A",
    number: 25,
    questionText: "A company identifies 10 categories of customer complaints. Two categories account for 78% of all complaints. What is the most rational initial action?",
    options: [
      "A. Work equally on all 10 categories",
      "B. Focus investigation on the two dominant categories",
      "C. Ignore the two categories because they are already known",
      "D. Randomly select one category"
    ],
    marks: 2
  },
  {
    id: 6026,
    type: "mcq",
    section: "A",
    number: 26,
    questionText: "Project A provides ₹20L expected benefit with ₹10L cost.\nProject B provides ₹30L expected benefit with ₹25L cost.\n\nIgnoring other factors, which has the higher ROI?",
    options: [
      "A. Project A",
      "B. Project B",
      "C. Both are equal",
      "D. ROI cannot be calculated"
    ],
    marks: 2
  },
  {
    id: 6027,
    type: "mcq",
    section: "A",
    number: 27,
    questionText: "A project has four risks:\n• A: 10% prob | ₹10L impact (Expected: ₹1.0L)\n• B: 50% prob | ₹2L impact (Expected: ₹1.0L)\n• C: 20% prob | ₹5L impact (Expected: ₹1.0L)\n• D: 5% prob | ₹20L impact (Expected: ₹1.0L)\n\nWhich has the highest expected monetary exposure?",
    options: [
      "A. Risk A",
      "B. All risks have equal expected monetary exposure (₹1.0L)",
      "C. Risk C",
      "D. Risk D"
    ],
    marks: 2
  },
  {
    id: 6028,
    type: "mcq",
    section: "A",
    number: 28,
    questionText: "A risk has a very low probability but could cause catastrophic regulatory penalties. Another risk has a high probability but only minor inconvenience. Which statement is most appropriate?",
    options: [
      "A. Always prioritize probability",
      "B. Always prioritize impact",
      "C. Evaluate probability, impact, detectability, and business context",
      "D. Ignore low-probability risks"
    ],
    marks: 2
  },
  {
    id: 6029,
    type: "mcq",
    section: "A",
    number: 29,
    questionText: "A process has five steps:\n• Step A: 2 min\n• Step B: 3 min\n• Step C: 15 min\n• Step D: 4 min\n• Step E: 2 min\n\nWhich step is the most obvious bottleneck?",
    options: [
      "A. A",
      "B. B",
      "C. C",
      "D. E"
    ],
    marks: 2
  },
  {
    id: 6030,
    type: "mcq",
    section: "A",
    number: 30,
    questionText: "Management doubles the processing capacity of Step B, which currently takes 3 minutes, while Step C still takes 15 minutes. What is the likely overall impact?",
    options: [
      "A. Process capacity doubles",
      "B. Overall throughput may change very little",
      "C. Step C disappears",
      "D. Total processing time becomes zero"
    ],
    marks: 2
  },

  // ── Section D — Business Analysis & Requirements ──────────────────────────
  {
    id: 6031,
    type: "mcq",
    section: "A",
    number: 31,
    questionText: "Which is the best-written requirement?",
    options: [
      "A. The system should be fast.",
      "B. The system should be user-friendly.",
      "C. The system should display the dashboard within 2 seconds for 95% of requests under normal load.",
      "D. The system should have a modern interface."
    ],
    marks: 2
  },
  {
    id: 6032,
    type: "mcq",
    section: "A",
    number: 32,
    questionText: "A stakeholder says: 'The application should allow users to easily upload large files.' What is the biggest BA concern?",
    options: [
      "A. The requirement is too technical",
      "B. 'Easily' and 'large' are not measurable",
      "C. File upload is unnecessary",
      "D. The stakeholder should not provide requirements"
    ],
    marks: 2
  },
  {
    id: 6033,
    type: "mcq",
    section: "A",
    number: 33,
    questionText: "Which is the strongest acceptance criterion?",
    options: [
      "A. User should like the dashboard",
      "B. Dashboard should be attractive",
      "C. Dashboard must display revenue by region and update within 5 seconds after applying filters",
      "D. Dashboard should use modern technology"
    ],
    marks: 2
  },
  {
    id: 6034,
    type: "mcq",
    section: "A",
    number: 34,
    questionText: "Two stakeholders request mutually exclusive behavior. What should the BA do first?",
    options: [
      "A. Choose whichever stakeholder has the higher job title",
      "B. Implement both simultaneously",
      "C. Understand the business objectives, constraints, and decision authority",
      "D. Ignore the conflict"
    ],
    marks: 2
  },
  {
    id: 6035,
    type: "mcq",
    section: "A",
    number: 35,
    questionText: "During development, a stakeholder requests a feature that was not included in the approved scope. What should the BA do?",
    options: [
      "A. Add it immediately",
      "B. Reject it automatically",
      "C. Assess impact, priority, dependencies, and follow the change-control process",
      "D. Ask developers to implement it secretly"
    ],
    marks: 2
  },
  {
    id: 6036,
    type: "mcq",
    section: "A",
    number: 36,
    questionText: "Which is primarily a functional requirement?",
    options: [
      "A. The system must respond within 2 seconds",
      "B. The system must encrypt stored customer information",
      "C. The user must be able to export the monthly sales report as CSV",
      "D. The application must have 99.9% availability"
    ],
    marks: 2
  },
  {
    id: 6037,
    type: "mcq",
    section: "A",
    number: 37,
    questionText: "Which is primarily a non-functional requirement?",
    options: [
      "A. User can create an account",
      "B. User can reset a password",
      "C. System supports 10,000 concurrent users",
      "D. Manager can approve a request"
    ],
    marks: 2
  },
  {
    id: 6038,
    type: "mcq",
    section: "A",
    number: 38,
    questionText: "A stakeholder has high influence but low day-to-day involvement. What is generally the best approach?",
    options: [
      "A. Ignore them",
      "B. Keep them appropriately informed and satisfied",
      "C. Give them complete control of every decision",
      "D. Exclude them from project communication"
    ],
    marks: 2
  },
  {
    id: 6039,
    type: "mcq",
    section: "A",
    number: 39,
    questionText: "Why is a Requirements Traceability Matrix useful?",
    options: [
      "A. It replaces project management",
      "B. It connects requirements to design, development, and testing",
      "C. It automatically generates revenue",
      "D. It eliminates stakeholder meetings"
    ],
    marks: 2
  },
  {
    id: 6040,
    type: "mcq",
    section: "A",
    number: 40,
    questionText: "A stakeholder requests: 'Add an export-to-Excel button.' What is the most valuable BA question?",
    options: [
      "A. 'Which Excel version do you use?' immediately",
      "B. 'Why do users need to export this data?'",
      "C. 'Who designed the current screen?'",
      "D. 'Can we change the button color?'"
    ],
    marks: 2
  },

  // ── Section E — Advanced Business Scenarios ───────────────────────────────
  {
    id: 6041,
    type: "mcq",
    section: "A",
    number: 41,
    questionText: "A dashboard shows:\n• Revenue ↑ 20%\n• Customers ↑ 25%\n• Profit ↓ 10%\n\nWhich question should a BA investigate first?",
    options: [
      "A. Why customer count increased",
      "B. Whether cost per customer, pricing, or margins changed",
      "C. Whether revenue is actually increasing",
      "D. Whether the dashboard needs more colors"
    ],
    marks: 2
  },
  {
    id: 6042,
    type: "mcq",
    section: "A",
    number: 42,
    questionText: "A company introduces a new sales process. Sales conversion rises from 10% to 15%, but average deal size falls from ₹10L to ₹5L. What should the BA conclude?",
    options: [
      "A. The new process is definitely successful",
      "B. The new process definitely failed",
      "C. Conversion improved, but overall revenue impact must be evaluated",
      "D. Average deal size is irrelevant"
    ],
    marks: 2
  },
  {
    id: 6043,
    type: "mcq",
    section: "A",
    number: 43,
    questionText: "A company has customers with very different purchasing behavior. Which segmentation approach is most useful for targeted business decisions?",
    options: [
      "A. Segment only by customer name",
      "B. Segment using meaningful variables such as industry, revenue, behavior, needs, and profitability",
      "C. Segment randomly",
      "D. Use geographic location only"
    ],
    marks: 2
  },
  {
    id: 6044,
    type: "mcq",
    section: "A",
    number: 44,
    questionText: "A mobile application's rating falls from 4.5 to 3.2. Analysis shows that 70% of negative reviews mention login problems. What should be investigated first?",
    options: [
      "A. Marketing budget",
      "B. Login process and authentication failures",
      "C. Employee salaries",
      "D. Competitor pricing"
    ],
    marks: 2
  },
  {
    id: 6045,
    type: "mcq",
    section: "A",
    number: 45,
    questionText: "Version A has a conversion rate of 5% from 10,000 users.\nVersion B has a conversion rate of 5.5% from 100 users.\n\nWhich statement is most appropriate?",
    options: [
      "A. B is definitely superior",
      "B. A is definitely superior",
      "C. B has a higher observed conversion rate, but the sample size and statistical significance must be considered",
      "D. Both must have exactly the same conversion rate"
    ],
    marks: 2
  },
  {
    id: 6046,
    type: "mcq",
    section: "A",
    number: 46,
    questionText: "A report shows a sudden 300% increase in sales immediately after a CRM migration. What should the BA investigate before presenting this as business growth?",
    options: [
      "A. Whether the sales team worked harder",
      "B. Data duplication, migration mapping, definitions, and reporting logic",
      "C. Whether competitors reduced prices",
      "D. Whether employees received bonuses"
    ],
    marks: 2
  },
  {
    id: 6047,
    type: "mcq",
    section: "A",
    number: 47,
    questionText: "Sales is measured on revenue generated, while Customer Success is measured on customer retention. Sales begins offering heavily discounted contracts that increase new sales but lead to poor-quality customers and high churn.\n\nWhat does this most clearly demonstrate?",
    options: [
      "A. Strong organizational alignment",
      "B. A KPI incentive misalignment",
      "C. Excellent customer segmentation",
      "D. A database problem"
    ],
    marks: 2
  },
  {
    id: 6048,
    type: "mcq",
    section: "A",
    number: 48,
    questionText: "A company automates a process that takes 10 minutes manually. After automation, it takes 2 minutes but requires frequent human intervention for exceptions. Which metric should be evaluated before declaring success?",
    options: [
      "A. Time saved only",
      "B. Total process efficiency, including exception rate, error rate, cost, and human intervention",
      "C. Number of software developers",
      "D. Number of meetings"
    ],
    marks: 2
  },
  {
    id: 6049,
    type: "mcq",
    section: "A",
    number: 49,
    questionText: "Three potential projects have the following characteristics:\n• Project A: ₹50L benefit | ₹20L cost | High risk\n• Project B: ₹35L benefit | ₹10L cost | Low risk\n• Project C: ₹70L benefit | ₹50L cost | Medium risk\n\nThe CEO asks: 'Which project should we choose?' What is the best BA response?",
    options: [
      "A. Always choose C because it has the highest benefit",
      "B. Always choose B because it has the lowest risk",
      "C. Recommend B automatically because ROI is highest",
      "D. Compare ROI, absolute benefit, risk, strategic alignment, constraints, and expected value before recommending"
    ],
    marks: 2
  },
  {
    id: 6050,
    type: "mcq",
    section: "A",
    number: 50,
    questionText: "A company reports: 'Our new CRM increased sales by 25%.'\nA BA investigates and discovers:\n• Sales increased 25%\n• Marketing spend increased 60%\n• Sales team increased by 30%\n• Average deal size decreased by 10%\n• Customer acquisition cost increased by 40%\n• Customer retention decreased by 5%\n\nWhat is the most analytically defensible conclusion?",
    options: [
      "A. The CRM was highly successful because sales increased by 25%",
      "B. The CRM failed because retention decreased",
      "C. Sales increased, but the available evidence is insufficient to attribute the increase solely to the CRM or conclude that overall business performance improved",
      "D. Marketing caused the entire increase"
    ],
    marks: 2
  }
];
