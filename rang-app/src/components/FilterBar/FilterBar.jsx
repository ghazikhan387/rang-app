import { useState, useRef, useEffect } from 'react';
import { Briefcase, LayoutList } from 'lucide-react';
import {
  CATEGORIES,
  RECENCY_OPTIONS,
  CATEGORIES_RECRUITER_FIRST,
  RECRUITER_CATEGORY_IDS,
} from '../../data/categories';
import './FilterBar.css';

const VIEW_OPTIONS = [
  { id: 'recruiter', label: 'Recruiter view', icon: Briefcase },
  { id: 'all', label: 'All topics', icon: LayoutList },
];

/* Dropdown sections: recruiter priorities first, everything else after */
const CATEGORY_SECTIONS = [
  { label: 'Recruiter picks', items: CATEGORIES_RECRUITER_FIRST.filter((c) => RECRUITER_CATEGORY_IDS.includes(c.id)) },
  { label: 'More topics', items: CATEGORIES_RECRUITER_FIRST.filter((c) => !RECRUITER_CATEGORY_IDS.includes(c.id)) },
];

export default function FilterBar({
  viewMode,
  onViewChange,
  selectedCategories,
  onCategoryChange,
  selectedRecency,
  onRecencyChange,
  onClearAll,
  hasActiveFilters,
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      onCategoryChange(selectedCategories.filter((c) => c !== catId));
    } else {
      onCategoryChange([...selectedCategories, catId]);
    }
  };

  return (
    <div className="filter-bar-wrap">
      <div className="filter-bar" role="toolbar" aria-label="Article filters">
        {/* Feed view preset */}
        <div className="filter-bar__group">
          {VIEW_OPTIONS.map((opt) => {
            const ViewIcon = opt.icon;
            return (
              <button
                key={opt.id}
                className={`filter-pill ${viewMode === opt.id ? 'active' : ''}`}
                onClick={() => onViewChange(opt.id)}
                aria-pressed={viewMode === opt.id}
                title={
                  opt.id === 'recruiter'
                    ? 'Prioritizes workforce, hiring, staffing and policy stories'
                    : 'Show every topic in the feed'
                }
              >
                <ViewIcon width={14} height={14} strokeWidth={2} aria-hidden="true" />
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="filter-bar__divider" />

        {/* Recency */}
        <div className="filter-bar__group">
          {RECENCY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`filter-pill ${selectedRecency === opt.id ? 'active' : ''}`}
              onClick={() => onRecencyChange(opt.id)}
              aria-pressed={selectedRecency === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="filter-bar__divider" />

        {/* Category multi-select dropdown */}
        <div className="filter-bar__dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`filter-pill ${selectedCategories.length > 0 ? 'active' : ''}`}
            onClick={() => setCategoryOpen(!categoryOpen)}
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Categories
            {selectedCategories.length > 0 && (
              <span className="filter-bar__active-count">{selectedCategories.length}</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {categoryOpen && (
            <div className="filter-bar__dropdown" role="listbox" aria-label="Category filter">
              {CATEGORY_SECTIONS.map((section, sectionIndex) => (
                <div key={section.label}>
                  {sectionIndex > 0 && <div className="filter-bar__dropdown-sep" />}
                  <div className="filter-bar__dropdown-label">{section.label}</div>
                  {section.items.map((cat) => {
                    const CatIcon = cat.icon;
                    const selected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        className={`filter-bar__dropdown-item ${selected ? 'active' : ''}`}
                        onClick={() => toggleCategory(cat.id)}
                        role="option"
                        aria-selected={selected}
                      >
                        <span className="filter-bar__dropdown-item-icon" aria-hidden="true">
                          {CatIcon && <CatIcon size={15} strokeWidth={2} />}
                        </span>
                        <span>{cat.label}</span>
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button className="filter-bar__clear" onClick={onClearAll}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear filters
          </button>
        )}
      </div>

      {/* Active-filter chips */}
      {selectedCategories.length > 0 && (
        <div className="filter-bar__chips" aria-label="Active category filters">
          {selectedCategories.map((id) => {
            const cat = CATEGORIES.find((c) => c.id === id);
            return (
              <span key={id} className="filter-chip">
                {cat?.label || id}
                <button
                  type="button"
                  className="filter-chip__remove"
                  onClick={() => toggleCategory(id)}
                  aria-label={`Remove filter: ${cat?.label || id}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
