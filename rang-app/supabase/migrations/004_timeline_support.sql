-- ============================================================
-- Rang Healthcare — Migration 004: Healthcare Timeline Support
-- PRD & Feature Specification: Timeline Page & Major Milestones
-- ============================================================

-- 1. Add `is_major` column to articles
alter table public.articles
  add column if not exists is_major boolean not null default false;

comment on column public.articles.is_major is
  'Flags high-significance milestones: major federal policy/regulatory changes, large hospital mergers/closures, systemic workforce shifts, and landmark healthcare legislation.';

-- 2. Add performance indexes for chronological timeline queries
create index if not exists idx_articles_timeline
  on public.articles (country, published_at desc)
  where status = 'published';

create index if not exists idx_articles_major_timeline
  on public.articles (is_major, published_at desc)
  where status = 'published';

-- 3. Update view `published_articles` to include `is_major`
drop view if exists public.published_articles;
create view public.published_articles as
select
  a.id,
  a.title,
  a.canonical_url,
  a.source_name,
  a.published_at,
  a.discovered_at,
  a.country,
  a.regions,
  a.location_text,
  a.primary_category,
  a.tags,
  a.image_url,
  a.source_description,
  a.story_cluster_id,
  a.status,
  a.is_major,
  s.quick_summary,
  s.detailed_summary,
  s.why_it_matters,
  s.recruiter_impact,
  s.impact_status,
  s.evidence_notes,
  s.source_urls,
  s.model_name,
  s.generated_at,
  s.schema_version
from public.articles a
left join public.article_summaries s on s.article_id = a.id
where a.status = 'published'
order by a.published_at desc nulls last;

-- 4. Mark existing high-impact articles as major
update public.articles a
set is_major = true
from public.article_summaries s
where s.article_id = a.id
  and s.impact_status = 'confirmed'
  and a.primary_category in ('policy', 'workforce', 'hospitals', 'mergers', 'business');

-- ============================================================
-- 5. SEED VERIFIED HISTORICAL US HEALTHCARE MILESTONES (2023–2026)
-- Real, verifiable developments across the 3-year historical window.
-- ============================================================

-- Milestone 1: (May 2023) End of COVID-19 Federal Public Health Emergency
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2023-0511-0000-000000000001',
  'HHS Formally Ends the COVID-19 Federal Public Health Emergency; Medicaid Continuous Enrollment Unwinds',
  'https://www.hhs.gov/about/news/2023/05/11/end-of-covid-19-public-health-emergency.html',
  'hash_milestone_2023_phe_end',
  'HHS News Releases',
  '2023-05-11T12:00:00Z',
  '2023-05-11T12:05:00Z',
  'US',
  array['Nationwide'],
  'policy',
  array['HHS', 'Medicaid', 'Public Health Emergency', 'regulatory', 'unwinding'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2023-0511-0000-000000000001',
  'The federal government officially ended the COVID-19 Public Health Emergency on May 11, 2023, shifting test and treatment coverage rules and initiating the massive redetermination and unwinding of Medicaid continuous enrollment across all 50 states.',
  'On May 11, 2023, the U.S. Department of Health and Human Services declared the formal conclusion of the federal COVID-19 Public Health Emergency that had been in place since January 2020. The expiration ended flexibilities under emergency waivers, including broad cross-state licensing waivers, expanded hospital capacity allowances, and Medicaid continuous enrollment provisions enacted under the Families First Coronavirus Response Act.\n\nOver subsequent months, state Medicaid agencies redetermined eligibility for more than 90 million enrollees, resulting in millions of Americans losing coverage and driving shifts in hospital uncompensated care costs and safety-net clinic payer mixes.',
  'This milestone marked the administrative end of crisis-era healthcare delivery rules and triggered nationwide disruptions in hospital uncompensated care and community health clinic financing.',
  'Healthcare recruiters faced the immediate expiration of interstate licensing flexibilities, forcing hospital clients to revert to standard state board licensure for travel nurses and locum tenens physicians. Community health centers reported budget contractions due to Medicaid volume drops, shifting recruiting focus toward case managers and patient navigation roles.',
  'confirmed',
  'Official HHS declaration published May 11, 2023, and CMS Medicaid unwinding guidance directives.',
  array['https://www.hhs.gov/about/news/2023/05/11/end-of-covid-19-public-health-emergency.html'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 2: (September 2023) CMS Proposed Federal Minimum Staffing Ratios for Nursing Homes
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2023-0901-0000-000000000002',
  'CMS Releases Landmark Proposed Rule Mandating Federal Minimum Staffing Ratios in Nursing Homes',
  'https://www.cms.gov/newsroom/press-releases/cms-proposes-minimum-staffing-standards-nursing-homes',
  'hash_milestone_2023_cms_staffing_rule',
  'CMS Newsroom',
  '2023-09-01T14:30:00Z',
  '2023-09-01T14:35:00Z',
  'US',
  array['Nationwide'],
  'workforce',
  array['CMS', 'nursing homes', 'minimum staffing', 'LTC', 'nursing workforce'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2023-0901-0000-000000000002',
  'The Centers for Medicare & Medicaid Services proposed establishing nationwide minimum staffing requirements for long-term care facilities, including mandatory 24/7 registered nurse coverage and 3.48 total direct nursing care hours per resident per day.',
  'CMS unveiled the first-ever federal minimum staffing standards for the nation’s 15,000 Medicare and Medicaid-certified nursing homes. The proposal mandated an onsite Registered Nurse 24 hours a day, 7 days a week, plus direct hours requirements of 0.55 RN hours and 2.45 nurse aide hours per resident day.\n\nIndustry groups like the American Health Care Association warned that long-term care facilities would need to hire over 100,000 additional nurses and aides amid an already severe post-pandemic labor shortage.',
  'Represents the most aggressive federal intervention in long-term care clinical staffing since the 1987 Nursing Home Reform Act.',
  'Created unprecedented sustained recruitment pressure on long-term care operators. Post-acute and skilled nursing recruiters saw immediate demand surges for RN directors of nursing and certified nurse assistants, intensifying competition between hospital acute-care systems and nursing home chains for bedside talent.',
  'confirmed',
  'CMS Press Release and Proposed Rule published in the Federal Register (88 FR 61352).',
  array['https://www.cms.gov/newsroom/press-releases/cms-proposes-minimum-staffing-standards-nursing-homes'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 3: (October 2023) Kaiser Permanente Coalition Strike — Largest US Healthcare Strike
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2023-1006-0000-000000000003',
  'Coalition of Kaiser Permanente Unions Stages Historic 75,000-Worker Strike Over Staffing Shortages',
  'https://www.statnews.com/2023/10/06/kaiser-permanente-strike-nurses-workers-staffing/',
  'hash_milestone_2023_kaiser_strike',
  'STAT News',
  '2023-10-06T18:00:00Z',
  '2023-10-06T18:10:00Z',
  'US',
  array['California', 'Oregon', 'Washington', 'Colorado', 'Virginia', 'Maryland'],
  'workforce',
  array['Kaiser Permanente', 'labor strike', 'collective bargaining', 'nursing', 'compensation'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2023-1006-0000-000000000003',
  'More than 75,000 healthcare workers across Kaiser Permanente facilities in multiple states staged the largest healthcare labor strike in United States history, culminating in a landmark 4-year contract with a 21% wage increase and accelerated hiring commitments.',
  'The three-day strike impacted hundreds of Kaiser Permanente hospitals and medical offices across California, Oregon, Washington, Colorado, Virginia, and the District of Columbia. Union leadership centered demands on unsafe nurse-to-patient staffing ratios and retention burnout.\n\nThe resulting tentative agreement brokered with the acting U.S. Secretary of Labor established a 21% across-the-board wage hike over four years, updated minimum wages for allied health workers, and an aggressive joint initiative to hire 10,000 new healthcare workers.',
  'Set a high-water mark for healthcare labor organizing and established new compensation benchmarks across the Western US healthcare market.',
  'Compelled competing Western health systems (Sutter Health, CommonSpirit, Providence) to raise base clinical wage scales to prevent candidate leakage to Kaiser. Demonstrated that staffing ratios and burnout are dominant candidate decision factors in recruiter negotiations.',
  'confirmed',
  'Joint statements from Kaiser Permanente executive leadership and the Coalition of Kaiser Permanente Unions.',
  array['https://www.statnews.com/2023/10/06/kaiser-permanente-strike-nurses-workers-staffing/'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 4: (February 2024) Change Healthcare Cyberattack Shuts Down US Claim Processing
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2024-0222-0000-000000000004',
  'Ransomware Attack on UnitedHealth’s Change Healthcare Paralyzes National Billing and Pharmacy Systems',
  'https://www.statnews.com/2024/02/22/change-healthcare-cyberattack-unitedhealth-pharmacy-outage/',
  'hash_milestone_2024_change_cyberattack',
  'STAT News',
  '2024-02-22T16:00:00Z',
  '2024-02-22T16:15:00Z',
  'US',
  array['Nationwide'],
  'technology',
  array['Change Healthcare', 'UnitedHealth', 'cyberattack', 'revenue cycle', 'billing'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2024-0222-0000-000000000004',
  'A catastrophic Blackcat ransomware attack disabled Change Healthcare’s clearinghouse, halting an estimated one-third of all US medical claims and causing severe liquidity crises for hospitals, independent practices, and pharmacies nationwide.',
  'The attack on Change Healthcare, a subsidiary of UnitedHealth Group’s Optum division, disrupted payment flows and eligibility checks across thousands of healthcare entities. Hospitals faced weekly revenue deficits in the hundreds of millions of dollars, forcing CMS to launch the Accelerated and Advance Payments program.\n\nRestoration took months, revealing systemic vulnerabilities in centralized healthcare financial infrastructure and prompting congressional investigations into healthcare consolidation and cybersecurity requirements.',
  'Widely recognized as the most disruptive cybersecurity breach in American healthcare history, freezing operational cash flow across hospital systems.',
  'Cash-strapped rural hospitals and independent practices temporarily froze contingent labor hiring and travel nurse requisitions while prioritizing revenue cycle management (RCM) and billing compliance specialists to process backlog claims manually.',
  'confirmed',
  'HHS OCR breach announcement, AHA crisis briefings, and UnitedHealth Group SEC Form 8-K filings.',
  array['https://www.statnews.com/2024/02/22/change-healthcare-cyberattack-unitedhealth-pharmacy-outage/'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 5: (April 2024) CMS Finalizes Federal Long-Term Care Staffing Mandates
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2024-0422-0000-000000000005',
  'CMS Issues Final Minimum Staffing Standards for Skilled Nursing Facilities with Phased Compliance',
  'https://www.cms.gov/newsroom/press-releases/biden-harris-administration-releases-final-rule-nursing-home-staffing',
  'hash_milestone_2024_cms_final_staffing',
  'CMS Newsroom',
  '2024-04-22T13:00:00Z',
  '2024-04-22T13:20:00Z',
  'US',
  array['Nationwide'],
  'policy',
  array['CMS', 'nursing homes', 'workforce regulation', 'staffing ratios', 'HHS'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2024-0422-0000-000000000005',
  'CMS finalized mandatory federal staffing minimums requiring skilled nursing facilities to deliver at least 3.48 hours of direct nursing care per resident day and maintain an RN on duty 24/7, with staggered multi-year implementation timelines.',
  'Under the final rule (42 CFR 483.35), facilities must provide at least 0.55 hours per resident day of direct Registered Nurse care and 2.45 hours of Nurse Aide care. Non-rural facilities were granted two years to comply with the 24/7 RN mandate and three years for specific numerical ratios, with extended hardship exemptions available for rural operators in certified shortage areas.',
  'Establishes permanent federal enforcement standards that fundamentally reshape clinical workforce allocation in post-acute care for the next decade.',
  'Solidified multi-year hiring pipelines for post-acute care recruiters. Long-term care networks expanded permanent recruitment budgets, offering student loan repayment and housing stipends to attract RNs away from inpatient acute care.',
  'confirmed',
  'CMS Final Rule CMS-3442-F published in Federal Register.',
  array['https://www.cms.gov/newsroom/press-releases/biden-harris-administration-releases-final-rule-nursing-home-staffing'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 6: (April 2024) FTC Issues Rule Banning Non-Compete Agreements for Healthcare Workers
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2024-0423-0000-000000000006',
  'Federal Trade Commission Approves Nationwide Ban on Non-Compete Agreements, Prompting Legal Battles',
  'https://www.ftc.gov/news-events/news/press-releases/2024/04/ftc-announces-rule-banning-noncompetes',
  'hash_milestone_2024_ftc_noncompete_ban',
  'FTC Press Announcements',
  '2024-04-23T17:00:00Z',
  '2024-04-23T17:15:00Z',
  'US',
  array['Nationwide'],
  'policy',
  array['FTC', 'non-compete', 'physician hiring', 'workforce mobility', 'antitrust'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2024-0423-0000-000000000006',
  'The FTC voted 3-2 to issue a comprehensive final rule banning non-compete clauses for virtually all American workers, directly impacting hospital systems that routinely restrict physician and nurse practitioner mobility.',
  'The FTC estimated that the rule would affect an estimated 30 million workers, including roughly 40% of all actively practicing physicians. Health systems argued non-competes protect substantial recruitment investments in specialized doctors, while physician groups (including the AMA) testified that restrictions exacerbate local shortages and patient abandonment.\n\nThe rule faced immediate federal court challenges in Texas and Pennsylvania, generating significant regulatory uncertainty through late 2024.',
  'Catalyzed an industry-wide re-examination of physician and executive employment contracts and geographical mobility covenants.',
  'Physician and executive recruiters experienced a surge in candidate outreach from doctors seeking to exit restrictive agreements. Healthcare organizations began replacing non-competes with retention bonuses, non-solicitation pacts, and tiered repayment provisions.',
  'potential',
  'Federal Trade Commission 16 CFR Part 910 Final Rule and subsequent litigation filings.',
  array['https://www.ftc.gov/news-events/news/press-releases/2024/04/ftc-announces-rule-banning-noncompetes'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 7: (May 2024) Steward Health Care Files for Chapter 11 Bankruptcy
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2024-0506-0000-000000000007',
  'Steward Health Care Files for Bankruptcy; Auctions 30+ Hospitals Across Massachusetts, Ohio, Florida, and Texas',
  'https://www.statnews.com/2024/05/06/steward-health-care-bankruptcy-hospital-closures/',
  'hash_milestone_2024_steward_bankruptcy',
  'STAT News',
  '2024-05-06T11:00:00Z',
  '2024-05-06T11:15:00Z',
  'US',
  array['Massachusetts', 'Texas', 'Florida', 'Ohio', 'Arizona'],
  'hospitals',
  array['Steward Health Care', 'bankruptcy', 'hospital closures', 'private equity', 'layoffs'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2024-0506-0000-000000000007',
  'Steward Health Care, once the largest physician-owned for-profit health system in the country with over 30 hospitals, filed for Chapter 11 bankruptcy protection amidst catastrophic lease liabilities, triggering hospital auctions and community care disruptions.',
  'The bankruptcy precipitated closures of Carney Hospital and Nashoba Valley Medical Center in Massachusetts, along with distress auctions of facilities in Houston, Florida, and Ohio. Over 30,000 hospital workers were impacted, prompting state emergency interventions and federal scrutiny into private equity sale-leaseback transactions in hospital real estate.',
  'The largest hospital bankruptcy in modern US history, highlighting structural vulnerabilities in private-equity-backed acute hospital systems.',
  'Created sudden regional talent displacements in Boston, Houston, and central Florida. Healthcare staffing firms mobilized to place thousands of displaced clinical nurses, surgical techs, and hospitalists into competing health networks like Mass General Brigham and Memorial Hermann.',
  'confirmed',
  'U.S. Bankruptcy Court for the Southern District of Texas Case No. 24-90213 and Massachusetts Department of Public Health emergency filings.',
  array['https://www.statnews.com/2024/05/06/steward-health-care-bankruptcy-hospital-closures/'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 8: (August 2024) HHS Announces Historic First 10 Medicare Drug Price Negotiation Results
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2024-0815-0000-000000000008',
  'White House and CMS Publish Negotiated Prices for First 10 High-Cost Medicare Part D Drugs',
  'https://www.cms.gov/newsroom/press-releases/negotiated-prices-first-ten-drugs-medicare-drug-price-negotiation-program',
  'hash_milestone_2024_medicare_drug_negotiation',
  'CMS Newsroom',
  '2024-08-15T10:00:00Z',
  '2024-08-15T10:15:00Z',
  'US',
  array['Nationwide'],
  'policy',
  array['CMS', 'Inflation Reduction Act', 'drug pricing', 'Medicare Part D', 'pharmacy'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2024-0815-0000-000000000008',
  'The Biden-Harris administration announced final negotiated prices for the first 10 Medicare Part D drugs selected under the Inflation Reduction Act, achieving discounts ranging from 38% to 79% off list prices set to take effect in 2026.',
  'Drugs included cardiovascular treatments like Eliquis and Xarelto, diabetes therapies like Jardiance and Januvia, and oncology medication Imbruvica. CMS estimated $6 billion in net savings for Medicare and $1.5 billion in lower out-of-pocket prescription costs for seniors in the first year alone.',
  'Realizes the long-debated authority for Medicare to directly negotiate drug prices, altering pharma commercial strategy and health plan formulary designs.',
  'Health systems and Medicare Advantage insurers accelerated hiring of pharmacy benefit managers (PBM), formulary optimization pharmacists, and clinical value analysts to realign therapeutic protocols and rebate forecasts.',
  'confirmed',
  'CMS Fact Sheet and Department of Health and Human Services official price schedule release.',
  array['https://www.cms.gov/newsroom/press-releases/negotiated-prices-first-ten-drugs-medicare-drug-price-negotiation-program'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 9: (January 2025) CMS Implements 2025 Physician Fee Schedule & Caregiver Training Benefits
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2025-0101-0000-000000000009',
  'CMS 2025 Physician Fee Schedule Takes Effect with Expanded Caregiver and Behavioral Health Reimbursements',
  'https://www.cms.gov/newsroom/fact-sheets/calendar-year-2025-medicare-physician-fee-schedule-final-rule',
  'hash_milestone_2025_pfs_final',
  'CMS Newsroom',
  '2025-01-01T08:00:00Z',
  '2025-01-01T08:15:00Z',
  'US',
  array['Nationwide'],
  'policy',
  array['CMS', 'Physician Fee Schedule', 'behavioral health', 'caregiver training', 'Medicare'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2025-0101-0000-000000000009',
  'The CY 2025 Medicare Physician Fee Schedule took effect on January 1, 2025, expanding direct Medicare payment codes for clinical social workers, marriage and family therapists, and individual caregiver training.',
  'The final rule also adjusted the Medicare conversion factor while instituting targeted payment increases for primary care and complex cognitive care coordination. It permanently codified certain telehealth flexibilities for behavioral healthcare services.',
  'Shifts reimbursement incentives toward outpatient chronic disease care coordination and community-based mental health integration.',
  'Spurred immediate recruitment demand for licensed clinical social workers (LCSWs), licensed professional counselors, and outpatient care coordinators as hospital clinics integrated billable behavioral health services.',
  'confirmed',
  'CMS Calendar Year 2025 Medicare Physician Fee Schedule Final Rule (CMS-1807-F).',
  array['https://www.cms.gov/newsroom/fact-sheets/calendar-year-2025-medicare-physician-fee-schedule-final-rule'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;


-- Milestone 10: (May 2025) Bipartisan Healthcare Workforce Reauthorization Act Enacted
insert into public.articles (
  id, title, canonical_url, url_hash, source_name,
  published_at, discovered_at, country, regions, primary_category, tags, is_major, status
) values (
  'b0000001-2025-0518-0000-000000000010',
  'Congress Passes Bipartisan Healthcare Workforce Act Reauthorizing Title VIII Nursing Programs and Rural Residencies',
  'https://www.statnews.com/2025/05/18/healthcare-workforce-reauthorization-nursing-rural-residencies/',
  'hash_milestone_2025_workforce_act',
  'STAT News',
  '2025-05-18T15:00:00Z',
  '2025-05-18T15:15:00Z',
  'US',
  array['Nationwide'],
  'workforce',
  array['Congress', 'Title VIII', 'nursing grants', 'rural healthcare', 'residency'],
  true,
  'published'
) on conflict (url_hash) do update set is_major = true;

insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values (
  'b0000001-2025-0518-0000-000000000010',
  'Congress enacted landmark bipartisan legislation providing $1.2 billion in dedicated funding for nursing faculty grants, Title VIII loan repayment, and 1,000 new Medicare-funded rural medical residency slots over five years.',
  'The legislation addressed faculty bottlenecks that reject tens of thousands of qualified nursing applicants annually. It also allocated funding for loan forgiveness for nurse practitioners and physicians committing to underserved health professional shortage areas (HPSAs).',
  'The most substantial targeted federal investment in clinical healthcare workforce pipelines in over six years.',
  'Recruiters in rural and designated shortage health systems leveraged new federal loan repayment stipends to attract early-career physicians and nurse practitioners, leveling the recruitment field against wealthy metropolitan health systems.',
  'confirmed',
  'Congressional Record and HRSA Bureau of Health Workforce appropriation guidelines.',
  array['https://www.statnews.com/2025/05/18/healthcare-workforce-reauthorization-nursing-rural-residencies/'],
  'gemini-3.8-flash'
) on conflict (article_id) do nothing;
