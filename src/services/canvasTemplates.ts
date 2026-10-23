import type { CanvasCardTemplate } from '../types/canvas';

export function saveCardTemplate(
  templates: CanvasCardTemplate[],
  draft: CanvasCardTemplate,
): CanvasCardTemplate[] {
  const name = draft.name.trim();
  if (!name) throw new Error('Informe um nome para o modelo.');
  if (templates.some(template => template.id !== draft.id &&
    template.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
    throw new Error('Já existe um modelo com esse nome neste canvas.');
  }
  if (!Number.isFinite(draft.width) || draft.width < 140 ||
      !Number.isFinite(draft.height) || draft.height < 80) {
    throw new Error('O tamanho mínimo do modelo é 140 x 80.');
  }
  const saved = { ...draft, name };
  return templates.some(template => template.id === draft.id)
    ? templates.map(template => template.id === draft.id ? saved : template)
    : [...templates, saved];
}
