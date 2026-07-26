#!/usr/bin/env python3
import os
import sys
import subprocess

def run_step(command, step_name):
    """Executes a command and exits if the process fails."""
    print(f"\n🚀 Running {step_name}...")
    result = subprocess.run(command)
    if result.returncode != 0:
        print(f"\n❌ {step_name} failed!")
        sys.exit(result.returncode)

def main():
    # Check if 'bun' is present in the package manager's user agent
    user_agent = os.environ.get("npm_config_user_agent", "")

    if "bun" not in user_agent.lower():
        print("\n❌ Error: Bun is required to build this project.")
        print("👉 Please run 'bun run build' instead of npm, yarn, or pnpm.\n")
        sys.exit(1)

    print("\n⚡ Bun detected! Starting production build process...")

    try:
        # Step 1: Run vue-tsc -b
        run_step(["bunx", "vue-tsc", "-b"], "Vue Type Check (vue-tsc)")

        # Step 2: Run vite build
        run_step(["bunx", "vite", "build"], "Vite Production Build")

        print("\n✨ Build completed successfully!")

    except KeyboardInterrupt:
        print("\n⚠️ Build cancelled by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()
