#!/bin/bash

# Run integration tests for summarizer with real Gemini API
echo "🧪 Running Summarizer Integration Tests with Real Gemini API..."
echo "⚠️  Make sure you have GEMINI_API_KEY set in your environment"
echo ""

# Check if API key is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY environment variable is not set"
    echo "Please set it with: export GEMINI_API_KEY=your_api_key_here"
    exit 1
fi

echo "✅ GEMINI_API_KEY is set"
echo ""

# Run the integration tests
deno test --allow-net --allow-env src/concepts/Scriblink/summarizer.integration.test.ts

echo ""
echo "🎉 Integration tests completed!"
