-- ============================================================
-- Rang Healthcare — Seed Data: Initial RSS Sources
-- US and Canadian healthcare feeds for the ingestion pipeline.
-- ============================================================

-- US Sources — Federal agencies & healthcare media
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('HHS News Releases',            'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:hhs.gov+news+release&hl=en-US&gl=US&ceid=US:en',      'https://www.hhs.gov',          1, 60),
  ('CMS Newsroom',                 'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:cms.gov+newsroom&hl=en-US&gl=US&ceid=US:en',          'https://www.cms.gov',          1, 60),
  ('CDC Media Releases',           'official_newsroom', 'US',  'https://tools.cdc.gov/api/v2/resources/media/404952.rss',                                        'https://www.cdc.gov',          2, 120),
  ('Modern Healthcare',            'rss',               'US',  'https://news.google.com/rss/search?q=site:modernhealthcare.com&hl=en-US&gl=US&ceid=US:en',       'https://www.modernhealthcare.com', 2, 60),
  ('Becker''s Hospital Review',    'rss',               'US',  'https://news.google.com/rss/search?q=site:beckershospitalreview.com&hl=en-US&gl=US&ceid=US:en',   'https://www.beckershospitalreview.com', 2, 60),
  ('Healthcare Dive',              'rss',               'US',  'https://www.healthcaredive.com/feeds/news/',                                                     'https://www.healthcaredive.com', 3, 120),
  ('Fierce Healthcare',            'rss',               'US',  'https://news.google.com/rss/search?q=site:fiercehealthcare.com&hl=en-US&gl=US&ceid=US:en',       'https://www.fiercehealthcare.com', 3, 120),
  ('AHA News',                     'official_newsroom', 'US',  'https://news.google.com/rss/search?q=site:aha.org+news&hl=en-US&gl=US&ceid=US:en',              'https://www.aha.org',          2, 120),
  ('Kaiser Health News',           'rss',               'US',  'https://kffhealthnews.org/feed/',                                                               'https://kffhealthnews.org',    2, 120);

-- Canada Sources — Federal agencies & healthcare media
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('Health Canada News',           'official_newsroom', 'CA',  'https://www.canada.ca/en/health-canada.atom.xml',                                               'https://www.canada.ca/en/health-canada.html', 1, 60),
  ('CIHI (Canadian Institute for Health Information)', 'official_newsroom', 'CA', 'https://news.google.com/rss/search?q=site:cihi.ca&hl=en-CA&gl=CA&ceid=CA:en', 'https://www.cihi.ca', 2, 180),
  ('CBC Health',                   'rss',               'CA',  'https://www.cbc.ca/cmlink/rss-health',                                                          'https://www.cbc.ca/news/health', 2, 60),
  ('Globe and Mail Health',        'rss',               'CA',  'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/life/health-and-fitness/',        'https://www.theglobeandmail.com', 3, 120);

-- Google News RSS search feeds (cross-country healthcare topics)
insert into public.sources (name, source_type, country_scope, feed_url, website_url, priority, check_interval_minutes) values
  ('Google News: US Hospital Staffing',       'search_feed', 'US',  'https://news.google.com/rss/search?q=hospital+staffing+hiring+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: US Healthcare Policy',       'search_feed', 'US',  'https://news.google.com/rss/search?q=healthcare+policy+regulation+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: US Nursing Workforce',       'search_feed', 'US',  'https://news.google.com/rss/search?q=nursing+shortage+workforce+United+States&hl=en-US&gl=US&ceid=US:en', 'https://news.google.com', 4, 180),
  ('Google News: Canada Healthcare Staffing', 'search_feed', 'CA',  'https://news.google.com/rss/search?q=healthcare+staffing+hospital+Canada&hl=en-CA&gl=CA&ceid=CA:en',     'https://news.google.com', 4, 180),
  ('Google News: Canada Nursing',             'search_feed', 'CA',  'https://news.google.com/rss/search?q=nursing+shortage+workforce+Canada&hl=en-CA&gl=CA&ceid=CA:en',        'https://news.google.com', 4, 180),
  ('Google News: Healthcare Mergers',         'search_feed', 'ALL', 'https://news.google.com/rss/search?q=healthcare+hospital+merger+acquisition&hl=en-US&gl=US&ceid=US:en',   'https://news.google.com', 5, 360);
