# React Hook Form Controller Example

## Example: Email Input with Controller

This example shows how to use `Controller` instead of manual `register()` and `handleFieldChange` functions.

### Before (Manual Approach - Current Code)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors },
  clearErrors,
  trigger,
  touchedFields,
} = useForm<ForgotPasswordFormData>({
  resolver: zodResolver(forgotPasswordSchema),
  mode: "onBlur",
  reValidateMode: "onChange",
});

// Manual handler function (lots of code)
const handleFieldChange = (field: keyof ForgotPasswordFormData) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value || value.trim() === "") {
      clearErrors(field);
      trigger(field);
    } else if (touchedFields[field]) {
      trigger(field);
    } else if (errors[field]) {
      clearErrors(field);
    }
  };
};

// In JSX (complex)
<input
  id="email"
  type="email"
  {...register("email")}
  onChange={(e) => {
    register("email").onChange(e);
    handleFieldChange("email")(e);
  }}
/>
<InputError message={errors.email?.message} />
```

### After (Controller Approach - Simplified)

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm<ForgotPasswordFormData>({
  resolver: zodResolver(forgotPasswordSchema),
  mode: "onBlur",           // Validates on blur
  reValidateMode: "onChange", // Re-validates on change after first validation
});

// In JSX (simple and clean)
<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        {...field}  // Automatically handles onChange, onBlur, value, name
        className={fieldState.error ? "border-red-300" : "border-slate-300"}
      />
      <InputError message={fieldState.error?.message} />
    </div>
  )}
/>
```

## Benefits of Controller

1. **Less Code**: No need for manual `handleFieldChange` functions
2. **Automatic**: React Hook Form handles onChange, onBlur, value automatically
3. **Built-in State**: `fieldState` provides error, invalid, isTouched, isDirty
4. **Cleaner**: All field logic in one place
5. **Type Safe**: Full TypeScript support

## How It Works

- `field` object contains: `onChange`, `onBlur`, `value`, `name`, `ref`
- `fieldState` contains: `error`, `invalid`, `isTouched`, `isDirty`, `isTouched`
- React Hook Form automatically:
  - Validates on blur (due to `mode: "onBlur"`)
  - Re-validates on change (due to `reValidateMode: "onChange"`)
  - Shows/hides errors automatically
  - Clears errors when field becomes valid

## Complete Example for Forgot Password

```typescript
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validation/auth.schema";

export default function ForgotPasswordPage() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await authService.forgotPassword(data.email);
      // Success handling
    } catch (error: any) {
      // Backend error handling
      if (error?.response?.data?.message) {
        setError("root", {
          type: "server",
          message: error.response.data.message,
        });
      }
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              {...field}
              className={fieldState.error ? "border-red-300" : "border-slate-300"}
            />
            <InputError message={fieldState.error?.message} />
          </div>
        )}
      />
      
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

## Key Points

- **No manual handlers needed** - Controller handles everything
- **Automatic validation** - Works with `mode` and `reValidateMode`
- **Error state built-in** - `fieldState.error` provides current error
- **Cleaner code** - Much less boilerplate

