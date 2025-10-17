running 12 tests from ./src/concepts/Scriblink/notes.test.ts
Principle: User can create, view, rename, edit, and delete their own note ...
------- output -------

📝 OPERATIONAL PRINCIPLE: Note Management Workflow
============================================================
----- output end -----
  1. User creates a new note with a title ...
------- output -------

📝 Step 1: Creating new note with title
   ✅ Note created successfully: 'My First Note'
----- output end -----
  1. User creates a new note with a title ... ok (49ms)
  2. User can view their own notes ...
------- output -------

👀 Step 2: Viewing user's notes
   ✅ User notes retrieved: 1 note found
----- output end -----
  2. User can view their own notes ... ok (16ms)
  3. User can rename their note ...
------- output -------

✏️  Step 3: Renaming note
   ✅ Note renamed successfully: 'My Renamed Note'
----- output end -----
  3. User can rename their note ... ok (50ms)
  4. User can edit the content of their note ...
------- output -------

📝 Step 4: Editing note content
   ✅ Note content updated successfully
----- output end -----
  4. User can edit the content of their note ... ok (51ms)
  5. User can delete their note ...
------- output -------

🗑️  Step 5: Deleting note
   ✅ Note deleted successfully
----- output end -----
  5. User can delete their note ... ok (51ms)
------- output -------

🎉 OPERATIONAL PRINCIPLE COMPLETE
============================================================
----- output end -----
Principle: User can create, view, rename, edit, and delete their own note ... ok (742ms)
Action: createNote - default title and initial state ... ok (538ms)
Action: deleteNote - requires existing note and ownership ...
  Deleting a non-existent note should fail ... ok (16ms)
  Unauthorized user trying to delete another user's note should fail ... ok (17ms)
Action: deleteNote - requires existing note and ownership ... ok (470ms)
Action: setTitle - requires existing note and ownership ...
  Setting title on a non-existent note should fail ... ok (20ms)
  Unauthorized user trying to set title of another user's note should fail ... ok (19ms)
  Setting the same title should be a no-op (no error, no modification) ... ok (38ms)
Action: setTitle - requires existing note and ownership ... ok (606ms)
Action: updateContent - requires existing note and ownership ...
  Updating content on a non-existent note should fail ... ok (16ms)
  Unauthorized user trying to update content of another user's note should fail ... ok (17ms)
  Updating with the same content should be a no-op (no error, but last_modified might still update for robustness) ... ok (103ms)
Action: updateContent - requires existing note and ownership ... ok (600ms)
Query: getNoteDetails - requires existing note and ownership ...
  Getting details for a non-existent note should fail ... ok (17ms)
  Unauthorized user trying to get details of another user's note should fail ... ok (16ms)
Query: getNoteDetails - requires existing note and ownership ... ok (558ms)
Query: getNotesByUser - retrieves only owner's notes ...
  Retrieving notes for Alice should return only her notes ... ok (15ms)
  Retrieving notes for Bob should return only his notes ... ok (15ms)
  Retrieving notes for a user with no notes should return an empty array ... ok (15ms)
Query: getNotesByUser - retrieves only owner's notes ... ok (515ms)
Interesting Scenario 1: Note lifecycle with complex editing patterns ...
------- output -------

📝 SCENARIO 1: Complex Note Editing Patterns
==================================================

📝 Step 1: Creating initial note
   ✅ Initial note created: 'Complex Note'

📝 Step 2: Adding content gradually
   ✅ First content added
   ✅ Content expanded with second paragraph

✏️  Step 3: Renaming note
   ✅ Note renamed: 'Complex Note - Updated'

🔍 Step 4: Verifying final state
   ✅ Final state verified
   📊 Final note: 'Complex Note - Updated' with 2 paragraphs

🎉 SCENARIO 1 COMPLETE
==================================================
----- output end -----
Interesting Scenario 1: Note lifecycle with complex editing patterns ... ok (659ms)
Interesting Scenario 2: Multi-user note isolation and permissions ...
------- output -------

👥 SCENARIO 2: Multi-User Note Isolation
==================================================
1. Alice creating a note...
✓ Alice's note created
2. Bob creating a separate note...
✓ Bob's note created
3. Testing cross-user access restrictions...
✓ Cross-user access correctly blocked
4. Testing cross-user edit restrictions...
✓ Cross-user edit correctly blocked
5. Verifying independent operations...
✓ Both users can work independently

🎉 SCENARIO 2 COMPLETE
==================================================
----- output end -----
Interesting Scenario 2: Multi-user note isolation and permissions ... ok (632ms)
Interesting Scenario 3: Note deletion and recovery patterns ...
------- output -------

🗑️  SCENARIO 3: Note Deletion and Recovery
==================================================
1. Creating and populating note...
✓ Note created and populated
2. Deleting the note...
✓ Note deleted
3. Testing access to deleted note...
✓ Deleted note access correctly blocked
4. Testing edit of deleted note...
✓ Deleted note edit correctly blocked
5. Creating new note with same title...
✓ New note created with same title

🎉 SCENARIO 3 COMPLETE
==================================================
----- output end -----
Interesting Scenario 3: Note deletion and recovery patterns ... ok (562ms)
Interesting Scenario 4: Rapid note operations and concurrency ...
------- output -------

⚡ SCENARIO 4: Rapid Note Operations
==================================================
1. Creating multiple notes rapidly...
✓ All rapid note creations succeeded
2. Editing notes rapidly...
✓ All rapid edits succeeded
3. Renaming notes rapidly...
✓ All rapid renames succeeded
4. Verifying all notes...
✓ All notes verified

🎉 SCENARIO 4 COMPLETE
==================================================
----- output end -----
Interesting Scenario 4: Rapid note operations and concurrency ... ok (1s)
Interesting Scenario 5: Note content edge cases and validation ...
------- output -------
=== Interesting Scenario 5: Content Edge Cases and Validation ===
1. Creating note with empty content...
✓ Empty content note created
2. Testing very long content...
✓ Long content accepted
3. Testing special characters...
✓ Special characters accepted
4. Testing multiline content...
✓ Multiline content accepted
5. Testing title edge cases...
✓ Long title accepted
✓ Special character title accepted
6. Verifying final state...
✓ Final state verified

🎉 SCENARIO 5 COMPLETE
==================================================
----- output end -----
Interesting Scenario 5: Note content edge cases and validation ... ok (762ms)

ok | 12 passed (18 steps) | 0 failed (7s)