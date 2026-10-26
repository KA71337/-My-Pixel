'use client';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './icon';

type Option = {value: string; label: string};
export function CategoryDropdown({label, allLabel, categories, value}: {
  label: string; allLabel: string; categories: Option[]; value: string;
}) {
  const options = [{value: '', label: allLabel}, ...categories];
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef({text: '', time: 0});
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === selected));
  useEffect(() => {setSelected(value); setOpen(false);}, [value]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({block: 'nearest'});
  }, [open, active, id]);
  function choose(index: number) {
    setSelected(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === 'Tab') {setOpen(false); return;}
    if (key === 'Escape') {if (open) event.preventDefault(); setOpen(false); return;}
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      const start = open ? active : selectedIndex;
      setActive(key === 'Home' ? 0 : key === 'End' ? options.length - 1 :
        !open ? start : (start + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      setOpen(true);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) choose(active); else {setActive(selectedIndex); setOpen(true);}
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      search.current.text = (now - search.current.time < 700 ? search.current.text : '') + key.toLocaleLowerCase();
      search.current.time = now;
      const query = search.current.text;
      const repeated = [...query].every(char => char === query[0]);
      const prefix = repeated ? query[0] : query;
      const start = open ? active : selectedIndex;
      for (let offset = 1; offset <= options.length; offset++) {
        const index = (start + offset) % options.length;
        if (options[index].label.toLocaleLowerCase().startsWith(prefix)) {setActive(index); break;}
      }
      setOpen(true);
    }
  }
  return <div ref={root} className="category-dropdown" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <span id={`${id}-label`} className="filter-label">{label}</span>
    <input type="hidden" name="category" value={selected}/>
    <button ref={trigger} type="button" role="combobox" aria-labelledby={`${id}-label ${id}-value`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      className="category-trigger" onKeyDown={keyDown} onClick={() => {setActive(selectedIndex); setOpen(!open);}}>
      <span id={`${id}-value`}>{options[selectedIndex].label}</span><Icon name="down"/>
    </button>
    {open && <ul id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`} className="category-options">
      {options.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option"
        aria-selected={option.value === selected} className={active === index ? 'active' : ''}
        onPointerMove={event => {if (event.pointerType === 'mouse') setActive(index);}} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === selected && <Icon name="check"/>}
      </li>)}
    </ul>}
  </div>;
}
