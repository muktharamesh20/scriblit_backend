(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys src/concepts/Scriblink/summarizer.integration.test.ts
Check file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts
running 4 tests from ./src/concepts/Scriblink/summarizer.integration.test.ts
Integration: setSummaryWithAI with real Gemini - long technical text ...
------- output -------
✅ Long text summary: *   **Entanglement Explained:** Particles linked, sharing fates across any distance.
*   **Instantaneous Influence:** Measuring one affects the other immediately, defying classical locality.
*   **"Spooky Action":** Einstein's term for this non-local connection.
*   **Implications:** Challenges reality, enables quantum technologies.
*   **Measurement Problem:** How superposition collapses to a definite state.
----- output end -----
Integration: setSummaryWithAI with real Gemini - long technical text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - short text ...
------- output -------
✅ Short text summary: *   The nature of short texts
*   Example sentence: "The quick brown fox jumps over the lazy dog."
----- output end -----
Integration: setSummaryWithAI with real Gemini - short text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - technical content ...
------- output -------
✅ Technical text summary: *   **What Machine Learning Is:**
    *   Learning from data
    *   Types: Supervised, Unsupervised, Reinforcement
*   **Key Concepts:**
    *   Algorithms (e.g., regression, neural networks)
    *   Applications (e.g., image recognition, NLP)
*   **Challenges:**
    *   Overfitting and bias
    *   Data requirements
----- output end -----
Integration: setSummaryWithAI with real Gemini - technical content ... ok (1s)
Integration: setSummaryWithAI with real Gemini - edge cases ...
------- output -------
Error generating or validating AI summary for item 0199efac-b2df-78f6-990e-950bb568648a: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 16.7% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts:182:25
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
⚠️  Very short text failed: Failed to generate or validate AI summary: ContentRelevanceError: Summary appears unrelated to source text. Only 16.7% of summary words overlap with original content (min 20% required).
✅ Empty text correctly rejected
----- output end -----
Integration: setSummaryWithAI with real Gemini - edge cases ... ok (1s)

ok | 4 passed | 0 failed (4s)