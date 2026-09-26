#!/bin/bash
# Persistent dev server respawn script.
# Runs `bunx next dev -p 3000` and respawns it if it dies.
# Detached via setsid so it survives parent shell exit.

cd /home/z/my-project

LOG=/home/z/my-project/dev-direct.log

while true; do
  echo "[$(date)] Starting next dev..." >> "$LOG"
  nohup bunx next dev -p 3000 >> "$LOG" 2>&1
  EXIT=$?
  echo "[$(date)] next dev exited with $EXIT, restarting in 3s..." >> "$LOG"
  sleep 3
done
