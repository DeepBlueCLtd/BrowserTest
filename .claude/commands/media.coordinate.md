---
description: Coordinate media content generation across specialist agents for blog posts, site updates, and technical documentation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This coordinator manages three specialist agents for media content generation:

1. **Content Specialist** (`/media.content`) - Blog posts, LinkedIn summaries, voice/tone
2. **Site Specialist** (`/media.site`) - Jekyll site structure, templates, styling
3. **Technical Specialist** (`/media.technical`) - Specs, architecture docs, READMEs, diagrams

## Delegation Framework

When receiving a request, analyze it and delegate to the appropriate specialist(s).

### Task Classification

| Request Type | Primary Specialist | Supporting Specialist |
|--------------|-------------------|----------------------|
| "Write a blog post about..." | Content | Technical (context) |
| "Update the site layout..." | Site | - |
| "Create architecture diagram..." | Technical | - |
| "Announce feature X..." | Content | Technical (context) → Site (publish) |
| "Document the API..." | Technical | - |
| "Add new page to site..." | Site | Content (copy) |

## Coordination Workflow

### Step 1: Parse Request

Analyze the user input to determine:

1. **Primary task type**: content, site, or technical
2. **Required specialists**: which agents needed
3. **Dependencies**: what order to execute
4. **Deliverables**: expected outputs

### Step 2: Gather Context

Before delegating:

1. Check for existing related content in:
   - `docs/` - existing documentation
   - `specs/` - feature specifications
   - `_posts/` or blog directories - existing posts
   - `README.md` - project overview

2. Extract relevant context for specialists:
   - Feature names and descriptions
   - Technical details needed
   - Existing voice/tone from prior content

### Step 3: Delegate Tasks

Execute in dependency order:

```
Complex Request Flow:
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Coordinator   │──► Parse & classify
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Tech  │ │Content│
│Spec.  │ │ Spec. │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  Site Spec.     │──► Publish/integrate
└─────────────────┘
```

### Step 4: Assemble Output

Combine specialist outputs into cohesive deliverable:

1. Verify consistency across outputs
2. Resolve any conflicts
3. Present final artifacts to user

## Request Handling

### For Blog Post Requests

**Planning Posts** (announcing upcoming work):

1. Delegate to Technical Specialist for feature context
2. Delegate to Content Specialist with context + template type "planning"
3. Optionally delegate to Site Specialist for publishing

**Completed Posts** (showcasing delivered work):

1. Delegate to Technical Specialist for implementation summary
2. Delegate to Content Specialist with context + template type "completed"
3. Optionally delegate to Site Specialist for publishing

### For Documentation Requests

1. Delegate directly to Technical Specialist
2. If user-facing docs needed, also delegate to Content Specialist for review

### For Site Updates

1. Delegate directly to Site Specialist
2. If content needed, first delegate to Content Specialist

## Output Format

After coordination, report:

```markdown
## Media Generation Complete

### Tasks Executed
- [x] Task 1: [description] → [specialist]
- [x] Task 2: [description] → [specialist]

### Deliverables Created
1. **[File/artifact name]**: [brief description]
   - Location: `path/to/file`

2. **[File/artifact name]**: [brief description]
   - Location: `path/to/file`

### Next Steps (if any)
- [ ] [Action needed]
```

## Quick Commands

For simple single-specialist tasks, you may invoke directly:

- `/media.content [description]` - Content creation only
- `/media.site [description]` - Site updates only
- `/media.technical [description]` - Technical docs only

Use this coordinator (`/media.coordinate`) for complex multi-specialist tasks.
