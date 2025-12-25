
export enum VisualType {
  FLOWCHART = 'FLOWCHART',
  MINDMAP = 'MINDMAP',
  CHART = 'CHART',
  ILLUSTRATION = 'ILLUSTRATION',
  AUTO = 'AUTO'
}

export interface GenerationResult {
  type: VisualType;
  content: string; // Mermaid code, JSON string for charts, or base64 for images
  description?: string;
}

export interface ChartData {
  name: string;
  value: number;
  category?: string;
}
