# NexvorDEV — Master Design System

## Product
A Persian-first website for game-server services across Minecraft Java, Minecraft Bedrock, and Counter-Strike 1.6.

## Visual direction
Dark futuristic developer studio with a blue/cyan gradient identity. Use subtle animated code streams in the hero background, glowing blue ambient light, a technical terminal panel, crisp borders, and restrained motion. The visual mood should feel like a modern game-server development studio, not an esports team template.

## Color tokens
- Background: #070B14
- Surface: #0C1422
- Raised surface: #101D31
- Primary text: #EDF5FF
- Muted text: #91A4BD
- Primary accent: #42B8FF
- Cyan accent: #70E5FF
- Violet accent: #7777FF
- Borders: rgba(119, 177, 255, 0.15)

## Typography
Persian-first system stack: Tahoma, Arial, sans-serif. Latin technical labels use Arial or monospace. Headlines are bold and compact; body copy uses comfortable line-height.

## Page structure
1. Hero with animated code-rain background and terminal-style visual.
2. Supported platforms: Minecraft Java, Minecraft Bedrock, Counter-Strike 1.6.
3. Services: custom plugin development, server setup, installation/configuration, optimization.
4. Pricing: each platform has the same confirmed range of 65,000 to 2,000,000 toman; final quote depends on order details.
5. How we work: request, review/quote, execution/review, delivery.
6. Contact: Telegram link https://t.me/TheROMZDEV.
7. Footer with section navigation.

## Layout
- RTL document direction.
- Centered content container, max width 1160px.
- Desktop hero uses two columns; mobile stacks copy before terminal.
- Platform and pricing cards use three columns on desktop and one on mobile.
- Services use four cards on desktop and two on mobile.
- Sections use consistent vertical rhythm and clear headings.

## Components
- Header: sticky, translucent dark surface, compact navigation.
- Primary action: blue-to-cyan gradient with dark text.
- Secondary action: transparent outlined button.
- Cards: deep blue surfaces, thin blue borders, restrained hover lift.
- Hero terminal: code-style panel with status and syntax colors.
- Background decoration: animated vertical code streams and soft blue/violet glow.

## UX and accessibility
- Semantic landmarks and heading hierarchy.
- Explicit labels for icon-only controls.
- Visible keyboard focus states.
- Respect prefers-reduced-motion.
- Keep touch targets comfortable on mobile.
- Ensure responsive text wrapping and no horizontal overflow.
- Avoid fake metrics, testimonials, client logos, and unsupported claims.

## Content rules
- Clear Persian copy; English only for short technical labels.
- Confirmed price range applies equally to all three platforms and all listed services: 65,000–2,000,000 toman.
- Do not invent individual fixed prices, uptime guarantees, client counts, or case studies.
- Contact CTA points to the known Telegram channel.
- Keep public pages static; no API, database, forms, or admin panel unless there is a real requirement.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS 4, Lucide React.
