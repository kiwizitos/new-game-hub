import { KanbanData } from '../types/kanban';
import { CanvasData } from './FileService';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'markdown' | 'kanban' | 'canvas';
  content: string | KanbanData | CanvasData;
  category: string;
  tags: string[];
}

class TemplateService {
  private static instance: TemplateService;

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  // Templates predefinidos
  getDefaultTemplates(): Template[] {
    return [
      // Templates Markdown
      {
        id: 'md-blank',
        name: 'Blank Document',
        description: 'Empty markdown document to start from scratch',
        type: 'markdown',
        content: '# New Document\n\nStart writing here...\n',
        category: 'Basic',
        tags: ['empty', 'blank']
      },
      {
        id: 'md-note',
        name: 'Note Template',
        description: 'Simple note template with sections',
        type: 'markdown',
        content: `# Note Title

## Summary
Quick summary or key points here.

## Content
Main content goes here.

## References
- Link 1
- Link 2

## Tags
#note #important

---
Created: ${new Date().toLocaleDateString()}`,
        category: 'Notes',
        tags: ['note', 'template']
      },
      {
        id: 'md-meeting',
        name: 'Meeting Notes',
        description: 'Template for meeting notes and action items',
        type: 'markdown',
        content: `# Meeting Notes - ${new Date().toLocaleDateString()}

## Attendees
- 
- 
- 

## Agenda
1. 
2. 
3. 

## Discussion Points
### Point 1


### Point 2


## Action Items
- [ ] Task 1 - Assigned to: 
- [ ] Task 2 - Assigned to: 
- [ ] Task 3 - Assigned to: 

## Next Meeting
Date: 
Time: 
Location: `,
        category: 'Business',
        tags: ['meeting', 'notes', 'business']
      },
      {
        id: 'md-project',
        name: 'Project Documentation',
        description: 'Complete project documentation template',
        type: 'markdown',
        content: `# Project Name

## Overview
Brief description of the project.

## Objectives
- Objective 1
- Objective 2
- Objective 3

## Requirements
### Functional Requirements
1. 
2. 
3. 

### Non-Functional Requirements
1. 
2. 
3. 

## Architecture
Description of system architecture.

## Timeline
| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Phase 1 | | | |
| Phase 2 | | | |
| Phase 3 | | | |

## Resources
### Team Members
- 
- 
- 

### Tools & Technologies
- 
- 
- 

## Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| | | | |

## Next Steps
1. 
2. 
3. `,
        category: 'Project',
        tags: ['project', 'documentation', 'planning']
      },

      // Templates Kanban
      {
        id: 'kanban-basic',
        name: 'Basic Kanban',
        description: 'Simple 3-column kanban board',
        type: 'kanban',
        content: {
          columns: [
            {
              id: 'todo',
              title: 'To Do',
              cards: [
                {
                  id: 'task-1',
                  title: 'Example task',
                  description: 'This is an example task. You can edit or delete it.',
                  priority: 'medium' as const,
                  tags: ['example'],
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
            },
            {
              id: 'doing',
              title: 'In Progress',
              cards: []
            },
            {
              id: 'done',
              title: 'Done',
              cards: []
            }
          ]
        } as KanbanData,
        category: 'Basic',
        tags: ['kanban', 'basic', 'todo']
      },
      {
        id: 'kanban-agile',
        name: 'Agile Scrum Board',
        description: 'Kanban board for agile development',
        type: 'kanban',
        content: {
          columns: [
            {
              id: 'backlog',
              title: 'Backlog',
              cards: []
            },
            {
              id: 'sprint-planning',
              title: 'Sprint Planning',
              cards: []
            },
            {
              id: 'in-development',
              title: 'In Development',
              cards: []
            },
            {
              id: 'code-review',
              title: 'Code Review',
              cards: []
            },
            {
              id: 'testing',
              title: 'Testing',
              cards: []
            },
            {
              id: 'done',
              title: 'Done',
              cards: []
            }
          ]
        } as KanbanData,
        category: 'Development',
        tags: ['agile', 'scrum', 'development']
      },
      {
        id: 'kanban-personal',
        name: 'Personal Task Board',
        description: 'Personal productivity board',
        type: 'kanban',
        content: {
          columns: [
            {
              id: 'inbox',
              title: 'Inbox',
              cards: []
            },
            {
              id: 'today',
              title: 'Today',
              cards: []
            },
            {
              id: 'this-week',
              title: 'This Week',
              cards: []
            },
            {
              id: 'waiting',
              title: 'Waiting For',
              cards: []
            },
            {
              id: 'completed',
              title: 'Completed',
              cards: []
            }
          ]
        } as KanbanData,
        category: 'Personal',
        tags: ['personal', 'productivity', 'gtd']
      },

      // Templates Canvas
      {
        id: 'canvas-blank',
        name: 'Blank Canvas',
        description: 'Empty canvas to start creating',
        type: 'canvas',
        content: {
          title: 'New Canvas',
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        } as CanvasData,
        category: 'Basic',
        tags: ['canvas', 'blank', 'mindmap']
      },
      {
        id: 'canvas-mindmap',
        name: 'Mind Map Template',
        description: 'Basic mind map with central idea',
        type: 'canvas',
        content: {
          title: 'Mind Map',
          nodes: [
            {
              id: 'central',
              type: 'custom',
              position: { x: 400, y: 300 },
              style: { width: 200, height: 100 },
              data: { content: '# Central Idea\n\nMain topic or theme' }
            },
            {
              id: 'branch1',
              type: 'custom',
              position: { x: 100, y: 100 },
              style: { width: 180, height: 80 },
              data: { content: '## Branch 1\n\nSubtopic 1' }
            },
            {
              id: 'branch2',
              type: 'custom',
              position: { x: 700, y: 100 },
              style: { width: 180, height: 80 },
              data: { content: '## Branch 2\n\nSubtopic 2' }
            },
            {
              id: 'branch3',
              type: 'custom',
              position: { x: 100, y: 500 },
              style: { width: 180, height: 80 },
              data: { content: '## Branch 3\n\nSubtopic 3' }
            },
            {
              id: 'branch4',
              type: 'custom',
              position: { x: 700, y: 500 },
              style: { width: 180, height: 80 },
              data: { content: '## Branch 4\n\nSubtopic 4' }
            }
          ],
          edges: [
            { id: 'e1', source: 'central', target: 'branch1' },
            { id: 'e2', source: 'central', target: 'branch2' },
            { id: 'e3', source: 'central', target: 'branch3' },
            { id: 'e4', source: 'central', target: 'branch4' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        } as CanvasData,
        category: 'Planning',
        tags: ['mindmap', 'brainstorm', 'planning']
      },
      {
        id: 'canvas-flowchart',
        name: 'Process Flowchart',
        description: 'Template for process documentation',
        type: 'canvas',
        content: {
          title: 'Process Flow',
          nodes: [
            {
              id: 'start',
              type: 'custom',
              position: { x: 400, y: 50 },
              style: { width: 120, height: 60 },
              data: { content: '**Start**' }
            },
            {
              id: 'step1',
              type: 'custom',
              position: { x: 400, y: 150 },
              style: { width: 200, height: 80 },
              data: { content: '## Step 1\n\nProcess description' }
            },
            {
              id: 'decision',
              type: 'custom',
              position: { x: 400, y: 280 },
              style: { width: 180, height: 80 },
              data: { content: '### Decision?\n\nYes/No question' }
            },
            {
              id: 'step2a',
              type: 'custom',
              position: { x: 200, y: 420 },
              style: { width: 160, height: 80 },
              data: { content: '## Step 2A\n\nIf Yes' }
            },
            {
              id: 'step2b',
              type: 'custom',
              position: { x: 600, y: 420 },
              style: { width: 160, height: 80 },
              data: { content: '## Step 2B\n\nIf No' }
            },
            {
              id: 'end',
              type: 'custom',
              position: { x: 400, y: 560 },
              style: { width: 120, height: 60 },
              data: { content: '**End**' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'step1' },
            { id: 'e2', source: 'step1', target: 'decision' },
            { id: 'e3', source: 'decision', target: 'step2a' },
            { id: 'e4', source: 'decision', target: 'step2b' },
            { id: 'e5', source: 'step2a', target: 'end' },
            { id: 'e6', source: 'step2b', target: 'end' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        } as CanvasData,
        category: 'Process',
        tags: ['flowchart', 'process', 'workflow']
      }
    ];
  }

  // Obter templates por tipo
  getTemplatesByType(type: 'markdown' | 'kanban' | 'canvas'): Template[] {
    return this.getDefaultTemplates().filter(template => template.type === type);
  }

  // Obter template por ID
  getTemplateById(id: string): Template | null {
    return this.getDefaultTemplates().find(template => template.id === id) || null;
  }

  // Obter templates por categoria
  getTemplatesByCategory(category: string): Template[] {
    return this.getDefaultTemplates().filter(template => template.category === category);
  }

  // Obter todas as categorias
  getCategories(): string[] {
    const categories = this.getDefaultTemplates().map(template => template.category);
    return [...new Set(categories)].sort();
  }
}

export default TemplateService;
