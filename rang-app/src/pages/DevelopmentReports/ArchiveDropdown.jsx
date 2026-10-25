import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './ArchiveDropdown.css';

/**
 * ArchiveDropdown — custom dark-teal listbox replacing the native <select>
 * for the "Historical Archive" month picker.
 *
 * Props:
 *  - options:   [{ value, label }] (existing monthlyArchives shape, mapped)
 *  - value:     currently selected value (existing selectedMonthKey)
 *  - onChange:  same handler/state, called with the chosen month key
 *  - triggerId: id for the trigger button (so the page label's htmlFor binds)
 */
export default function ArchiveDropdown({ value, onChange, options = [], triggerId }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef(new Map());

  const selected = options.find((o) => o.value === value) || null;
  const selectedLabel = selected ? selected.label : 'Select month';

  /* Group by year (period_key like "2026-10") for the small year headers.
     Each item keeps its flat index so keyboard nav matches the visual order. */
  const groups = useMemo(() => {
    const map = new Map();
    options.forEach((opt, idx) => {
      const year = /^\d{4}-/.test(opt.value) ? opt.value.slice(0, 4) : 'Archive';
      if (!map.has(year)) map.set(year, []);
      map.get(year).push({ ...opt, idx });
    });
    return [...map.entries()].map(([year, items]) => ({ year, items }));
  }, [options]);

  /* Highlight the current selection whenever the menu opens */
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlighted(Math.max(0, idx));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Keep the highlighted item visible */
  useEffect(() => {
    if (open && highlighted >= 0) {
      itemRefs.current.get(highlighted)?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selectOption = (opt) => {
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const optionDomId = (opt) => `archive-opt-${String(opt.value).replace(/[^a-zA-Z0-9-]/g, '')}`;

  const onTriggerKeyDown = (e) => {
    if (!open) {
      // Open with keyboard as well as click
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (!options.length) return;
    const count = options.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((i) => (i - 1 + count) % count);
        break;
      case 'Home':
        e.preventDefault();
        setHighlighted(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlighted(count - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlighted >= 0 && options[highlighted]) {
          selectOption(options[highlighted]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      default:
        // Type-ahead: jump to the next match starting with the typed letter
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const typed = e.key.toLowerCase();
          let idx = -1;
          for (let step = 0; step < count; step++) {
            const i = (highlighted + 1 + step) % count;
            if (options[i].label.toLowerCase().startsWith(typed)) { idx = i; break; }
          }
          if (idx === -1) {
            for (let i = 0; i < count; i++) {
              if (options[i].label.toLowerCase().includes(typed)) { idx = i; break; }
            }
          }
          if (idx >= 0) setHighlighted(idx);
        }
    }
  };

  return (
    <div className="archive-dropdown-wrap" ref={wrapRef}>
      <button
        id={triggerId}
        type="button"
        ref={triggerRef}
        className={`archive-trigger ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={
          open && highlighted >= 0 && options[highlighted]
            ? optionDomId(options[highlighted])
            : undefined
        }
        aria-label="Historical Archive: select month"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="archive-trigger-label">{selectedLabel}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className="archive-trigger-chevron"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="archive-menu" role="listbox" aria-label="Months">
          {groups.map(({ year, items }) => (
            <div className="archive-menu-group" key={year}>
              {groups.length > 1 && (
                <div className="archive-menu-group-label">{year}</div>
              )}
              {items.map((opt) => {
                const isSelected = opt.value === value;
                const isHighlighted = opt.idx === highlighted;
                return (
                  <div
                    key={opt.value}
                    id={optionDomId(opt)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    ref={(el) => { itemRefs.current.set(opt.idx, el); }}
                    className={`archive-menu-item ${
                      isSelected ? 'selected' : ''
                    } ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlighted(opt.idx)}
                  >
                    <span className="archive-menu-item-label">{opt.label}</span>
                    {isSelected && <Check size={16} strokeWidth={2.5} className="archive-menu-check" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
