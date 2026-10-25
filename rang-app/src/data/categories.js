/**
 * Rang Healthcare — News categories
 * Single source of truth for all category definitions.
 *
 * Icons are Lucide React components (no emojis) so every theme renders
 * crisp, professional glyphs that inherit the surrounding text color.
 */
import {
  Hospital,
  Users,
  Pill,
  ClipboardList,
  ShieldCheck,
  CircleDollarSign,
  Globe,
  Bot,
  Microscope,
  Handshake,
  Newspaper,
  MapPin,
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'hospitals',      label: 'Hospitals & Health Systems',       icon: Hospital },
  { id: 'workforce',      label: 'Healthcare Workforce & Staffing',  icon: Users },
  { id: 'nursing',        label: 'Nursing & Clinical Workforce',     icon: Pill },
  { id: 'policy',         label: 'Healthcare Policy & Regulation',   icon: ClipboardList },
  { id: 'insurance',      label: 'Insurance & Payers',               icon: ShieldCheck },
  { id: 'business',       label: 'Healthcare Business & Finance',    icon: CircleDollarSign },
  { id: 'public-health',  label: 'Public Health',                    icon: Globe },
  { id: 'technology',     label: 'Healthcare Technology & AI',       icon: Bot },
  { id: 'research',       label: 'Research & Clinical Developments', icon: Microscope },
  { id: 'mergers',        label: 'Mergers, Acquisitions & Expansion',icon: Handshake },
  { id: 'other',          label: 'Other Healthcare News',            icon: Newspaper },
];

/**
 * Recruiter view preset — the categories surfaced by default on the news
 * feed. Clinical research and other specialist beats are excluded from the
 * default view but stay available under "All topics" and the Categories
 * dropdown.
 *
 * Mapping of the product brief to category ids:
 * - Nursing & Clinical Workforce  -> nursing
 * - Hiring & Staffing             -> workforce
 * - Layoffs                       -> workforce (classified there by the AI pipeline)
 * - Policy & Reimbursement        -> policy + insurance
 * - Health System Business        -> hospitals + business
 * - Workforce Data                -> workforce
 * Explicitly OUT of the default view: research, technology, public-health,
 * mergers, other.
 */
export const RECRUITER_CATEGORY_IDS = [
  'nursing',
  'workforce',
  'policy',
  'insurance',
  'business',
  'hospitals',
];

/* Categories ordered for filter UIs: recruiter priorities first, then the rest */
export const CATEGORIES_RECRUITER_FIRST = [
  ...RECRUITER_CATEGORY_IDS.map((id) => CATEGORIES.find((c) => c.id === id)),
  ...CATEGORIES.filter((c) => !RECRUITER_CATEGORY_IDS.includes(c.id)),
];

export const COUNTRIES = [
  { id: 'all', label: 'All News',      icon: Globe },
  { id: 'US',  label: 'United States', icon: MapPin },
  { id: 'CA',  label: 'Canada',        icon: MapPin },
];

export const RECENCY_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '24h', label: 'Past 24 hours' },
  { id: '7d',  label: 'Past 7 days' },
];

/* Default recency window for the news feed */
export const DEFAULT_RECENCY = '24h';

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

export const TIMELINE_RANGES = [
  { id: 'week',    label: 'Past week',     description: 'Last 7 days' },
  { id: 'month',   label: 'Past month',    description: 'Last 30 days (default)' },
  { id: '3months', label: 'Past 3 months', description: 'Last 90 days' },
  { id: '6months', label: 'Past 6 months', description: 'Last 180 days' },
  { id: 'year',    label: 'Past year',     description: 'Last 365 days' },
  { id: '3years',  label: 'Past 3 years',  description: 'Historical archive (2023–2026)' },
];

