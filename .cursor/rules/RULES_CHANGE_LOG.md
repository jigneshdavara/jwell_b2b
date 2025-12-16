# Rules Change Log

## 2025-01-15 - Critical Rule Additions and Consolidations

### Added Sections

1. **Rule Violation Severity Levels** (`00_OVERVIEW.mdc`)
   - Defined CRITICAL/HIGH/MEDIUM/LOW severity levels
   - Mapped rule categories to severity levels
   - Established enforcement actions per severity

2. **Rules vs Reality (Living Docs)** (`00_OVERVIEW.mdc`)
   - Mandates rules must reflect code reality
   - Forbids silent divergence between rules and code
   - Requires either fix code OR update rules explicitly
   - Documents resolution process for conflicts

3. **Rules May Require Refactor** (`00_OVERVIEW.mdc`)
   - States legacy code is not exempt from CRITICAL/HIGH violations
   - Defines exception policy (requires comment, justification, timeline)
   - No grandfathering allowed - rules apply to all code

### Fixed Contradictions

1. **Status Color Policy Consolidation** (`30_STYLE_THEME.mdc`)
   - Added explicit "STATUS COLOR POLICY (Source of Truth)" statement at top of Section 3
   - Clarified policy applies uniformly to BOTH Customer and Admin UI
   - Added cross-references to Section 3.2 from UI Differences section
   - Removed ambiguity about portal-specific status color rules

### Updated Evidence Index

- Added references to new severity levels section
- Added references to Rules vs Reality section
- Added references to Rules May Require Refactor section
- Added Status Color Policy as source of truth with evidence

### Language Tightening

- Converted "should" → "must" in CRITICAL/HIGH domains:
  - Workflow transitions (rate locking must happen)
  - Controller structure (controllers must only handle...)
  - Migration rollbacks (must work)
  - Rate changes (must only affect new orders)

### Consistency Improvements

- Status color policy now stated once as source of truth in Section 3.2
- Cross-references added to prevent contradictions
- Severity levels used consistently across rule documents

