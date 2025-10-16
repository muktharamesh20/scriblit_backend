# Test Case Output

## Most recent console output

running 28 tests from ./src/concepts/Scriblink/folder.test.ts
Principle: User initializes root, creates hierarchy, manages items, and deletes folders ... ok (1s)
Action: initializeFolder fails if user already has folders ... ok (654ms)
Action: initializeFolder successfully creates a root for a new user ... ok (755ms)
Action: createFolder successfully creates a new folder ... ok (744ms)
Action: createFolder fails if parent folder not found ... ok (646ms)
Action: createFolder fails if parent folder not owned by user ... ok (755ms)
Query: _getFolderChildren successfully retrieves children ... ok (776ms)
Query: _getFolderChildren fails if folder not found ... ok (779ms)
Action: insertItem successfully inserts an item ... ok (641ms)
Action: insertItem successfully moves an item if already exists elsewhere ... ok (991ms)
Action: insertItem is a no-op if item is already in target folder ... ok (800ms)
Action: insertItem fails if target folder not found ... ok (630ms)
Query: _getFolderItems successfully retrieves items ... ok (909ms)
Query: _getFolderItems fails if folder not found ... ok (749ms)
Query: _isDescendant correctly identifies descendants ...
------- output -------
Folder ID 0199eb3d-e31a-7d02-8937-be8dd20abb9d found in hierarchy but document missing.
----- output end -----
Query: _isDescendant correctly identifies descendants ... ok (1s)
Action: moveFolder successfully moves a folder ... ok (910ms)
Action: moveFolder fails if folder or newParent not found ... ok (751ms)
Action: moveFolder fails if folders have different owners ... ok (835ms)
Action: moveFolder fails if moving into itself ... ok (599ms)
Action: moveFolder fails if moving into a descendant ... ok (896ms)
Action: deleteItem successfully removes an item ... ok (743ms)
Action: deleteItem fails if item not found in any folder ... ok (585ms)
Query: _collectDescendants successfully collects all descendant folder IDs ... ok (994ms)
Action: deleteFolder successfully deletes a folder and its descendants ... ok (1s)
Action: deleteFolder fails if folder not found ... ok (629ms)
Action: deleteFolder successfully deletes another user's root folder ... ok (694ms)
Query: _getFolderDetails successfully retrieves folder details ... ok (914ms)
Query: _getFolderDetails fails if folder not found ... ok (584ms)
running 7 tests from ./src/concepts/Scriblink/notes.test.ts
Principle: User can create, view, rename, edit, and delete their own note ...
  1. User creates a new note with a title ... ok (54ms)
  2. User can view their own notes ... ok (19ms)
  3. User can rename their note ... ok (53ms)
  4. User can edit the content of their note ... ok (56ms)
  5. User can delete their note ... ok (142ms)
Principle: User can create, view, rename, edit, and delete their own note ... ok (901ms)
Action: createNote - default title and initial state ... ok (627ms)
Action: deleteNote - requires existing note and ownership ...
  Deleting a non-existent note should fail ... ok (22ms)
  Unauthorized user trying to delete another user's note should fail ... ok (22ms)
Action: deleteNote - requires existing note and ownership ... ok (594ms)
Action: setTitle - requires existing note and ownership ...
  Setting title on a non-existent note should fail ... ok (21ms)
  Unauthorized user trying to set title of another user's note should fail ... ok (19ms)
  Setting the same title should be a no-op (no error, no modification) ... ok (41ms)
Action: setTitle - requires existing note and ownership ... ok (918ms)
Action: updateContent - requires existing note and ownership ...
  Updating content on a non-existent note should fail ... ok (18ms)
  Unauthorized user trying to update content of another user's note should fail ... ok (18ms)
  Updating with the same content should be a no-op (no error, but last_modified might still update for robustness) ... ok (117ms)
Action: updateContent - requires existing note and ownership ... ok (769ms)
Query: getNoteDetails - requires existing note and ownership ...
  Getting details for a non-existent note should fail ... ok (17ms)
  Unauthorized user trying to get details of another user's note should fail ... ok (18ms)
Query: getNoteDetails - requires existing note and ownership ... ok (737ms)
Query: getNotesByUser - retrieves only owner's notes ...
  Retrieving notes for Alice should return only her notes ... ok (17ms)
  Retrieving notes for Bob should return only his notes ... ok (17ms)
  Retrieving notes for a user with no notes should return an empty array ... ok (17ms)
Query: getNotesByUser - retrieves only owner's notes ... ok (725ms)
running 4 tests from ./src/concepts/Scriblink/passwordAuth.test.ts
Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user. ... ok (787ms)
Action: register - requires the provided username must not already exist in the system. ... ok (662ms)
Action: authenticate - ensures multiple users can be registered and authenticated independently ... ok (876ms)
Action: authenticate - requires the username and password combination to exactly match ... ok (672ms)
running 4 tests from ./src/concepts/Scriblink/summarizer.integration.test.ts
Integration: setSummaryWithAI with real Gemini - long technical text ...
------- post-test output -------
✅ Long text summary: *   **Entanglement: Linked Fates**
*   **"Spooky Action": Instant Influence**
*   **Challenging Reality: Locality and Beyond**
*   **Measurement Problem: State Collapse**
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - long technical text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - short text ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-2ce9-7330-a718-1035ee7a4900: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 14.3% of summary words overlap with original content (min 20% required).
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
✅ Technical text summary: *   **What Machine Learning Is:** AI focused on learning from data.
*   **Key Learning Types:** Supervised, Unsupervised, Reinforcement.
*   **Common Algorithms & Applications:** Examples and real-world uses.
*   **Major Challenges:** Overfitting, data bias, data quantity.
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - technical content ... ok (1s)
Integration: setSummaryWithAI with real Gemini - edge cases ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-3ed7-787d-b8d2-5037ae014743: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
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
Constructor: Initializes SummariesConcept correctly ... ok (673ms)
Action: setSummary successfully creates a new summary ... ok (697ms)
Action: setSummary successfully updates an existing summary ... ok (603ms)
Action: setSummary returns error for empty summary ... ok (611ms)
Query: getSummary returns existing summary ... ok (808ms)
Query: getSummary returns an error for non-existent summary ... ok (614ms)
Action: deleteSummary successfully deletes an existing summary ... ok (671ms)
Action: deleteSummary returns error for non-existent summary ... ok (593ms)
Action: setSummaryWithAI successfully generates and saves a summary ... ok (784ms)
Action: setSummaryWithAI returns error for empty text ... ok (600ms)
Action: setSummaryWithAI handles LLM generation failure ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-41cd-7142-81b0-4b4e665d7f8a: Error: LLM API failed to respond.
    at GeminiLLM.<anonymous> (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:355:26)
    at GeminiLLM.stub (https://jsr.io/@std/testing/1.0.16/mock.ts:1092:28)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:125:42)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:359:34
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM generation failure ... ok (569ms)
Action: setSummaryWithAI rejects summary with meta-language ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-41cd-7142-81b0-4b4e665d7f8a: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'as an ai', 'the main points are'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:387:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary with meta-language ... ok (621ms)
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-41cd-7142-81b0-4b4e665d7f8a: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 11.1% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:417:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ... ok (517ms)
Action: setSummaryWithAI rejects summary that is irrelevant ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-41cd-7142-81b0-4b4e665d7f8a: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:447:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is irrelevant ... ok (484ms)
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb3e-41cd-7142-81b0-4b4e665d7f8a: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'the summary could not be generated because the content was unclear or unrelated.'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:477:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ... ok (505ms)
running 7 tests from ./src/concepts/Scriblink/tags.test.ts
Principle: User flags items, then retrieves items by tag and tags by item ... ok (956ms)
Action: addTag creates new tag or adds to existing, enforces requirements ... ok (806ms)
Action: removeTagFromItem successfully removes association and enforces requirements ... ok (1s)
Query: _getItemsByTag retrieves associated items or error ... ok (828ms)
Query: _getTagsForItem retrieves tags associated with an item for a specific user ... ok (914ms)
Query: _getTagDetails retrieves full tag structure or error ... ok (638ms)
Query: _getAllUserTags retrieves all tags owned by a user ... ok (813ms)

 ERRORS 

Integration: setSummaryWithAI with real Gemini - short text => ./src/concepts/Scriblink/summarizer.integration.test.ts:91:6
error: AssertionError: Expected actual: true not to be: true: setSummaryWithAI should succeed with real Gemini for short text
  throw new AssertionError(
        ^
    at assertNotEquals (https://jsr.io/@std/assert/1.0.15/not_equals.ts:34:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts:102:5

 FAILURES 

Integration: setSummaryWithAI with real Gemini - short text => ./src/concepts/Scriblink/summarizer.integration.test.ts:91:6

FAILED | 64 passed (18 steps) | 1 failed (52s)




## a console output

running 28 tests from ./src/concepts/Scriblink/folder.test.ts
Principle: User initializes root, creates hierarchy, manages items, and deletes folders ... ok (1s)
Action: initializeFolder fails if user already has folders ... ok (652ms)
Action: initializeFolder successfully creates a root for a new user ... ok (691ms)
Action: createFolder successfully creates a new folder ... ok (749ms)
Action: createFolder fails if parent folder not found ... ok (588ms)
Action: createFolder fails if parent folder not owned by user ... ok (735ms)
Query: _getFolderChildren successfully retrieves children ... ok (884ms)
Query: _getFolderChildren fails if folder not found ... ok (698ms)
Action: insertItem successfully inserts an item ... ok (713ms)
Action: insertItem successfully moves an item if already exists elsewhere ... ok (896ms)
Action: insertItem is a no-op if item is already in target folder ... ok (749ms)
Action: insertItem fails if target folder not found ... ok (764ms)
Query: _getFolderItems successfully retrieves items ... ok (904ms)
Query: _getFolderItems fails if folder not found ... ok (529ms)
Query: _isDescendant correctly identifies descendants ...
------- output -------
Folder ID 0199eb30-76dc-7679-9369-36544854fe2a found in hierarchy but document missing.
----- output end -----
Query: _isDescendant correctly identifies descendants ... ok (1s)
Action: moveFolder successfully moves a folder ... ok (1s)
Action: moveFolder fails if folder or newParent not found ... ok (751ms)
Action: moveFolder fails if folders have different owners ... ok (692ms)
Action: moveFolder fails if moving into itself ... ok (691ms)
Action: moveFolder fails if moving into a descendant ... ok (944ms)
Action: deleteItem successfully removes an item ... ok (908ms)
Action: deleteItem fails if item not found in any folder ... ok (647ms)
Query: _collectDescendants successfully collects all descendant folder IDs ... ok (999ms)
Action: deleteFolder successfully deletes a folder and its descendants ... ok (1s)
Action: deleteFolder fails if folder not found ... ok (708ms)
Action: deleteFolder successfully deletes another user's root folder ... ok (695ms)
Query: _getFolderDetails successfully retrieves folder details ... ok (971ms)
Query: _getFolderDetails fails if folder not found ... ok (604ms)
running 7 tests from ./src/concepts/Scriblink/notes.test.ts
Principle: User can create, view, rename, edit, and delete their own note ...
  1. User creates a new note with a title ... ok (57ms)
  2. User can view their own notes ... ok (20ms)
  3. User can rename their note ... ok (60ms)
  4. User can edit the content of their note ... ok (62ms)
  5. User can delete their note ... ok (60ms)
Principle: User can create, view, rename, edit, and delete their own note ... ok (1s)
Action: createNote - default title and initial state ... ok (741ms)
Action: deleteNote - requires existing note and ownership ...
  Deleting a non-existent note should fail ... ok (21ms)
  Unauthorized user trying to delete another user's note should fail ... ok (20ms)
Action: deleteNote - requires existing note and ownership ... ok (723ms)
Action: setTitle - requires existing note and ownership ...
  Setting title on a non-existent note should fail ... ok (20ms)
  Unauthorized user trying to set title of another user's note should fail ... ok (19ms)
  Setting the same title should be a no-op (no error, no modification) ... ok (37ms)
Action: setTitle - requires existing note and ownership ... ok (729ms)
Action: updateContent - requires existing note and ownership ...
  Updating content on a non-existent note should fail ... ok (18ms)
  Unauthorized user trying to update content of another user's note should fail ... ok (19ms)
  Updating with the same content should be a no-op (no error, but last_modified might still update for robustness) ... ok (105ms)
Action: updateContent - requires existing note and ownership ... ok (885ms)
Query: getNoteDetails - requires existing note and ownership ...
  Getting details for a non-existent note should fail ... ok (20ms)
  Unauthorized user trying to get details of another user's note should fail ... ok (18ms)
Query: getNoteDetails - requires existing note and ownership ... ok (690ms)
Query: getNotesByUser - retrieves only owner's notes ...
  Retrieving notes for Alice should return only her notes ... ok (18ms)
  Retrieving notes for Bob should return only his notes ... ok (17ms)
  Retrieving notes for a user with no notes should return an empty array ... ok (17ms)
Query: getNotesByUser - retrieves only owner's notes ... ok (706ms)
running 4 tests from ./src/concepts/Scriblink/passwordAuth.test.ts
Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user. ... ok (743ms)
Action: register - requires the provided username must not already exist in the system. ... ok (778ms)
Action: authenticate - ensures multiple users can be registered and authenticated independently ... ok (700ms)
Action: authenticate - requires the username and password combination to exactly match ... ok (812ms)
running 4 tests from ./src/concepts/Scriblink/summarizer.integration.test.ts
Integration: setSummaryWithAI with real Gemini - long technical text ...
------- post-test output -------
✅ Long text summary: *   **Entanglement: Linked Fates Across Distance**
*   **"Spooky Action": Instant Influence**
*   **Challenging Reality and Enabling New Tech**
*   **The Measurement Problem: State Collapse**
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - long technical text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - short text ...
------- post-test output -------
✅ Short text summary: *  The purpose of "The quick brown fox jumps over the lazy dog."
*  Its characteristic as a short piece of text.
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - short text ... ok (1s)
Integration: setSummaryWithAI with real Gemini - technical content ...
------- post-test output -------
✅ Technical text summary: *   **Core Concept:** Machine learning empowers computers to learn from data and make decisions.
*   **Learning Approaches:** Three main types: supervised (labeled data), unsupervised (pattern discovery), and reinforcement (rewards/penalties).
*   **Common Algorithms:** Techniques like regression, decision trees, and neural networks are widely used.
*   **Key Applications:** Image recognition, language processing, and self-driving cars are prominent examples.
*   **Challenges to Overcome:** Overfitting, data bias, and the necessity of extensive training data.
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - technical content ... ok (1s)
Integration: setSummaryWithAI with real Gemini - edge cases ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d62a-7ffc-9e98-dd7c9529201c: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 13.3% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.integration.test.ts:182:25
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
⚠️  Very short text failed: Failed to generate or validate AI summary: ContentRelevanceError: Summary appears unrelated to source text. Only 13.3% of summary words overlap with original content (min 20% required).
✅ Empty text correctly rejected
----- post-test output end -----
Integration: setSummaryWithAI with real Gemini - edge cases ... ok (1s)
running 15 tests from ./src/concepts/Scriblink/summarizer.test.ts
Constructor: Initializes SummariesConcept correctly ... ok (591ms)
Action: setSummary successfully creates a new summary ... ok (790ms)
Action: setSummary successfully updates an existing summary ... ok (648ms)
Action: setSummary returns error for empty summary ... ok (497ms)
Query: getSummary returns existing summary ... ok (615ms)
Query: getSummary returns an error for non-existent summary ... ok (587ms)
Action: deleteSummary successfully deletes an existing summary ... FAILED (788ms)
Action: deleteSummary returns error for non-existent summary ... ok (579ms)
Action: setSummaryWithAI successfully generates and saves a summary ... FAILED (627ms)
Action: setSummaryWithAI returns error for empty text ... ok (586ms)
Action: setSummaryWithAI handles LLM generation failure ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d900-752e-a853-e031ae87344c: Error: LLM API failed to respond.
    at GeminiLLM.<anonymous> (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:343:26)
    at GeminiLLM.stub (https://jsr.io/@std/testing/1.0.16/mock.ts:1092:28)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:125:42)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:347:34
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM generation failure ... ok (682ms)
Action: setSummaryWithAI rejects summary with meta-language ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d900-752e-a853-e031ae87344c: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'as an ai', 'the main points are'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:375:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary with meta-language ... ok (580ms)
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d900-752e-a853-e031ae87344c: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 11.1% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:405:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is too long (ratio or absolute) ... ok (677ms)
Action: setSummaryWithAI rejects summary that is irrelevant ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d900-752e-a853-e031ae87344c: Error: ContentRelevanceError: Summary appears unrelated to source text. Only 0.0% of summary words overlap with original content (min 20% required).
    at SummariesConcept.validateContentRelevance (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:256:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:171:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:435:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI rejects summary that is irrelevant ... ok (625ms)
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ...
------- post-test output -------
Error generating or validating AI summary for item 0199eb30-d900-752e-a853-e031ae87344c: Error: MetaLanguageError: Found AI meta-language or summary boilerplate: 'the summary could not be generated because the content was unclear or unrelated.'
    at SummariesConcept.validateNoMetaLanguage (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:315:13)
    at SummariesConcept.validateSummary (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:165:10)
    at SummariesConcept.setSummaryWithAI (file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.ts:128:12)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:465:20
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async outerWrapped (ext:cli/40_test.js:124:14)
----- post-test output end -----
Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message ... ok (556ms)
running 7 tests from ./src/concepts/Scriblink/tags.test.ts
Principle: User flags items, then retrieves items by tag and tags by item ... ok (965ms)
Action: addTag creates new tag or adds to existing, enforces requirements ... ok (889ms)
Action: removeTagFromItem successfully removes association and enforces requirements ... ok (952ms)
Query: _getItemsByTag retrieves associated items or error ... ok (717ms)
Query: _getTagsForItem retrieves tags associated with an item for a specific user ... ok (930ms)
Query: _getTagDetails retrieves full tag structure or error ... ok (939ms)
Query: _getAllUserTags retrieves all tags owned by a user ... ok (838ms)

 ERRORS 

Action: deleteSummary successfully deletes an existing summary => ./src/concepts/Scriblink/summarizer.test.ts:213:6
error: AssertionError: Values are not equal: Summary should be null after deletion.


    [Diff] Actual / Expected


-   {
-     error: "No summary found for item 0199eb30-d900-752e-a853-e031ae87344c.",
-   }
+   null

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.15/equals.ts:65:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:239:5

Action: setSummaryWithAI successfully generates and saves a summary => ./src/concepts/Scriblink/summarizer.test.ts:267:6
error: AssertionError: Values are not equal.


    [Diff] Actual / Expected


+   \n
    • Quantum entanglement: linked particles share fate\n
    • Instant influence regardless of distance ("spooky action")\n
    • Challenges classical locality\n
+   • Key for quantum computing/cryptography\n
+   
-   • Key for quantum computing/cryptography


  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.15/equals.ts:65:9)
    at file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/summarizer.test.ts:290:5

 FAILURES 

Action: deleteSummary successfully deletes an existing summary => ./src/concepts/Scriblink/summarizer.test.ts:213:6
Action: setSummaryWithAI successfully generates and saves a summary => ./src/concepts/Scriblink/summarizer.test.ts:267:6

FAILED | 63 passed (18 steps) | 2 failed (53s)

error: Test failed