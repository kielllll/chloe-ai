#!/bin/bash

PROMPT_PARAM="${1:-Tell me a joke}"

curl -N -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$PROMPT_PARAM\"}"

echo "" # Add newline after response