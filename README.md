# Annotation Tool

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/) [![Electron](https://img.shields.io/badge/Electron-2C2E3B?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/) [![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com/)

## Overview

The Annotation Tool is a desktop application built with Electron and React. It provides an intuitive interface for annotating books - both prose and poetry, tracking progress, and managing metadata. 

## 💾 Download

You can download the latest release of the Annotation Tool directly from GitHub:

👉 [**Go to Releases**](https://github.com/tandebnath/annotation-tool/releases)

Choose the appropriate file for your OS:

* **macOS**: `.dmg` or `.zip`
* **Linux**: `.AppImage` (portable) or `.deb` (Ubuntu/Debian)
* **Windows**: `.exe` installer

## 🟢 Run the App (Development Mode)

### 1. Install Node.js and npm

Download and install Node.js and npm from [here](https://nodejs.org/).

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App (Development Mode)

```bash
npm run start
```

This will launch the Electron app with hot-reloading.

## 🔨 Build the App (Production)

To build the app for production use:

```bash
npm run package
```

The build artifacts will be generated in the `release/build/` directory.

For more advanced build instructions (including Docker and cross-platform builds):

👉 See [`BUILDING.md`](./BUILDING.md)

---

## 🕰️ Accessing the Older Version

The previous version of this tool, which was built with Flask and Python, is archived on the `v1_flask` branch. You can access it [here](https://github.com/tandebnath/annotation-tool/tree/v1_flask).
