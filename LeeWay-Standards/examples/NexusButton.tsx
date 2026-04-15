/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.NEXUS
TAG: UI.COMPONENT.NEXUS.BUTTON

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Nexus voice control button — the primary interface for voice commands
WHY = Provides users with a single clearly-identified entry point for voice interactions
WHO = Rapid Web Development
WHERE = examples/NexusButton.tsx
WHEN = 2026
HOW = React functional component with Tailwind CSS styling and accessibility support

AGENTS:
AZR
PHI3
GEMINI
QWEN
LLAMA
ECHO

LICENSE:
MIT
*/

import React, { useState, useCallback } from 'react';

interface NexusButtonProps {
  onActivate?: () => void;
  onDeactivate?: () => void;
  label?: string;
  disabled?: boolean;
}

/**
 * NexusButton — the primary voice command activation control.
 * Follows LEEWAY UI.COMPONENT standards.
 */
export function NexusButton({
  onActivate,
  onDeactivate,
  label = 'Activate Voice',
  disabled = false,
}: NexusButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = useCallback(() => {
    const nextState = !isActive;
    setIsActive(nextState);

    if (nextState) {
      onActivate?.();
    } else {
      onDeactivate?.();
    }
  }, [isActive, onActivate, onDeactivate]);

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={isActive ? 'Deactivate voice control' : label}
      disabled={disabled}
      onClick={handleClick}
      className={[
        'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        isActive
          ? 'bg-green-400 text-black shadow-neon focus:ring-green-400'
          : 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-400',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{isActive ? '🎙️' : '🔇'}</span>
        {isActive ? 'Voice Active' : label}
      </span>
    </button>
  );
}
