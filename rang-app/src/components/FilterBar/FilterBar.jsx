import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, RECENCY_OPTIONS } from '../../data/categories';
import './FilterBar.css';

export default function FilterBar({
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
    <div className="filter-bar" role="toolbar" aria-label="Article filters">
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

      {/* Category dropdown */}
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
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
              <button
                key={cat.id}
                className={`filter-bar__dropdown-item ${selectedCategories.includes(cat.id) ? 'active' : ''}`}
                onClick={() => toggleCategory(cat.id)}
                role="option"
                aria-selected={selectedCategories.includes(cat.id)}
              >
                <span className="filter-bar__dropdown-item-icon" aria-hidden="true">
                  {CatIcon && <CatIcon size={15} strokeWidth={2} />}
                </span>
                <span>{cat.label}</span>
                {selectedCategories.includes(cat.id) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
              );
            })}
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
  );
}
