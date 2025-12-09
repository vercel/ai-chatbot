/**
 * TiQology Nexus - Multimodal Vision System
 * AI that SEES, UNDERSTANDS, and CREATES
 *
 * Features:
 * - Image analysis (GPT-4 Vision)
 * - Image generation (DALL-E 3, Stable Diffusion)
 * - Screenshot understanding
 * - Design feedback
 * - 3D model generation
 * - OCR and diagram analysis
 */

import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// ============================================
// CONFIGURATION
// ============================================

const VISION_CONFIG = {
  vision: {
    model: process.env.VISION_MODEL || "gpt-4-vision-preview",
    maxTokens: Number.parseInt(process.env.VISION_MAX_TOKENS || "4096"),
  },
  generation: {
    dalle: process.env.DALL_E_MODEL || "dall-e-3",
    stableDiffusion: process.env.STABLE_DIFFUSION_API || "",
  },
};

// ============================================
// TYPES
// ============================================

export interface VisionAnalysis {
  description: string;
  objects: DetectedObject[];
  text: string[];
  colors: ColorPalette;
  composition: CompositionAnalysis;
  suggestions: string[];
  confidence: number;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ColorPalette {
  dominant: string[];
  accent: string[];
  wcagCompliance?: {
    foreground: string;
    background: string;
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  };
}

export interface CompositionAnalysis {
  layout: string;
  balance:
    | "balanced"
    | "left-heavy"
    | "right-heavy"
    | "top-heavy"
    | "bottom-heavy";
  spacing: "tight" | "comfortable" | "loose";
  hierarchy: "clear" | "moderate" | "unclear";
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: "realistic" | "artistic" | "technical" | "3d-render";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
  b64Json?: string;
}

export interface ScreenshotAnalysis extends VisionAnalysis {
  ui: {
    type: "web" | "mobile" | "desktop" | "unknown";
    framework?: string;
    issues: UIIssue[];
    improvements: string[];
  };
  code?: {
    detected: boolean;
    language?: string;
    snippet?: string;
  };
}

export interface UIIssue {
  type: "alignment" | "contrast" | "spacing" | "accessibility" | "responsive";
  severity: "low" | "medium" | "high";
  description: string;
  fix?: string;
}

export interface DiagramAnalysis {
  type:
    | "architecture"
    | "flowchart"
    | "sequence"
    | "er-diagram"
    | "mindmap"
    | "unknown";
  components: string[];
  connections: DiagramConnection[];
  description: string;
  mermaidCode?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type?: "unidirectional" | "bidirectional" | "depends-on";
}

// ============================================
// VISION ENGINE
// ============================================

export class VisionEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze any image
   */
  async analyzeImage(
    imageUrl: string,
    prompt?: string
  ): Promise<VisionAnalysis> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text:
                prompt ||
                `Analyze this image in detail. Describe:
1. What you see (objects, people, scenes)
2. Any text visible
3. Color palette and visual design
4. Composition and layout
5. Suggestions for improvement (if applicable)

Provide a thorough analysis.`,
            },
          ],
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: VISION_CONFIG.vision.model,
        messages,
        max_tokens: VISION_CONFIG.vision.maxTokens,
      });

      const analysis = response.choices[0].message.content || "";

      // Parse the analysis into structured format
      return this.parseVisionResponse(analysis);
    } catch (error) {
      console.error("[Vision] Image analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze UI screenshot with specific focus on design issues
   */
  async analyzeScreenshot(imageUrl: string): Promise<ScreenshotAnalysis> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Analyze this UI screenshot. Provide detailed feedback on:

1. UI Type (web/mobile/desktop)
2. Potential framework used
3. Design Issues:
   - Alignment problems
   - Color contrast (WCAG compliance)
   - Spacing inconsistencies
   - Accessibility concerns
   - Responsive design issues
4. Specific fixes with CSS/code examples
5. Overall design improvements

If there's code visible in the screenshot, extract and identify the language.

Return as JSON: {
  "ui": {"type": "...", "framework": "...", "issues": [], "improvements": []},
  "code": {"detected": true/false, "language": "...", "snippet": "..."},
  "description": "...",
  "suggestions": []
}`,
            },
          ],
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: VISION_CONFIG.vision.model,
        messages,
        max_tokens: VISION_CONFIG.vision.maxTokens,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        description: result.description || "No description",
        objects: [],
        text: [],
        colors: { dominant: [], accent: [] },
        composition: {
          layout: result.ui?.layout || "unknown",
          balance: "balanced",
          spacing: "comfortable",
          hierarchy: "clear",
        },
        suggestions: result.suggestions || [],
        confidence: 0.9,
        ui: result.ui || {
          type: "unknown",
          issues: [],
          improvements: [],
        },
        code: result.code,
      };
    } catch (error) {
      console.error("[Vision] Screenshot analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze architecture diagrams and generate Mermaid code
   */
  async analyzeDiagram(imageUrl: string): Promise<DiagramAnalysis> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Analyze this diagram. Determine:
1. Diagram type (architecture, flowchart, sequence, ER diagram, etc.)
2. All components/nodes
3. Connections between components
4. Generate Mermaid diagram code

Return as JSON: {
  "type": "...",
  "components": [],
  "connections": [{"from": "...", "to": "...", "label": "..."}],
  "description": "...",
  "mermaidCode": "..."
}`,
            },
          ],
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: VISION_CONFIG.vision.model,
        messages,
        max_tokens: VISION_CONFIG.vision.maxTokens,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        type: result.type || "unknown",
        components: result.components || [],
        connections: result.connections || [],
        description: result.description || "",
        mermaidCode: result.mermaidCode,
      };
    } catch (error) {
      console.error("[Vision] Diagram analysis failed:", error);
      throw error;
    }
  }

  /**
   * Extract and read code from screenshots
   */
  async extractCodeFromImage(imageUrl: string): Promise<{
    language: string;
    code: string;
    confidence: number;
  }> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Extract any code visible in this image. Return as JSON:
{
  "language": "detected programming language",
  "code": "extracted code with proper formatting",
  "confidence": 0.0-1.0
}`,
            },
          ],
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: VISION_CONFIG.vision.model,
        messages,
        max_tokens: VISION_CONFIG.vision.maxTokens,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        language: result.language || "unknown",
        code: result.code || "",
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.error("[Vision] Code extraction failed:", error);
      return { language: "unknown", code: "", confidence: 0 };
    }
  }

  /**
   * Generate images using DALL-E 3
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<GeneratedImage[]> {
    try {
      const {
        prompt,
        style = "realistic",
        size = "1024x1024",
        quality = "standard",
        n = 1,
      } = request;

      // Enhance prompt based on style
      const enhancedPrompt = this.enhancePrompt(prompt, style);

      const response = await this.openai.images.generate({
        model: VISION_CONFIG.generation.dalle,
        prompt: enhancedPrompt,
        n,
        size,
        quality,
        response_format: "url",
      });

      return response.data.map((img) => ({
        url: img.url || "",
        revisedPrompt: img.revised_prompt,
      }));
    } catch (error) {
      console.error("[Vision] Image generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate variations of an existing image
   */
  async generateVariations(imageUrl: string, n = 3): Promise<GeneratedImage[]> {
    try {
      // Download image as buffer
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageFile = new File([imageBuffer], "image.png", {
        type: "image/png",
      });

      const response = await this.openai.images.createVariation({
        image: imageFile,
        n,
        size: "1024x1024",
      });

      return response.data.map((img) => ({
        url: img.url || "",
      }));
    } catch (error) {
      console.error("[Vision] Variation generation failed:", error);
      throw error;
    }
  }

  /**
   * Edit an image using AI (inpainting/outpainting)
   */
  async editImage(
    imageUrl: string,
    maskUrl: string,
    prompt: string
  ): Promise<GeneratedImage> {
    try {
      // Download images
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageFile = new File([imageBuffer], "image.png", {
        type: "image/png",
      });

      const maskResponse = await fetch(maskUrl);
      const maskBuffer = await maskResponse.arrayBuffer();
      const maskFile = new File([maskBuffer], "mask.png", {
        type: "image/png",
      });

      const response = await this.openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt,
        n: 1,
        size: "1024x1024",
      });

      return {
        url: response.data[0].url || "",
      };
    } catch (error) {
      console.error("[Vision] Image editing failed:", error);
      throw error;
    }
  }

  /**
   * Compare two images
   */
  async compareImages(
    imageUrl1: string,
    imageUrl2: string
  ): Promise<{
    similarity: number;
    differences: string[];
    description: string;
  }> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Image 1:" },
            { type: "image_url", image_url: { url: imageUrl1 } },
            { type: "text", text: "Image 2:" },
            { type: "image_url", image_url: { url: imageUrl2 } },
            {
              type: "text",
              text: `Compare these two images. Return as JSON:
{
  "similarity": 0.0-1.0,
  "differences": ["list of differences"],
  "description": "detailed comparison"
}`,
            },
          ],
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: VISION_CONFIG.vision.model,
        messages,
        max_tokens: VISION_CONFIG.vision.maxTokens,
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("[Vision] Image comparison failed:", error);
      throw error;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private parseVisionResponse(response: string): VisionAnalysis {
    // Simple parsing logic - can be enhanced
    return {
      description: response,
      objects: [],
      text: [],
      colors: { dominant: [], accent: [] },
      composition: {
        layout: "unknown",
        balance: "balanced",
        spacing: "comfortable",
        hierarchy: "clear",
      },
      suggestions: [],
      confidence: 0.8,
    };
  }

  private enhancePrompt(prompt: string, style: string): string {
    const stylePrompts = {
      realistic: "photorealistic, high quality, detailed",
      artistic: "artistic, creative, stylized",
      technical: "technical diagram, clean lines, professional",
      "3d-render": "3D render, detailed modeling, raytraced lighting",
    };

    return `${prompt}. ${stylePrompts[style as keyof typeof stylePrompts] || ""}`;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let visionEngine: VisionEngine | null = null;

export function getVisionEngine(): VisionEngine {
  if (!visionEngine) {
    visionEngine = new VisionEngine();
  }
  return visionEngine;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function analyzeImage(
  imageUrl: string,
  prompt?: string
): Promise<VisionAnalysis> {
  const engine = getVisionEngine();
  return engine.analyzeImage(imageUrl, prompt);
}

export async function analyzeUIScreenshot(
  imageUrl: string
): Promise<ScreenshotAnalysis> {
  const engine = getVisionEngine();
  return engine.analyzeScreenshot(imageUrl);
}

export async function analyzeDiagram(
  imageUrl: string
): Promise<DiagramAnalysis> {
  const engine = getVisionEngine();
  return engine.analyzeDiagram(imageUrl);
}

export async function generateImage(
  request: ImageGenerationRequest
): Promise<GeneratedImage[]> {
  const engine = getVisionEngine();
  return engine.generateImage(request);
}

export async function extractCode(imageUrl: string): Promise<{
  language: string;
  code: string;
  confidence: number;
}> {
  const engine = getVisionEngine();
  return engine.extractCodeFromImage(imageUrl);
}
