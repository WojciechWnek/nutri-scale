# nutri-scale - Project Overview

This project is a NestJS (Node.js) application written in TypeScript. App is a backend layer and will allow users to scan or upload PDF's with recipes. It will then extract data from those files and save extracted data. Then the data will be accessible in the app repository for quick recipes access. It will also allow user to scale meal portion and adjust macronutrients for scaled meals. The project leverages `pnpm` for efficient package management.

## Building and Running

To get started with the project, follow these steps:

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Build the project:**

    ```bash
    pnpm run build
    ```

3.  **Run the application in development mode (with watch for changes):**

    ```bash
    pnpm run start:dev
    ```

    The application will typically be available at `http://localhost:3000`.

4.  **Run the application in production mode:**
    ```bash
    pnpm run start:prod
    ```

## Testing

The project includes configurations for unit and end-to-end tests:

1.  **Run unit tests:**

    ```bash
    pnpm run test
    ```

2.  **Run end-to-end tests:**

    ```bash
    pnpm run test:e2e
    ```

3.  **Run tests and generate coverage reports:**
    ```bash
    pnpm run test:cov
    ```

## Development Conventions

This project adheres to the following development conventions:

- **Linter:** [ESLint](https://eslint.org/) is configured using `eslint.config.mjs` to enforce code quality and style. It can be run with `pnpm run lint`.
- **Formatter:** [Prettier](https://prettier.io/) is configured via `.prettierrc` for consistent code formatting. It can be applied with `pnpm run format`.
- **TypeScript:** The project is written in TypeScript, with `tsconfig.json` specifying strict compilation settings and targeting `ES2023`.
- **NestJS CLI:** The presence of `nest-cli.json` indicates the project follows standard NestJS CLI conventions for project structure, code generation, and compilation.
- **Architectural Pattern:** The application follows the standard NestJS modular architecture, utilizing modules, controllers, and services for organized code.

### Additional

- Don't run `pnpm run start:dev` - i will run ti myself
