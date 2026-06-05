# Locato UI/UX Design System Guide

This document defines the visual design system and interface guidelines for **Locato**, a modern, high-efficiency geospatial mapping and coordinate lookup utility. 

It covers color tokens, typography scales, card layouts, and UI transitions to ensure a cohesive, professional, and accessible user experience across desktop and mobile devices.

---

## 1. Design Philosophy

Locato is built on three core pillars:
*   **Precision**: Coordinates and maps are presented clearly, with micro-copy and clean alignments to prevent input errors.
*   **Speed**: One-click actions, keyboard support, and lightweight client-side components to minimize load times.
*   **Aesthetics**: A premium glassmorphism interface with custom dark and light themes that adapts seamlessly to system preferences.

---

## 2. Brand Color Palette

Locato's standard color palette uses a dual-core branding strategy of **Brand Blue** and **Brand Teal**, supported by semantic and neutral shades designed to satisfy WCAG AA contrast standards.

### Core Colors

| Color Name | HEX Code | RGB Code | Digital Purpose |
| :--- | :--- | :--- | :--- |
| **Brand Blue** | `#0095B8` | `0, 149, 184` | Primary branding color. Used for key actions, brand logo icons, focus outlines, and coordinates emphasis. |
| **Brand Teal** | `#00A29D` | `0, 162, 157` | Secondary branding color. Used for success states, secondary elements, and toast icons. |

### Semantic Accent Colors

| Color Name | HEX Code | Digital Purpose |
| :--- | :--- | :--- |
| **Navy (Deep Trust)** | `#003366` | Sophisticated accents, high-contrast text on light cards. |
| **Orange (Alert Spark)** | `#FF8200` | Attention grabbers, highlights, warning tags. |
| **Eco Jade (Safety)** | `#007B5F` | Clean status indications, green areas. |

### Neutral Color Tokens

```css
:root {
  /* Light Mode Neutrals */
  --neutral-100: #FFFFFF; /* Pure White Card Background */
  --neutral-200: #F4F7F6; /* Soft green-gray App Background */
  --neutral-300: #E2E8F0; /* Divider and Border lines */
  --neutral-400: #94A3B8; /* Disabled states, icons, placeholder text */
  --neutral-700: #475569; /* Secondary labels, descriptions */
  --neutral-900: #1E293B; /* Primary headings, title text */

  /* Dark Mode Neutrals */
  --dark-bg-pure: #090F1C;   /* Deep Space Dark Background */
  --dark-bg-card: #121B2E;   /* Card panel background */
  --dark-border:  #1E2E4A;   /* Sleek dark border line */
  --dark-text-main: #F8FAFC; /* Primary dark text */
  --dark-text-sub:  #94A3B8; /* Muted dark text */
}
```

---

## 3. Typography & Hierarchy

To maintain legibility in maps and analytical views, Locato uses modern sans-serif typography.

*   **Primary Font Family**: `Inter`, `Outfit`, sans-serif
*   **Monospace Font Family (for Coordinates)**: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace (ensures numerals align vertically and are easy to read).

### Typography Scale

| Hierarchy | CSS Class / Tag | Size (REM / PX) | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Display Header** | `h1` | `2.0rem` / `32px` | 700 (Bold) | 1.3 |
| **Panel Header** | `h2` | `1.5rem` / `24px` | 600 (Semi-Bold) | 1.4 |
| **Sub Section Title** | `h3` | `1.25rem` / `20px` | 600 (Semi-Bold) | 1.4 |
| **Primary Body** | `p` | `1.0rem` / `16px` | 400 (Regular) | 1.6 |
| **Helper Text / Date** | `.body-small` | `0.875rem` / `14px` | 400 (Regular) | 1.5 |
| **Labels / Captions** | `.caption` | `0.75rem` / `12px` | 500 (Medium) | 1.4 |

---

## 4. UI Components & Motion

### Buttons (Primary Copy)

Interactive buttons are styled with standard border-radii, slight elevation shadows, and hover micro-animations.

```css
.fb-btn-primary {
  background: linear-gradient(135deg, #0095B8 0%, #00A29D 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 149, 184, 0.25);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.fb-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 149, 184, 0.4);
  background: linear-gradient(135deg, #00a5cc 0%, #00b3ad 100%);
}

.fb-btn-primary:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(0, 149, 184, 0.2);
}
```

### Cards (Glassmorphism Panels)

Dashboard overlays are styled with translucent card backdrops to ensure maps are visible underneath:

```css
.fb-card-glass {
  background: rgba(18, 27, 46, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 149, 184, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
```

---

## 5. Mobile & Responsive Layouts

For smaller viewport screens (under 768px):
*   **Header Compactness**: Brand text title scales down or hides completely to reserve max-width for the address search input.
*   **Touch Targets**: Input heights increase to `40px` - `44px` and font sizes set to `16px` to prevent iOS Safari auto-zooming.
*   **Collapsible Panel**: The coordinate detail card switches to a bottom drawer overlay, featuring a collapse chevron button which slides the panel down to a compact `56px` header bar.
