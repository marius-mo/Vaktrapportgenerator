# Vaktrapport Design System
## Visual Design Specifications

---

## Color Palette

### Primary Colors
```css
--color-primary-50: #E3F2FD;
--color-primary-100: #BBDEFB;
--color-primary-200: #90CAF9;
--color-primary-300: #64B5F6;
--color-primary-400: #42A5F5;
--color-primary-500: #1E88E5;  /* Main Primary */
--color-primary-600: #1976D2;
--color-primary-700: #1565C0;
--color-primary-800: #0D47A1;
--color-primary-900: #0A2540;  /* Dark Primary */
```

### Semantic Colors
```css
/* Success (Serviceable) */
--color-success-50: #E8F5E9;
--color-success-500: #4CAF50;
--color-success-700: #2E7D32;

/* Warning (Attention) */
--color-warning-50: #FFF8E1;
--color-warning-500: #FFB300;
--color-warning-700: #F57C00;

/* Error (Unserviceable) */
--color-error-50: #FFEBEE;
--color-error-500: #E53935;
--color-error-700: #C62828;

/* Info */
--color-info-50: #E1F5FE;
--color-info-500: #03A9F4;
--color-info-700: #0277BD;
```

### Neutral Colors
```css
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;
--color-gray-900: #212121;
```

### Background Colors
```css
--bg-primary: #FFFFFF;
--bg-secondary: #F5F7FA;
--bg-tertiary: #E8ECF1;
--bg-overlay: rgba(0, 0, 0, 0.5);
```

### Text Colors
```css
--text-primary: #1A1A1A;
--text-secondary: #616161;
--text-tertiary: #9E9E9E;
--text-inverse: #FFFFFF;
--text-disabled: #BDBDBD;
```

---

## Typography

### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                'Roboto', 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 
             'Source Code Pro', monospace;
```

### Font Sizes (Fluid Typography)
```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);    /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);      /* 14-16px */
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);    /* 16-18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);       /* 18-24px */
--text-xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);             /* 24-32px */
--text-2xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem);   /* 30-40px */
--text-3xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);       /* 36-48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## Spacing System

### Base Unit: 4px
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## Shadows & Elevation

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;
```

---

## Component Specifications

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
  color: var(--text-inverse);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--bg-primary);
  color: var(--color-primary-700);
  border: 2px solid var(--color-primary-300);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  background: var(--bg-primary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### Cards

```css
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.badge-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.badge-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
}

.badge-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}
```

---

## Animation Specifications

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Example Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Usage
```css
@media (min-width: 768px) {
  .container {
    max-width: 1200px;
    padding: var(--space-12);
  }
}
```

---

## Dark Mode Colors

### Background
```css
--dark-bg-primary: #0F1419;
--dark-bg-secondary: #1A1F2E;
--dark-bg-tertiary: #252B3A;
```

### Text
```css
--dark-text-primary: #E5E7EB;
--dark-text-secondary: #9CA3AF;
--dark-text-tertiary: #6B7280;
```

### Borders
```css
--dark-border: rgba(255, 255, 255, 0.1);
```

---

## Accessibility Standards

### Focus Indicators
```css
:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Minimum Touch Targets
- Buttons: 44x44px minimum
- Links: 44x44px minimum
- Form inputs: 44px height minimum

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

---

## Icon System

### Icon Size Scale
```css
--icon-xs: 1rem;    /* 16px */
--icon-sm: 1.25rem; /* 20px */
--icon-md: 1.5rem;  /* 24px */
--icon-lg: 2rem;    /* 32px */
--icon-xl: 2.5rem;  /* 40px */
```

### Recommended Icon Library
- Heroicons (outline & solid variants)
- Feather Icons
- Custom SVG icons for brand-specific elements

---

## Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## Grid System

### Container
```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

### Grid Columns
```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
```

---

*This design system should be implemented as CSS custom properties (variables) for easy theming and maintenance.*
