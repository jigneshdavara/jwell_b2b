# How to Update Rules Files

This guide explains how to automatically update `.cursor/rules/*.mdc` files when important points need to be added.

## Quick Start

When you need to add an important point to the rules:

1. **Tell the AI**: "Add this to the rules: [your important point]"
2. **The AI will**:
   - Identify the correct rules file
   - Add the point in the appropriate section
   - Maintain formatting consistency
   - Update related sections if needed

## Rules File Structure

The rules are organized by topic:

- `00-overview.mdc` - Project overview, tech stack, portals, user types
- `10-domain.mdc` - Business domain rules (products, pricing, workflows)
- `20-backend.mdc` - Backend architecture (Laravel, controllers, services)
- `21-database.mdc` - Database schema, migrations, naming conventions
- `30-frontend.mdc` - Frontend architecture (React, TypeScript, Inertia)
- `31-frontend-style.mdc` - Brand styling, colors, typography
- `40-testing.mdc` - Testing guidelines and best practices
- `50-refactoring.mdc` - Code quality, DRY, cleanup rules

## When to Update Rules

Update rules when you discover:

1. **New business rules** → `10-domain.mdc`
   - New workflow steps
   - New status values
   - New pricing rules
   - New domain constraints

2. **New architectural patterns** → `20-backend.mdc` or `30-frontend.mdc`
   - New service patterns
   - New component patterns
   - New routing conventions

3. **New database patterns** → `21-database.mdc`
   - New table naming conventions
   - New migration patterns
   - New relationship patterns

4. **New styling guidelines** → `31-frontend-style.mdc`
   - New color usage
   - New component patterns
   - New layout rules

5. **New testing requirements** → `40-testing.mdc`
   - New test patterns
   - New coverage requirements

6. **New refactoring guidelines** → `50-refactoring.mdc`
   - New DRY patterns
   - New cleanup rules

7. **Project-wide changes** → `00-overview.mdc`
   - New tech stack components
   - New portal structure
   - New user types

## Automatic Update Instructions for AI

When you want to add a rule, use this format:

```
Add to rules: [Your rule description]

Context:
- Category: [domain/backend/frontend/database/styling/testing/refactoring/overview]
- Related to: [specific feature/component/service]
- Priority: [critical/important/nice-to-have]
```

### Example Instructions

**Example 1: Domain Rule**
```
Add to rules: Product variants must always have a default variant marked with is_default=true

Context:
- Category: domain
- Related to: ProductVariant model, variant generation
- Priority: critical
```

**Example 2: Backend Rule**
```
Add to rules: All payment gateway integrations must use the PaymentGatewayManager service

Context:
- Category: backend
- Related to: Payment processing, PaymentGatewayManager
- Priority: critical
```

**Example 3: Frontend Rule**
```
Add to rules: All form submissions must use Inertia's useForm hook

Context:
- Category: frontend
- Related to: Form handling, Inertia.js
- Priority: important
```

## Manual Update Process

If you prefer to update manually:

1. **Identify the correct file** using the structure guide above
2. **Find the appropriate section** within that file
3. **Add the rule** following the existing format:
   - Use markdown headers for sections
   - Use bullet points for rules
   - Include code examples if helpful
   - Reference file paths with backticks
4. **Maintain consistency**:
   - Follow existing formatting style
   - Use same heading levels
   - Keep similar rules grouped together

## Format Guidelines

### Rule Format

```markdown
### Section Name

**Key Point**: Brief description

- **Rule 1**: Description
- **Rule 2**: Description
- **Location**: `path/to/file.php` or `path/to/Component.tsx`
- **Service**: `App\Services\ServiceName` (if applicable)
```

### Example

```markdown
### Variant Matching

**Rule**: Variant matching must be centralized

- **Location**: `app/Services/Catalog/ProductVariantSyncService.php`
- **Frontend**: Use helper function in `resources/js/utils/variantMatching.ts`
- **Never**: Duplicate matching logic in components
```

## Verification Checklist

After adding a rule, verify:

- [ ] Rule is in the correct file
- [ ] Rule is in the appropriate section
- [ ] Formatting matches existing style
- [ ] File paths are correct and use backticks
- [ ] Related sections are updated if needed
- [ ] No duplicate rules exist
- [ ] Rule is clear and actionable

## Using the Helper Script

Run the helper script for guided rule updates:

```bash
./.cursor/scripts/update-rules.sh
```

Or use the Node.js version:

```bash
node .cursor/scripts/update-rules.js
```

The script will:
1. Ask what type of rule you want to add
2. Guide you to the correct file
3. Show you where to add it
4. Help format it correctly

## Best Practices

1. **Be specific**: Include file paths, service names, and examples
2. **Be actionable**: Rules should tell the AI what to do, not just describe
3. **Group related rules**: Keep similar rules together
4. **Update related sections**: If a rule affects multiple areas, update all relevant files
5. **Review periodically**: Check rules for outdated information

## Common Patterns

### Adding a New Service Pattern

```markdown
### Service Name

**Purpose**: Brief description

**Location**: `app/Services/ServiceName.php`

**Pattern**:
- Use dependency injection for dependencies
- Return structured data (Collections, arrays)
- Handle exceptions appropriately

**Example**:
```php
// Example code
```
```

### Adding a New Component Pattern

```markdown
### Component Name

**Purpose**: Brief description

**Location**: `resources/js/Components/ComponentName.tsx`

**Pattern**:
- Use TypeScript interfaces for props
- Follow existing component structure
- Use Tailwind classes for styling

**Example**:
```tsx
// Example code
```
```

### Adding a New Workflow Step

```markdown
### Workflow Name

**Status Flow**: Step1 → Step2 → Step3

**Service**: `app/Services/WorkflowService.php`

**Rules**:
- Status transitions must be validated
- Fire events for key transitions
- Use enum values, not strings
```

## Troubleshooting

**Rule not being followed?**
- Check if rule is in the correct file
- Verify rule is clear and specific
- Ensure rule doesn't conflict with other rules
- Check if rule needs to be in `00-overview.mdc` for project-wide application

**Rule seems outdated?**
- Review the rule in context
- Check if related code has changed
- Update or remove if no longer applicable
- Mark as deprecated if unsure

**Too many rules?**
- Group related rules together
- Extract common patterns
- Consider splitting large files into sub-sections
- Review and consolidate duplicates




