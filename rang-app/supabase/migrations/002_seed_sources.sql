-- ============================================================
-- Rang Healthcare — Seed Data: Comprehensive RSS Sources
-- US and Canadian healthcare feeds for the ingestion pipeline.
-- ~85 sources across trade publications, staffing industry,
-- government agencies, professional associations, health systems,
-- and topical Google News search feeds.
-- ============================================================

-- ============================================================
-- A. US Sources — Federal Agencies & Healthcare Media
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('HHS News Releases',            'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:hhs.gov+news+release&hl=en-US&gl=US&ceid=US:en',      'https://www.hhs.gov',          1, 60),
  ('CMS Newsroom',                 'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:cms.gov+newsroom&hl=en-US&gl=US&ceid=US:en',          'https://www.cms.gov',          1, 60),
  ('CDC Media Releases',           'official_newsroom', 'US',  'https://tools.cdc.gov/api/v2/resources/media/404952.rss',                                        'https://www.cdc.gov',          2, 120),
  ('Modern Healthcare',            'rss',               'US',  'https://news.google.com/rss/search?q=site:modernhealthcare.com&hl=en-US&gl=US&ceid=US:en',       'https://www.modernhealthcare.com', 2, 60),
  ('Becker''s Hospital Review',    'rss',               'US',  'https://news.google.com/rss/search?q=site:beckershospitalreview.com&hl=en-US&gl=US&ceid=US:en',   'https://www.beckershospitalreview.com', 2, 60),
  ('Healthcare Dive',              'rss',               'US',  'https://www.healthcaredive.com/feeds/news/',                                                     'https://www.healthcaredive.com', 3, 120),
  ('Fierce Healthcare',            'rss',               'US',  'https://news.google.com/rss/search?q=site:fiercehealthcare.com&hl=en-US&gl=US&ceid=US:en',       'https://www.fiercehealthcare.com', 3, 120),
  ('AHA News',                     'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:aha.org+news&hl=en-US&gl=US&ceid=US:en',              'https://www.aha.org',          2, 120),
  ('Kaiser Health News',           'rss',               'US',  'https://kffhealthnews.org/feed/',                                                               'https://kffhealthnews.org',    2, 120)
on conflict do nothing;

-- ============================================================
-- B. US Trade Publications & Industry Media (Direct RSS)
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('STAT News',                      'rss', 'US', 'https://www.statnews.com/feed/',                                                              'https://www.statnews.com',                 1, 60),
  ('Healthcare Finance News',        'rss', 'US', 'https://www.healthcarefinancenews.com/rss.xml',                                                'https://www.healthcarefinancenews.com',     2, 60),
  ('HealthLeaders Media',            'rss', 'US', 'https://www.healthleadersmedia.com/rss.xml',                                                   'https://www.healthleadersmedia.com',        2, 60),
  ('Advisory Board',                 'rss', 'US', 'https://news.google.com/rss/search?q=site:advisory.com+healthcare&hl=en-US&gl=US&ceid=US:en',  'https://www.advisory.com',                 3, 120),
  ('Healthcare IT News',             'rss', 'US', 'https://www.healthcareitnews.com/rss.xml',                                                     'https://www.healthcareitnews.com',          2, 60),
  ('MedPage Today',                  'rss', 'US', 'https://www.medpagetoday.com/rss/headlines.xml',                                               'https://www.medpagetoday.com',              3, 120),
  ('Medscape News',                  'rss', 'US', 'https://news.google.com/rss/search?q=site:medscape.com+healthcare&hl=en-US&gl=US&ceid=US:en',  'https://www.medscape.com',                 3, 120),
  ('Health Affairs Blog',            'rss', 'US', 'https://www.healthaffairs.org/do/section/blog/feed/',                                          'https://www.healthaffairs.org',             2, 180),
  ('Politico Health Care',           'rss', 'US', 'https://rss.politico.com/healthcare.xml',                                                      'https://www.politico.com/health-care',      2, 60),
  ('Reuters Health',                 'rss', 'US', 'https://news.google.com/rss/search?q=site:reuters.com+healthcare+hospital&hl=en-US&gl=US&ceid=US:en', 'https://www.reuters.com',           3, 120),
  ('The Hill - Healthcare',          'rss', 'US', 'https://thehill.com/taxonomy/term/28/feed',                                                    'https://thehill.com/policy/healthcare/',     3, 120),
  ('McKnights Long-Term Care News',  'rss', 'US', 'https://www.mcknights.com/feed/',                                                              'https://www.mcknights.com',                3, 120),
  ('Nursing Times',                  'rss', 'US', 'https://www.nursingtimes.net/feed/',                                                           'https://www.nursingtimes.net',             3, 120),
  ('RevCycleIntelligence',           'rss', 'US', 'https://revcycleintelligence.com/rss/revcycleintelligence.xml',                                 'https://revcycleintelligence.com',         3, 120),
  ('HealthPayerIntelligence',        'rss', 'US', 'https://healthpayerintelligence.com/rss/healthpayerintelligence.xml',                           'https://healthpayerintelligence.com',      3, 120),
  ('HealthITAnalytics',              'rss', 'US', 'https://healthitanalytics.com/rss/healthitanalytics.xml',                                       'https://healthitanalytics.com',            3, 120),
  ('EHRIntelligence',                'rss', 'US', 'https://ehrintelligence.com/rss/ehrintelligence.xml',                                           'https://ehrintelligence.com',              4, 180),
  ('mHealthIntelligence',            'rss', 'US', 'https://mhealthintelligence.com/rss/mhealthintelligence.xml',                                   'https://mhealthintelligence.com',          4, 180)
on conflict do nothing;

-- ============================================================
-- C. Healthcare Staffing & Recruiting Industry
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('Staffing Industry Analysts',     'rss', 'US', 'https://news.google.com/rss/search?q=site:staffingindustry.com+healthcare&hl=en-US&gl=US&ceid=US:en',  'https://www.staffingindustry.com',  2, 120),
  ('American Staffing Association',   'rss', 'US', 'https://news.google.com/rss/search?q=site:americanstaffing.net+healthcare&hl=en-US&gl=US&ceid=US:en', 'https://americanstaffing.net',      3, 180),
  ('Beckers Clinical Leadership',    'rss', 'US', 'https://news.google.com/rss/search?q=site:beckershospitalreview.com+staffing+nurse&hl=en-US&gl=US&ceid=US:en', 'https://www.beckershospitalreview.com', 2, 120),
  ('Nurse.com',                      'rss', 'US', 'https://news.google.com/rss/search?q=site:nurse.com+OR+site:reliasmedia.com+healthcare&hl=en-US&gl=US&ceid=US:en', 'https://www.nurse.com',       3, 180),
  ('Medscape Nurses',                'rss', 'US', 'https://news.google.com/rss/search?q=site:medscape.com+nursing+staffing&hl=en-US&gl=US&ceid=US:en',   'https://www.medscape.com',          4, 180)
on conflict do nothing;

-- ============================================================
-- D. US Federal Government & Regulatory Agencies
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('VA News Releases',               'official_newsroom', 'US', 'https://news.va.gov/feed/',                                                                        'https://news.va.gov',               2, 120),
  ('HRSA News',                      'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:hrsa.gov+news&hl=en-US&gl=US&ceid=US:en',                 'https://www.hrsa.gov',              2, 180),
  ('FDA Newsroom',                   'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:fda.gov+news+press+release&hl=en-US&gl=US&ceid=US:en',    'https://www.fda.gov',               2, 120),
  ('NIH News Releases',             'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:nih.gov+news+release&hl=en-US&gl=US&ceid=US:en',          'https://www.nih.gov',               3, 180),
  ('GAO Healthcare Reports',        'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:gao.gov+healthcare+hospital&hl=en-US&gl=US&ceid=US:en',   'https://www.gao.gov',               4, 360),
  ('FTC Healthcare',                 'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:ftc.gov+healthcare+hospital+merger&hl=en-US&gl=US&ceid=US:en', 'https://www.ftc.gov',          4, 360),
  ('DOL News Releases',             'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:dol.gov+healthcare+worker+labor&hl=en-US&gl=US&ceid=US:en', 'https://www.dol.gov',              4, 360)
on conflict do nothing;

-- ============================================================
-- E. Professional Associations & Nursing Organizations
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('American Nurses Association',    'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:nursingworld.org+OR+"American+Nurses+Association"&hl=en-US&gl=US&ceid=US:en', 'https://www.nursingworld.org', 2, 180),
  ('AHA Today',                      'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:aha.org+today+news&hl=en-US&gl=US&ceid=US:en',            'https://www.aha.org',               2, 120),
  ('AACN News',                      'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:aacnnursing.org+news&hl=en-US&gl=US&ceid=US:en',           'https://www.aacnnursing.org',       3, 360),
  ('AONL Nurse Leaders',             'official_newsroom', 'US', 'https://news.google.com/rss/search?q="AONL"+OR+"nurse+leader"+workforce&hl=en-US&gl=US&ceid=US:en', 'https://www.aonl.org',              4, 360),
  ('AMA News',                       'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:ama-assn.org+news&hl=en-US&gl=US&ceid=US:en',             'https://www.ama-assn.org',          3, 180),
  ('Joint Commission News',          'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:jointcommission.org+news&hl=en-US&gl=US&ceid=US:en',      'https://www.jointcommission.org',   4, 360)
on conflict do nothing;

-- ============================================================
-- F. Major Hospital System Newsrooms
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('HCA Healthcare Newsroom',        'official_newsroom', 'US', 'https://news.google.com/rss/search?q=site:hcahealthcare.com+OR+"HCA+Healthcare"+hiring+expansion&hl=en-US&gl=US&ceid=US:en',   'https://hcahealthcare.com',   3, 180),
  ('CommonSpirit Health News',       'official_newsroom', 'US', 'https://news.google.com/rss/search?q="CommonSpirit+Health"+hospital+news&hl=en-US&gl=US&ceid=US:en',   'https://www.commonspirit.org',   3, 180),
  ('Ascension Health News',          'official_newsroom', 'US', 'https://news.google.com/rss/search?q="Ascension+Health"+hospital+news&hl=en-US&gl=US&ceid=US:en',      'https://www.ascension.org',      3, 180),
  ('Tenet Healthcare News',          'official_newsroom', 'US', 'https://news.google.com/rss/search?q="Tenet+Healthcare"+news+hospital&hl=en-US&gl=US&ceid=US:en',      'https://www.tenethealth.com',    3, 180),
  ('Kaiser Permanente News',         'official_newsroom', 'US', 'https://news.google.com/rss/search?q="Kaiser+Permanente"+news+hospital+hiring&hl=en-US&gl=US&ceid=US:en', 'https://about.kaiserpermanente.org', 3, 180),
  ('Cleveland Clinic Newsroom',      'official_newsroom', 'US', 'https://news.google.com/rss/search?q="Cleveland+Clinic"+news+expansion+hiring&hl=en-US&gl=US&ceid=US:en', 'https://newsroom.clevelandclinic.org', 3, 180),
  ('Mayo Clinic News',               'official_newsroom', 'US', 'https://news.google.com/rss/search?q="Mayo+Clinic"+news+expansion+hiring&hl=en-US&gl=US&ceid=US:en',      'https://newsnetwork.mayoclinic.org', 3, 180),
  ('UnitedHealth Group News',        'official_newsroom', 'US', 'https://news.google.com/rss/search?q="UnitedHealth+Group"+OR+"Optum"+news+healthcare&hl=en-US&gl=US&ceid=US:en', 'https://www.unitedhealthgroup.com', 3, 180),
  ('CVS Health News',                'official_newsroom', 'US', 'https://news.google.com/rss/search?q="CVS+Health"+OR+"Aetna"+healthcare+news&hl=en-US&gl=US&ceid=US:en',  'https://www.cvshealth.com',     3, 180)
on conflict do nothing;

-- ============================================================
-- G. Google News Topical Search Feeds (US Healthcare Recruiting)
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('Google News: US Hospital Staffing',       'search_feed', 'US',  'https://news.google.com/rss/search?q=hospital+staffing+hiring+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: US Healthcare Policy',       'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+policy+regulation+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: US Nursing Workforce',       'search_feed', 'US',  'https://news.google.com/rss/search?q=nursing+shortage+workforce+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: Healthcare Mergers',         'search_feed', 'ALL', 'https://news.google.com/rss/search?q=healthcare+hospital+merger+acquisition&hl=en-US&gl=US&ceid=US:en',   'https://news.google.com', 5, 360),
  ('GNews: Healthcare Recruiting',            'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+recruiting+hiring+jobs&hl=en-US&gl=US&ceid=US:en',              'https://news.google.com', 3, 120),
  ('GNews: Travel Nursing',                   'search_feed', 'US',  'https://news.google.com/rss/search?q=travel+nursing+staffing+agency&hl=en-US&gl=US&ceid=US:en',                 'https://news.google.com', 3, 120),
  ('GNews: Healthcare Worker Shortage',       'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+worker+shortage+burnout&hl=en-US&gl=US&ceid=US:en',             'https://news.google.com', 3, 120),
  ('GNews: Hospital Expansion',              'search_feed', 'US',  'https://news.google.com/rss/search?q=hospital+expansion+new+facility+construction&hl=en-US&gl=US&ceid=US:en',   'https://news.google.com', 3, 180),
  ('GNews: Healthcare Layoffs',              'search_feed', 'US',  'https://news.google.com/rss/search?q=hospital+layoffs+OR+healthcare+layoffs+OR+healthcare+closure&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 2, 120),
  ('GNews: Healthcare AI Technology',        'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+artificial+intelligence+technology+hospital&hl=en-US&gl=US&ceid=US:en',    'https://news.google.com', 4, 180),
  ('GNews: Medicare Medicaid Policy',        'search_feed', 'US',  'https://news.google.com/rss/search?q=Medicare+Medicaid+policy+regulation+CMS&hl=en-US&gl=US&ceid=US:en',        'https://news.google.com', 3, 120),
  ('GNews: Nurse Practitioner PA',           'search_feed', 'US',  'https://news.google.com/rss/search?q=nurse+practitioner+OR+physician+assistant+scope+of+practice&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('GNews: Hospital CEO Leadership',        'search_feed', 'US',  'https://news.google.com/rss/search?q=hospital+CEO+appointed+OR+hospital+CEO+resigned+OR+health+system+leadership&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('GNews: Healthcare Union Labor',          'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+union+strike+OR+nurse+strike+OR+hospital+labor&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 3, 120),
  ('GNews: Health Insurance Payer',          'search_feed', 'US',  'https://news.google.com/rss/search?q=health+insurance+payer+coverage+premium&hl=en-US&gl=US&ceid=US:en',         'https://news.google.com', 4, 180),
  ('GNews: Allied Health Professionals',     'search_feed', 'US',  'https://news.google.com/rss/search?q=allied+health+professional+therapist+technologist+staffing&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('GNews: Telehealth Virtual Care',         'search_feed', 'US',  'https://news.google.com/rss/search?q=telehealth+virtual+care+remote+patient+monitoring&hl=en-US&gl=US&ceid=US:en',   'https://news.google.com', 4, 180),
  ('GNews: Rural Hospital',                  'search_feed', 'US',  'https://news.google.com/rss/search?q=rural+hospital+closure+OR+rural+healthcare+access&hl=en-US&gl=US&ceid=US:en',  'https://news.google.com', 3, 180),
  ('GNews: Physician Recruitment',           'search_feed', 'US',  'https://news.google.com/rss/search?q=physician+recruitment+OR+doctor+shortage+OR+residency+program&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 3, 180),
  ('GNews: Home Health Hospice',             'search_feed', 'US',  'https://news.google.com/rss/search?q=home+health+hospice+staffing+OR+home+health+aide&hl=en-US&gl=US&ceid=US:en',   'https://news.google.com', 4, 180),
  ('GNews: Behavioral Health Mental',        'search_feed', 'US',  'https://news.google.com/rss/search?q=behavioral+health+mental+health+workforce+staffing&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('GNews: Long Term Care Nursing Home',     'search_feed', 'US',  'https://news.google.com/rss/search?q=nursing+home+long+term+care+staffing+mandate&hl=en-US&gl=US&ceid=US:en',      'https://news.google.com', 3, 120)
on conflict do nothing;

-- ============================================================
-- H. Canada Sources — Federal agencies & healthcare media
-- ============================================================
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('Health Canada News',           'official_newsroom', 'CA',  'https://www.canada.ca/en/health-canada.atom.xml',                                               'https://www.canada.ca/en/health-canada.html', 1, 60),
  ('CIHI (Canadian Institute for Health Information)', 'official_newsroom', 'CA', 'https://news.google.com/rss/search?q=site:cihi.ca&hl=en-CA&gl=CA&ceid=CA:en', 'https://www.cihi.ca', 2, 180),
  ('CBC Health',                   'rss',               'CA',  'https://www.cbc.ca/cmlink/rss-health',                                                          'https://www.cbc.ca/news/health', 2, 60),
  ('Globe and Mail Health',        'rss',               'CA',  'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/life/health-and-fitness/',        'https://www.theglobeandmail.com', 3, 120),
  ('Google News: Canada Healthcare Staffing', 'search_feed', 'CA',  'https://news.google.com/rss/search?q=healthcare+staffing+hospital+Canada&hl=en-CA&gl=CA&ceid=CA:en',     'https://news.google.com', 4, 180),
  ('Google News: Canada Nursing',             'search_feed', 'CA',  'https://news.google.com/rss/search?q=nursing+shortage+workforce+Canada&hl=en-CA&gl=CA&ceid=CA:en',        'https://news.google.com', 4, 180),
  ('GNews: Canada Healthcare Workforce',  'search_feed', 'CA', 'https://news.google.com/rss/search?q=Canada+healthcare+workforce+hiring+hospital&hl=en-CA&gl=CA&ceid=CA:en', 'https://news.google.com', 3, 180),
  ('GNews: Canada Physician Shortage',    'search_feed', 'CA', 'https://news.google.com/rss/search?q=Canada+physician+shortage+OR+doctor+shortage&hl=en-CA&gl=CA&ceid=CA:en', 'https://news.google.com', 4, 180),
  ('GNews: Canada Hospital Expansion',    'search_feed', 'CA', 'https://news.google.com/rss/search?q=Canada+hospital+expansion+OR+Canada+hospital+new&hl=en-CA&gl=CA&ceid=CA:en', 'https://news.google.com', 4, 180),
  ('CTV Health News',                     'rss',         'CA', 'https://www.ctvnews.ca/rss/health',                                                                        'https://www.ctvnews.ca/health', 3, 120)
on conflict do nothing;
