import { create } from 'zustand';
import { KanbanData, KanbanCard, KanbanColumn } from '../types/kanban';

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

interface KanbanStore {
  data: KanbanData;
  
  // Actions
  setKanbanData: (data: KanbanData) => void;
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
        const parsedData = JSON.parse(savedData);
        
        // Convert date strings back to Date objects if they exist
        const dataWithDates = {
          ...parsedData,
          columns: parsedData.columns.map((column: any) => ({
            ...column,
            cards: column.cards.map((card: any) => ({
              ...card,
              createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
              updatedAt: card.updatedAt ? new Date(card.updatedAt) : new Date()
            }))
          }))
        };
        
        set({ data: dataWithDates });
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
      const parsedData = JSON.parse(jsonData);
      
      // Validate data structure
      if (!parsedData.columns || !Array.isArray(parsedData.columns)) {
        throw new Error('Invalid data format: missing columns array');
      }
      
      // Convert date strings back to Date objects if they exist
      const dataWithDates = {
        columns: parsedData.columns.map((column: any) => ({
          ...column,
          cards: column.cards.map((card: any) => ({
            ...card,
            createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
            updatedAt: card.updatedAt ? new Date(card.updatedAt) : new Date()
          }))
        }))
      };
      
      set({ data: dataWithDates });
      await get().saveKanbanData();
      
      console.log('Kanban data imported successfully');
    } catch (error) {
      console.error('Error importing kanban data:', error);
      throw error;
    }
  },
}));
