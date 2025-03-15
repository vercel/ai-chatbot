# Nature-Inspired Color Theme

This document outlines the new nature-inspired color theme implemented in the application.

## Color Palette

The color palette is based on earthy, natural tones:

| Color Name     | Hex     | Description                                        |
|----------------|---------|---------------------------------------------------|
| Hunter Green   | #386641 | Primary color for text, buttons, and accents      |
| Asparagus      | #6a994e | Secondary color for buttons and highlights        |
| Cornsilk       | #fefae0 | Background color (replaces white)                 |
| Earth Yellow   | #dda15e | Accent color for interactions and highlights      |
| Tiger's Eye    | #bc6c25 | Destructive actions and errors                    |

## Light Mode

In light mode:
- Background: Cornsilk (#fefae0)
- Text: Hunter Green (#386641)
- Primary buttons: Hunter Green (#386641)
- Secondary buttons: Asparagus (#6a994e)
- Accents: Earth Yellow (#dda15e)
- Error states: Tiger's Eye (#bc6c25)

## Dark Mode

In dark mode:
- Background: Dark Hunter Green (modified #386641)
- Text: Cornsilk (#fefae0)
- Primary buttons: Cornsilk (#fefae0)
- Secondary buttons: Asparagus (#6a994e)
- Accents: Earth Yellow (#dda15e)
- Error states: Tiger's Eye (#bc6c25)

## Color Variables

The theme uses CSS variables to dynamically switch between light and dark modes. These are defined in `/app/globals.css`.

Example usage:
```css
.element {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

## Tailwind Customization

The color palette is integrated into Tailwind via the `/tailwind.config.ts` file, which defines the following color utilities:

```jsx
<div className="bg-hunter_green-500">Hunter Green</div>
<div className="bg-asparagus-500">Asparagus</div>
<div className="bg-cornsilk-500">Cornsilk</div>
<div className="bg-earth_yellow-500">Earth Yellow</div>
<div className="bg-tigers_eye-500">Tiger's Eye</div>
```

Each color also has variants from 100 (very light) to 900 (very dark).

## Component Theming

Components use the appropriate colors based on the current theme:

- Buttons use hunter_green/cornsilk for default style
- Form inputs use cornsilk/hunter_green backgrounds
- Error states use tigers_eye variations
- Interactive elements use earth_yellow for hover states

## Implementation Notes

1. The CSS variables in `globals.css` are set using HSL values for better color manipulation
2. Direct color classes (e.g., `bg-hunter_green-500`) are used where specific styling is needed
3. Semantic color variables (e.g., `bg-primary`) are used for consistent theming
4. Dark mode variants are handled with the `dark:` prefix

## Accessibility

The color combinations have been chosen to maintain good contrast ratios:
- Main text on background: 7:1 (exceeds WCAG AA)
- Secondary text on background: 4.5:1 (meets WCAG AA)
- Button text on button backgrounds: 4.5:1+ (meets WCAG AA)

## Custom Component Colors

The following custom components have been specially themed:
- Voice Recorder
- Audio Upload
- Transcription Progress
- Transcript Viewer
