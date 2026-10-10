/**
 * Rang Healthcare — News categories
 * Single source of truth for all category definitions.
 */

export const CATEGORIES = [
  { id: 'hospitals',      label: 'Hospitals & Health Systems',       icon: '🏥' },
  { id: 'workforce',      label: 'Healthcare Workforce & Staffing',  icon: '👥' },
  { id: 'nursing',        label: 'Nursing & Clinical Workforce',     icon: '💊' },
  { id: 'policy',         label: 'Healthcare Policy & Regulation',   icon: '📋' },
  { id: 'insurance',      label: 'Insurance & Payers',               icon: '🛡️' },
  { id: 'business',       label: 'Healthcare Business & Finance',    icon: '💰' },
  { id: 'public-health',  label: 'Public Health',                    icon: '🌍' },
  { id: 'technology',     label: 'Healthcare Technology & AI',       icon: '🤖' },
  { id: 'research',       label: 'Research & Clinical Developments', icon: '🔬' },
  { id: 'mergers',        label: 'Mergers, Acquisitions & Expansion',icon: '🤝' },
  { id: 'other',          label: 'Other Healthcare News',            icon: '📰' },
];

export const COUNTRIES = [
  { id: 'all', label: 'All News' },
  { id: 'US',  label: 'United States', flag: '🇺🇸' },
  { id: 'CA',  label: 'Canada',        flag: '🇨🇦' },
];

export const RECENCY_OPTIONS = [
  { id: 'latest',    label: 'Latest' },
  { id: '24h',       label: 'Past 24 hours' },
  { id: '7d',        label: 'Past 7 days' },
];

export const IMPACT_STATUS = {
  confirmed: {
    label: 'Confirmed development',
    color: 'var(--color-success)',
    description: 'A source explicitly reports the relevant workforce or hiring change.',
  },
  potential: {
    label: 'Potential recruiting relevance',
    color: 'var(--color-warning)',
    description: 'The story may matter to recruiters, but a direct hiring effect is not confirmed.',
  },
  unclear: {
    label: 'No clear recruiting impact identified',
    color: 'var(--color-text-muted)',
    description: 'No meaningful implication can be supported from the available evidence.',
  },
};
