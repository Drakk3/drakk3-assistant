# Skill Registry — drakk3-assistant

Generated: 2026-04-12

## User Skills

| Skill | Trigger |
|-------|---------|
| branch-pr | When creating a pull request, opening a PR, or preparing changes for review |
| go-testing | When writing Go tests, using teatest, or adding test coverage |
| issue-creation | When creating a GitHub issue, reporting a bug, or requesting a feature |
| judgment-day | When user says "judgment day", "review adversarial", "dual review", "doble review", "juzgar" |
| skill-creator | When user asks to create a new skill, add agent instructions, or document patterns for AI |

## Project Conventions

No project-level CLAUDE.md, AGENTS.md, or .cursorrules found.

## Compact Rules

### branch-pr
- Follow issue-first enforcement: PR must reference an existing issue
- Use conventional commit format for PR title
- Include test plan in PR body

### go-testing
- Use table-driven tests with `t.Run`
- Use `teatest` for Bubbletea TUI components
- Keep test files co-located with source

### issue-creation
- Follow issue-first enforcement system
- Label bugs vs features clearly
- Include reproduction steps for bugs

### judgment-day
- Launch two independent blind judge sub-agents simultaneously
- Synthesize findings and apply fixes
- Re-judge until both pass or escalate after 2 iterations

### skill-creator
- Follow Agent Skills spec format
- Include frontmatter with trigger, license, metadata
- Write compact rules section for sub-agent injection
