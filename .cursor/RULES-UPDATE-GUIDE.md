# 📝 Automatic Rules Update Guide

This guide explains how to automatically update your `.cursor/rules/*.mdc` files when important points need to be added.

## 🚀 Quick Start

**Simply tell the AI:**
```
Add to rules: [Your important point]

Context:
- Category: [domain/backend/frontend/database/styling/testing/refactoring/overview]
- Related to: [specific feature/component/service]
- Priority: [critical/important/nice-to-have]
```

The AI will automatically:
1. ✅ Identify the correct rules file
2. ✅ Find the appropriate section
3. ✅ Add the rule in the correct format
4. ✅ Update related sections if needed

## 📚 What Was Created

### 1. **README-UPDATING-RULES.md**
   - Complete guide on updating rules
   - File structure explanation
   - Format guidelines
   - Best practices
   - Location: `.cursor/rules/README-UPDATING-RULES.md`

### 2. **RULE-UPDATE-TEMPLATE.md**
   - Quick reference template
   - Category guide
   - Example formats
   - Location: `.cursor/rules/RULE-UPDATE-TEMPLATE.md`

### 3. **Helper Scripts**
   - **Bash script**: `.cursor/scripts/update-rules.sh`
   - **Node.js script**: `.cursor/scripts/update-rules.js`
   - Interactive guides for rule updates
   - Search existing rules
   - View file structures

## 🎯 How to Use

### Method 1: Direct AI Instruction (Recommended)

Just tell the AI what rule to add:

```
Add to rules: Product variants must always have a default variant marked with is_default=true

Context:
- Category: domain
- Related to: ProductVariant model, variant generation
- Priority: critical
- File path: app/Models/ProductVariant.php
```

### Method 2: Use the Helper Script

Run the interactive script:

```bash
# Bash version
./.cursor/scripts/update-rules.sh

# Or Node.js version
node .cursor/scripts/update-rules.js
```

The script will guide you through:
- Selecting the correct file
- Finding the right section
- Formatting your rule
- Showing you where to add it

### Method 3: Manual Update

1. Read `.cursor/rules/README-UPDATING-RULES.md` for guidelines
2. Use `.cursor/rules/RULE-UPDATE-TEMPLATE.md` as reference
3. Edit the appropriate `.mdc` file directly

## 📋 Rules File Structure

- `00-overview.mdc` - Project overview, tech stack, portals
- `10-domain.mdc` - Business domain rules (products, pricing, workflows)
- `20-backend.mdc` - Backend architecture (Laravel patterns)
- `21-database.mdc` - Database schema, migrations
- `30-frontend.mdc` - Frontend architecture (React, TypeScript)
- `31-frontend-style.mdc` - Brand styling, colors, typography
- `40-testing.mdc` - Testing guidelines
- `50-refactoring.mdc` - Code quality, DRY rules

## 🔍 Category Guide

When adding a rule, specify the category:

| Category | Goes To | Examples |
|----------|---------|----------|
| `domain` | `10-domain.mdc` | Business logic, workflows, pricing rules |
| `backend` | `20-backend.mdc` | Laravel patterns, services, controllers |
| `database` | `21-database.mdc` | Schema, migrations, naming conventions |
| `frontend` | `30-frontend.mdc` | React patterns, TypeScript, Inertia |
| `styling` | `31-frontend-style.mdc` | Colors, typography, UI components |
| `testing` | `40-testing.mdc` | Test patterns, coverage requirements |
| `refactoring` | `50-refactoring.mdc` | DRY, cleanup, code quality |
| `overview` | `00-overview.mdc` | Project-wide, tech stack changes |

## ✅ Verification Checklist

After adding a rule, verify:
- [ ] Rule is in the correct file
- [ ] Rule is in the appropriate section
- [ ] Formatting matches existing style
- [ ] File paths are correct (use backticks)
- [ ] Related sections updated if needed
- [ ] No duplicate rules
- [ ] Rule is clear and actionable

## 💡 Pro Tips

1. **Be specific**: Include file paths, service names, examples
2. **Be actionable**: Rules should tell what to do, not just describe
3. **Group related rules**: Keep similar rules together
4. **Update related sections**: If a rule affects multiple areas, update all
5. **Review periodically**: Check for outdated information

## 📖 Examples

### Example 1: Domain Rule
```
Add to rules: All orders must use OrderWorkflowService for status transitions

Context:
- Category: domain
- Related to: Order workflow, OrderWorkflowService
- Priority: critical
- File path: app/Services/OrderWorkflowService.php
```

### Example 2: Frontend Rule
```
Add to rules: All form submissions must use Inertia's useForm hook

Context:
- Category: frontend
- Related to: Form handling, Inertia.js
- Priority: important
```

### Example 3: Database Rule
```
Add to rules: All foreign keys must use cascade delete for child records

Context:
- Category: database
- Related to: Migrations, relationships
- Priority: critical
```

## 🛠️ Troubleshooting

**Rule not being followed?**
- Check if rule is in the correct file
- Verify rule is clear and specific
- Ensure rule doesn't conflict with other rules

**Rule seems outdated?**
- Review the rule in context
- Check if related code has changed
- Update or remove if no longer applicable

**Need help?**
- Read `.cursor/rules/README-UPDATING-RULES.md` for detailed guide
- Use `.cursor/rules/RULE-UPDATE-TEMPLATE.md` for quick reference
- Run the helper scripts for interactive guidance

## 🎉 You're All Set!

Now whenever you discover an important point that should be in the rules, just tell the AI using the format above, and it will automatically update the appropriate rules file for you!

---

## 📄 Creating Files Based on Requirements

When you need to create new files (controllers, services, components, etc.), the AI will:

1. ✅ **Analyze your requirements** - Understand what you need
2. ✅ **Check existing patterns** - Look at similar files in the codebase
3. ✅ **Create dynamically** - Build files that match your project structure
4. ✅ **Integrate properly** - Ensure files work with existing code

**Just describe what you need:**
```
Create a service to handle inventory management that:
- Tracks stock levels for product variants
- Updates inventory when orders are placed
- Integrates with OrderWorkflowService
- Sends alerts when stock is low
```

The AI will create the appropriate files following your project's patterns, not fixed templates.

**See `FILE-CREATION-INSTRUCTIONS.mdc`** for detailed guidelines on how the AI creates files.

