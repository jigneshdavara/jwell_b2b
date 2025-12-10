# Rule Update Template

Use this template when asking the AI to add a new rule.

## Quick Template

```
Add to rules: [Your rule description]

Context:
- Category: [domain/backend/frontend/database/styling/testing/refactoring/overview]
- Related to: [specific feature/component/service]
- Priority: [critical/important/nice-to-have]
- File path (if known): [e.g., app/Services/ServiceName.php]
```

## Category Guide

- **domain** → `10-domain.mdc` (business logic, workflows, pricing)
- **backend** → `20-backend.mdc` (Laravel patterns, controllers, services)
- **database** → `21-database.mdc` (schema, migrations, naming)
- **frontend** → `30-frontend.mdc` (React, TypeScript, Inertia patterns)
- **styling** → `31-frontend-style.mdc` (colors, typography, UI)
- **testing** → `40-testing.mdc` (test patterns, coverage)
- **refactoring** → `50-refactoring.mdc` (DRY, cleanup, code quality)
- **overview** → `00-overview.mdc` (project-wide, tech stack, portals)

## Examples

### Example 1: Domain Rule
```
Add to rules: All product variants must have a default variant (is_default=true)

Context:
- Category: domain
- Related to: ProductVariant model, variant generation
- Priority: critical
- File path: app/Models/ProductVariant.php, app/Services/Catalog/ProductVariantSyncService.php
```

### Example 2: Backend Rule
```
Add to rules: All API endpoints must return consistent JSON structure with 'data' and 'meta' keys

Context:
- Category: backend
- Related to: API responses, controllers
- Priority: important
```

### Example 3: Frontend Rule
```
Add to rules: All form inputs must use the TextInput component from Components/

Context:
- Category: frontend
- Related to: Form components, UI consistency
- Priority: important
- File path: resources/js/Components/TextInput.tsx
```

### Example 4: Database Rule
```
Add to rules: All foreign key columns must use cascade delete for child records

Context:
- Category: database
- Related to: Migrations, relationships
- Priority: critical
```

## What Happens Next

When you use this template, the AI will:
1. ✅ Identify the correct rules file
2. ✅ Find the appropriate section
3. ✅ Add the rule in the correct format
4. ✅ Update related sections if needed
5. ✅ Maintain formatting consistency

## Pro Tips

- **Be specific**: Include file paths, service names, examples
- **Be actionable**: Tell what to do, not just describe
- **Include context**: Help the AI understand where it fits
- **Check existing rules**: Search first to avoid duplicates



