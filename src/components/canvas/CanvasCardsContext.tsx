import { createContext, useContext } from 'react';

interface CanvasCardsActions {
  openCard: (id: string) => void;
}

export const CanvasCardsContext = createContext<CanvasCardsActions | null>(null);

export function useCanvasCards() {
  const context = useContext(CanvasCardsContext);
  if (!context) throw new Error('Canvas card actions are unavailable');
  return context;
}
