# Validation Guide: React Hook Form + Zod

This guide explains how to implement validation on both frontend and backend.

## Installation

```bash
cd next-frontend
npm install react-hook-form zod @hookform/resolvers
```

## Architecture

### Frontend (Next.js)
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation with TypeScript inference
- **@hookform/resolvers**: Connects Zod schemas to React Hook Form

### Backend (NestJS)
- **class-validator**: Already installed and configured
- **class-transformer**: Type transformation

## Workflow

1. **Frontend Validation (Client-side)**
   - User fills form → Zod schema validates → React Hook Form shows errors
   - Fast, immediate feedback, no API call

2. **Backend Validation (Server-side)**
   - Form submitted → API call → NestJS DTO validation → Errors returned
   - Security, data integrity, business rules

3. **Error Handling**
   - Backend errors converted to React Hook Form format
   - Displayed alongside frontend validation errors

## Creating Validation Schemas

### Step 1: Create Zod Schema

```typescript
// src/lib/validation/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1, 'The product name field is required.'),
    sku: z.string().min(1, 'The SKU field is required.'),
    brand_id: z.number().int().positive('The brand must be a valid selection.'),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
```

### Step 2: Use in Component

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@/lib/validation/product.schema';

const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createProductSchema),
    mode: 'onBlur', // Validate when field loses focus (recommended)
    reValidateMode: 'onChange', // Re-validate on change after first validation
});
```

**Validation Modes:**
- `onBlur` (recommended): Validates when field loses focus - **Best UX, no errors while typing**
- `onChange`: Validates on every keystroke - **Instant feedback, may be noisy**
- `onSubmit`: Validates only on submit - **Less responsive**
- `onTouched`: Validates after first blur, then on change - **Good balance**
- `all`: Validates on both blur and change - **Most aggressive**

### Step 3: Handle Backend Errors

```typescript
const onSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    const response = await api.post('/api/products', data);
    // Handle success
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error?.[0]?.message || 
                         error?.response?.data?.message || 
                         error?.message || 
                         'An error occurred. Please try again.';
    setError('root', {
      type: 'server',
      message: errorMessage,
    });
  } finally {
    setLoading(false);
  }
};
```

## Keeping Frontend & Backend in Sync

### Option 1: Manual Sync (Current Approach)
- Create Zod schemas that mirror NestJS DTOs
- Update both when validation rules change
- Document changes in PR descriptions

### Option 2: Shared Validation Package (Future)
- Create a shared package with validation schemas
- Use Zod on frontend, convert to class-validator on backend
- Single source of truth

## Real-Time Validation

React Hook Form supports real-time validation with different modes:

### Recommended: `onBlur` Mode (Default)
- Validates when user finishes typing (field loses focus)
- Good balance between responsiveness and UX
- Prevents showing errors while user is still typing

```typescript
const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
});
```

### Instant Feedback: `onChange` Mode
- Validates on every keystroke
- Instant feedback, but can be noisy
- Use for critical forms where immediate feedback is needed

```typescript
const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on every change
});
```

### Using Controller Component (Recommended)

```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <div>
      <input {...field} />
      <InputError message={fieldState.error?.message} />
    </div>
  )}
/>
```

## Best Practices

1. **Validate Early**: Frontend validation prevents unnecessary API calls
2. **Validate Always**: Backend validation is the source of truth
3. **Real-Time Feedback**: Use `onBlur` mode for better UX (validates when user finishes typing)
4. **Clear Messages**: Use same error messages on frontend and backend
5. **Type Safety**: Use `z.infer<>` to get TypeScript types from schemas
6. **Error Handling**: Always handle both frontend and backend errors

## Example: Complete Form

See `src/app/login/page.tsx` for a complete example with Controller component.

## Migration Strategy

1. **Start Small**: Migrate one form at a time
2. **Keep Existing**: Don't break existing forms during migration
3. **Test Thoroughly**: Ensure both frontend and backend validation work
4. **Document**: Update team on new validation patterns

