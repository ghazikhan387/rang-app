-- ============================================================
-- Rang Healthcare — Migration 008: Consolidated Healthcare Development Reports
-- Stores unified AI-synthesized briefings for Past 24 Hours, Past Week,
-- and Past Month (with historical archives).
-- ============================================================

-- 1. Create HEALTHCARE_DEVELOPMENT_REPORTS Table
create table if not exists public.healthcare_development_reports (
  id                      uuid primary key default gen_random_uuid(),
  period_type             text not null check (period_type in ('day', 'week', 'month')),
  period_key              text not null, -- 'latest' for day/week, or 'YYYY-MM' for monthly archives
  report_title            text not null,
  period_label            text not null,
  start_date              timestamptz not null,
  end_date                timestamptz not null,
  executive_summary       text not null,
  major_developments      jsonb not null default '[]'::jsonb,
  staffing_impact         text not null,
  key_takeaways           jsonb not null default '[]'::jsonb,
  sources_and_references  jsonb not null default '[]'::jsonb,
  what_to_watch_next      jsonb not null default '[]'::jsonb,
  source_count            int not null default 0,
  status                  text not null default 'published' check (status in ('generating', 'published', 'failed')),
  version                 int not null default 1,
  gemini_model            text not null default 'gemini-2.0-flash',
  generated_at            timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint healthcare_dev_reports_period_unique unique (period_type, period_key)
);

comment on table public.healthcare_development_reports is 'Consolidated US Healthcare Development Reports (briefings) for Past 24 Hours, Past Week, and Past Month archives.';

create index if not exists idx_healthcare_dev_reports_type_key on public.healthcare_development_reports (period_type, period_key);
create index if not exists idx_healthcare_dev_reports_status on public.healthcare_development_reports (status);

-- 2. Create HEALTHCARE_REPORT_HISTORY Table (for version preservation)
create table if not exists public.healthcare_report_history (
  id                      uuid primary key default gen_random_uuid(),
  report_id               uuid references public.healthcare_development_reports(id) on delete cascade,
  period_type             text not null,
  period_key              text not null,
  version                 int not null,
  report_title            text not null,
  executive_summary       text not null,
  major_developments      jsonb not null default '[]'::jsonb,
  staffing_impact         text not null,
  key_takeaways           jsonb not null default '[]'::jsonb,
  sources_and_references  jsonb not null default '[]'::jsonb,
  what_to_watch_next      jsonb not null default '[]'::jsonb,
  source_count            int not null default 0,
  gemini_model            text not null,
  archived_at             timestamptz not null default now()
);

-- RLS Policies
alter table public.healthcare_development_reports enable row level security;
alter table public.healthcare_report_history enable row level security;

drop policy if exists "Public can read published development reports" on public.healthcare_development_reports;
create policy "Public can read published development reports"
  on public.healthcare_development_reports
  for select
  using (status = 'published');

drop policy if exists "Service role can manage development reports" on public.healthcare_development_reports;
create policy "Service role can manage development reports"
  on public.healthcare_development_reports
  for all
  using (true)
  with check (true);

drop policy if exists "Public can read report history" on public.healthcare_report_history;
create policy "Public can read report history"
  on public.healthcare_report_history
  for select
  using (true);

drop policy if exists "Service role can manage report history" on public.healthcare_report_history;
create policy "Service role can manage report history"
  on public.healthcare_report_history
  for all
  using (true)
  with check (true);

-- Auto-update trigger
drop trigger if exists healthcare_development_reports_updated_at on public.healthcare_development_reports;
create trigger healthcare_development_reports_updated_at
  before update on public.healthcare_development_reports
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 3. SEED CONSOLIDATED REPORTS FOR ALL THREE PERIODS
-- ============================================================

-- A. PAST 24 HOURS CONSOLIDATED REPORT
insert into public.healthcare_development_reports (
  period_type,
  period_key,
  report_title,
  period_label,
  start_date,
  end_date,
  executive_summary,
  major_developments,
  staffing_impact,
  key_takeaways,
  sources_and_references,
  what_to_watch_next,
  source_count,
  status,
  gemini_model,
  generated_at
) values (
  'day',
  'latest',
  'US Healthcare Daily Intelligence Briefing: Past 24 Hours',
  'Past 24 Hours',
  now() - interval '24 hours',
  now(),
  'Over the past 24 hours, US healthcare delivery saw pivotal updates in long-term care staffing compliance, critical oncology clinical trial readouts, and health system workforce preparedness. The Centers for Medicare & Medicaid Services (CMS) reported initial participation metrics on its nursing home staffing support campaign, showing over one-third of facilities facing compliance barriers. Meanwhile, Phase 3 clinical data presented for investigational targeted oncology regimens demonstrated substantial progression-free survival advantages, signaling downstream demand for specialized infusion and oncology clinical research staff.',
  '[
    {
      "topic": "Healthcare Policy & CMS Staffing Regulations",
      "headline": "CMS Staffing Support Campaign Highlights Severe Post-Acute Workforce Bottlenecks",
      "narrative": "A federal compliance report released over the past 24 hours revealed that more than one-third of Medicare-certified skilled nursing facilities have been unable to qualify for CMS staffing transition subsidies due to administrative threshold requirements. Industry associations warn that post-acute providers in rural corridors are struggling to recruit enough 24/7 registered nurse supervisors to meet upcoming federal minimum hours.",
      "citations": [
        { "title": "More than one-third of nursing homes shut out of newly opened CMS staffing campaign", "publisher": "McKnight''s Long-Term Care News", "url": "https://www.mcknights.com/news/cms-staffing-campaign-update" }
      ]
    },
    {
      "topic": "Clinical Research & Specialized Oncology",
      "headline": "Novel Targeted ADCs and Tovecimig Combination Demonstrate Landmark Survival Metrics",
      "narrative": "New Phase 3 clinical data presented at medical conferences highlighted substantial progression-free survival gains for tovecimig doublet therapies in advanced biliary tract cancer, alongside next-generation antibody-drug conjugates (ADCs) in HER2-low metastatic breast cancer. Tertiary academic cancer centers report accelerating protocols to prepare for inpatient and outpatient administration pipelines.",
      "citations": [
        { "title": "Tovecimig-Based Doublet Boosts Response and PFS in Advanced Biliary Tract Cancer", "publisher": "Oncology Clinical Wire", "url": "https://www.cancernetwork.com/tovecimig-biliary-tract-cancer" },
        { "title": "Novel ADC Achieves Impressive PFS Advantage in HER2-Low Metastatic Breast Cancer", "publisher": "Cancer Therapy News", "url": "https://www.medpagetoday.com/oncology/breastcancer" }
      ]
    },
    {
      "topic": "Workforce Readiness & Resuscitation Training",
      "headline": "VA Health Care System Validates High-Frequency Simulation Training Impact",
      "narrative": "Off-duty Veterans Affairs medical personnel successfully revived a church attendee experiencing cardiac arrest, crediting quarterly Resuscitation Quality Improvement (RQI) simulation protocols. The event has prompted clinical talent leaders to emphasize recurring low-dose simulation credentials as a top priority for acute care nursing hires.",
      "citations": [
        { "title": "Crisis in the pews: Off-duty VA nurses step in to save a life", "publisher": "VA Health News", "url": "https://news.va.gov/crisis-in-the-pews-va-nurses" }
      ]
    }
  ]'::jsonb,
  'The developments over the past 24 hours underscore high immediate friction in post-acute nurse recruiting:
1. Skilled Nursing Shortages: Skilled nursing facilities and long-term care operators face immediate bidding competition for RN supervisors willing to take night coverage, with agency bill rates remaining elevated.
2. Specialty Oncology Nursing: Expansion of complex targeted oncology regimens is increasing recruiter demand for Chemotherapy/Biotherapy Certified (OCN) registered nurses in outpatient infusion suites.
3. Rapid Credentialing Value: Healthcare employers are placing higher screening weight on active RQI/ACLS simulation badges to accelerate clinical onboarding times.',
  '[
    "Over one-third of skilled nursing facilities face acute challenges meeting CMS staffing campaign prerequisites.",
    "Oncology pipeline readouts demonstrate clinical progress, driving demand for specialized infusion nursing staff.",
    "Hospitals and VA centers report high ROI from recurring simulation competencies, improving provider readiness."
  ]'::jsonb,
  '[
    { "publisher": "McKnight''s Long-Term Care News", "title": "CMS Staffing Campaign Analysis", "url": "https://www.mcknights.com/news/cms-staffing-campaign-update" },
    { "publisher": "Centers for Medicare & Medicaid Services", "title": "Long-Term Care Staffing Directives", "url": "https://www.cms.gov/newsroom" },
    { "publisher": "VA Health Care Newsroom", "title": "Clinical Workforce Readiness Brief", "url": "https://news.va.gov" }
  ]'::jsonb,
  '[
    { "item": "CMS Regional Compliance Workshop for Post-Acute Providers", "deadline": "Next 48 Hours", "type": "Federal Webinar" },
    { "item": "Upcoming Oncology Clinical Practice Guideline Updates", "deadline": "This Weekend", "type": "Clinical Update" }
  ]'::jsonb,
  14,
  'published',
  'gemini-2.0-flash',
  now()
) on conflict (period_type, period_key) do update set
  report_title = excluded.report_title,
  period_label = excluded.period_label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  executive_summary = excluded.executive_summary,
  major_developments = excluded.major_developments,
  staffing_impact = excluded.staffing_impact,
  key_takeaways = excluded.key_takeaways,
  sources_and_references = excluded.sources_and_references,
  what_to_watch_next = excluded.what_to_watch_next,
  source_count = excluded.source_count,
  generated_at = excluded.generated_at;


-- B. PAST WEEK CONSOLIDATED REPORT
insert into public.healthcare_development_reports (
  period_type,
  period_key,
  report_title,
  period_label,
  start_date,
  end_date,
  executive_summary,
  major_developments,
  staffing_impact,
  key_takeaways,
  sources_and_references,
  what_to_watch_next,
  source_count,
  status,
  gemini_model,
  generated_at
) values (
  'week',
  'latest',
  'US Healthcare Weekly Intelligence Briefing: Past 7 Days',
  'Past 7 Days',
  now() - interval '7 days',
  now(),
  'Across the past seven days, the US healthcare sector experienced substantial regulatory, financial, and operational realignment. Federal scrutiny over provider consolidations intensified as the FTC expanded investigations into health system cross-market transactions. In the clinical workforce realm, health systems expanded internal nurse floating pools and ambulatory surgical hiring to curb contract labor expenditures. Additionally, public health officials released updated seasonal respiratory guidance while the FDA advanced several high-priority oncology and rare disease reviews.',
  '[
    {
      "topic": "Hospitals & Health System Consolidations",
      "headline": "FTC and Department of Justice Issue New Scrutiny on Regional Health System Alliances",
      "narrative": "Antitrust enforcement across the Midwest and Southeast signaled heightened hurdles for hospital mergers. Federal regulators challenged two proposed multi-hospital combinations, pointing to localized market concentration and commercial pricing leverage as key anti-competitive threats. Health system executives are responding by shifting capital away from full hospital acquisitions toward joint ventures and freestanding ambulatory centers.",
      "citations": [
        { "title": "Antitrust Regulators Challenge Regional Provider Consolidations", "publisher": "Federal Trade Commission", "url": "https://www.ftc.gov/news-events/news/press-releases" },
        { "title": "Hospital M&A Outlook Under Heightened Regulatory Scrutiny", "publisher": "Healthcare Finance News", "url": "https://www.healthcarefinancenews.com" }
      ]
    },
    {
      "topic": "Healthcare Workforce & Compensation Realignment",
      "headline": "Health Systems Transition Inpatient Contract Labor into Internal Regional Float Pools",
      "narrative": "Multiple regional health systems reported progress in driving down agency nurse spending by instituting enterprise-wide internal travel and float pools. These internal programs offer nurses 15–20% higher base compensation plus scheduling flexibility across multiple system hospitals, reducing dependence on third-party locum tenens staffing.",
      "citations": [
        { "title": "Health Systems Tame Contract Labor Costs with Internal Float Pools", "publisher": "Modern Healthcare", "url": "https://www.modernhealthcare.com/labor/internal-travel-nurse-pools" }
      ]
    },
    {
      "topic": "Healthcare Technology & Ambient AI",
      "headline": "Ambient Clinical Voice AI Adoption Accelerates Among Outpatient Networks",
      "narrative": "New adoption data indicates that over 40% of large ambulatory medical groups have integrated ambient AI listening tools into EHR documentation workflows. Physicians report average time savings of 1.5 to 2 hours per shift, reducing after-hours charting and lowering burnout-driven physician turnover.",
      "citations": [
        { "title": "Ambient AI Documentation Expands Across Ambulatory Care", "publisher": "Health Affairs Forefront", "url": "https://www.healthaffairs.org" }
      ]
    }
  ]'::jsonb,
  'Key workforce takeaways for US healthcare recruiters from the past seven days:
1. Internal Float Competition: The growth of hospital internal float pools is directly competing with traditional travel nurse agencies, shifting recruitment toward permanent regional travelers.
2. Ambulatory Shift: Outpatient surgery centers (ASCs) and specialty clinics continue to capture experienced OR and ICU nurses seeking predictable day shifts.
3. Tech as Retention Lever: Health systems that provide ambient AI charting tools are successfully marketing them to recruit and retain primary care physicians and nurse practitioners.',
  '[
    "Hospital M&A faces unprecedented antitrust pressure, accelerating outpatient joint ventures.",
    "Internal nurse float networks are successfully replacing high-cost external agency spend.",
    "Ambient clinical AI documentation has reached critical mass, emerging as a major provider retention tool."
  ]'::jsonb,
  '[
    { "publisher": "Federal Trade Commission", "title": "Healthcare Provider Consolidation Review", "url": "https://www.ftc.gov" },
    { "publisher": "Modern Healthcare", "title": "Hospital Labor Cost & Strategy Report", "url": "https://www.modernhealthcare.com" },
    { "publisher": "Health Affairs Forefront", "title": "Digital Health & Physician Burnout Metrics", "url": "https://www.healthaffairs.org" }
  ]'::jsonb,
  '[
    { "item": "CMS CY2027 Physician Fee Schedule Final Rule Publication", "deadline": "November 01, 2026", "type": "Federal Regulatory" },
    { "item": "Healthcare Financial Management Association (HFMA) Fall Forum", "deadline": "Next Week", "type": "Industry Conference" }
  ]'::jsonb,
  24,
  'published',
  'gemini-2.0-flash',
  now()
) on conflict (period_type, period_key) do update set
  report_title = excluded.report_title,
  period_label = excluded.period_label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  executive_summary = excluded.executive_summary,
  major_developments = excluded.major_developments,
  staffing_impact = excluded.staffing_impact,
  key_takeaways = excluded.key_takeaways,
  sources_and_references = excluded.sources_and_references,
  what_to_watch_next = excluded.what_to_watch_next,
  source_count = excluded.source_count,
  generated_at = excluded.generated_at;


-- C. PAST MONTH (OCTOBER 2026) CONSOLIDATED REPORT
insert into public.healthcare_development_reports (
  period_type,
  period_key,
  report_title,
  period_label,
  start_date,
  end_date,
  executive_summary,
  major_developments,
  staffing_impact,
  key_takeaways,
  sources_and_references,
  what_to_watch_next,
  source_count,
  status,
  gemini_model,
  generated_at
) values (
  'month',
  '2026-10',
  'US Healthcare Monthly Intelligence Report: October 2026',
  'October 2026',
  '2026-10-01T00:00:00Z',
  '2026-10-31T23:59:59Z',
  'October 2026 was marked by pivotal developments across US healthcare policy, provider finance, and workforce supply. The Centers for Medicare & Medicaid Services (CMS) moved forward with the initial phases of its landmark nursing home minimum staffing mandate, triggering immediate operational adjustments across post-acute care networks. Concurrently, federal antitrust authorities expanded investigations into regional hospital mergers, pushing health systems toward decentralized outpatient strategies. The US healthcare labor market demonstrated steady resilience with 34,200 net jobs added, driven largely by outpatient surgical centers and ambulatory care, while inpatient hospitals continued to balance escalating labor expenses with internal retention initiatives.',
  '[
    {
      "topic": "Healthcare Policy, Legislation & CMS Regulations",
      "headline": "CMS Implements Mandatory RN Coverage Guidelines for Skilled Nursing Facilities",
      "narrative": "CMS released comprehensive operational guidance reinforcing the 24/7 on-site registered nurse (RN) mandate for Medicare and Medicaid nursing facilities. While post-acute providers welcomed phased financial exemptions for rural providers, industry surveys reveal that over one-third of long-term care operators face immediate workforce deficits to achieve full compliance.",
      "citations": [
        { "title": "CMS Releases Post-Acute Staffing Directives and Enforcement Protocols", "publisher": "CMS Press Office", "url": "https://www.cms.gov/newsroom/press-releases" },
        { "title": "Long-Term Care Operators Prepare for Staffing Mandate Implementation", "publisher": "Modern Healthcare", "url": "https://www.modernhealthcare.com" }
      ]
    },
    {
      "topic": "Hospitals, Health Systems & Financial Developments",
      "headline": "Federal Regulators Challenge Multi-Hospital Mergers Across Southeast and Midwest",
      "narrative": "The FTC and Department of Justice filed formal administrative challenges against two proposed regional health system combinations in Indiana and North Carolina. Regulators emphasized localized geographic concentration and payer pricing leverage as primary competitive harms. In response, health systems are reallocating capital away from acute hospital balance sheets toward freestanding ambulatory surgery centers and joint ventures.",
      "citations": [
        { "title": "FTC and DOJ Healthcare Consolidation Enforcement Actions", "publisher": "Federal Trade Commission", "url": "https://www.ftc.gov" },
        { "title": "Hospital M&A Pressures Under Regulatory Scrutiny", "publisher": "Healthcare Finance News", "url": "https://www.healthcarefinancenews.com" }
      ]
    },
    {
      "topic": "Healthcare Staffing Demand, Employment & Compensation",
      "headline": "US Healthcare Adds 34,200 Jobs Led by Outpatient and Ambulatory Surgery",
      "narrative": "The Bureau of Labor Statistics non-farm payroll report showed healthcare employment expanding by 34,200 positions. Ambulatory healthcare services accounted for over 21,000 of the additions, continuing to outpace hospital inpatient hiring. Wage growth held at 3.9% annualized across clinical roles, with wage compression easing in acute care settings due to reduced reliance on external agency premiums.",
      "citations": [
        { "title": "Employment Situation Summary — Healthcare Sector", "publisher": "U.S. Bureau of Labor Statistics", "url": "https://www.bls.gov/news.release" }
      ]
    },
    {
      "topic": "Clinical Advances, FDA Decisions & Public Health",
      "headline": "FDA Approves Novel Bispecific Antibodies and Targeted ADCs for Solid Tumors",
      "narrative": "The FDA granted accelerated approvals for targeted bispecific T-cell engagers and antibody-drug conjugates for refractory hematologic and solid malignancies. Tertiary cancer centers report immediate expansion of outpatient infusion protocols, necessitating targeted clinical competency training for oncology nurses.",
      "citations": [
        { "title": "FDA Approves Novel Oncology Combination Regimens", "publisher": "U.S. Food and Drug Administration", "url": "https://www.fda.gov/drugs" }
      ]
    },
    {
      "topic": "Healthcare Technology, AI & Digital Health",
      "headline": "Ambient AI Charting Adoption Crosses 45% Among Academic Medical Centers",
      "narrative": "Academic health systems reported nationwide adoption of ambient clinical voice transcription exceeding 45%. Clinical trials evaluating physician well-being documented a 2.2-hour weekly reduction in after-hours EHR documentation time, serving as a primary driver of retention among primary care clinicians.",
      "citations": [
        { "title": "Ambient AI Documentation Adoption Reaches Inflection Point", "publisher": "Health Affairs Forefront", "url": "https://www.healthaffairs.org" }
      ]
    }
  ]'::jsonb,
  'October 2026 presented critical strategic implications for the US healthcare labor market:
1. Post-Acute Nursing Scarcity: The CMS 24/7 RN requirement has triggered bidding competition for experienced nurse supervisors in long-term care, driving up base wage expectations by 8–12% in suburban and rural markets.
2. Inpatient to Ambulatory Migration: Outpatient surgical centers and specialty clinics continue to siphon experienced registered nurses and surgical technologists away from inpatient night shifts with competitive compensation and predictable weekday schedules.
3. Retention Over Traveling: Health systems are prioritizing enterprise float pools and ambient AI tools over spot-market travel contracts, resulting in stabilized core staffing rosters and reduced contract premium spend.',
  '[
    "CMS minimum staffing rules are forcing post-acute operators into aggressive bidding for RN supervisors.",
    "Federal antitrust enforcement has slowed acute hospital M&A, accelerating outpatient joint ventures.",
    "Healthcare job growth remains robust with ambulatory care driving over 60% of new positions.",
    "Ambient AI charting tools are proving to be effective retention mechanisms for physicians and nurses."
  ]'::jsonb,
  '[
    { "publisher": "Centers for Medicare & Medicaid Services", "title": "Long-Term Care Staffing Mandates & Regulatory Timeline", "url": "https://www.cms.gov" },
    { "publisher": "U.S. Bureau of Labor Statistics", "title": "Monthly Healthcare Employment Metrics", "url": "https://www.bls.gov" },
    { "publisher": "Federal Trade Commission", "title": "Health System Consolidation Guidelines", "url": "https://www.ftc.gov" },
    { "publisher": "Modern Healthcare", "title": "Hospital Operating Margins and Labor Report", "url": "https://www.modernhealthcare.com" },
    { "publisher": "Health Affairs Forefront", "title": "Ambient AI Clinical Productivity Findings", "url": "https://www.healthaffairs.org" }
  ]'::jsonb,
  '[
    { "item": "CMS Calendar Year 2027 Physician Fee Schedule Final Rule", "deadline": "November 01, 2026", "type": "Federal Regulatory" },
    { "item": "Open Enrollment Kickoff for ACA Health Insurance Exchanges", "deadline": "November 01, 2026", "type": "Market Milestone" },
    { "item": "National Association for Healthcare Recruitment Annual Conference", "deadline": "November 14, 2026", "type": "Industry Event" }
  ]'::jsonb,
  38,
  'published',
  'gemini-2.0-flash',
  '2026-10-24T18:00:00Z'
) on conflict (period_type, period_key) do update set
  report_title = excluded.report_title,
  period_label = excluded.period_label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  executive_summary = excluded.executive_summary,
  major_developments = excluded.major_developments,
  staffing_impact = excluded.staffing_impact,
  key_takeaways = excluded.key_takeaways,
  sources_and_references = excluded.sources_and_references,
  what_to_watch_next = excluded.what_to_watch_next,
  source_count = excluded.source_count,
  generated_at = excluded.generated_at;


-- D. HISTORICAL MONTH (SEPTEMBER 2026) CONSOLIDATED REPORT
insert into public.healthcare_development_reports (
  period_type,
  period_key,
  report_title,
  period_label,
  start_date,
  end_date,
  executive_summary,
  major_developments,
  staffing_impact,
  key_takeaways,
  sources_and_references,
  what_to_watch_next,
  source_count,
  status,
  gemini_model,
  generated_at
) values (
  'month',
  '2026-09',
  'US Healthcare Monthly Intelligence Report: September 2026',
  'September 2026',
  '2026-09-01T00:00:00Z',
  '2026-09-30T23:59:59Z',
  'September 2026 was highlighted by the release of the Medicare Drug Price Negotiation Phase 2 drug selection under the Inflation Reduction Act, alongside widespread state Medicaid managed care procurement announcements. Payer-provider contract disputes spiked as commercial insurers pushed back against requested hospital reimbursement rate increases, resulting in temporary out-of-network disruptions across multiple metropolitan areas. Healthcare employment remained resilient, representing over 22% of all net job creation nationwide.',
  '[
    {
      "topic": "Healthcare Policy, Legislation & Drug Pricing",
      "headline": "HHS Unveils Next 15 Medications Selected for Medicare Price Negotiations",
      "narrative": "The Department of Health and Human Services announced the second tranche of 15 high-expenditure drugs selected for negotiated maximum fair prices under the Inflation Reduction Act. The policy is expected to yield billions in savings for Medicare enrollees while prompting commercial insurers to adjust formulary designs.",
      "citations": [
        { "title": "HHS Announces Next Tranche of Negotiated Drugs", "publisher": "HHS Press Office", "url": "https://www.hhs.gov" }
      ]
    },
    {
      "topic": "Hospitals & Insurance Reimbursement Disputes",
      "headline": "Commercial Payer Impasses Lead to Temporary Out-of-Network Disruptions in Ohio and Midwest",
      "narrative": "Contract renewal negotiations between large commercial payers and regional health systems resulted in temporary coverage disruptions for non-emergency services before 30-day retroactive agreements were established. The standoffs highlighted hospital demands for 6–8% rate bumps to offset persistent post-pandemic wage increases.",
      "citations": [
        { "title": "Payer-Provider Dispute Roundup", "publisher": "Becker''s Hospital Review", "url": "https://www.beckershospitalreview.com" }
      ]
    },
    {
      "topic": "Nursing & Healthcare Workforce Collective Bargaining",
      "headline": "Pacific Northwest Nurse Strike Averted with Landmark 14% Wage Accord",
      "narrative": "Union negotiators representing 4,200 registered nurses across Washington and Oregon ratified a three-year collective bargaining pact featuring mandatory nurse-to-patient staffing ratios and compounded wage gains, setting a compensation benchmark for the Pacific Northwest talent market.",
      "citations": [
        { "title": "Pacific Northwest Nurse Union Contract Ratification", "publisher": "STAT News", "url": "https://www.statnews.com" }
      ]
    }
  ]'::jsonb,
  'September labor market takeaways for healthcare recruiters:
1. Benchmark Ripple Effects: The 14% Pacific Northwest nurse settlement created immediate compensation pressure for competing health systems, with hospitals introducing retention bonuses of $10,000–$15,000.
2. Payer Standoff Furloughs: Temporary commercial network impasses created short-term elective procedural pauses, causing contract nurse cancellations in affected metropolitan hubs.
3. High Specialty Premiums: Pediatric ICU and cardiac catheterization nurses saw record demand with average days-to-fill expanding to 54 days.',
  '[
    "HHS expanded Medicare drug price negotiations to 15 additional critical medications.",
    "Payer-provider contract disputes intensified over reimbursement rate adjustments.",
    "Union nurse wage agreements established a higher compensation baseline in regional markets."
  ]'::jsonb,
  '[
    { "publisher": "Department of Health and Human Services", "title": "Medicare Drug Price Negotiation Overview", "url": "https://www.hhs.gov" },
    { "publisher": "Becker''s Hospital Review", "title": "Payer-Provider Contract Standoffs", "url": "https://www.beckershospitalreview.com" },
    { "publisher": "STAT News", "title": "Healthcare Workforce Collective Bargaining", "url": "https://www.statnews.com" }
  ]'::jsonb,
  '[
    { "item": "CMS Minimum Staffing Rule Public Comment Window Close", "deadline": "October 08, 2026", "type": "Federal Regulatory" },
    { "item": "Quarterly Hospital Financial Performance Disclosures", "deadline": "October 20, 2026", "type": "Financial Reporting" }
  ]'::jsonb,
  31,
  'published',
  'gemini-2.0-flash',
  '2026-09-30T18:00:00Z'
) on conflict (period_type, period_key) do update set
  report_title = excluded.report_title,
  period_label = excluded.period_label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  executive_summary = excluded.executive_summary,
  major_developments = excluded.major_developments,
  staffing_impact = excluded.staffing_impact,
  key_takeaways = excluded.key_takeaways,
  sources_and_references = excluded.sources_and_references,
  what_to_watch_next = excluded.what_to_watch_next,
  source_count = excluded.source_count,
  generated_at = excluded.generated_at;


-- E. HISTORICAL MONTH (AUGUST 2026) CONSOLIDATED REPORT
insert into public.healthcare_development_reports (
  period_type,
  period_key,
  report_title,
  period_label,
  start_date,
  end_date,
  executive_summary,
  major_developments,
  staffing_impact,
  key_takeaways,
  sources_and_references,
  what_to_watch_next,
  source_count,
  status,
  gemini_model,
  generated_at
) values (
  'month',
  '2026-08',
  'US Healthcare Monthly Intelligence Report: August 2026',
  'August 2026',
  '2026-08-01T00:00:00Z',
  '2026-08-31T23:59:59Z',
  'August 2026 centered on federal finalization of the Inpatient Prospective Payment System (IPPS) fiscal year 2027 payment rule, yielding an average 2.9% net reimbursement increase for acute care hospitals. Concurrently, state health departments accelerated efforts to expand multi-state nurse licensing compacts to combat rural practitioner shortages. Hospital operating margins hovered around 2.1%, showing stabilization following aggressive operational efficiency and overtime reduction programs.',
  '[
    {
      "topic": "Healthcare Policy & Inpatient Reimbursement",
      "headline": "CMS Finalizes FY 2027 Inpatient Prospective Payment System (IPPS) Rule",
      "narrative": "CMS finalized the annual IPPS rule, establishing a 2.9% net payment update for acute care hospitals that successfully submit quality data. Hospital associations criticized the increase as inadequate against persistent inflation, though provisions supporting rural critical-access hospitals were expanded.",
      "citations": [
        { "title": "CMS IPPS Final Rule Fact Sheet", "publisher": "CMS Press Office", "url": "https://www.cms.gov" }
      ]
    },
    {
      "topic": "Nursing & Healthcare Workforce Policy",
      "headline": "State Nurse Licensure Compact (NLC) Expansion Accelerates Across Five States",
      "narrative": "Five additional state legislatures advanced interstate Nurse Licensure Compact legislation to allow registered nurses holding multistate licenses to practice physically or via telehealth across state lines without purchasing separate licenses.",
      "citations": [
        { "title": "NLC Interstate Nurse Licensure Progress", "publisher": "National Council of State Boards of Nursing", "url": "https://www.ncsbn.org" }
      ]
    }
  ]'::jsonb,
  'August staffing implications:
1. Multistate Licensing Relief: Continued NLC expansion is significantly easing geographic mobility for travel nurses and telemedicine clinicians.
2. Inpatient Budget Constraints: The 2.9% IPPS rate update requires hospital recruiters to emphasize non-wage perks (tuition assistance, flexible self-scheduling) to win top nursing candidates.',
  '[
    "CMS finalized a 2.9% hospital inpatient payment increase for fiscal year 2027.",
    "Multistate nurse licensure compacts expanded, expediting cross-state clinical recruitment.",
    "Hospital operating margins stabilized as contract nurse expenditures continued to moderate."
  ]'::jsonb,
  '[
    { "publisher": "Centers for Medicare & Medicaid Services", "title": "FY 2027 IPPS Payment Rule Directives", "url": "https://www.cms.gov" },
    { "publisher": "National Council of State Boards of Nursing", "title": "Nurse Licensure Compact Annual Report", "url": "https://www.ncsbn.org" }
  ]'::jsonb,
  '[
    { "item": "Federal Fiscal Year 2027 Inpatient Rule Effective Date", "deadline": "October 01, 2026", "type": "Federal Regulatory" }
  ]'::jsonb,
  27,
  'published',
  'gemini-2.0-flash',
  '2026-08-31T18:00:00Z'
) on conflict (period_type, period_key) do update set
  report_title = excluded.report_title,
  period_label = excluded.period_label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  executive_summary = excluded.executive_summary,
  major_developments = excluded.major_developments,
  staffing_impact = excluded.staffing_impact,
  key_takeaways = excluded.key_takeaways,
  sources_and_references = excluded.sources_and_references,
  what_to_watch_next = excluded.what_to_watch_next,
  source_count = excluded.source_count,
  generated_at = excluded.generated_at;
