# Engineering Missions

The `missions/` directory coordinates large, multi-session engineering efforts such as major features, refactors, migrations, investigations, and architectural changes.

A mission gives developers and AI agents a concise, shared understanding of the objective, execution plan, current state, and important decisions.

## When to create a mission

Create a mission when:

- The work requires multiple development or AI sessions.
- Multiple components or services are involved.
- The work needs to be divided into phases.
- Important context or decisions must survive between sessions.
- Another developer or AI agent may need to continue the work.

Do not create a mission for small changes that can be completed within a single session or understood from an issue or pull request.

## Directory structure

Use a short, descriptive mission name. Include an issue identifier when available.

```text
missions/
├── README.md
├── _template/
│   ├── BRIEF.md
│   ├── PLAN.md
│   ├── STATE.md
│   └── DECISIONS.md
├── SG-142-device-pairing/
│   └── ...
└── _archive/
    └── ...
```

Create new missions by copying `_template/`.

## Mission files

### `BRIEF.md`

Defines what the mission must achieve and why it matters.

It contains:

- Problem and desired outcome
- Scope
- Explicit non-goals
- Constraints
- Acceptance criteria
- Important references

The brief should remain relatively stable. Any scope change must be intentional and clearly recorded.

### `PLAN.md`

Defines how the mission will be executed.

It contains:

- Current phase
- Planned phases
- Expected outcome of each phase
- Dependencies
- Exit and verification criteria
- Remaining work

The plan may evolve as new information is discovered. Phases should describe outcomes rather than guessed implementation steps.

### `STATE.md`

Describes the current verified state of the mission.

It contains:

- Current progress
- Completed work
- Known working and broken behavior
- Validation already performed
- Blockers and unresolved questions
- The next recommended action

Update this file in place after every substantial session. Do not create separate session-summary files.

### `DECISIONS.md`

Records durable technical or product decisions that future contributors might otherwise question or reverse.

Each decision should include:

- Date and status
- Context
- Decision
- Consequences

This file is optional. Major architectural decisions should be promoted to the repository’s permanent architecture documentation.

## Mission lifecycle

### 1. Create

Copy `_template/` into a new mission directory:

```text
missions/<issue-id>-<short-description>/
```

Complete `BRIEF.md` before implementation begins.

### 2. Plan

Break the mission into outcome-based phases in `PLAN.md`.

Each phase should have:

- A clear objective
- Defined boundaries
- Exit criteria
- Required validation

Only one phase should normally be active at a time.

### 3. Execute

At the beginning of every session, read the mission files in this order:

```text
BRIEF.md → PLAN.md → STATE.md → DECISIONS.md
```

Verify important claims against the current code, tests, schemas, and Git history before relying on them.

Work only on the active phase unless the mission plan is intentionally revised.

### 4. Handoff

Before ending a substantial session:

1. Run the relevant validations.
2. Update progress and remaining work in `PLAN.md`.
3. Rewrite `STATE.md` with the latest verified state.
4. Record any durable new decisions.
5. Leave one concrete recommended next action.

Do not create a separate report for each session.

### 5. Complete

When the mission is complete:

1. Confirm that all acceptance criteria are satisfied.
2. Run the final required validations.
3. Move permanent knowledge into the appropriate repository documentation.
4. Mark the mission as completed.
5. Move the mission directory into `missions/_archive/`.

## Mission principles

- Code, tests, schemas, and Git history are the source of truth.
- Mission files are a navigation and coordination layer, not a replacement for code documentation.
- Keep every file concise and relevant.
- Link to existing files instead of copying large amounts of content.
- Record verified facts and decisions, not chat narration.
- Avoid duplicating the same information across mission files.
- Plans may change; acceptance criteria must not change silently.
- Completed work should include validation evidence.
- AI-generated summaries must be verified before being treated as fact.
- Every session should leave the mission easier to continue than it was before.

## Starting an AI session

Use a prompt similar to:

> Continue the mission in `missions/<mission-name>`.
>
> Read `BRIEF.md`, `PLAN.md`, `STATE.md`, and `DECISIONS.md` in that order. Verify important claims against the current code, tests, and Git history.
>
> Work only on the active phase and its exit criteria. Before finishing, run the relevant validations, update `PLAN.md` and `STATE.md` in place, and record only durable decisions in `DECISIONS.md`.
>
> Do not create a separate session report. Leave one concrete next action for the next developer or AI agent.
