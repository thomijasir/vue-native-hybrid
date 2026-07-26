#!/usr/bin/env python3

import os
import sys
import subprocess

def main():
    # Package managers set this environment variable when running scripts
    user_agent = os.environ.get("npm_config_user_agent", "")

    # Check if 'bun' is present in the user agent string
    if "bun" not in user_agent.lower():
        print("\n❌ Error: Bun is required to run this project.")
        print("👉 Please run 'bun dev' instead of npm, yarn, or pnpm.\n")
        sys.exit(1)

    print("\n⚡ Bun detected! Starting Vite...\n")

    try:
        # Launch Vite using Bun
        subprocess.run(["vite"], check=True)
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully without printing a Python stack trace
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()
