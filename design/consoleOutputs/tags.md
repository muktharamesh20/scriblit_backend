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
Principle: User flags items, then retrieves items by tag and tags by item ... ok (684ms)
Action: addTag creates new tag or adds to existing, enforces requirements ... ok (618ms)
Action: removeTagFromItem successfully removes association and enforces requirements ... ok (743ms)
Query: _getItemsByTag retrieves associated items or error ... ok (728ms)
Query: _getTagsForItem retrieves tags associated with an item for a specific user ... ok (698ms)
Query: _getTagDetails retrieves full tag structure or error ... ok (630ms)
Query: _getAllUserTags retrieves all tags owned by a user ... ok (700ms)
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
✓ Empty and whitespace tags correctly rejected

🎉 SCENARIO 1 COMPLETE
==================================================
----- output end -----
Interesting Scenario 1: Tag collision and namespace conflicts ... ok (1s)
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
4. Performance measurement: 3433ms for all operations
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
Interesting Scenario 4: Tag data corruption and recovery ... ok (876ms)
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
✓ Shared tag concept works correctly
5. Verifying Alice's data integrity...
✓ Alice's data integrity maintained

🎉 SCENARIO 5 COMPLETE
==================================================
----- output end -----
Interesting Scenario 5: Cross-user tag pollution and isolation ... ok (767ms)

ok | 12 passed | 0 failed (14s)