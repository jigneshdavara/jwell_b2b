## Cursor Coding Rules

1. **Embrace Laravel conventions first.** Leverage framework features (Eloquent, service containers, events, policies) before custom implementations.
2. **Keep controllers thin.** Offload domain logic to dedicated service classes in `app/Services` or action classes in `app/Actions`.
3. **Apply the DRY principle.** Extract shared logic into services, traits, scopes, Blade components, or Vue/React components.
4. **Use form requests for validation.** Place them under `app/Http/Requests` and keep validation rules out of controllers.
5. **Model relationships explicitly.** Define Eloquent relationships, attribute casting, and accessors/mutators within models.
6. **Organize views/components per portal.** Use separate namespace folders for public, customer, admin, and production modules.
7. **Isolate configuration/constants.** Centralize business rules and enums under `app/Enums` or config files, avoiding magic strings.
8. **Write migrations + seeders consistently.** Ensure schema changes are reversible and provide baseline seed data for development.
9. **Document service boundaries.** Add docblocks or markdown notes describing responsibilities and inputs/outputs where helpful.
10. **Prefer reusable frontend assets.** Utilize component libraries (Blade, Vue, React) with Bootstrap styling; keep JS/CSS modular.

These guidelines must be followed for all future changes unless explicitly overridden by the user.

