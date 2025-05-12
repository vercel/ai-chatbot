# LostMind AI Brand Guidelines

## Color Palette

### Primary Colors
- **Primary Blue**: `#4F46E5` (rgb(79, 70, 229))
  - Usage: Main brand color, primary buttons, links
  - Hex: #4F46E5
  - RGB: 79, 70, 229
  - HSL: 243°, 75%, 59%

- **Secondary Purple**: `#8B5CF6` (rgb(139, 92, 246))
  - Usage: Secondary elements, gradients, accents
  - Hex: #8B5CF6
  - RGB: 139, 92, 246
  - HSL: 258°, 92%, 66%

- **Accent Green**: `#10B981` (rgb(16, 185, 129))
  - Usage: Success states, positive feedback
  - Hex: #10B981
  - RGB: 16, 185, 129
  - HSL: 160°, 91%, 39%

### Gradient Combinations
```css
/* Primary Gradient */
background: linear-gradient(45deg, #4F46E5, #8B5CF6);

/* Subtle Background Gradient */
background: linear-gradient(to right, rgba(79, 70, 229, 0.05), rgba(139, 92, 246, 0.05));

/* Button Hover Gradient */
background: linear-gradient(45deg, #3730B3, #6D28D9);
```

## Typography

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Heading Styles
```css
/* H1 - Hero Headlines */
.h1 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* H2 - Section Headers */
.h2 {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* H3 - Subsection Headers */
.h3 {
  font-size: clamp(18px, 3vw, 24px);
  font-weight: 600;
  line-height: 1.3;
}
```

### Body Text
```css
/* Primary Body Text */
.body {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}

/* Secondary Body Text */
.body-secondary {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}
```

## Logo Usage

### Primary Logo
- Use the animated neural network logo as the primary identifier
- Minimum size: 32x32 pixels
- Recommended sizes: 48x48 (mobile), 56x56 (desktop)
- Allow clear space equal to logo height on all sides

### Logo Variations
1. **Full Logo**: With "LostMind AI" text
2. **Icon Only**: Just the neural network symbol
3. **Horizontal**: Logo and text side-by-side
4. **Stacked**: Logo above text

### Theme Variations
```tsx
// Dark Theme
<LostMindLogo theme="dark" />

// Light Theme  
<LostMindLogo theme="light" />

// Gradient Theme (Recommended)
<LostMindLogo theme="gradient" />
```

## Component Styling

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(45deg, #4F46E5, #8B5CF6);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #4F46E5;
  border: 1px solid #4F46E5;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(79, 70, 229, 0.1);
}
```

### Cards
```css
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(79, 70, 229, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: rgba(79, 70, 229, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-gradient {
  background: linear-gradient(135deg, #fdfcfd 0%, #f8f9ff 100%);
}
```

### Navigation
```css
.nav-link {
  color: #475569;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #4F46E5;
  background: rgba(79, 70, 229, 0.1);
}

.nav-link.active {
  color: #4F46E5;
  background: rgba(79, 70, 229, 0.15);
  font-weight: 500;
}
```

## Animation Guidelines

### Logo Animation
- Neural network pulses: 0.5s ease-in-out
- Connection activations: 0.8-2s random intervals
- Node movements: Smooth, organic motion
- Maximum animation duration: 3s loops

### UI Transitions
```css
/* Standard Hover Transition */
transition: all 0.2s ease;

/* Smooth Page Transitions */
transition: opacity 0.3s ease, transform 0.3s ease;

/* Loading States */
@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}
```

## Voice and Tone

### Brand Personality
- **Intelligent**: Convey expertise without condescension
- **Approachable**: Friendly and conversational
- **Innovation-Focused**: Forward-thinking and cutting-edge
- **Neural/Tech**: Embrace the neural network theme

### Writing Style
- Use active voice
- Keep sentences clear and concise
- Avoid excessive jargon
- Include subtle tech references when appropriate

### Example Phrases
- "Unleash your mind's potential"
- "Neural-powered intelligence"
- "Thinking beyond boundaries"
- "Your AI thought partner"

## Dark Mode Adaptation

### Color Variables
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --brand-blue: #4F46E5;
  --brand-purple: #8B5CF6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --brand-blue: #6366f1;
    --brand-purple: #a78bfa;
  }
}
```

## Responsive Guidelines

### Breakpoints
```css
/* Mobile First Approach */
/* Small devices (phones) */
@media (max-width: 640px) { }

/* Medium devices (tablets) */
@media (max-width: 768px) { }

/* Large devices (desktops) */
@media (max-width: 1024px) { }

/* Extra large devices */
@media (max-width: 1280px) { }
```

### Responsive Typography
```css
font-size: clamp(minimum, preferred, maximum);
```

## Usage Examples

### Chat Interface
```tsx
// Message from AI
<div className="ai-message">
  <div className="message-badge">LostMind Quantum</div>
  <div className="message-content">
    {/* AI response content */}
  </div>
</div>

// User message
<div className="user-message">
  <div className="message-content">
    {/* User input */}
  </div>
</div>
```

### Status Indicators
```tsx
// Model Active State
<Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500">
  <Sparkles className="h-3 w-3 mr-1" />
  LostMind Quantum Active
</Badge>

// Loading State
<Badge variant="secondary" className="animate-pulse">
  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
  Processing...
</Badge>
```

## Asset Management

### Icon Usage
- Use Lucide React for UI icons
- Neural network icons for AI-specific features
- Consistent icon sizing: 16px (inline), 20px (buttons), 24px (headers)

### Image Guidelines
- Optimize all images for web
- Use WebP format when possible
- Provide 2x versions for retina displays
- Maximum image width: 1200px

---

**Version**: 1.0.0  
**Last Updated**: May 12, 2025  
**Maintained by**: LostMind AI Team
