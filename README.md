# Annotation Tool

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/) [![Electron](https://img.shields.io/badge/Electron-2C2E3B?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/) [![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com/)


## Overview

The Annotation Tool is a desktop application built with Electron and React. It provides an intuitive interface for annotating books, tracking progress, and managing metadata. This version replaces the previous Flask/Python-based web application.

## Steps to Run

### 1. Install Node.js and npm
Download and install Node.js and npm from [here](https://nodejs.org/).

### 2. Install Dependencies
a. Open a terminal or command prompt.  
b. Navigate to your project directory.  
c. Run the following command to install the required packages:
   ```bash
   npm install
   ```

### 3. Install Dependencies
a. To run the application in development mode with hot-reloading, use the following command:
   ```bash
   npm run start
   ```
This will start both the Electron main process and the React renderer process.

### 4. Build the Application (Production)
a. To build the application for production, use the following command:
   ```bash
   npm run package
   ```
This will create the executable for your platform (Windows, macOS, or Linux) inside the `release/build` directory.

### 5. Running the Built Application
After building the application, you can find the executable inside the `release/build` directory. Simply double-click the executable to run the application.


## Accessing the Older Version
The previous version of this tool, which was built with Flask and Python, is archived on the v1_flask branch. You can access it [here](https://github.com/tandebnath/annotation-tool/tree/v1_flask).