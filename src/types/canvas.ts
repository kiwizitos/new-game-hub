export interface CanvasNodeData {
  content: string;
  [key: string]: unknown;
}

export interface CanvasCardTemplate {
  id: string;
  name: string;
  content: string;
  width: number;
  height: number;
}
