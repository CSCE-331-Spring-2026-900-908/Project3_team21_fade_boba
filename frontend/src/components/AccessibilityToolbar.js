import React from 'react';
import {
  CONTRAST_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from '../utils/accessibility';

export default function AccessibilityToolbar({
  settings,
  onContrastChange,
  onTextSizeChange,
  compact = false,
}) {
  return (
    <section
      className="card accessibility-toolbar"
      aria-label="Accessibility settings"
      style={compact ? compactStyle : undefined}
    >
      <div style={headerRowStyle}>
        <div>
          <h2 style={titleStyle}>Accessibility</h2>
          <p style={subtitleStyle}>
            Adjust contrast and text size for easier viewing and keyboard use.
          </p>
        </div>
      </div>

      <div style={groupsWrapStyle}>
        <div style={groupStyle}>
          <span style={groupLabelStyle}>Contrast</span>
          <div style={buttonRowStyle} role="group" aria-label="Contrast mode">
            {CONTRAST_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="accessibility-toolbar__button"
                aria-pressed={settings.contrast === option.value}
                onClick={() => onContrastChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={groupStyle}>
          <span style={groupLabelStyle}>Text size</span>
          <div style={buttonRowStyle} role="group" aria-label="Text size">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="accessibility-toolbar__button"
                aria-pressed={settings.textSize === option.value}
                onClick={() => onTextSizeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const compactStyle = {
  padding: '16px',
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
  marginBottom: '14px',
};

const titleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  marginBottom: '4px',
};

const subtitleStyle = {
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
};

const groupsWrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
};

const groupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '260px',
  flex: 1,
};

const groupLabelStyle = {
  fontWeight: 700,
  color: 'var(--text)',
};

const buttonRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};