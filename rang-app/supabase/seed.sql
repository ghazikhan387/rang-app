-- ============================================================
-- Rang Healthcare — Development Seed Data
-- PRD §13: Core articles and summaries for testing and development.
-- ============================================================

-- 1. Insert Initial Sources
insert into public.sources (id, name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('d3b07384-d113-4a0f-90e6-5c5a8e0f6b01', 'HHS News Releases',            'official_newsroom', 'US',  'https://www.hhs.gov/about/news/rss/index.xml',                   'https://www.hhs.gov',          1, 60),
  ('d3b07384-d113-4a0f-90e6-5c5a8e0f6b02', 'CMS Newsroom',                 'official_newsroom', 'US',  'https://www.cms.gov/newsroom/rss',                               'https://www.cms.gov',          1, 60),
  ('d3b07384-d113-4a0f-90e6-5c5a8e0f6b03', 'Modern Healthcare',            'rss',               'US',  'https://www.modernhealthcare.com/section/rss',                    'https://www.modernhealthcare.com', 2, 60),
  ('d3b07384-d113-4a0f-90e6-5c5a8e0f6b04', 'CBC Health',                   'rss',               'CA',  'https://www.cbc.ca/cmlink/rss-health',                           'https://www.cbc.ca/news/health', 2, 60),
  ('d3b07384-d113-4a0f-90e6-5c5a8e0f6b05', 'Health Canada News',           'official_newsroom', 'CA',  'https://www.canada.ca/en/health-canada.atom.xml',                'https://www.canada.ca/en/health-canada.html', 1, 60)
on conflict do nothing;

-- 2. Insert Sample Articles
insert into public.articles (
  id, title, canonical_url, url_hash, source_name, source_id,
  published_at, country, regions, primary_category, tags, status
) values
(
  'a0000001-0000-0000-0000-000000000001',
  'HCA Healthcare Announces Major Nurse Recruitment Drive Across Southeast Hospitals',
  'https://example.com/hca-nurse-recruitment',
  'hca_nurse_recruitment_hash_001',
  'Modern Healthcare',
  'd3b07384-d113-4a0f-90e6-5c5a8e0f6b03',
  now() - interval '2 hours',
  'US',
  array['Tennessee', 'Florida', 'Texas'],
  'workforce',
  array['nursing', 'recruitment', 'HCA Healthcare', 'staffing'],
  'published'
),
(
  'a0000001-0000-0000-0000-000000000002',
  'Ontario Government Proposes New International Nurse Credential Recognition Framework',
  'https://example.com/ontario-nurse-credentials',
  'ontario_nurse_credentials_hash_002',
  'CBC News',
  'd3b07384-d113-4a0f-90e6-5c5a8e0f6b04',
  now() - interval '5 hours',
  'CA',
  array['Ontario'],
  'policy',
  array['Ontario', 'international nurses', 'credential recognition', 'immigration'],
  'published'
),
(
  'a0000001-0000-0000-0000-000000000003',
  'Cleveland Clinic and IBM Announce AI-Powered Clinical Decision Support Partnership',
  'https://example.com/cleveland-clinic-ibm-ai',
  'cleveland_ibm_ai_hash_003',
  'Healthcare IT News',
  null,
  now() - interval '8 hours',
  'US',
  array['Ohio'],
  'technology',
  array['AI', 'Cleveland Clinic', 'IBM', 'clinical decision support', 'technology'],
  'published'
),
(
  'a0000001-0000-0000-0000-000000000004',
  'Quebec Nurses Reach Tentative Agreement with Government on Working Conditions and Overtime',
  'https://example.com/quebec-nurses-tentative-agreement',
  'quebec_nurses_agreement_hash_004',
  'Montreal Gazette',
  null,
  now() - interval '14 hours',
  'CA',
  array['Quebec'],
  'labor_unions',
  array['Quebec', 'FIQ', 'nurses union', 'collective bargaining', 'overtime'],
  'published'
),
(
  'a0000001-0000-0000-0000-000000000005',
  'FDA Approves First Breakthrough Therapy for Early-Stage Alzheimer Disease in 2026',
  'https://example.com/fda-alzheimer-approval-2026',
  'fda_alzheimer_approval_hash_005',
  'BioWorld',
  null,
  now() - interval '20 hours',
  'US',
  array[]::text[],
  'clinical',
  array['FDA', 'Alzheimer', 'neurology', 'drug approval'],
  'published'
)
on conflict (url_hash) do nothing;

-- 3. Insert Matching Summaries
insert into public.article_summaries (
  article_id, quick_summary, detailed_summary, why_it_matters,
  recruiter_impact, impact_status, evidence_notes, source_urls, model_name
) values
(
  'a0000001-0000-0000-0000-000000000001',
  'HCA Healthcare has announced plans to recruit 15,000 nurses over the next 18 months across facilities in Tennessee, Florida, and Texas. The initiative includes sign-on bonuses and expanded training partnerships.',
  'HCA Healthcare, one of the largest for-profit hospital operators in the United States, announced a comprehensive nurse recruitment initiative targeting 15,000 registered nurses across the Southeast hospital network over the next 18 months. Key components include competitive sign-on bonuses ranging from $10,000 to $25,000 depending on specialty and location, expanded partnerships with over 30 regional nursing programs, and a new internal career development pathway.',
  'This initiative represents one of the largest single-employer nursing recruitment efforts in 2026 and signals continued demand pressure in the southeastern US healthcare labor market.',
  'Healthcare recruiters operating in Tennessee, Florida, and Texas should expect increased competition for nursing candidates, particularly in critical care and emergency specialties. HCA''s sign-on bonuses may drive compensation expectations higher across competing systems.',
  'confirmed',
  'Based on HCA Healthcare''s official announcement and press release detailing specific hiring numbers, locations, and compensation.',
  array['https://example.com/hca-nurse-recruitment'],
  'gemini-2.0-flash'
),
(
  'a0000001-0000-0000-0000-000000000002',
  'Ontario''s health ministry has proposed a streamlined credential recognition process for internationally educated nurses, potentially reducing the licensing timeline from 18 months to under 6 months.',
  'The Ontario Ministry of Health has released draft legislation establishing a new expedited credential recognition framework for internationally educated nurses (IENs). The proposal aims to address the province''s critical nursing shortage by standardizing competency assessments within 90 days and providing provisional licenses.',
  'This proposal could significantly expand Ontario''s nursing workforce at a time when hospitals across the province are operating with chronic staffing shortfalls.',
  'Recruiters specializing in Canadian healthcare placement should monitor this legislation closely. If enacted, the reduced credentialing timeline could create a significant influx of eligible nursing candidates in Ontario starting mid-2027.',
  'potential',
  'Based on Ontario Ministry of Health press release. Legislation is in draft stage and subject to public consultation.',
  array['https://example.com/ontario-nurse-credentials'],
  'gemini-2.0-flash'
),
(
  'a0000001-0000-0000-0000-000000000003',
  'Cleveland Clinic and IBM have formed a multi-year partnership to deploy artificial intelligence models for real-time clinical decision support across Cleveland Clinic''s hospital network.',
  'Cleveland Clinic and IBM announced a collaboration to co-develop and deploy domain-specific AI models for bedside clinical decision support. The system focuses on early sepsis detection, ICU deterioration monitoring, and medication conflict alerting.',
  'The partnership represents a significant transition from exploratory AI research to operational clinical deployment in a premier health system.',
  'Demand for clinical informaticists, health informatics nurses, and clinical data analysts will likely increase. Recruiters should expect health systems pursuing AI initiatives to prioritize candidates who bridge clinical practice and health informatics.',
  'potential',
  'Joint press announcement from Cleveland Clinic and IBM. Implementation roadmap extends through 2027.',
  array['https://example.com/cleveland-clinic-ibm-ai'],
  'gemini-2.0-flash'
),
(
  'a0000001-0000-0000-0000-000000000004',
  'Quebec''s major healthcare union FIQ has reached a tentative agreement with the provincial government that includes limits on mandatory overtime and enhanced retention bonuses for experienced nurses.',
  'The Fédération interprofessionnelle de la santé du Québec (FIQ), representing approximately 80,000 nurses and healthcare professionals, reached a tentative agreement with the Quebec government following months of negotiations and rotating strikes.',
  'The agreement represents a significant milestone in resolving labor instability in Quebec''s healthcare sector and addresses the persistent grievance of mandatory overtime.',
  'The tentative agreement could stabilize nursing retention in Quebec public hospitals, potentially reducing out-of-province mobility or agency travel nursing demand.',
  'confirmed',
  'Joint statement from FIQ executive and Quebec Treasury Board. Ratification vote pending.',
  array['https://example.com/quebec-nurses-tentative-agreement'],
  'gemini-2.0-flash'
),
(
  'a0000001-0000-0000-0000-000000000005',
  'The FDA has granted accelerated approval for a new monoclonal antibody targeting tau protein aggregates in patients with mild cognitive impairment and early-stage Alzheimer disease.',
  'The U.S. Food and Drug Administration approved an innovative therapy based on Phase 3 trial results demonstrating a 31% slowing of cognitive decline over 18 months.',
  'This approval expands treatment options for early Alzheimer disease beyond amyloid-targeting therapies, validating tau-targeted approaches.',
  'Health systems will require specialized memory clinic staff, cognitive assessment specialists, and infusion center nursing teams to support administration and monitoring protocols.',
  'potential',
  'FDA approval notice and Phase 3 trial clinical findings published in New England Journal of Medicine.',
  array['https://example.com/fda-alzheimer-approval-2026'],
  'gemini-2.0-flash'
)
on conflict (article_id) do nothing;
