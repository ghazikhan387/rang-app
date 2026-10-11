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

export const COUNTRIES = [
  { id: 'all', label: 'All News',      icon: Globe },
  { id: 'US',  label: 'United States', icon: MapPin },
  { id: 'CA',  label: 'Canada',        icon: MapPin },
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
