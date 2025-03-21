# Argus

Desktop application built with Tauri and React, following the Bulletproof React architecture.

## 🚀 About

Argus is a modern desktop application that leverages Tauri to create a lightweight and performant app with a reactive React user interface, structured according to the principles of the Bulletproof React architecture.

> Why did we name it Argus? Because like the mythological giant with a hundred eyes who could see everything, this app keeps a watchful eye on your data. Just don't expect it to turn into a peacock's tail if something goes wrong! 🦚👁️

_Note: The real reason is that every project needs a name, and "npm-create-tauri-app-v15.3-final-FINAL-for-real-this-time" was too long for the GitHub URL._

## ✨ Technologies

- **[Tauri](https://tauri.app/)** - Framework for building lightweight desktop apps
- **[React](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query](https://tanstack.com/query/latest)** - Server state management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Global state management
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Zod](https://github.com/colinhacks/zod)** - Schema validation
- **[React Router](https://reactrouter.com/)** - Routing
- **[Three.js](https://threejs.org/)** - 3D rendering
- **[D3.js](https://d3js.org/)** - Data visualization
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI components
- **[MSW](https://mswjs.io/)** - API mocking
- **[Vitest](https://vitest.dev/)** - Testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing

## 🏗️ Architecture

This project follows the [Bulletproof React](https://github.com/alan2207/bulletproof-react) architecture, a proven architecture for building maintainable and scalable React applications.

```
src/
|
├── assets/            # Static assets
├── components/        # Reusable UI components
│   ├── common/        # Generic highly reusable components
│   └── [domain]/      # Domain-specific components
│
├── config/            # Global application configuration
├── features/          # Features organized by domain
│   └── [feature]/
│       ├── api/       # API logic for the feature
│       ├── components/ # Feature-specific components
│       ├── hooks/     # Feature-specific hooks
│       ├── routes/    # Routes for the feature
│       ├── stores/    # Local state management
│       ├── types/     # Types/interfaces for the feature
│       └── utils/     # Utilities for the feature
│
├── hooks/             # Reusable hooks across the application
├── lib/               # Libraries and utilities
├── providers/         # React providers for context/data
├── routes/            # Route configuration
├── stores/            # Global state management (Zustand)
├── types/             # Global types
└── utils/             # Utility functions
```

## 🛠️ Installation

### Prerequisites

Before starting, make sure you have installed the necessary dependencies for Tauri. Follow the [Tauri installation guide](https://tauri.app/v1/guides/getting-started/prerequisites) for your operating system.

### Project Installation

```bash
# Clone the repository
git clone https://github.com/HerveDavid/argus
cd argus

# Install dependencies
pnpm install

# Start in development mode
pnpm tauri dev
```

## 📝 Available Scripts

- `pnpm dev` - Launches the app in development mode (frontend only)
- `pnpm build` - Compiles the app for production
- `pnpm preview` - Previews the production version
- `pnpm tauri` - Tauri commands
- `pnpm tauri dev` - Launches the Tauri app in development mode
- `pnpm tauri build` - Compiles the Tauri app for production

## 📚 Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Bulletproof React Architecture](https://github.com/alan2207/bulletproof-react)

## 🧪 Tests

```bash
# Unit and integration tests
pnpm test

# E2E tests
pnpm test:e2e
```

## 📦 Building for Production

```bash
pnpm tauri build
```

This command generates installers for your target operating system in the `src-tauri/target/release/bundle` folder.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.