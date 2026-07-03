---
name: Civic Excellence System
colors:
  surface: '#f8f9fc'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e5'
  on-surface: '#191c1e'
  on-surface-variant: '#40484d'
  inverse-surface: '#2e3133'
  inverse-on-surface: '#eff1f3'
  outline: '#70787d'
  outline-variant: '#c0c8cd'
  surface-tint: '#236580'
  primary: '#00475e'
  on-primary: '#ffffff'
  primary-container: '#1a5f7a'
  on-primary-container: '#9bd7f7'
  inverse-primary: '#92cfee'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#ffa454'
  on-secondary-container: '#713b00'
  tertiary: '#5f3800'
  on-tertiary: '#ffffff'
  tertiary-container: '#7b4f16'
  on-tertiary-container: '#ffc484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0e8ff'
  primary-fixed-dim: '#92cfee'
  on-primary-fixed: '#001e2b'
  on-primary-fixed-variant: '#004d66'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#f7bb78'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663e04'
  background: '#f8f9fc'
  on-background: '#191c1e'
  surface-variant: '#e1e2e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style
The design system is engineered for civic engagement, prioritizing **trust, transparency, and accessibility**. It bridges the gap between local government and citizens through a "Corporate Modern" aesthetic that feels professional yet welcoming. 

The visual language avoids the coldness of traditional bureaucracy, opting instead for a balanced approach with generous whitespace and high-legibility components. The emotional response should be one of empowerment—making the user feel that their voice is heard and that city management is efficient and organized.

## Colors
The palette is rooted in a **Deep Teal** primary color to project authority and stability. The **Amber/Orange** accent is used sparingly to draw attention to actionable items and urgent notifications without inducing panic. 

A specialized **Status System** ensures immediate cognitive recognition of report progress:
- **Pending (Amber):** Signals "Awaiting Review" or "Needs Attention."
- **In Progress (Blue):** Signals active movement and work.
- **Resolved (Green):** Signals success and completion.
- **Urgency (Red):** Reserved strictly for high-priority safety hazards.

The background uses a subtle off-white (`#F8FAFB`) to reduce eye strain and provide a clean canvas for information-dense cards.

## Typography
This design system utilizes **Inter** for its exceptional legibility and neutral, systematic tone. The type scale is optimized for information hierarchy, ensuring that category names and status updates are immediately scannable. 

- **Weight Usage:** Use Bold (700) for screen titles, Semi-Bold (600) for card titles and section headers, and Regular (400) for all description text.
- **Hierarchy:** Labels (status tags) use a smaller font size but higher weight and all-caps to differentiate them from interactive body text.

## Layout & Spacing
The layout follows a **Fluid Grid** model designed primarily for mobile-first interactions. 
- **Margins:** A standard 16px lateral margin ensures content does not touch the edge of the device.
- **Vertical Rhythm:** Elements are grouped using a 4px-based scale. Use 16px (md) for spacing between standard components and 24px (lg) to separate distinct logical sections.
- **Touch Targets:** All interactive elements (buttons, category chips) must maintain a minimum height of 48px to ensure accessibility for all citizens.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh borders in favor of soft shadows that lift active content from the light gray background.

- **Level 1 (Cards):** Use a subtle blur (10px) with low opacity (5-8%) to create a soft "float" effect.
- **Level 2 (Buttons/Active State):** Slightly more pronounced shadow to indicate interactivity.
- **Scrims:** When modals or bottom sheets are active, use a 40% opacity black overlay to focus user attention.

## Shapes
The design system employs a **Rounded (0.5rem / 8px)** base shape for most elements, but cards specifically utilize a larger **16px (1rem)** radius to evoke a friendlier, more modern "app-like" feel.

- **Buttons:** Fully rounded (pill) or 8px.
- **Input Fields:** 8px radius for a structured, secure look.
- **Report Cards:** 16px radius to soften the information-heavy interface.

## Components
### Buttons
- **Primary:** Solid Deep Teal with white text.
- **Secondary:** Transparent with Deep Teal border (ghost style).
- **Urgent Action:** Solid Red for "Report Emergency."

### Category Icons
Icons should be enclosed in a circular container with a light tint of the primary color. Icons must be clear, monoline, or flat-filled:
- **Road:** Pothole or asphalt roller icon.
- **Light:** Street lamp icon.
- **Water:** Water drop or faucet icon.
- **Garbage:** Trash bin icon.
- **Drainage:** Grate or pipe icon.
- **Park:** Tree or bench icon.
- **Security:** Shield or badge icon.

### Cards
Report cards should include a category icon, a title (Semi-bold), a timestamp, and a prominent **Status Chip** in the top right corner. The status chip should have a light background of the status color (e.g., light green) with dark green text for maximum legibility.

### Input Fields
Large, accessible text areas for report descriptions. Include a "Photo Attachment" button as a primary secondary-action within the report flow.
