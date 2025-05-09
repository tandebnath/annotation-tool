# Building the Annotation Tool

This guide explains how to generate builds - both native & cross-platform - for the Annotation Tool.

---

## 🔧 Prerequisites

Make sure the following are installed on your system:

* **Node.js** (>= 14.x recommended)
* **npm** (>= 7.x recommended)
* **Electron Builder** (via `npm install electron-builder`)
* **Docker Desktop** (for Docker-based builds)

> Make sure `electron-builder` is set up in the `package.json` file under the `build` field.

---

## 🖥️ Native Builds (Platform-Specific)

These methods build the app natively on the same OS platform.
> The steps provided will create builds in `release/build/` directory.

### macOS (produces `.app`, `.dmg`, and `.zip`)

You must run this on a MacOS machine.

```bash
npm install
npm run build
npm run package  
```

### Linux (produces `.deb` and `.AppImage`)

You must run this on a Linux machine.

```bash
npm install
npm run build
npx electron-builder --linux
```

* `.deb`: Installable via `dpkg` or `apt`. Ideal for Ubuntu/Debian.
* `.AppImage`: A portable binary that runs on most Linux distributions.

### Windows (produces `.exe` installer)

You must run this on a Windows machine.

```bash
npm install
npm run build
npx electron-builder --win
```

---

## 🐳 Cross-Platform Builds with Docker

If you're on one platform and want to create builds for other platforms, Docker lets you build for Linux and Windows. (macOS build generation from non-macOS platforms is **not supported** due to Apple restrictions.)

### Step 1: Install Docker

Make sure Docker is installed and running. You can get it at [https://www.docker.com/](https://www.docker.com/).

### Step 2: Pull the Electron builder image

```bash
docker pull electronuserland/builder
```

### Step 3: Build for Linux inside Docker

```bash
docker run --rm \
  --platform linux/amd64 \
  -e ELECTRON_CACHE="/root/.cache/electron" \
  -e ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v "$(pwd)":/project \
  -w /project \
  electronuserland/builder \
  /bin/bash -c "npm install && npm run build && npx electron-builder --linux"
```

> Produces both `.AppImage` and `.deb` files in the `release/build/` directory.

### Step 4: Build for Windows inside Docker

```bash
docker run --rm \
  -e ELECTRON_CACHE="/root/.cache/electron" \
  -e ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v "$(pwd)":/project \
  -w /project \
  electronuserland/builder \
  /bin/bash -c "npm install && npm run build && npx electron-builder --win"
```

> Produces `.exe` file in the `release/build/` directory.

### ⚠️ macOS Builds on Docker?

**Not possible.** You must run macOS builds **on a macOS machine**. Apple requires a macOS environment for signing and packaging `.dmg` files.

---

## 🧪 Optional: Test Linux AppImage inside Docker

```bash
docker run -it --rm \
  -v "$(pwd)/release/build:/mnt" \
  ubuntu:22.04 \
  bash

# Inside container:
cd /mnt
chmod +x *.AppImage
./YourApp.AppImage
```

---

## 💡 Notes

* macOS `.dmg` and `.zip` builds will only run on macOS.
* Linux `.deb` works best on Ubuntu/Debian-based distros.
* Linux `.AppImage` is portable across most distros.
* Windows `.exe` requires Windows or Wine to test.
* Do not commit your build files; ensure your `.gitignore` includes:

```
release/build
release/app/dist
```

---

## 📦 Creating a GitHub Release

1. Go to your GitHub repo → **Releases** → **Draft a new release**
2. Set tag as `v1.0.0` or similar
3. Upload `.dmg`, `.AppImage`, `.deb`, and/or `.exe` files
4. Click **Publish release**

---

You're all set to distribute your own build of the Annotation Tool!
