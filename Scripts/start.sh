#!/bin/bash
cd apps/backend-api && go run main.go &
cd apps/overlay-ui && bun run dev
