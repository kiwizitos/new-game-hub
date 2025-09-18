export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

export interface KanbanData {
  columns: KanbanColumn[];
}
