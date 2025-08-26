# demo-ext-chat-app

A React + TypeScript + Vite application deployed to GitHub Pages.

## 🚀 Getting Started

### Prerequisites
- Node.js (version 22+ recommended - required by Vite 7+)
- npm

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup GitHub Pages

1. Push your code to the `main` branch
2. Go to your repository Settings → Pages
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy your app

Your app will be available at: `https://[your-username].github.io/demo-ext-chat-app/`

## ✨ Features

- **⚡ Vite** - Lightning fast build tool and dev server
- **⚛️ React 19** - Latest React with TypeScript support
- **🚀 GitHub Pages Ready** - Pre-configured deployment workflow
- **🛣️ SPA Routing Support** - 404.html for client-side routing
- **🔧 Auto Configuration** - Base path automatically set from package.json
- **📱 Modern Setup** - ESLint, TypeScript, and modern tooling
- **🎨 Clean Structure** - Well-organized project structure

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Build the project

## 🏗️ Built With

- [React](https://reactjs.org/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Vite](https://vitejs.dev/) - Build Tool
- [GitHub Pages](https://pages.github.com/) - Hosting

## 📁 Project Structure

```
demo-ext-chat-app/
├── public/
│   ├── 404.html          # SPA routing support
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Pages deployment
├── index.html
├── vite.config.ts         # Vite configuration
└── package.json
```

## 🔧 Configuration

The project is pre-configured for GitHub Pages deployment:

- **Vite Config**: Automatically sets the correct base path from package.json name
- **GitHub Actions**: Deploys on every push to main branch
- **SPA Routing**: 404.html enables client-side routing
- **Asset Optimization**: Vite handles bundling and optimization

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request