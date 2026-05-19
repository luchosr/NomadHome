# Claude Opus

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
