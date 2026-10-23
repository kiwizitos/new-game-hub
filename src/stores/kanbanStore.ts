import { create } from 'zustand';
import { KanbanData, KanbanCard, KanbanColumn } from '../types/kanban';
import { parseKanbanData } from '../services/fileValidation';

const defaultColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [],
    color: '#ef4444'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [],
    color: '#f59e0b'
  },
  {
    id: 'done',
    title: 'Done',
    cards: [],
    color: '#10b981'
  }
];

function validateColumnTitle(data: KanbanData, title: string, excludeId?: string): string {
  const name = title.trim();
  if (!name) throw new Error('Informe um nome para a coluna.');
  if (data.columns.some(column => column.id !== excludeId && column.title.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    throw new Error('Já existe uma coluna com esse nome.');
  }
  return name;
}

interface KanbanStore {
  data: KanbanData;
  
  // Actions
  setKanbanData: (data: KanbanData) => void;
  addColumn: (title: string) => void;
  renameColumn: (columnId: string, title: string) => void;
  reorderColumn: (columnId: string, targetIndex: number) => void;
  removeColumn: (columnId: string, destinationId?: string) => void;
  addCard: (columnId: string, card: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, targetColumnId: string) => void;
  loadKanbanData: () => Promise<void>;
  saveKanbanData: () => Promise<void>;
  exportKanbanData: () => Promise<string>;
  importKanbanData: (jsonData: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  data: { columns: defaultColumns },

  setKanbanData: (data) => set({ data }),

  addColumn: (title) => {
    const { data } = get();
    const name = validateColumnTitle(data, title);
    set({ data: { ...data, columns: [...data.columns, {
      id: `column-${crypto.randomUUID()}`, title: name, cards: []
    }] } });
  },

  renameColumn: (columnId, title) => {
    const { data } = get();
    if (!data.columns.some(column => column.id === columnId)) {
      throw new Error('Coluna não encontrada.');
    }
    const name = validateColumnTitle(data, title, columnId);
    set({ data: { ...data, columns: data.columns.map(column =>
      column.id === columnId ? { ...column, title: name } : column
    ) } });
  },

  reorderColumn: (columnId, targetIndex) => {
    const { data } = get();
    const index = data.columns.findIndex(column => column.id === columnId);
    if (index < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= data.columns.length) {
      throw new Error('Posição de coluna inválida.');
    }
    const columns = [...data.columns];
    columns.splice(targetIndex, 0, columns.splice(index, 1)[0]);
    set({ data: { ...data, columns } });
  },

  removeColumn: (columnId, destinationId) => {
    const { data } = get();
    const source = data.columns.find(column => column.id === columnId);
    if (!source) throw new Error('Coluna não encontrada.');
    if (data.columns.length <= 1) throw new Error('A última coluna não pode ser removida.');
    const destination = data.columns.find(column => column.id === destinationId && column.id !== columnId);
    if ((source.cards.length > 0 || destinationId !== undefined) && !destination) {
      throw new Error('Escolha outra coluna para receber os cards.');
    }
    set({ data: { ...data, columns: data.columns
      .filter(column => column.id !== columnId)
      .map(column => column.id === destination?.id
        ? { ...column, cards: [...column.cards, ...source.cards] } : column)
    } });
  },

  addCard: (columnId, cardData) => {
    const { data } = get();
    const newCard: KanbanCard = {
      ...cardData,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedColumns = data.columns.map(column => 
      column.id === columnId 
        ? { ...column, cards: [...column.cards, newCard] }
        : column
    );

    set({ data: { columns: updatedColumns } });
  },

  updateCard: (cardId, updates) => {
    const { data } = get();
    const updatedColumns = data.columns.map(column => ({
      ...column,
      cards: column.cards.map(card =>
        card.id === cardId 
          ? { ...card, ...updates, updatedAt: new Date() }
          : card
      )
    }));

    set({ data: { columns: updatedColumns } });
    
    // Auto-save
    get().saveKanbanData();
  },

  deleteCard: (cardId) => {
    const { data } = get();
    const updatedColumns = data.columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => card.id !== cardId)
    }));

    set({ data: { columns: updatedColumns } });
    
    // Auto-save
    get().saveKanbanData();
  },

  moveCard: (cardId, targetColumnId) => {
    const { data } = get();
    const source = data.columns.find(column => column.cards.some(card => card.id === cardId));
    if (!source || source.id === targetColumnId || !data.columns.some(column => column.id === targetColumnId)) return;
    let cardToMove: KanbanCard | null = null;
    
    // Find and remove card from current column
    const columnsWithoutCard = data.columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => {
        if (card.id === cardId) {
          cardToMove = card;
          return false;
        }
        return true;
      })
    }));

    // Add card to target column
    if (cardToMove) {
      const updatedColumns = columnsWithoutCard.map(column =>
        column.id === targetColumnId
          ? { ...column, cards: [...column.cards, { ...(cardToMove as KanbanCard), updatedAt: new Date() }] }
          : column
      );

      set({ data: { columns: updatedColumns } });
      
      // Auto-save
      get().saveKanbanData();
    }
  },

  loadKanbanData: async () => {
    try {
      // Use localStorage for now (simpler and always works)
      const savedData = localStorage.getItem('kanban-data');
      if (savedData) {
        set({ data: parseKanbanData(JSON.parse(savedData)) });
        console.log('Kanban data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading kanban data:', error);
    }
  },

  saveKanbanData: async () => {
    try {
      const { data } = get();
      const jsonData = JSON.stringify(data, null, 2);
      
      // Save to localStorage
      localStorage.setItem('kanban-data', jsonData);
      
      console.log('Kanban data saved successfully');
    } catch (error) {
      console.error('Error saving kanban data:', error);
    }
  },

  exportKanbanData: async () => {
    const { data } = get();
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  },

  importKanbanData: async (jsonData: string) => {
    try {
      const parsedData = parseKanbanData(JSON.parse(jsonData));
      set({ data: parsedData });
      await get().saveKanbanData();
      
      console.log('Kanban data imported successfully');
    } catch (error) {
      console.error('Error importing kanban data:', error);
      throw error;
    }
  },
}));
