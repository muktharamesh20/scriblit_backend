Check file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts
running 21 tests from ./src/concepts/Scriblink/summarizer.test.ts
Principle: User creates, updates, and manages summaries for their items ...
------- output -------

📄 OPERATIONAL PRINCIPLE: Summary Management Workflow
============================================================

📝 Step 1: Creating initial summary for item
   ✅ Summary created successfully

👀 Step 2: Retrieving the summary
   ✅ Summary retrieved successfully

✏️  Step 3: Updating summary with new content
   ✅ Summary updated successfully

🔍 Step 4: Verifying updated summary
   ✅ Updated summary verified

📝 Step 5: Creating summary for second item
   ✅ Second summary created successfully
   📊 Final state: 2 items with summaries

🎉 OPERATIONAL PRINCIPLE COMPLETE
============================================================
----- output end -----
Principle: User creates, updates, and manages summaries for their items ... ok (610ms)
Constructor: Initializes SummariesConcept correctly ... ok (431ms)
Action: setSummary successfully creates a new summary ... ok (538ms)
Action: setSummary successfully updates an existing summary ... ok (547ms)
Action: setSummary returns error for empty summary ... ok (404ms)
Query: getSummary returns existing summary ... ok (530ms)
Query: getSummary returns an error for non-existent summary ... ok (560ms)
Action: deleteSummary successfully deletes an existing summary ... ok (580ms)
Action: deleteSummary returns error for non-existent summary ... ok (411ms)
Action: setSummaryWithAI successfully generates and saves a summary ... ok (542ms)
Action: setSummaryWithAI returns error for empty text ... ok (462ms)
Action: setSummaryWithAI handles LLM generation failure ...
------- output -------
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: LLM API failed to respond.
    at GeminiLLM.<anonymous> (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:438:26)
    at GeminiLLM.stub (https://jsr.io/@std/testing/1.0.16/mock.ts:1092:28)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:125:42)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:442:34
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Action: setSummaryWithAI handles LLM generation failure ... ok (501ms)
Action: setSummaryWithAI rejects summary with meta-language ...
------- output -------
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'as an ai', 'the main points are'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:470:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Action: setSummaryWithAI rejects summary with meta-language ... ok (432ms)
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ...
------- output -------
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 11.1% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:498:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ... ok (399ms)
Action: setSummaryWithAI rejects summary that is irrelevant ...
------- output -------
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:526:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Action: setSummaryWithAI rejects summary that is irrelevant ... ok (489ms)
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ...
------- output -------
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'the summary could not be generated because the content was unclear or unrelated.'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:554:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ... ok (485ms)
Interesting Scenario 1: AI summary about AI systems triggers false meta-language detection ...
------- output -------

🤖 SCENARIO 1: AI Content Meta-Language Edge Case
1. Generating AI summary about AI systems...
✓ AI summary about AI systems generated successfully
2. Verifying summary content...
✓ Summary correctly about AI systems, not meta-language
=== Scenario 1 Complete ===
----- output end -----
Interesting Scenario 1: AI summary about AI systems triggers false meta-language detection ... ok (541ms)
Interesting Scenario 2: Malicious prompt injection attempts and security validation ...
------- output -------

🔒 SCENARIO 2: Security and Prompt Injection Testing
1. Testing prompt injection attempt...
✓ Prompt injection handled correctly
2. Verifying summary content security...
✓ Summary correctly filtered malicious content
3. Testing SQL injection in manual summary...
✓ SQL injection in summary handled correctly
4. Testing XSS attempt in summary...
✓ XSS attempt handled correctly
=== Scenario 2 Complete ===
----- output end -----
Interesting Scenario 2: Malicious prompt injection attempts and security validation ... ok (537ms)
Interesting Scenario 3: Summary content validation and edge cases ...
------- output -------

📝 SCENARIO 3: Summary Content Validation and Edge Cases
1. Testing summary with only emojis and symbols...
✓ Emoji-only summary accepted
2. Testing summary with mathematical content...
✓ Mathematical summary accepted
3. Testing summary with code snippets...
✓ Code snippet summary accepted
4. Testing AI summary with creative content...
✓ Creative AI summary generated successfully
5. Testing summary with mixed languages...
✓ Multilingual summary accepted
6. Testing very short summary...
✓ Very short summary accepted
7. Testing summary with special characters...
✓ Special character summary accepted
8. Verifying all summaries can be retrieved...
✓ All summaries retrieved successfully
=== Scenario 3 Complete ===
----- output end -----
Interesting Scenario 3: Summary content validation and edge cases ... ok (631ms)
Interesting Scenario 4: AI summary validation and edge cases ...
------- output -------

🤖 SCENARIO 4: AI Validation Edge Cases
==================================================
1. Testing valid AI summary...
Error generating or validating AI summary for item 0199efab-bb49-781f-9bc1-bc1abbe37fbc: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:925:25
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- output end -----
Interesting Scenario 4: AI summary validation and edge cases ... FAILED (469ms)
Interesting Scenario 5: Summary replacement and idempotency ...
------- output -------

🔄 SCENARIO 5: Replacement and Idempotency
==================================================
1. Creating initial summary...
✓ Initial summary created
2. Replacing with identical content...
✓ Identical replacement succeeded
3. Replacing with different content...
✓ Different replacement succeeded
4. Verifying final state...
✓ Final state verified
5. Testing rapid updates...
✓ All rapid updates succeeded
✓ Final rapid update verified
=== Scenario 5 Complete ===
----- output end -----
Interesting Scenario 5: Summary replacement and idempotency ... ok (652ms)

 ERRORS 

Interesting Scenario 4: AI summary validation and edge cases => ./src/concepts/Scriblink/summarizer.test.ts:906:6
error: AssertionError: Expected actual: true not to be: true: Valid AI summary should succeed
  throw new AssertionError(
        ^
    at assertNotEquals (https://jsr.io/@std/assert/1.0.15/not_equals.ts:34:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:929:5

 FAILURES 

Interesting Scenario 4: AI summary validation and edge cases => ./src/concepts/Scriblink/summarizer.test.ts:906:6

FAILED | 20 passed | 1 failed (10s)