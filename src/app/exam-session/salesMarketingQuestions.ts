import { Question } from "./questions";

export const SALES_MARKETING_QUESTIONS: Question[] = [
  // ── Section A — CRM & Lead Management ─────────────────────────────────────
  {
    id: 7001,
    type: "mcq",
    section: "A",
    number: 1,
    questionText: "A marketing campaign generates 1,000 leads. 600 are contacted, 300 are qualified, and 90 become opportunities. Which metric best measures the effectiveness of the qualification process?",
    options: [
      "A. Lead-to-contact rate",
      "B. Contact-to-qualified-lead rate",
      "C. Qualified-lead-to-opportunity rate",
      "D. Campaign response rate"
    ],
    marks: 2
  },
  {
    id: 7002,
    type: "mcq",
    section: "A",
    number: 2,
    questionText: "A lead has downloaded three whitepapers, attended a webinar, and opened five marketing emails but has never spoken to sales. What is the most appropriate conclusion?",
    options: [
      "A. The lead should automatically become a Closed Won opportunity",
      "B. The lead is necessarily sales-qualified",
      "C. The lead demonstrates engagement but still requires qualification",
      "D. The lead should immediately be converted into an Account"
    ],
    marks: 2
  },
  {
    id: 7003,
    type: "mcq",
    section: "A",
    number: 3,
    questionText: "A company defines an MQL as a lead with a score above 70 and an SQL as a lead that has been explicitly accepted by Sales. A lead has a score of 85 but Sales has not reviewed it. What is the lead's status?",
    options: [
      "A. SQL",
      "B. MQL",
      "C. Opportunity",
      "D. Converted Customer"
    ],
    marks: 2
  },
  {
    id: 7004,
    type: "mcq",
    section: "A",
    number: 4,
    questionText: "A salesperson receives the same company as two separate leads from different campaigns. What is the best CRM practice?",
    options: [
      "A. Delete both leads",
      "B. Convert both leads into separate accounts",
      "C. Deduplicate the records while preserving relevant source information",
      "D. Assign both leads to different sales representatives"
    ],
    marks: 2
  },
  {
    id: 7005,
    type: "mcq",
    section: "A",
    number: 5,
    questionText: "A lead has a very high engagement score but belongs to a company that does not fit the organization's target market. Which approach is most appropriate?",
    options: [
      "A. Qualify it because engagement is high",
      "B. Ignore company information because behavior is more important",
      "C. Apply both fit and engagement criteria before qualification",
      "D. Convert it automatically because the score exceeds the threshold"
    ],
    marks: 2
  },
  {
    id: 7006,
    type: "mcq",
    section: "A",
    number: 6,
    questionText: "Which situation creates the highest risk of misleading sales analytics?",
    options: [
      "A. Having multiple campaign records",
      "B. Recording lead source consistently",
      "C. Allowing salespeople to manually overwrite standardized lead stages",
      "D. Tracking lead creation dates"
    ],
    marks: 2
  },
  {
    id: 7007,
    type: "mcq",
    section: "A",
    number: 7,
    questionText: "A lead repeatedly opens emails but never responds to calls or requests a meeting. What should the CRM ideally trigger?",
    options: [
      "A. Automatically mark the lead Closed Won",
      "B. Increase engagement score and potentially initiate a nurturing sequence",
      "C. Delete the lead",
      "D. Convert the lead into an opportunity"
    ],
    marks: 2
  },
  {
    id: 7008,
    type: "mcq",
    section: "A",
    number: 8,
    questionText: "A company wants to determine whether LinkedIn advertising or webinars generate higher-quality customers, not merely more leads. Which metric is most useful?",
    options: [
      "A. Number of impressions",
      "B. Number of leads",
      "C. Customer conversion and revenue by source",
      "D. Email open rate"
    ],
    marks: 2
  },
  {
    id: 7009,
    type: "mcq",
    section: "A",
    number: 9,
    questionText: "A lead has the following attributes:\n• Company size: Ideal\n• Industry: Ideal\n• Job title: Ideal\n• Website engagement: Low\n• Budget: Unknown\n\nWhat is the safest next step?",
    options: [
      "A. Reject the lead",
      "B. Convert immediately",
      "C. Qualify further to determine intent and purchasing capability",
      "D. Mark it as Closed Won"
    ],
    marks: 2
  },
  {
    id: 7010,
    type: "mcq",
    section: "A",
    number: 10,
    questionText: "Why is separating Lead Source from Campaign Source useful?",
    options: [
      "A. They are always identical",
      "B. Lead Source identifies the broader origin, while campaigns can track specific marketing initiatives",
      "C. Campaign Source is only useful after a deal closes",
      "D. Lead Source should only be used by Finance"
    ],
    marks: 2
  },

  // ── Section B — Sales Pipeline & Opportunity Management ───────────────────
  {
    id: 7011,
    type: "mcq",
    section: "A",
    number: 11,
    questionText: "A sales pipeline contains:\n• ₹10L in Discovery (20% probability)\n• ₹20L in Proposal (50% probability)\n• ₹30L in Negotiation (80% probability)\n\nWhat is the weighted pipeline value?",
    options: [
      "A. ₹60L",
      "B. ₹38L",
      "C. ₹34L",
      "D. ₹48L"
    ],
    marks: 2
  },
  {
    id: 7012,
    type: "mcq",
    section: "A",
    number: 12,
    questionText: "Two opportunities are worth ₹10L each. Opportunity A is at Proposal with 70% probability. Opportunity B is at Discovery with 30% probability. Which statement is most accurate?",
    options: [
      "A. Both contribute equally to weighted forecast",
      "B. Opportunity A contributes more to weighted forecast",
      "C. Opportunity B contributes more because it is newer",
      "D. Neither should appear in the forecast"
    ],
    marks: 2
  },
  {
    id: 7013,
    type: "mcq",
    section: "A",
    number: 13,
    questionText: "A salesperson has ₹1 crore in pipeline, but 40% of opportunities have not had any activity for more than 90 days. What does this most likely indicate?",
    options: [
      "A. Extremely strong pipeline",
      "B. Pipeline inflation",
      "C. High sales velocity",
      "D. Excellent forecasting accuracy"
    ],
    marks: 2
  },
  {
    id: 7014,
    type: "mcq",
    section: "A",
    number: 14,
    questionText: "An opportunity has been in the 'Negotiation' stage for 75 days, while the company's average negotiation duration is 20 days. What should management investigate first?",
    options: [
      "A. Whether the opportunity value should be increased",
      "B. Whether the opportunity is stalled or incorrectly staged",
      "C. Whether marketing generated the lead",
      "D. Whether the salesperson should create another opportunity"
    ],
    marks: 2
  },
  {
    id: 7015,
    type: "mcq",
    section: "A",
    number: 15,
    questionText: "A salesperson says, 'The customer verbally agreed, so I marked the opportunity as Closed Won.' What is the biggest CRM concern?",
    options: [
      "A. The opportunity value may be too low",
      "B. Closed Won should normally be supported by defined commercial/contractual confirmation",
      "C. Verbal agreement always means Closed Won",
      "D. The lead source must be changed"
    ],
    marks: 2
  },
  {
    id: 7016,
    type: "mcq",
    section: "A",
    number: 16,
    questionText: "Which opportunity represents the highest immediate risk?",
    options: [
      "A. ₹5L opportunity, Discovery, activity yesterday",
      "B. ₹20L opportunity, Proposal, activity 3 days ago",
      "C. ₹50L opportunity, Negotiation, no activity for 45 days",
      "D. ₹2L opportunity, Qualification, activity today"
    ],
    marks: 2
  },
  {
    id: 7017,
    type: "mcq",
    section: "A",
    number: 17,
    questionText: "A company notices that salespeople frequently move opportunities from 40% probability directly to 90%. What is the likely problem?",
    options: [
      "A. Too many marketing campaigns",
      "B. Poor opportunity-stage governance",
      "C. Excessive customer retention",
      "D. Incorrect account hierarchy"
    ],
    marks: 2
  },
  {
    id: 7018,
    type: "mcq",
    section: "A",
    number: 18,
    questionText: "Which field is most valuable for preventing an opportunity from becoming a 'floating deal' with no clear path forward?",
    options: [
      "A. Customer logo",
      "B. Next Step",
      "C. Lead Source",
      "D. Industry"
    ],
    marks: 2
  },
  {
    id: 7019,
    type: "mcq",
    section: "A",
    number: 19,
    questionText: "An opportunity is worth ₹25L. The salesperson expects the customer to make a decision in 90 days, but the CRM Close Date is tomorrow. What is the most appropriate action?",
    options: [
      "A. Leave it unchanged to maintain a strong forecast",
      "B. Update the Close Date to reflect the realistic expected decision timeline",
      "C. Mark it Closed Lost",
      "D. Increase the probability to compensate"
    ],
    marks: 2
  },
  {
    id: 7020,
    type: "mcq",
    section: "A",
    number: 20,
    questionText: "Why should an organization avoid creating separate opportunities for every sales conversation with the same customer?",
    options: [
      "A. It increases website traffic",
      "B. It can artificially inflate pipeline and distort forecasting",
      "C. It prevents marketing attribution",
      "D. It improves data quality"
    ],
    marks: 2
  },

  // ── Section C — Sales Forecasting ─────────────────────────────────────────
  {
    id: 7021,
    type: "mcq",
    section: "A",
    number: 21,
    questionText: "A sales manager has ₹80L of open pipeline but only ₹20L is considered highly likely to close. Which number should NOT automatically be presented as expected revenue?",
    options: [
      "A. ₹20L",
      "B. ₹80L",
      "C. Weighted forecast",
      "D. Commit forecast"
    ],
    marks: 2
  },
  {
    id: 7022,
    type: "mcq",
    section: "A",
    number: 22,
    questionText: "A forecast shows ₹40L expected revenue, but the underlying opportunities have outdated close dates and missing next steps. What is the biggest concern?",
    options: [
      "A. The forecast may have high numerical value but low reliability",
      "B. Forecasts never depend on CRM data",
      "C. Missing next steps increase forecast accuracy",
      "D. Close dates have no relationship with forecasting"
    ],
    marks: 2
  },
  {
    id: 7023,
    type: "mcq",
    section: "A",
    number: 23,
    questionText: "A salesperson consistently closes ₹10L per month but currently has ₹1 crore in pipeline. Why might management still avoid forecasting ₹1 crore?",
    options: [
      "A. Pipeline value and realized revenue are fundamentally different",
      "B. All pipeline automatically becomes revenue",
      "C. Revenue is based only on lead count",
      "D. Pipeline is irrelevant to sales"
    ],
    marks: 2
  },
  {
    id: 7024,
    type: "mcq",
    section: "A",
    number: 24,
    questionText: "Which situation is most likely to cause forecast optimism bias?",
    options: [
      "A. Automatically closing stale opportunities",
      "B. Sales representatives overestimating opportunity probabilities",
      "C. Tracking historical conversion rates",
      "D. Reviewing pipeline aging"
    ],
    marks: 2
  },
  {
    id: 7025,
    type: "mcq",
    section: "A",
    number: 25,
    questionText: "A company has historically converted 10% of Discovery opportunities, 40% of Proposal opportunities, and 70% of Negotiation opportunities. A new salesperson assigns 90% probability to every Negotiation opportunity. What should management do?",
    options: [
      "A. Accept all 90% probabilities without review",
      "B. Compare individual probabilities with historical conversion performance",
      "C. Delete the Negotiation opportunities",
      "D. Increase all Discovery opportunities to 90%"
    ],
    marks: 2
  },
  {
    id: 7026,
    type: "mcq",
    section: "A",
    number: 26,
    questionText: "Which metric best helps identify whether sales representatives are creating enough new pipeline to replace deals that are closing?",
    options: [
      "A. Pipeline coverage",
      "B. Email open rate",
      "C. Number of customer complaints",
      "D. Average response time"
    ],
    marks: 2
  },
  {
    id: 7027,
    type: "mcq",
    section: "A",
    number: 27,
    questionText: "A company requires 4× pipeline coverage to achieve its revenue target. If the monthly target is ₹25L, approximately how much qualified pipeline should ideally be available?",
    options: [
      "A. ₹50L",
      "B. ₹75L",
      "C. ₹100L",
      "D. ₹125L"
    ],
    marks: 2
  },
  {
    id: 7028,
    type: "mcq",
    section: "A",
    number: 28,
    questionText: "A salesperson has a high win rate but a very long sales cycle. Which conclusion is most reasonable?",
    options: [
      "A. The sales process is automatically optimal",
      "B. The salesperson converts effectively but may have process/velocity issues",
      "C. Win rate is irrelevant",
      "D. Long sales cycles always mean poor lead quality"
    ],
    marks: 2
  },
  {
    id: 7029,
    type: "mcq",
    section: "A",
    number: 29,
    questionText: "A team closes ₹60L from 12 deals during a quarter. What is the average deal size?",
    options: [
      "A. ₹2L",
      "B. ₹4L",
      "C. ₹5L",
      "D. ₹6L"
    ],
    marks: 2
  },
  {
    id: 7030,
    type: "mcq",
    section: "A",
    number: 30,
    questionText: "A company has 100 opportunities and closes 25. What is the opportunity-to-win conversion rate?",
    options: [
      "A. 15%",
      "B. 20%",
      "C. 25%",
      "D. 40%"
    ],
    marks: 2
  },

  // ── Section D — Marketing & Campaign Management ───────────────────────────
  {
    id: 7031,
    type: "mcq",
    section: "A",
    number: 31,
    questionText: "A marketing campaign generates 500 leads, but only 10 eventually become customers. Another campaign generates 100 leads and produces 15 customers. Which campaign is more effective at converting leads?",
    options: [
      "A. Campaign 1",
      "B. Campaign 2",
      "C. Both are equally effective",
      "D. Cannot be determined because lead volume is different"
    ],
    marks: 2
  },
  {
    id: 7032,
    type: "mcq",
    section: "A",
    number: 32,
    questionText: "Why is campaign ROI more meaningful than campaign lead volume when evaluating revenue impact?",
    options: [
      "A. ROI connects campaign investment with financial return",
      "B. Lead volume always equals revenue",
      "C. ROI ignores campaign cost",
      "D. Lead volume cannot be measured"
    ],
    marks: 2
  },
  {
    id: 7033,
    type: "mcq",
    section: "A",
    number: 33,
    questionText: "A campaign costs ₹2L and directly generates ₹8L in attributable revenue. What is the basic revenue-to-cost ratio?",
    options: [
      "A. 2:1",
      "B. 3:1",
      "C. 4:1",
      "D. 6:1"
    ],
    marks: 2
  },
  {
    id: 7034,
    type: "mcq",
    section: "A",
    number: 34,
    questionText: "A company discovers that most leads from a campaign are students, while its target customers are enterprises. The campaign generated many leads. What is the correct interpretation?",
    options: [
      "A. The campaign is automatically successful",
      "B. Lead quantity is high, but lead quality and targeting are poor",
      "C. Sales should accept all leads",
      "D. The CRM data must be deleted"
    ],
    marks: 2
  },
  {
    id: 7035,
    type: "mcq",
    section: "A",
    number: 35,
    questionText: "What is the primary purpose of associating Campaign Members with a campaign?",
    options: [
      "A. To identify and track people/accounts who participated or were targeted",
      "B. To replace opportunity records",
      "C. To calculate employee salaries",
      "D. To eliminate lead scoring"
    ],
    marks: 2
  },
  {
    id: 7036,
    type: "mcq",
    section: "A",
    number: 36,
    questionText: "A customer interacts with five marketing campaigns before purchasing. Why is multi-touch attribution potentially more informative than single-touch attribution?",
    options: [
      "A. It can recognize multiple interactions contributing to the buying journey",
      "B. It always assigns 100% credit to the first campaign",
      "C. It ignores customer behavior",
      "D. It removes the need for CRM data"
    ],
    marks: 2
  },
  {
    id: 7037,
    type: "mcq",
    section: "A",
    number: 37,
    questionText: "A campaign has an excellent email open rate but very low opportunity creation. Which conclusion is most appropriate?",
    options: [
      "A. The campaign is definitely generating revenue",
      "B. Engagement is high, but conversion to meaningful sales outcomes may be weak",
      "C. Open rate proves sales success",
      "D. The CRM should automatically mark all leads as qualified"
    ],
    marks: 2
  },
  {
    id: 7038,
    type: "mcq",
    section: "A",
    number: 38,
    questionText: "A marketing team sends the same promotional email to every CRM contact regardless of industry, role, or buying stage. What is the biggest strategic weakness?",
    options: [
      "A. Too much CRM storage",
      "B. Lack of segmentation and personalization",
      "C. Excessive pipeline velocity",
      "D. Too many opportunities"
    ],
    marks: 2
  },
  {
    id: 7039,
    type: "mcq",
    section: "A",
    number: 39,
    questionText: "Which sequence is generally the most logical in a CRM and sales workflow?",
    options: [
      "A. Opportunity → Lead → Campaign → Account",
      "B. Campaign → Lead → Qualification → Opportunity → Customer",
      "C. Customer → Lead → Campaign → Opportunity",
      "D. Campaign → Closed Won → Lead → Account"
    ],
    marks: 2
  },
  {
    id: 7040,
    type: "mcq",
    section: "A",
    number: 40,
    questionText: "A campaign generates many MQLs, but Sales rejects most of them because they lack budget and decision-making authority. What should Marketing and Sales improve?",
    options: [
      "A. MQL qualification criteria and alignment between teams",
      "B. CRM color scheme",
      "C. Opportunity naming convention only",
      "D. Customer invoice format"
    ],
    marks: 2
  },

  // ── Section E — CRM Analytics, Automation & Data Quality ──────────────────
  {
    id: 7041,
    type: "mcq",
    section: "A",
    number: 41,
    questionText: "A CRM contains 10,000 contacts, but 1,500 are duplicates. What is the most direct impact?",
    options: [
      "A. Better forecasting",
      "B. Distorted reporting and potentially duplicated customer communication",
      "C. Higher customer retention",
      "D. Improved campaign attribution"
    ],
    marks: 2
  },
  {
    id: 7042,
    type: "mcq",
    section: "A",
    number: 42,
    questionText: "A salesperson changes an opportunity's probability from 50% to 95% without changing its stage or providing supporting information. What control would best reduce this issue?",
    options: [
      "A. Allow unlimited manual editing",
      "B. Establish validation rules, governance, or stage-based probability controls",
      "C. Delete the opportunity",
      "D. Remove probability from the CRM"
    ],
    marks: 2
  },
  {
    id: 7043,
    type: "mcq",
    section: "A",
    number: 43,
    questionText: "Which automation is most appropriate when a newly created high-value lead belongs to an enterprise account?",
    options: [
      "A. Automatically delete the lead",
      "B. Route the lead to the appropriate enterprise sales team and create a follow-up task",
      "C. Mark it Closed Lost",
      "D. Change its source to 'Other'"
    ],
    marks: 2
  },
  {
    id: 7044,
    type: "mcq",
    section: "A",
    number: 44,
    questionText: "A CRM dashboard reports ₹2 crore pipeline. After removing opportunities with close dates older than six months and no recent activity, only ₹80L remains. What does this demonstrate?",
    options: [
      "A. Dashboards are useless",
      "B. Pipeline hygiene significantly affects management reporting",
      "C. Marketing generated too many emails",
      "D. Sales forecasting is unrelated to CRM data"
    ],
    marks: 2
  },
  {
    id: 7045,
    type: "mcq",
    section: "A",
    number: 45,
    questionText: "A manager wants to know where prospects are dropping out of the sales funnel. Which report is most appropriate?",
    options: [
      "A. Employee attendance report",
      "B. Funnel conversion report by stage",
      "C. Customer birthday report",
      "D. Server utilization report"
    ],
    marks: 2
  },
  {
    id: 7046,
    type: "mcq",
    section: "A",
    number: 46,
    questionText: "A funnel contains:\n• 1,000 Leads\n• 400 Qualified Leads\n• 100 Opportunities\n• 20 Customers\n\nAt which transition is the largest percentage drop occurring?",
    options: [
      "A. Leads → Qualified Leads",
      "B. Qualified Leads → Opportunities",
      "C. Opportunities → Customers",
      "D. All are equal"
    ],
    marks: 2
  },
  {
    id: 7047,
    type: "mcq",
    section: "A",
    number: 47,
    questionText: "A CRM automation automatically sends a 'Welcome' email every time a contact record is updated. A salesperson edits the contact 10 times, causing 10 emails. What type of design problem is this?",
    options: [
      "A. Poor trigger and execution criteria",
      "B. Excellent automation",
      "C. Pipeline forecasting issue",
      "D. Campaign attribution success"
    ],
    marks: 2
  },
  {
    id: 7048,
    type: "mcq",
    section: "A",
    number: 48,
    questionText: "Which approach is safest for automating opportunity closure?",
    options: [
      "A. Close every opportunity after 30 days",
      "B. Close opportunities based solely on probability",
      "C. Use defined business rules involving inactivity, close date, stage, and user confirmation where appropriate",
      "D. Close every opportunity with no email activity"
    ],
    marks: 2
  },
  {
    id: 7049,
    type: "mcq",
    section: "A",
    number: 49,
    questionText: "A company wants to identify its best-performing acquisition channel. Which combination provides the strongest analysis?",
    options: [
      "A. Lead count only",
      "B. Website visits only",
      "C. Leads + conversion rates + customer revenue + acquisition cost",
      "D. Email opens only"
    ],
    marks: 2
  },
  {
    id: 7050,
    type: "mcq",
    section: "A",
    number: 50,
    questionText: "A company has the following pipeline:\n• Opp A: ₹10L | Discovery | 20% prob | 2 days ago\n• Opp B: ₹20L | Proposal | 50% prob | 5 days ago\n• Opp C: ₹50L | Negotiation | 80% prob | 60 days ago\n• Opp D: ₹15L | Proposal | 50% prob | 3 days ago\n\nThe Sales Head says: 'Our forecast is ₹59.5L because the weighted pipeline is ₹59.5L.' What is the best response?",
    options: [
      "A. The forecast is definitely correct because weighted pipeline is always forecast revenue",
      "B. The forecast should include Opportunity C at 80% without further investigation",
      "C. The mathematical weighted pipeline may be ₹59.5L, but Opportunity C requires investigation because its 60-day inactivity makes the forecast potentially unreliable",
      "D. Opportunity A should automatically be marked Closed Won"
    ],
    marks: 2
  }
];
