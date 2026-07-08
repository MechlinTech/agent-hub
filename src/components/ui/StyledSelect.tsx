"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

const MENU_GAP_PX = 8;
const MENU_PREFERRED_MAX_PX = 240;
const MENU_OPTION_ESTIMATE_PX = 44;

export function StyledSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  function updateMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return false;
    const rect = trigger.getBoundingClientRect();
    const visible =
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth;
    if (!visible) return false;

    const contentHeight = Math.min(
      MENU_PREFERRED_MAX_PX,
      options.length * MENU_OPTION_ESTIMATE_PX + 12,
    );
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP_PX;
    const spaceAbove = rect.top - MENU_GAP_PX;
    const openUpward = spaceBelow < contentHeight && spaceAbove > spaceBelow;

    if (openUpward) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + MENU_GAP_PX,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MENU_PREFERRED_MAX_PX, spaceAbove),
      });
    } else {
      setMenuPosition({
        top: rect.bottom + MENU_GAP_PX,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MENU_PREFERRED_MAX_PX, spaceBelow),
      });
    }
    return true;
  }

  function syncMenuOrClose() {
    if (!updateMenuPosition()) {
      setOpen(false);
    }
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      setHoveredValue(null);
      return;
    }

    if (!updateMenuPosition()) {
      setOpen(false);
      return;
    }

    window.addEventListener("resize", syncMenuOrClose);
    window.addEventListener("scroll", syncMenuOrClose, true);
    return () => {
      window.removeEventListener("resize", syncMenuOrClose);
      window.removeEventListener("scroll", syncMenuOrClose, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && menuPosition && mounted ? (
      <ul
        ref={menuRef}
        id={listboxId}
        role="listbox"
        style={{
          top: menuPosition.top,
          bottom: menuPosition.bottom,
          left: menuPosition.left,
          width: menuPosition.width,
          maxHeight: menuPosition.maxHeight,
        }}
        className="glass-panel fixed z-[200] overflow-auto rounded-2xl py-1.5 ring-1 ring-brand-500/20"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const isHovered = hoveredValue === option.value;
          return (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHoveredValue(option.value)}
                onMouseLeave={() => setHoveredValue(null)}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                disabled={option.disabled}
                className={cn(
                  "select-option",
                  option.disabled && "cursor-not-allowed opacity-50",
                  isHovered && !option.disabled && "select-option-hover",
                  isSelected && "select-option-selected",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative", open && "z-10", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={ariaInvalid}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          "select-trigger",
          open && "select-trigger-open",
          !open && !disabled && "hover:border-slate-300 hover:bg-slate-50/90",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="truncate font-medium text-slate-900">
          {selected?.label ?? value}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180 text-brand-600",
          )}
          aria-hidden
        />
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
