## Argus
Desktop application built with Tauri and React, following the Bulletproof React architecture.

### 🚀 About
Argus is a modern desktop application that leverages Tauri to create a lightweight and performant app with a reactive React user interface, structured according to the principles of the Bulletproof React architecture.
Why did we name it Argus? Because like the mythological giant with a hundred eyes who could see everything, this app keeps a watchful eye on your data. Just don't expect it to turn into a peacock's tail if something goes wrong! 🦚👁️
Note: The real reason is that every project needs a name, and "npm-create-tauri-app-v15.3-final-FINAL-for-real-this-time" was too long for the GitHub URL.

### ✨ Technologies
- Tauri - Framework for building lightweight desktop apps
- React - UI library
- TypeScript - Static typing
- Vite - Fast build tool
- Tailwind CSS - Utility-first CSS framework
- React Query - Server state management
- Zustand - Global state management
- React Hook Form - Form handling
- Zod - Schema validation
- React Router - Routing
- Three.js - 3D rendering
- D3.js - Data visualization
- Radix UI - Unstyled, accessible UI components
- MSW - API mocking
- Effect-TS - Functional programming library for TypeScript
- Vitest - Testing framework
- Playwright - E2E testing

### 🏗️ Architecture
This project follows the Bulletproof React architecture, a proven architecture for building maintainable and scalable React applications.

```src/
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

### 🛠️ Installation

#### Prerequisites
Before starting, make sure you have installed the necessary dependencies for Tauri. Follow the Tauri installation guide for your operating system.

Additional Requirements:
- Install Python 3.10 and set up a virtual environment

#### Project Installation

```# Clone the repository
git clone https://github.com/HerveDavid/argus
cd argus

# Install dependencies
pnpm install

# Build sidecars (only needed once)
pnpm build:sidecars

# Start in development mode
pnpm tauri dev

```

### 🐛 Known Issues

Project Reliability:
The project is not yet fully stabilized. If you encounter issues:
- Try right-clicking and selecting "Reload" to refresh the application

### 📝 Available Scripts
- pnpm dev - Launches the app in development mode (frontend only)
- pnpm build - Compiles the app for production
- pnpm preview - Previews the production version
- pnpm tauri - Tauri commands
- pnpm tauri dev - Launches the Tauri app in development mode
- pnpm tauri build - Compiles the Tauri app for production
- pnpm build:sidecars - Builds the required sidecars

### 📚 Resources
- Tauri Documentation
- React Documentation
- Bulletproof React Architecture

### 🤝 Contributing
1. Fork the project
2. Create your feature branch ( git checkout -b feature/amazing-feature)
3. Commit your changes ( git commit -m 'feat: Add some amazing feature')
4. Push to the branch ( git push origin feature/amazing-feature)
5. Open a Pull Request

### 📄 License
This project is licensed under the MIT License.