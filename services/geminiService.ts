
import { GoogleGenAI, Type } from "@google/genai";
import { VisualType, GenerationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Summarizes text or URL content into a structured format optimized for visualization.
 */
export const summarizeContent = async (input: string, targetType: VisualType): Promise<string> => {
  const isUrl = /^(http|https):\/\/[^ "]+$/.test(input.trim());
  const model = "gemini-3-flash-preview";
  
  const prompt = isUrl 
    ? `Analyze and summarize the content of this URL: ${input.trim()}. 
       Extract the core logic, key stages, or main relationships. 
       Format the result as a concise structured outline optimized for a ${targetType} visualization. 
       Use natural Chinese language.`
    : `Summarize the following text into its essential logical components for a ${targetType} visualization. 
       Focus on key points, hierarchies, and processes. 
       Input text: "${input}"`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      tools: isUrl ? [{ googleSearch: {} }] : undefined,
    }
  });

  return response.text || input;
};

export const generateVisual = async (
  summarizedText: string,
  type: VisualType
): Promise<GenerationResult> => {
  if (type === VisualType.ILLUSTRATION) {
    return generateAIImage(summarizedText);
  }

  return generateDiagramCode(summarizedText, type);
};

async function generateDiagramCode(
  text: string,
  type: VisualType
): Promise<GenerationResult> {
  const model = "gemini-3-pro-preview";
  
  const typeInstruction = {
    [VisualType.FLOWCHART]: "Generate a valid Mermaid.js flowchart (graph TD or graph LR).",
    [VisualType.MINDMAP]: "Generate a valid Mermaid.js mindmap.",
    [VisualType.CHART]: "Generate a valid Mermaid.js pie chart or bar chart.",
    [VisualType.AUTO]: "Choose the most appropriate Mermaid.js diagram type (flowchart, sequence, mindmap, timeline, or pie chart)."
  }[type] || "Generate a Mermaid flowchart.";

  const prompt = `
    Task: Convert the provided summary into a ${typeInstruction}.
    
    Style: Professional Hand-Drawn Whiteboard Sketch. 
    Labels: Concise Chinese text.
    
    Summary to visualize:
    "${text}"

    Rules:
    1. Output ONLY raw Mermaid code.
    2. No markdown fences.
    3. Ensure syntax is 100% valid.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.3,
    }
  });

  const content = (response.text || "").replace(/```mermaid\n?|```/g, "").trim();

  let detectedType = type;
  if (type === VisualType.AUTO) {
    if (content.startsWith("mindmap")) detectedType = VisualType.MINDMAP;
    else if (content.startsWith("pie")) detectedType = VisualType.CHART;
    else detectedType = VisualType.FLOWCHART;
  }

  return {
    type: detectedType,
    content,
    description: "AI 逻辑提炼图"
  };
}

async function generateAIImage(text: string): Promise<GenerationResult> {
  // CRITICAL OPTIMIZATION: To prevent garbled text (乱码), we instruct the model 
  // to use minimalist typography, bold strokes, and high-contrast characters.
  const imagePrompt = `
    A professional corporate infographic illustration with a symmetrical layout. 
    In the very center, a large, glowing conceptual icon (like a shield or a crystalline core) serves as the focal point, featuring intricate circuit patterns and soft 3D shading. 
    On the left and right sides, multiple mini-scenes and conceptual 2.5D icons are organized neatly, representing different analytical perspectives. 
    The style is clean vector art with soft gradients and a pastel professional color palette (teal, amber, and light grey). 
    
    CRITICAL TYPOGRAPHY REQUIREMENT:
    The image must contain CLEAR, LEGIBLE SIMPLIFIED CHINESE CHARACTERS based on this text: "${text.substring(0, 100)}".
    - Use standard, clean "SimHei" (Bold Sans-Serif) font style for the Chinese text.
    - Characters must have thick, well-defined strokes to prevent blurring or artifacts.
    - Each icon should be accompanied by a 2-4 word Chinese label.
    - Ensure zero "hallucinated" or "jumbled" strokes; the text must be accurate and readable.
    - High-contrast color between text and background (e.g., dark grey text on white/pastel background).
    
    The composition includes technical elements like magnifying glasses, gears, progress bars, and floating data visualization symbols. 
    Set against a clean, minimalist white background. 
    High-end business aesthetic, crisp lines, 4k resolution, flat design with depth.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: imagePrompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9" 
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        type: VisualType.ILLUSTRATION,
        content: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        description: "深度优化版 AI 高端信息图"
      };
    }
  }

  throw new Error("Failed to generate image.");
}
