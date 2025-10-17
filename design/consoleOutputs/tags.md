(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys src/concepts/Scriblink/summarizer.test.ts  
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

error: Test failed
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

(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys src/concepts/Scriblink/tags.test.ts      
Check file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/tags.test.ts
running 12 tests from ./src/concepts/Scriblink/tags.test.ts
Principle: User flags items, then retrieves items by tag and tags by item ...
------- output -------

🏷️  OPERATIONAL PRINCIPLE: Tag Management Workflow
============================================================

🏷️  Step 1: Adding tag to item
   ✅ Tag 'important' added to itemA

🏷️  Step 2: Adding same tag to another item
   ✅ Tag 'important' added to itemB (reusing same tag)

🏷️  Step 3: Adding different tag to item
   ✅ Tag 'review' added to itemA (new tag created)

🔍 Step 4: Retrieving items by tag
   ✅ Found 2 items with 'important' tag: itemA, itemB

🔍 Step 5: Retrieving tags for item
   ✅ Found 2 tags for itemA: 'important', 'review'

🗑️  Step 6: Removing tag from item
   ✅ Tag 'important' removed from itemA

🔍 Step 7: Verifying tag removal effects
   ✅ 'important' tag now has only itemB (itemA removed)

🔍 Step 8: Verifying item's remaining tags
   ✅ itemA now has only 'review' tag

🔍 Step 9: Retrieving all user tags
   ✅ User has 2 tags: 'important' (1 item), 'review' (1 item)
   📊 Final state: itemA has 'review', itemB has 'important'

🎉 OPERATIONAL PRINCIPLE COMPLETE
============================================================
----- output end -----
Principle: User flags items, then retrieves items by tag and tags by item ... ok (691ms)
Action: addTag creates new tag or adds to existing, enforces requirements ... ok (685ms)
Action: removeTagFromItem successfully removes association and enforces requirements ... ok (738ms)
Query: _getItemsByTag retrieves associated items or error ... ok (726ms)
Query: _getTagsForItem retrieves tags associated with an item for a specific user ... ok (683ms)
Query: _getTagDetails retrieves full tag structure or error ... ok (641ms)
Query: _getAllUserTags retrieves all tags owned by a user ... ok (619ms)
Interesting Scenario 1: Tag collision and namespace conflicts ...
------- output -------

🏷️  SCENARIO 1: Tag Collision and Namespace Conflicts
1. Testing case-sensitive tag conflicts...
✓ All case-sensitive tags accepted as separate tags
2. Testing special character tag conflicts...
✓ All special character tags accepted
3. Testing unicode tag conflicts...
✓ All unicode tags accepted
4. Testing very long tag names...
✓ Very long tag accepted
5. Testing empty and whitespace tags...
----- output end -----
Interesting Scenario 1: Tag collision and namespace conflicts ... FAILED (969ms)
Interesting Scenario 2: Tag semantic similarity and fuzzy matching ...
------- output -------

🔍 SCENARIO 2: Tag Semantic Similarity and Fuzzy Matching
1. Creating semantically similar tags...
✓ All semantically similar tags created
2. Testing tag retrieval for similar tags...
✓ All similar tags retrieved correctly
3. Testing tag variations and typos...
✓ All tag variations accepted
4. Testing tag abbreviations and acronyms...
✓ All abbreviation tags accepted
5. Testing tags with numbers and versions...
✓ All version tags accepted
6. Testing tag removal with similar tags...
✓ Urgent tag removed successfully
7. Verifying remaining similar tags...
✓ Similar tags preserved after removal
8. Testing tag search with partial matches...
✓ Partial tag matching works correctly

🎉 SCENARIO 2 COMPLETE
==================================================
----- output end -----
Interesting Scenario 2: Tag semantic similarity and fuzzy matching ... ok (2s)
Interesting Scenario 3: Tag performance under high load ...
------- output -------

⚡ SCENARIO 3: Tag Performance Under High Load
1. Creating tags rapidly...
✓ 100 rapid tag creations completed
2. Testing concurrent tag operations...
✓ Concurrent operations: 100 succeeded, 0 failed
3. Testing large tag retrieval...
✓ Retrieved 100 tags for itemA
4. Performance measurement: 3487ms for all operations
✓ Performance within acceptable limits

🎉 SCENARIO 3 COMPLETE
==================================================
----- output end -----
Interesting Scenario 3: Tag performance under high load ... ok (3s)
Interesting Scenario 4: Tag data corruption and recovery ...
------- output -------

🔧 SCENARIO 4: Tag Data Corruption and Recovery
1. Creating normal tag structure...
✓ Normal tag structure created
2. Testing malformed tag labels...
✓ Malformed tag "null-char" accepted (sanitized)
✓ Malformed tag "tagwithcontrolchars" accepted (sanitized)
✓ Malformed tag "tag
with
newlines" accepted (sanitized)
✓ Malformed tag "tag    with    tabs" accepted (sanitized)
3. Testing extremely long tag labels...
✓ Extremely long tag accepted
4. Testing duplicate tag handling...
✓ Duplicate tag correctly rejected
5. Testing removal of non-existent tag...
✓ Non-existent tag removal correctly rejected
6. Verifying data integrity after corruption tests...
✓ Data integrity maintained after corruption tests

🎉 SCENARIO 4 COMPLETE
==================================================
----- output end -----
Interesting Scenario 4: Tag data corruption and recovery ... ok (886ms)
Interesting Scenario 5: Cross-user tag pollution and isolation ...
------- output -------

👥 SCENARIO 5: Cross-User Tag Pollution and Isolation
1. Alice creating tags...
✓ Alice's tags created
2. Bob creating similar tags...
✓ Bob's tags created
3. Testing tag isolation between users...
✓ Tag isolation maintained between users
4. Testing shared tag concept...
----- output end -----
Interesting Scenario 5: Cross-user tag pollution and isolation ... FAILED (737ms)

 ERRORS 

Interesting Scenario 1: Tag collision and namespace conflicts => ./src/concepts/Scriblink/tags.test.ts:743:6
error: AssertionError: Values are not equal: Empty tag should be rejected


    [Diff] Actual / Expected


-   false
+   true

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.15/equals.ts:65:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/tags.test.ts:838:5

Interesting Scenario 5: Cross-user tag pollution and isolation => ./src/concepts/Scriblink/tags.test.ts:1365:6
error: AssertionError: Expected actual: true not to be: true: Alice shared items should be retrievable
  throw new AssertionError(
        ^
    at assertNotEquals (https://jsr.io/@std/assert/1.0.15/not_equals.ts:34:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/tags.test.ts:1458:5

 FAILURES 

Interesting Scenario 1: Tag collision and namespace conflicts => ./src/concepts/Scriblink/tags.test.ts:743:6
Interesting Scenario 5: Cross-user tag pollution and isolation => ./src/concepts/Scriblink/tags.test.ts:1365:6

FAILED | 10 passed | 2 failed (14s)