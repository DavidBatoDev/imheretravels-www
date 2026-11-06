"use client";

import { useEffect, useRef, useState } from "react";
import useListboxNav from "@/app/components/global/useListboxNav";

/**
 * Site-styled single-select dropdown (used by the Personalized Tour and Work
 * With Us forms). Looks like the forms' text inputs; options are real buttons
 * with listbox roles, with arrow-key / Home / End / Escape support.
 */
type Option = { value: string; label: string };

type DropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  onBlur?: () => void;
};

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select",
  id,
  invalid = false,
  describedBy,
  onBlur,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wasOpen = useRef(false);

  useListboxNav({ open, listRef, triggerRef, onClose: () => setOpen(false) });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Treat closing the menu as leaving the field (for validate-on-blur).
  useEffect(() => {
    if (wasOpen.current && !open) onBlur?.();
    wasOpen.current = open;
  }, [open, onBlur]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        className={`flex w-full items-center justify-between rounded-sm border-[1.5px] bg-white px-4 py-3 text-left font-body text-b2-mobile outline-none focus:border-midnight md:text-b2-desktop ${
          invalid ? "border-crimson-red" : open ? "border-midnight" : "border-grey/60"
        }`}
      >
        <span className={`truncate ${selected ? "text-midnight" : "text-grey"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-grey transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-sm border border-grey/60 bg-white py-1 shadow-medium"
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`block w-full px-4 py-2 text-left font-body text-b2-mobile outline-none hover:bg-light-grey focus-visible:bg-light-grey md:text-b2-desktop ${
                  o.value === value ? "bg-light-grey text-crimson-red" : "text-midnight"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
