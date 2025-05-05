# Sudoku Game

<div align="right">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</div>

A modern, feature-rich Sudoku core library and application interface, supporting various Sudoku variants, difficulty levels, and assistance features.

![img](./img_6x6.png)

## Features

- 📱 Responsive design, adapting to various screen sizes
- 🔢 Multiple board sizes (4x4, 6x6, 9x9, etc.)
- 🎮 Multiple Sudoku variants (classic, diagonal, etc.)
- 🧩 Automatic candidate calculation and display
- 🎯 Multiple difficulty levels (easy, medium, hard, expert)
- 💾 Game progress saving and restoration
- 🎨 Customizable settings
- 🔍 Solving assistance tools
- Other core library features have been implemented or placeholders have been reserved, UI interfaces to be implemented in future updates

## Tech Stack

React + Vite + TypeScript + Tailwind CSS + DaisyUI

## Quick Start

### Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn
```

### Development Environment

```bash
pnpm dev
```

Visit http://localhost:3000 to view the application

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm serve
```

## Project Structure

```
.
├── public/              # Static assets
├── src/                 # Source code
│   ├── core/            # Sudoku core logic
│   │   ├── engine/      # Sudoku engine
│   │   ├── solvers/     # Solving algorithms
│   │   ├── generators/  # Puzzle generation
│   │   ├── validation/  # Rule validation
│   │   ├── variants/    # Sudoku variants
│   │   └── ...
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom Hooks
│   ├── store/           # State management
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry file
├── tests/               # Test files
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```
