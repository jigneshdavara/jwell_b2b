# Elvee Next.js Frontend

This is the Next.js migration of the Elvee B2B Jewelry Platform.

## Structure

- `src/app`: App Router structure mirroring Laravel portals.
  - `(customer)`: Customer portal routes.
  - `admin`: Admin portal routes.
  - `production`: Production portal routes.
  - `auth`: Authentication routes.
- `src/components`: Reusable React components.
  - `ui`: Base UI elements (Button, Input, etc.).
  - `shared`: Layout components (Headers, Footers).
- `src/services`: API clients for backend communication.
- `src/hooks`: Custom React hooks.
- `src/utils`: Utility functions.
- `src/types`: TypeScript definitions.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Conversion Progress

- [x] Directory structure
- [x] Portal layout placeholders
- [x] Basic UI components (Button, Input)
- [x] API client setup
- [ ] Porting of pages from `resources/js/Pages`
- [ ] Porting of components from `resources/js/Components`

