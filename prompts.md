# Claude Opus 4.7

1. I want to create a Markdown orchestrator agent to use with Claude Code. The idea is to develop a full-stack, end-to-end project called NomadHome: A Co-living and Workspace platform, using OpenSpec. Can you help me create this agent (CLAUDE.md) by acting as a prompt engineering expert with meta-prompting and context engineering techniques? Feel free to ask me anything you need for the task.
   The agent's Markdown must be entirely in English, and the agent must use Git Worktrees for each ticket.

Q: What's your tech stack preference for NomadHome?
R: Reactjs + nodejs+ prisma+ postgresql (monorepo)

Q: How should the orchestrator delegate work to sub-agents?
R: Spawn specialized sub-agents (architect, backend, frontend, QA, devops) via Task tool

Q: Which OpenSpec workflow phases should be strictly enforced?
R: All of the above with quality gates between phases

Q: How should Git Worktrees be structured?
R: Feature branches per ticket (e.g., feature/TICKET-123-name)

Q: Which quality/testing stack should be enforced?
R: Vitest + Playwright + ESLint + Prettier + Husky + commitlint

Q: What's the MVP scope for NomadHome?
R: Full SaaS: everything above + i18n, mobile-responsive, PWA, API for partners

Q: How autonomous should the orchestrator be?
R: Plan mode → approval → execution (human-in-the-loop per ticket)

Q: Should the agent strictly follow OpenSpec's official directory conventions?
R: Yes — plus require the agent to read OpenSpec docs before any change

2. You are a product expert, with experience in co-living platforms and workspace reservations.
   What basic functionalities does a co-living and workspace reservation platform have?
   Describe them in a list, ordered from highest to lowest priority.
   What benefits does the client obtain from a co-living and workspace reservation platform to consider its use?
   What alternatives are there to using a co-living and workspace booking platform, and when might they be relevant?
   What is the normal customer journey of a client who uses a co-living and workspace booking platform? Describe every interaction step by step.

3. Taking into account the product description (product-description.m), could you help me create the product requirement document (PRD) for the project? Ask me what you need for it.

Q: "What scope should the PRD cover?"
R: "MVP only (per CLAUDE.md §2)"

Q: "Who is the primary audience for this PRD?"
R: "Mixed: eng + product/business stakeholders"

Q: "Which personas should the PRD treat as primary?"
R: "Digital nomad / remote worker (guest), Platform admin, Property host / co-living operator, Remote team lead (guest)"

Q: "Where should the PRD live?"
R:"docs/PRD.md in the repo".

4. Taking into account the enrich-us skill, can you generate a docs/tasks.md file with the tasks related to the user stories developed in the PRD (docs/PRD.md)?

5. can you update the docs to match with claude.md criteria?

6. can you populate the data-model.md?

7. can you made an architecture-diagram.md file with architectural c4 diagrams related to NomadHome using mermaid?

8. when I review the data-model from github, the diagram in README.md (point 3.1) I see this error:
   Unable to render rich display

Parse error on line 14:
... uuid userId PK_FK "1:1 with USER"
-----------------------^
Expecting 'ATTRIBUTE_WORD', got 'COMMENT'

For more information, see https://docs.github.com/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams#creating-mermaid-diagrams

How can we solve it?
