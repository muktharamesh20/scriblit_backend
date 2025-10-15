---
timestamp: 'Wed Oct 15 2025 17:23:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_172314.583353c1.md]]'
content_id: 5c841c0393d390297fb1c4930a97f02d11364268e33b65c3088f3f78e654513d
---

# response:

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "../../utils/database.ts"; // Adjust path as necessary based on your project structure
import { ID } from "../../utils/types.ts"; // Adjust path as necessary
import TagConcept from "./tags.ts"; // Adjust path as necessary

// Define some constant IDs for testing, similar to the example
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID; // Another user to test isolation
const itemA = "item:documentA" as ID;
const itemB = "item:photoB" as ID;
const itemC = "item:videoC" as ID;
const nonExistentID = "nonexistent:id" as ID; // For testing non-existent entities

Deno.test("Principle: User flags items, then retrieves items by tag and tags by item", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // 1. UserAlice adds tag "important" to itemA
    const addTag1Result = await tagConcept.addTag({
      user: userAlice,
      label: "important",
      item: itemA,
    });
    assertNotEquals("error" in addTag1Result, true, "Adding tag 'important' to itemA should succeed.");
    const tagImportantId = (addTag1Result as { tag: ID }).tag;
    assertExists(tagImportantId);

    // 2. UserAlice adds tag "important" to itemB
    const addTag2Result = await tagConcept.addTag({
      user: userAlice,
      label: "important",
      item: itemB,
    });
    assertNotEquals("error" in addTag2Result, true, "Adding tag 'important' to itemB should succeed.");
    assertEquals((addTag2Result as { tag: ID }).tag, tagImportantId, "Both items should use the same 'important' tag ID.");

    // 3. UserAlice adds tag "review" to itemA
    const addTag3Result = await tagConcept.addTag({
      user: userAlice,
      label: "review",
      item: itemA,
    });
    assertNotEquals("error" in addTag3Result, true, "Adding tag 'review' to itemA should succeed.");
    const tagReviewId = (addTag3Result as { tag: ID }).tag;
    assertNotEquals(tagReviewId, tagImportantId, "'review' tag should have a different ID than 'important' tag.");
    assertExists(tagReviewId);

    // 4. Verify items for the "important" tag
    const importantItems = await tagConcept._getItemsByTag({ tagId: tagImportantId });
    assertNotEquals("error" in importantItems, true, "Getting items by 'important' tag should succeed.");
    assertEquals((importantItems as ID[]).length, 2, "There should be 2 items associated with 'important'.");
    assertEquals((importantItems as ID[]).includes(itemA), true, "itemA should be in 'important' items.");
    assertEquals((importantItems as ID[]).includes(itemB), true, "itemB should be in 'important' items.");

    // 5. Verify tags for itemA (should have both "important" and "review")
    const itemATags = await tagConcept._getTagsForItem({ user: userAlice, item: itemA });
    assertNotEquals("error" in itemATags, true, "Getting tags for itemA should succeed.");
    assertEquals((itemATags as Array<any>).length, 2, "There should be 2 tags associated with itemA.");
    assertEquals((itemATags as Array<any>).some((t) => t.label === "important"), true, "itemA should have 'important' tag.");
    assertEquals((itemATags as Array<any>).some((t) => t.label === "review"), true, "itemA should have 'review' tag.");

    // 6. UserAlice removes tag "important" from itemA
    const removeResult = await tagConcept.removeTagFromItem({ tag: tagImportantId, item: itemA });
    assertNotEquals("error" in removeResult, true, "Removing 'important' from itemA should succeed.");

    // 7. Verify items for "important" tag again (itemA should be gone)
    const importantItemsAfterRemoval = await tagConcept._getItemsByTag({ tagId: tagImportantId });
    assertNotEquals("error" in importantItemsAfterRemoval, true, "Getting items by 'important' tag should succeed after removal.");
    assertEquals((importantItemsAfterRemoval as ID[]).length, 1, "There should be 1 item left in 'important'.");
    assertEquals((importantItemsAfterRemoval as ID[]).includes(itemA), false, "itemA should NOT be in 'important' items.");
    assertEquals((importantItemsAfterRemoval as ID[]).includes(itemB), true, "itemB should still be in 'important' items.");

    // 8. Verify tags for itemA again (only "review" should remain)
    const itemATagsAfterRemoval = await tagConcept._getTagsForItem({ user: userAlice, item: itemA });
    assertNotEquals("error" in itemATagsAfterRemoval, true, "Getting tags for itemA should succeed after removal.");
    assertEquals((itemATagsAfterRemoval as Array<any>).length, 1, "There should be 1 tag associated with itemA.");
    assertEquals((itemATagsAfterRemoval as Array<any>).some((t) => t.label === "important"), false, "itemA should NOT have 'important' tag.");
    assertEquals((itemATagsAfterRemoval as Array<any>).some((t) => t.label === "review"), true, "itemA should still have 'review' tag.");

    // 9. Get all tags for userAlice
    const allUserAliceTags = await tagConcept._getAllUserTags({ user: userAlice });
    assertNotEquals("error" in allUserAliceTags, true, "Getting all tags for userAlice should succeed.");
    assertEquals((allUserAliceTags as Array<any>).length, 2, "UserAlice should have 2 tags: 'important' (with itemB) and 'review' (with itemA).");
    assertEquals((allUserAliceTags as Array<any>).find(t => t.label === "important")?.items.length, 1);
    assertEquals((allUserAliceTags as Array<any>).find(t => t.label === "review")?.items.length, 1);

  } finally {
    await client.close();
  }
});

Deno.test("Action: addTag creates new tag or adds to existing, enforces requirements", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Case 1: Create a brand new tag for userAlice
    const result1 = await tagConcept.addTag({ user: userAlice, label: "newTag", item: itemA });
    assertNotEquals("error" in result1, true, "Should successfully create a new tag.");
    const tagId1 = (result1 as { tag: ID }).tag;
    assertExists(tagId1);

    // Verify tag details
    const tagDetails1 = await tagConcept._getTagDetails({ tagId: tagId1 });
    assertNotEquals("error" in tagDetails1, true, "Should retrieve details for the new tag.");
    assertEquals((tagDetails1 as any).label, "newTag");
    assertEquals((tagDetails1 as any).owner, userAlice);
    assertEquals((tagDetails1 as any).items.length, 1);
    assertEquals((tagDetails1 as any).items[0], itemA);

    // Case 2: Add another item to the existing tag for userAlice
    const result2 = await tagConcept.addTag({ user: userAlice, label: "newTag", item: itemB });
    assertNotEquals("error" in result2, true, "Should successfully add item to existing tag.");
    const tagId2 = (result2 as { tag: ID }).tag;
    assertEquals(tagId2, tagId1, "Should reuse the same tag ID for the same user and label.");

    // Verify tag details reflect the new item
    const tagDetails2 = await tagConcept._getTagDetails({ tagId: tagId1 });
    assertNotEquals("error" in tagDetails2, true, "Should retrieve updated details for the tag.");
    assertEquals((tagDetails2 as any).items.length, 2);
    assertEquals((tagDetails2 as any).items.includes(itemA), true);
    assertEquals((tagDetails2 as any).items.includes(itemB), true);

    // Case 3: Violation of 'requires': item already associated with the tag
    const result3 = await tagConcept.addTag({ user: userAlice, label: "newTag", item: itemA });
    assertEquals("error" in result3, true, "Should fail when item is already in the tag.");
    assertEquals(
      (result3 as { error: string }).error.includes("already associated"),
      true,
      "Error message should indicate existing association.",
    );

    // Case 4: Another user (userBob) creates a tag with the same label - should be a distinct tag
    const result4 = await tagConcept.addTag({ user: userBob, label: "newTag", item: itemC });
    assertNotEquals("error" in result4, true, "userBob should successfully create their own 'newTag'.");
    const tagIdBob = (result4 as { tag: ID }).tag;
    assertNotEquals(tagIdBob, tagId1, "userBob's tag should have a different ID than userAlice's tag.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: removeTagFromItem successfully removes association and enforces requirements", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup: Create a tag with two items for userAlice
    const addTagResult = await tagConcept.addTag({ user: userAlice, label: "removeTest", item: itemA });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({ user: userAlice, label: "removeTest", item: itemB });

    // Verify initial state
    let tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals((tagDetails as any).items.length, 2, "Initial tag should have 2 items.");

    // Case 1: Successfully remove an item
    const removeResult1 = await tagConcept.removeTagFromItem({ tag: tagId, item: itemA });
    assertNotEquals("error" in removeResult1, true, "Should successfully remove itemA from tag.");
    tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals((tagDetails as any).items.length, 1, "Tag should have 1 item after removal.");
    assertEquals((tagDetails as any).items[0], itemB, "Remaining item should be itemB.");

    // Case 2: Violation of 'requires': item not associated with the tag
    const removeResult2 = await tagConcept.removeTagFromItem({ tag: tagId, item: itemA });
    assertEquals("error" in removeResult2, true, "Should fail when item is not in the tag.");
    assertEquals(
      (removeResult2 as { error: string }).error.includes("not currently associated"),
      true,
      "Error message should indicate no current association.",
    );

    // Case 3: Violation of 'requires': tag does not exist
    const removeResult3 = await tagConcept.removeTagFromItem({ tag: nonExistentID, item: itemA });
    assertEquals("error" in removeResult3, true, "Should fail when tag does not exist.");
    assertEquals(
      (removeResult3 as { error: string }).error.includes("Tag with ID"),
      true,
      "Error message should indicate tag not found.",
    );

    // Case 4: Remove the last item (tag should remain, items array becomes empty)
    const removeResult4 = await tagConcept.removeTagFromItem({ tag: tagId, item: itemB });
    assertNotEquals("error" in removeResult4, true, "Should successfully remove the last item from tag.");
    tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals((tagDetails as any).items.length, 0, "Tag should have 0 items after removing the last one.");
    assertExists(tagDetails, "Tag document itself should still exist."); // The tag itself is not deleted

  } finally {
    await client.close();
  }
});

Deno.test("Query: _getItemsByTag retrieves associated items or error", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup: Create a tag with two items
    const addTagResult = await tagConcept.addTag({ user: userAlice, label: "queryTag", item: itemA });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({ user: userAlice, label: "queryTag", item: itemB });

    // Case 1: Retrieve items for an existing tag
    const items = await tagConcept._getItemsByTag({ tagId });
    assertNotEquals("error" in items, true, "Should retrieve items for an existing tag.");
    assertEquals((items as ID[]).length, 2);
    assertEquals((items as ID[]).includes(itemA), true);
    assertEquals((items as ID[]).includes(itemB), true);

    // Case 2: Retrieve items for a non-existent tag
    const errorResult = await tagConcept._getItemsByTag({ tagId: nonExistentID });
    assertEquals("error" in errorResult, true, "Should return an error for a non-existent tag.");
    assertEquals(
      (errorResult as { error: string }).error.includes("Tag with ID"),
      true,
      "Error message should indicate tag not found.",
    );

    // Case 3: Retrieve items for an existing tag that has no items
    const addEmptyTagResult = await tagConcept.addTag({ user: userAlice, label: "emptyTag", item: itemC });
    const emptyTagId = (addEmptyTagResult as { tag: ID }).tag;
    await tagConcept.removeTagFromItem({ tag: emptyTagId, item: itemC }); // Make it empty
    const emptyItems = await tagConcept._getItemsByTag({ tagId: emptyTagId });
    assertNotEquals("error" in emptyItems, true, "Should retrieve items for an empty tag (empty array).");
    assertEquals((emptyItems as ID[]).length, 0);

  } finally {
    await client.close();
  }
});

Deno.test("Query: _getTagsForItem retrieves tags associated with an item for a specific user", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup for userAlice
    await tagConcept.addTag({ user: userAlice, label: "tagForA_1", item: itemA });
    await tagConcept.addTag({ user: userAlice, label: "tagForA_2", item: itemA });
    await tagConcept.addTag({ user: userAlice, label: "tagForB_1", item: itemB });

    // Setup for userBob
    await tagConcept.addTag({ user: userBob, label: "tagForA_B", item: itemA }); // Different user, same item

    // Case 1: Retrieve tags for itemA for userAlice (should have two tags)
    const itemATagsForAlice = await tagConcept._getTagsForItem({ user: userAlice, item: itemA });
    assertNotEquals("error" in itemATagsForAlice, true, "Should retrieve tags for itemA for userAlice.");
    assertEquals((itemATagsForAlice as Array<any>).length, 2);
    assertEquals((itemATagsForAlice as Array<any>).some(t => t.label === "tagForA_1"), true);
    assertEquals((itemATagsForAlice as Array<any>).some(t => t.label === "tagForA_2"), true);

    // Case 2: Retrieve tags for itemB for userAlice (should have one tag)
    const itemBTagsForAlice = await tagConcept._getTagsForItem({ user: userAlice, item: itemB });
    assertNotEquals("error" in itemBTagsForAlice, true, "Should retrieve tags for itemB for userAlice.");
    assertEquals((itemBTagsForAlice as Array<any>).length, 1);
    assertEquals((itemBTagsForAlice as Array<any>)[0].label, "tagForB_1");

    // Case 3: Retrieve tags for itemC that userAlice doesn't have tags for (should be empty)
    const itemCTagsForAlice = await tagConcept._getTagsForItem({ user: userAlice, item: itemC });
    assertNotEquals("error" in itemCTagsForAlice, true, "Should return an empty array for itemC for userAlice.");
    assertEquals((itemCTagsForAlice as Array<any>).length, 0);

    // Case 4: Retrieve tags for itemA for userBob (should be isolated from userAlice's tags)
    const itemATagsForBob = await tagConcept._getTagsForItem({ user: userBob, item: itemA });
    assertNotEquals("error" in itemATagsForBob, true, "Should retrieve tags for itemA for userBob.");
    assertEquals((itemATagsForBob as Array<any>).length, 1);
    assertEquals((itemATagsForBob as Array<any>)[0].label, "tagForA_B");

  } finally {
    await client.close();
  }
});

Deno.test("Query: _getTagDetails retrieves full tag structure or error", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup: Create a tag with two items
    const addTagResult = await tagConcept.addTag({ user: userAlice, label: "detailTag", item: itemA });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({ user: userAlice, label: "detailTag", item: itemB });

    // Case 1: Retrieve details for an existing tag
    const tagDetails = await tagConcept._getTagDetails({ tagId });
    assertNotEquals("error" in tagDetails, true, "Should retrieve full details for an existing tag.");
    assertEquals((tagDetails as any)._id, tagId);
    assertEquals((tagDetails as any).owner, userAlice);
    assertEquals((tagDetails as any).label, "detailTag");
    assertEquals((tagDetails as any).items.length, 2);
    assertEquals((tagDetails as any).items.includes(itemA), true);
    assertEquals((tagDetails as any).items.includes(itemB), true);

    // Case 2: Retrieve details for a non-existent tag
    const errorResult = await tagConcept._getTagDetails({ tagId: nonExistentID });
    assertEquals("error" in errorResult, true, "Should return an error for a non-existent tag.");
    assertEquals(
      (errorResult as { error: string }).error.includes("Tag with ID"),
      true,
      "Error message should indicate tag not found.",
    );

  } finally {
    await client.close();
  }
});

Deno.test("Query: _getAllUserTags retrieves all tags owned by a user", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup for userAlice: two distinct tags, one with multiple items
    await tagConcept.addTag({ user: userAlice, label: "tag1Alice", item: itemA });
    await tagConcept.addTag({ user: userAlice, label: "tag2Alice", item: itemB });
    await tagConcept.addTag({ user: userAlice, label: "tag1Alice", item: itemC }); // Add another item to tag1Alice

    // Setup for userBob: one tag
    await tagConcept.addTag({ user: userBob, label: "tag1Bob", item: itemA });

    // Case 1: Retrieve all tags for userAlice
    const userAliceTags = await tagConcept._getAllUserTags({ user: userAlice });
    assertNotEquals("error" in userAliceTags, true, "Should retrieve all tags for userAlice.");
    assertEquals((userAliceTags as Array<any>).length, 2, "UserAlice should have 2 distinct tags.");
    assertEquals((userAliceTags as Array<any>).some(t => t.label === "tag1Alice" && t.items.length === 2 && t.items.includes(itemA) && t.items.includes(itemC)), true);
    assertEquals((userAliceTags as Array<any>).some(t => t.label === "tag2Alice" && t.items.length === 1 && t.items.includes(itemB)), true);

    // Case 2: Retrieve all tags for userBob
    const userBobTags = await tagConcept._getAllUserTags({ user: userBob });
    assertNotEquals("error" in userBobTags, true, "Should retrieve all tags for userBob.");
    assertEquals((userBobTags as Array<any>).length, 1, "UserBob should have 1 tag.");
    assertEquals((userBobTags as Array<any>)[0].label, "tag1Bob");
    assertEquals((userBobTags as Array<any>)[0].items.includes(itemA), true);

    // Case 3: Retrieve all tags for a user with no tags
    const userCharlieTags = await tagConcept._getAllUserTags({ user: "user:Charlie" as ID });
    assertNotEquals("error" in userCharlieTags, true, "Should retrieve an empty array for a user with no tags.");
    assertEquals((userCharlieTags as Array<any>).length, 0);

  } finally {
    await client.close();
  }
});
```
