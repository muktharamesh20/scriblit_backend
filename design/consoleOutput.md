# First attempt at test cases:

(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys
running 5 tests from ./src/concepts/LikertSurvey/LikertSurveyConcept.test.ts
Principle: Author creates survey, respondent answers, author views results ... FAILED (1s)
Action: createSurvey requires scaleMin < scaleMax ... ok (495ms)
Action: addQuestion requires an existing survey ... ok (728ms)
Action: submitResponse requirements are enforced ... ok (1s)
Action: updateResponse successfully updates a response and enforces requirements ... ok (887ms)
running 28 tests from ./src/concepts/Scriblink/folder.test.ts
Principle: User initializes root, creates hierarchy, manages items, and deletes folders ... FAILED (779ms)
Action: initializeFolder fails if user already has folders ... ok (697ms)
Action: initializeFolder successfully creates a root for a new user ... ok (756ms)
Action: createFolder successfully creates a new folder ... ok (835ms)
Action: createFolder fails if parent folder not found ... ok (716ms)
Action: createFolder fails if parent folder not owned by user ... ok (605ms)
Query: _getFolderChildren successfully retrieves children ... ok (972ms)
Query: _getFolderChildren fails if folder not found ... ok (576ms)
Action: insertItem successfully inserts an item ... ok (738ms)
Action: insertItem successfully moves an item if already exists elsewhere ... ok (959ms)
Action: insertItem is a no-op if item is already in target folder ... ok (823ms)
Action: insertItem fails if target folder not found ... ok (583ms)
Query: _getFolderItems successfully retrieves items ... ok (1s)
Query: _getFolderItems fails if folder not found ... ok (629ms)
Query: _isDescendant correctly identifies descendants ...
------- post-test output -------
Folder ID 0199eb20-c244-7dfa-a185-4b85b6641681 found in hierarchy but document missing.
----- post-test output end -----
Query: _isDescendant correctly identifies descendants ... ok (1s)
Action: moveFolder successfully moves a folder ... ok (973ms)
Action: moveFolder fails if folder or newParent not found ... ok (731ms)
Action: moveFolder fails if folders have different owners ... ok (931ms)
Action: moveFolder fails if moving into itself ... ok (587ms)
Action: moveFolder fails if moving into a descendant ... ok (957ms)
Action: deleteItem successfully removes an item ... ok (831ms)
Action: deleteItem fails if item not found in any folder ... ok (551ms)
Query: _collectDescendants successfully collects all descendant folder IDs ... ok (1s)
Action: deleteFolder successfully deletes a folder and its descendants ... FAILED (1s)
Action: deleteFolder fails if folder not found ... ok (571ms)
Action: deleteFolder successfully deletes another user's root folder ... ok (793ms)
Query: _getFolderDetails successfully retrieves folder details ... ok (862ms)
Query: _getFolderDetails fails if folder not found ... ok (554ms)
running 7 tests from ./src/concepts/Scriblink/notes.test.ts
Principle: User can create, view, rename, edit, and delete their own note ...
  1. User creates a new note with a title ... ok (133ms)
  2. User can view their own notes ... ok (19ms)
  3. User can rename their note ... ok (68ms)
  4. User can edit the content of their note ... ok (56ms)
  5. User can delete their note ... ok (58ms)
Principle: User can create, view, rename, edit, and delete their own note ... ok (947ms)
Action: createNote - default title and initial state ... ok (615ms)
Action: deleteNote - requires existing note and ownership ...
  Deleting a non-existent note should fail ... ok (18ms)
  Unauthorized user trying to delete another user's note should fail ... ok (18ms)
Action: deleteNote - requires existing note and ownership ... ok (638ms)
Action: setTitle - requires existing note and ownership ...
  Setting title on a non-existent note should fail ... ok (19ms)
  Unauthorized user trying to set title of another user's note should fail ... ok (19ms)
  Setting the same title should be a no-op (no error, no modification) ... ok (40ms)
Action: setTitle - requires existing note and ownership ... ok (845ms)
Action: updateContent - requires existing note and ownership ...
  Updating content on a non-existent note should fail ... ok (19ms)
  Unauthorized user trying to update content of another user's note should fail ... FAILED (23ms)
  Updating with the same content should be a no-op (no error, but last_modified might still update for robustness) ... ok (244ms)
Action: updateContent - requires existing note and ownership ... FAILED (due to 1 failed step) (918ms)
Query: getNoteDetails - requires existing note and ownership ...
  Getting details for a non-existent note should fail ... ok (15ms)
  Unauthorized user trying to get details of another user's note should fail ... ok (16ms)
Query: getNoteDetails - requires existing note and ownership ... ok (727ms)
Query: getNotesByUser - retrieves only owner's notes ...
  Retrieving notes for Alice should return only her notes ... ok (22ms)
  Retrieving notes for Bob should return only his notes ... ok (20ms)
  Retrieving notes for a user with no notes should return an empty array ... ok (21ms)
Query: getNotesByUser - retrieves only owner's notes ... ok (832ms)
running 4 tests from ./src/concepts/Scriblink/passwordAuth.test.ts
Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user. ... ok (662ms)
Action: register - requires the provided username must not already exist in the system. ... ok (757ms)
Action: authenticate - ensures multiple users can be registered and authenticated independently ... FAILED (740ms)
Action: authenticate - requires the username and password combination to exactly match ... ok (826ms)
running 4 tests from ./src/concepts/Scriblink/summarizer.integration.test.ts
Integration: setSummaryWithAI with real Gemini - long technical text ...
------- post-test output -------
✅ Long text summary: *   Quantum Entanglement: Particles linked, sharing a fate irrespective of distance.
*   "Spooky Action at a Distance": Instantaneous influence on entangled partners.
*   Implications: Challenges locality, enables quantum technologies.
*   Measurement Problem: The collapse of quantum superposition into a definite state.
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - long technical text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - short text ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-0d63-71f7-83b4-703893672298: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts:96:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - short text ... FAILED (1s)
Integration: setSummaryWithAI with real Gemini - technical content ...
------- post-test output -------
✅ Technical text summary: *   **What is Machine Learning?**
*   **Types of Machine Learning:**
    *   Supervised Learning
    *   Unsupervised Learning
    *   Reinforcement Learning
*   **Key Applications**
*   **Common Challenges**
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - technical content ... ok (1s)
Integration: setSummaryWithAI with real Gemini - edge cases ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-1e52-7e45-93da-1dcad6aac476: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts:182:25
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
⚠️  Very short text failed: Failed to generate or validate AI summary: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
✅ Empty text correctly rejected
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - edge cases ... ok (1s)
running 15 tests from ./src/concepts/Scriblink/summarizer.test.ts
Constructor: Initializes SummariesConcept correctly ... ok (753ms)
Action: setSummary successfully creates a new summary ... ok (644ms)
Action: setSummary successfully updates an existing summary ... ok (667ms)
Action: setSummary returns error for empty summary ... ok (578ms)
Query: getSummary returns existing summary ... ok (771ms)
Query: getSummary returns null for non-existent summary ... FAILED (564ms)
Action: deleteSummary successfully deletes an existing summary ... FAILED (719ms)
Action: deleteSummary returns error for non-existent summary ... ok (756ms)
Action: setSummaryWithAI successfully generates and saves a summary ... FAILED (569ms)
Action: setSummaryWithAI returns error for empty text ... ok (556ms)
Action: setSummaryWithAI handles LLM generation failure ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-20a4-716c-a392-c1448fd8f181: Error: LLM API failed to respond.
    at GeminiLLM.<anonymous> (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:343:26)
    at GeminiLLM.stub (https://jsr.io/@std/testing/1.0.16/mock.ts:1092:28)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:125:42)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:347:34
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM generation failure ... ok (738ms)
Action: setSummaryWithAI rejects summary with meta-language ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-20a4-716c-a392-c1448fd8f181: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'as an ai', 'the main points are'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:375:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary with meta-language ... ok (857ms)
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-20a4-716c-a392-c1448fd8f181: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 11.1% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:405:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ... ok (674ms)
Action: setSummaryWithAI rejects summary that is irrelevant ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-20a4-716c-a392-c1448fd8f181: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:435:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is irrelevant ... ok (772ms)
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb21-20a4-716c-a392-c1448fd8f181: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'the summary could not be generated because the content was unclear or unrelated.'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:465:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ... ok (677ms)
running 7 tests from ./src/concepts/Scriblink/tags.test.ts
Principle: User flags items, then retrieves items by tag and tags by item ... ok (1s)
Action: addTag creates new tag or adds to existing, enforces requirements ... ok (966ms)
Action: removeTagFromItem successfully removes association and enforces requirements ... ok (1s)
Query: _getItemsByTag retrieves associated items or error ... ok (1s)
Query: _getTagsForItem retrieves tags associated with an item for a specific user ... ok (1s)
Query: _getTagDetails retrieves full tag structure or error ... ok (862ms)
Query: _getAllUserTags retrieves all tags owned by a user ... ok (851ms)
running 1 test from ./src/recitation/01-setup.test.ts
