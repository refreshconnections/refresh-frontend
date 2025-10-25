#!/usr/bin/env python3
import os
import shutil
import subprocess

print("🛠️  After building frontend in docker, copying static images, and syncing Capacitor...")

ROOT = os.getcwd()
BUILD_DIR = os.path.join(ROOT, "static", "frontend")
IMG_SRC = os.path.join(BUILD_DIR, "img")
STATIC_TARGET_PARENT = os.path.join(BUILD_DIR, "static")
STATIC_TARGET = os.path.join(STATIC_TARGET_PARENT, "img")

def run(cmd):
    print(f"\n👉 {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        raise SystemExit(f"❌ Command failed: {cmd}")

# 1️⃣ Build frontend
# run("npm run build")

# 2️⃣ Copy img folder into static/frontend/static/img
if os.path.exists(IMG_SRC):
    os.makedirs(STATIC_TARGET_PARENT, exist_ok=True)
    print(f"📁 Copying {IMG_SRC} → {STATIC_TARGET}")
    # remove old folder if exists
    if os.path.exists(STATIC_TARGET):
        shutil.rmtree(STATIC_TARGET)
    shutil.copytree(IMG_SRC, STATIC_TARGET)
else:
    print("⚠️  No static/frontend/img folder found — skipping image copy")

# 3️⃣ Sync with Capacitor
run("npx cap sync")

print("\n✅ Done! Your images are now available in Capacitor\n")
