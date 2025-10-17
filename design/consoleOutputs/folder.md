(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys src/concepts/Scriblink/folder.test.ts      
Check file:///Users/muktharamesh/Documents/6104/scriblit_backend/src/concepts/Scriblink/folder.test.ts
running 33 tests from ./src/concepts/Scriblink/folder.test.ts
Principle: User initializes root, creates hierarchy, manages items, and deletes folders ...
------- output -------

📁 OPERATIONAL PRINCIPLE: Folder Management Workflow
============================================================

🏗️  Step 1: Initializing root folder
   ✅ Root folder initialized successfully

📁 Step 2: Creating child folders
   ✅ Child folders created: Child 1, Child 2

📁 Step 3: Creating grandchild folder
   ✅ Grandchild folder created: Grandchild 1 (under Child 1)

📦 Step 4: Adding items to folders
   ✅ Items added: itemA (root), itemB (child1)

🔄 Step 5: Moving item between folders
   ✅ ItemA moved from root to child1

🔄 Step 6: Moving folder between parents
   ✅ Child2 moved from root to child1

🗑️  Step 7: Deleting item from folder
   ✅ ItemB deleted from child1

🗑️  Step 8: Deleting folder with children (cascade delete)
   ✅ Child1 and all descendants deleted (cascade delete)
   📊 Final state: Empty root folder
   ✅ All items removed from database

🎉 OPERATIONAL PRINCIPLE COMPLETE
============================================================
----- output end -----
Principle: User initializes root, creates hierarchy, manages items, and deletes folders ... ok (1s)
Action: initializeFolder fails if user already has folders ... ok (578ms)
Action: initializeFolder successfully creates a root for a new user ... ok (495ms)
Action: createFolder successfully creates a new folder ... ok (586ms)
Action: createFolder fails if parent folder not found ... ok (508ms)
Action: createFolder fails if parent folder not owned by user ... ok (537ms)
Query: _getFolderChildren successfully retrieves children ... ok (736ms)
Query: _getFolderChildren fails if folder not found ... ok (507ms)
Action: insertItem successfully inserts an item ... ok (534ms)
Action: insertItem successfully moves an item if already exists elsewhere ... ok (849ms)
Action: insertItem is a no-op if item is already in target folder ... ok (645ms)
Action: insertItem fails if target folder not found ... ok (510ms)
Query: _getFolderItems successfully retrieves items ... ok (706ms)
Query: _getFolderItems fails if folder not found ... ok (452ms)
Query: _isDescendant correctly identifies descendants ...
------- output -------
Folder ID 0199efaa-7a5c-7d83-a955-29e9f98ac84a found in hierarchy but document missing.
----- output end -----
Query: _isDescendant correctly identifies descendants ... ok (848ms)
Action: moveFolder successfully moves a folder ... ok (760ms)
Action: moveFolder fails if folder or newParent not found ... ok (631ms)
Action: moveFolder fails if folders have different owners ... ok (618ms)
Action: moveFolder fails if moving into itself ... ok (633ms)
Action: moveFolder fails if moving into a descendant ... ok (702ms)
Action: deleteItem successfully removes an item ... ok (693ms)
Action: deleteItem fails if item not found in any folder ... ok (533ms)
Query: _collectDescendants successfully collects all descendant folder IDs ... ok (750ms)
Action: deleteFolder successfully deletes a folder and its descendants ... ok (912ms)
Action: deleteFolder fails if folder not found ... ok (430ms)
Action: deleteFolder successfully deletes another user's root folder ... ok (627ms)
Query: _getFolderDetails successfully retrieves folder details ... ok (615ms)
Query: _getFolderDetails fails if folder not found ... ok (412ms)
Interesting Scenario 1: Complex folder hierarchy with nested operations ...
------- output -------

🔗 SCENARIO 1: Complex Hierarchy Operations
==================================================

📁 Step 1: Creating deep nested hierarchy
   ✅ Deep hierarchy created (4 levels: root → L1 → L2 → L3)

📦 Step 2: Adding items at different levels
   ✅ Items added: itemA (root), itemB (level2)

🔄 Step 3: Moving item between levels
   ✅ ItemA moved: root → level3 (deepest level)

🔍 Step 4: Verifying hierarchy integrity
   ✅ Hierarchy integrity verified
   📊 Final state: root(0 items), level3(1 item: itemA)

🎉 SCENARIO 1 COMPLETE
==================================================
----- output end -----
Interesting Scenario 1: Complex folder hierarchy with nested operations ... ok (836ms)
Interesting Scenario 2: Duplicate folder titles, and moving to non-existent folder ...
------- output -------

⚠️  SCENARIO 2: Error Recovery and Edge Cases
==================================================

🏗️  Step 1: Setting up basic structure
   ✅ Basic structure created: root + child folder

📋 Step 2: Testing duplicate title creation
   ✅ Duplicate title creation succeeded (titles can be duplicated)

📦 Step 3: Testing item addition
   ✅ New item added successfully

🔄 Step 4: Testing move to non-existent folder
   ✅ Move to non-existent folder correctly rejected

🔄 Step 5: Recovering with valid operations
   ✅ Valid item addition succeeded after errors

🎉 SCENARIO 2 COMPLETE
==================================================
----- output end -----
Interesting Scenario 2: Duplicate folder titles, and moving to non-existent folder ... ok (764ms)
Interesting Scenario 3: Circular reference prevention and hierarchy validation ...
------- output -------

🔄 SCENARIO 3: Circular Reference Prevention
==================================================

🏗️  Step 1: Creating deep folder hierarchy
   ✅ Deep hierarchy created: root → L1 → L2 → L3

🔄 Step 2: Testing self-descendant prevention
   ✅ Self-descendant move correctly blocked

🔄 Step 3: Testing direct circular reference
   ✅ Direct circular reference correctly blocked

✅ Step 4: Testing valid folder creation
   ✅ Valid folder creation succeeded

🔍 Step 5: Verifying hierarchy integrity
   ✅ Hierarchy integrity maintained after failed circular attempts

🔄 Step 6: Testing complex circular scenarios
   ✅ Complex circular reference correctly blocked
   📊 Final state: Clean hierarchy maintained, no circular references

🎉 SCENARIO 3 COMPLETE
==================================================
----- output end -----
Interesting Scenario 3: Circular reference prevention and hierarchy validation ... ok (978ms)
Interesting Scenario 4: Order of deletion of folders and items ...
------- output -------

🗑️  SCENARIO 4: Folder Deletion and Cleanup
==================================================

🏗️  Step 1: Creating complex folder structure
   ✅ Complex structure created: root → [child1, child2], child1 → [grandchild]

📦 Step 2: Adding items to different folders
   ✅ Items added: itemA (child1), itemB (grandchild)

🗑️  Step 3: Testing deletion of folder with children
   ✅ Folder deleted (no deleted items info returned)

🔍 Step 4: Verifying grandchild folder was deleted
   ✅ Grandchild folder correctly deleted as part of cascade

🔍 Step 5: Verifying remaining structure
   ✅ Remaining structure verified
   📊 Final state: root → [child2] (child1 and grandchild deleted)

🗑️  Step 6: Testing root folder deletion
   ✅ Root folder deleted
   ✅ Root folder correctly deleted

🎉 SCENARIO 4 COMPLETE
==================================================
----- output end -----
Interesting Scenario 4: Order of deletion of folders and items ... ok (1s)
Interesting Scenario 5: Rapid operations and concurrency ...
------- output -------

⚡ SCENARIO 5: Rapid Operations and Concurrency
==================================================

🏗️  Step 1: Initializing root folder
   ✅ Root initialized

⚡ Step 2: Creating multiple folders rapidly
   ✅ All 5 rapid folder creations succeeded

📦 Step 3: Adding items rapidly
   ✅ All 3 rapid item additions succeeded

🔍 Step 4: Verifying final state after rapid operations
   ✅ Final state verified: 5 folders + 3 items in root

⚡ Step 5: Performing rapid item operations
   ✅ All 3 rapid item operations succeeded
   📊 Final state: 5 folders + 6 items total (3 in root, 3 in folders)

🎉 SCENARIO 5 COMPLETE
==================================================
----- output end -----
Interesting Scenario 5: Rapid operations and concurrency ... ok (914ms)

ok | 33 passed | 0 failed (22s)