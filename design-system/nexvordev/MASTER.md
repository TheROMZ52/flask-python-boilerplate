# NexvorDEV — Master Design System

## Product
A Persian-first service website for game-server engineering, custom plugin development, server setup, and performance optimization.

## Visual direction
Dark technical editorial. Premium engineering studio rather than a generic gaming/esports template. Use generous whitespace, restrained motion, crisp borders, and small technical labels.

## Color tokens
- Background: #090B10
- Surface: #10141D
- Raised surface: #141A25
- Primary text: #F1F4FA
- Muted text: #929BAD
- Accent: #B8F36B (lime)
- Secondary accent: #9D8CFF (violet)
- Borders: rgba(179, 194, 219, 0.12)

## Typography
Persian-first system stack: Tahoma, Arial, sans-serif. Latin technical labels use Arial. Headlines are bold and compact; body copy uses comfortable line-height.

## Layout
- RTL document direction.
- Centered content container, max width 1160px.
- Desktop hero uses two columns; mobile stacks copy before visual.
- Services use four cards on desktop, two on tablet, one on mobile.
- Sections use consistent vertical rhythm and clear headings.

## Components
- Header: sticky, translucent dark surface, compact navigation.
- Primary action: lime fill with dark text.
- Secondary action: quiet outlined button.
- Cards: subtle surface gradient, thin border, restrained hover lift.
- Technical decoration: abstract network/orbit motif; avoid stock gaming imagery.

## UX and accessibility
- Semantic landmarks and heading hierarchy.
- Explicit labels for icon-only controls.
- Visible focus states should be added during final polish.
- Respect prefers-reduced-motion.
- Keep touch targets comfortable on mobile.
- Avoid fake metrics, testimonials, client logos, and unsupported claims.

## Content rules
- Clear Persian copy; English only for short technical labels.
- Do not invent prices, uptime guarantees, client counts, or case studies.
- Contact CTA currently points to the known Telegram channel.
- Keep public pages static until a real need for forms, storage, or an admin panel exists.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS 4, Lucide React.
