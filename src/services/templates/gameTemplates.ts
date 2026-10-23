import type { Template } from '../TemplateService';
import type { KanbanCard } from '../../types/kanban';

export function createGameTemplates(): Template[] {
  const now = new Date();
  const card = (id: string, title: string, description: string, tags: string[]): KanbanCard => ({
    id,
    title,
    description,
    priority: 'medium',
    tags,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });

  return [
    {
      id: 'md-game-design',
      name: 'Game Design Document',
      description: 'A focused GDD: player fantasy, design pillars, core loop, scope and validation.',
      type: 'markdown',
      category: 'Game Design',
      tags: ['game', 'gdd', 'design', 'jogo'],
      content: `# Game Design Document

## High Concept
Describe the game in one sentence. What does the player do, and why is it compelling?
- Genre:
- Target audience:
- Target platforms and input devices:
- Engine and technical constraints:

## Player Fantasy and Design Pillars
What should the player feel? Choose three pillars to guide trade-offs.
1. Pillar / how it affects gameplay:
2. Pillar / how it affects gameplay:
3. Pillar / how it affects gameplay:

## Core Loop
Player goal -> action -> feedback -> reward -> next decision.
- Moment-to-moment actions:
- Failure conditions and recovery:
- Session length and progression:

## Mechanics and Systems
| System | Player decision | Rules | Dependencies | Prototype question |
|--------|-----------------|-------|--------------|--------------------|
| | | | | |

## World, Narrative and Level Design
- Setting and narrative premise:
- How the first level teaches the core loop:
- Challenge progression and pacing:

## Art, Audio and UI Direction
- Visual references and asset constraints:
- Sound cues and music goals:
- UI feedback and readability:
- Accessibility: remapping, text size, contrast and motion:

## Scope and Milestones
- Prototype: prove the riskiest mechanic.
- Vertical slice: one representative, end-to-end experience.
- MVP: minimum complete game, with explicit exclusions.
- Out of scope:

## Validation and Risks
| Assumption | Playtest or experiment | Success criterion | Next decision |
|------------|------------------------|-------------------|---------------|
| | | | |

## Definition of Done
- [ ] Core loop is playable on target hardware.
- [ ] New players understand the goal without developer guidance.
- [ ] Performance and accessibility targets are met.
- [ ] Known issues and release scope are documented.
`,
    },
    {
      id: 'md-game-mechanic',
      name: 'Gameplay Mechanic Specification',
      description: 'Turn a mechanic into testable rules, feedback, tuning parameters and edge cases.',
      type: 'markdown',
      category: 'Game Design',
      tags: ['game', 'mechanic', 'prototype', 'mecanica'],
      content: `# Mechanic Name

## Purpose
- Player fantasy:
- Design pillar supported:
- Hypothesis to validate in a prototype:

## Rules and Inputs
- Preconditions and activation input:
- Cost, cooldown and duration:
- Outcomes, rewards and failure conditions:
- Interactions with other systems:

## State Transitions
| Current state | Input or condition | Next state | Feedback |
|---------------|--------------------|------------|----------|
| Ready | | Active | |
| Active | | Recovery | |
| Recovery | | Ready | |

## Feedback and Accessibility
- Animation, VFX and audio cues:
- UI indicators:
- Alternatives to color-only or audio-only information:
- Input remapping and timing assistance:

## Tuning
| Parameter | Initial value | Allowed range | Expected player impact |
|-----------|---------------|---------------|------------------------|
| | | | |

## Edge Cases
- Interrupted input, pause and restart:
- Invalid targets and resource exhaustion:
- Save/load during the action:
- Frame rate or latency sensitivity, if applicable:

## Acceptance Criteria
- [ ] Activation succeeds only when preconditions are met.
- [ ] Costs and cooldowns apply exactly once.
- [ ] Failure and interruption produce clear feedback.
- [ ] Player can discover and use the mechanic in a playtest.

## Prototype Result
- Build tested:
- Observations:
- Decision: keep / change / discard:
`,
    },
    {
      id: 'md-game-playtest',
      name: 'Playtest Report',
      description: 'Capture build context, player observations, evidence and prioritized follow-up work.',
      type: 'markdown',
      category: 'Game Testing',
      tags: ['game', 'playtest', 'qa', 'teste'],
      content: `# Playtest Report

## Session Context
- Date and facilitator:
- Build / commit:
- Platform, hardware and input device:
- Participant profile (avoid personal identifying information):
- Consent for recording, if applicable:

## Questions and Success Criteria
| Design question | Task for the player | Observable success criterion |
|-----------------|---------------------|------------------------------|
| | | |

## Session Plan
1. Explain the session, not the solution.
2. Observe without guiding the player.
3. Ask neutral follow-up questions after the task.

## Observations
Separate observed behavior from interpretation.
| Time / level | Observed behavior or quote | Friction / delight | Evidence |
|--------------|----------------------------|-------------------|----------|
| | | | |

## Bugs
| Summary | Steps to reproduce | Expected / actual | Severity | Frequency |
|---------|--------------------|-------------------|----------|-----------|
| | | | | |

## Findings and Decisions
- What worked:
- What confused players:
- Hypothesis supported or rejected:
- Limitations of this session:

## Follow-up
| Action | Priority | Owner | Retest criterion |
|--------|----------|-------|------------------|
| | | | |
`,
    },
    {
      id: 'kanban-game-production',
      name: 'Game Production Board',
      description: 'Plan a playable milestone across design, code, art and audio, with playtest gates.',
      type: 'kanban',
      category: 'Game Production',
      tags: ['game', 'production', 'milestone', 'producao'],
      content: {
        columns: [
          {
            id: 'backlog', title: 'Backlog',
            cards: [
              card('define-milestone', 'Define the playable milestone',
                'Choose one player experience to deliver. List the in-scope mechanics, target platform, exclusions and measurable acceptance criteria.', ['design', 'milestone']),
              card('plan-assets', 'List required art and audio assets',
                'List assets for the milestone, their owner, format, budget and license. Identify placeholders and dependencies on gameplay.', ['art', 'audio']),
            ],
          },
          {
            id: 'ready', title: 'Ready',
            cards: [
              card('prototype-core-loop', 'Prototype the core loop',
                'Implement the smallest playable loop using placeholders. Done when a player can complete a goal, receive feedback and try again. Record the question the prototype must answer.', ['code', 'prototype']),
            ],
          },
          { id: 'in-development', title: 'In Development', cards: [] },
          { id: 'playtest', title: 'Playtest', cards: [] },
          { id: 'done', title: 'Done', cards: [] },
        ],
      },
    },
    {
      id: 'kanban-game-bugs',
      name: 'Game Bug Triage',
      description: 'Track reproducible gameplay defects from triage through verification on a named build.',
      type: 'kanban',
      category: 'Game Testing',
      tags: ['game', 'bug', 'qa', 'triage'],
      content: {
        columns: [
          {
            id: 'reported', title: 'Reported',
            cards: [
              card('bug-report-guide', 'Bug report checklist',
                'Use this card as a reporting guide, not a confirmed defect.\n\nBuild / commit:\nPlatform and hardware:\nLevel / save / seed:\nSteps to reproduce:\nExpected result:\nActual result:\nFrequency:\nSeverity / player impact:\nEvidence:\nVerification build:', ['qa', 'guide']),
            ],
          },
          { id: 'triaged', title: 'Triaged', cards: [] },
          { id: 'fixing', title: 'Fixing', cards: [] },
          { id: 'verification', title: 'Verification', cards: [] },
          { id: 'resolved', title: 'Resolved', cards: [] },
        ],
      },
    },
    {
      id: 'canvas-game-loop',
      name: 'Core Gameplay Loop',
      description: 'Map player goals, actions, challenges, rewards and progression into a connected loop.',
      type: 'canvas',
      category: 'Game Design',
      tags: ['game', 'loop', 'mechanics', 'gameplay'],
      content: {
        title: 'Core Gameplay Loop',
        nodes: [
          {
            id: 'goal', type: 'custom', position: { x: 40, y: 40 },
            style: { width: 260, height: 180 },
            data: { content: '## Player Goal\n\nWhat does the player want right now?\n\nHow is the objective communicated?' },
          },
          {
            id: 'action', type: 'custom', position: { x: 380, y: 40 },
            style: { width: 260, height: 180 },
            data: { content: '## Player Action\n\nWhat input and meaningful decision move the player toward the goal?' },
          },
          {
            id: 'challenge', type: 'custom', position: { x: 720, y: 40 },
            style: { width: 260, height: 180 },
            data: { content: '## Challenge\n\nWhat rule, enemy or resource creates tension?\n\nWhat happens on failure?' },
          },
          {
            id: 'feedback', type: 'custom', position: { x: 720, y: 320 },
            style: { width: 260, height: 180 },
            data: { content: '## Feedback and Reward\n\nHow does the player understand the outcome?\n\nWhat reward reinforces mastery?' },
          },
          {
            id: 'progression', type: 'custom', position: { x: 380, y: 320 },
            style: { width: 260, height: 180 },
            data: { content: '## Progression\n\nWhat changes for the next attempt?\n\nNew options, higher stakes or a new goal?' },
          },
          {
            id: 'validation', type: 'custom', position: { x: 40, y: 320 },
            style: { width: 260, height: 180 },
            data: { content: '## Playtest Question\n\nCan a new player understand and repeat this loop?\n\nDefine one observable success criterion.' },
          },
        ],
        edges: [
          { id: 'goal-action', source: 'goal', target: 'action', sourceHandle: 'right', targetHandle: 'left' },
          { id: 'action-challenge', source: 'action', target: 'challenge', sourceHandle: 'right', targetHandle: 'left' },
          { id: 'challenge-feedback', source: 'challenge', target: 'feedback', sourceHandle: 'bottom', targetHandle: 'top' },
          { id: 'feedback-progression', source: 'feedback', target: 'progression', sourceHandle: 'left', targetHandle: 'right' },
          { id: 'progression-goal', source: 'progression', target: 'goal', sourceHandle: 'top', targetHandle: 'bottom' },
          { id: 'validation-goal', source: 'validation', target: 'goal', sourceHandle: 'top', targetHandle: 'bottom' },
        ],
        viewport: { x: 0, y: 0, zoom: 0.7 },
      },
    },
  ];
}
