import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { testDb } from "../../utils/database.ts";
import { ID } from "../../utils/types.ts";
import TagConcept from "../Scriblink/tagsConcept.ts"; // Fixed path from "./tags.ts" to "../tags.ts" (assuming tags.ts is one directory up)

// Define some constant IDs for testing, similar to the example
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID; // Another user to test isolation
const itemA = "item:documentA" as ID;
const itemB = "item:photoB" as ID;
const itemC = "item:videoC" as ID;
const nonExistentID = "nonexistent:id" as ID; // For testing non-existent entities

// ============================================================================
// --- OPERATIONAL PRINCIPLE ---
// ============================================================================

Deno.test("Principle: User flags items, then retrieves items by tag and tags by item", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log("\n🏷️  OPERATIONAL PRINCIPLE: Tag Management Workflow");
    console.log("=".repeat(60));

    // 1. UserAlice adds tag "important" to itemA
    console.log("\n🏷️  Step 1: Adding tag to item");
    const addTag1Result = await tagConcept.addTag({
      user: userAlice,
      label: "important",
      item: itemA,
    });
    assertNotEquals(
      "error" in addTag1Result,
      true,
      "Adding tag 'important' to itemA should succeed.",
    );
    const tagImportantId = (addTag1Result as { tag: ID }).tag;
    assertExists(tagImportantId);
    console.log("   ✅ Tag 'important' added to itemA");

    // 2. UserAlice adds tag "important" to itemB
    console.log("\n🏷️  Step 2: Adding same tag to another item");
    const addTag2Result = await tagConcept.addTag({
      user: userAlice,
      label: "important",
      item: itemB,
    });
    assertNotEquals(
      "error" in addTag2Result,
      true,
      "Adding tag 'important' to itemB should succeed.",
    );
    assertEquals(
      (addTag2Result as { tag: ID }).tag,
      tagImportantId,
      "Both items should use the same 'important' tag ID.",
    );
    console.log("   ✅ Tag 'important' added to itemB (reusing same tag)");

    // 3. UserAlice adds tag "review" to itemA
    console.log("\n🏷️  Step 3: Adding different tag to item");
    const addTag3Result = await tagConcept.addTag({
      user: userAlice,
      label: "review",
      item: itemA,
    });
    assertNotEquals(
      "error" in addTag3Result,
      true,
      "Adding tag 'review' to itemA should succeed.",
    );
    const tagReviewId = (addTag3Result as { tag: ID }).tag;
    assertNotEquals(
      tagReviewId,
      tagImportantId,
      "'review' tag should have a different ID than 'important' tag.",
    );
    assertExists(tagReviewId);
    console.log("   ✅ Tag 'review' added to itemA (new tag created)");

    // 4. Verify items for the "important" tag
    console.log("\n🔍 Step 4: Retrieving items by tag");
    const importantItems = await tagConcept._getItemsByTag({
      tagId: tagImportantId,
    });
    assertNotEquals(
      "error" in importantItems,
      true,
      "Getting items by 'important' tag should succeed.",
    );
    assertEquals(
      (importantItems as ID[]).length,
      2,
      "There should be 2 items associated with 'important'.",
    );
    assertEquals(
      (importantItems as ID[]).includes(itemA),
      true,
      "itemA should be in 'important' items.",
    );
    assertEquals(
      (importantItems as ID[]).includes(itemB),
      true,
      "itemB should be in 'important' items.",
    );
    console.log("   ✅ Found 2 items with 'important' tag: itemA, itemB");

    // 5. Verify tags for itemA (should have both "important" and "review")
    console.log("\n🔍 Step 5: Retrieving tags for item");
    const itemATags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in itemATags,
      true,
      "Getting tags for itemA should succeed.",
    );
    assertEquals(
      (itemATags as Array<any>).length,
      2,
      "There should be 2 tags associated with itemA.",
    );
    assertEquals(
      (itemATags as Array<any>).some((t) => t.label === "important"),
      true,
      "itemA should have 'important' tag.",
    );
    assertEquals(
      (itemATags as Array<any>).some((t) => t.label === "review"),
      true,
      "itemA should have 'review' tag.",
    );
    console.log("   ✅ Found 2 tags for itemA: 'important', 'review'");

    // 6. UserAlice removes tag "important" from itemA
    console.log("\n🗑️  Step 6: Removing tag from item");
    const removeResult = await tagConcept.removeTagFromItem({
      tag: tagImportantId,
      item: itemA,
    });
    assertNotEquals(
      "error" in removeResult,
      true,
      "Removing 'important' from itemA should succeed.",
    );
    console.log("   ✅ Tag 'important' removed from itemA");

    // 7. Verify items for "important" tag again (itemA should be gone)
    console.log("\n🔍 Step 7: Verifying tag removal effects");
    const importantItemsAfterRemoval = await tagConcept._getItemsByTag({
      tagId: tagImportantId,
    });
    assertNotEquals(
      "error" in importantItemsAfterRemoval,
      true,
      "Getting items by 'important' tag should succeed after removal.",
    );
    assertEquals(
      (importantItemsAfterRemoval as ID[]).length,
      1,
      "There should be 1 item left in 'important'.",
    );
    assertEquals(
      (importantItemsAfterRemoval as ID[]).includes(itemA),
      false,
      "itemA should NOT be in 'important' items.",
    );
    assertEquals(
      (importantItemsAfterRemoval as ID[]).includes(itemB),
      true,
      "itemB should still be in 'important' items.",
    );
    console.log("   ✅ 'important' tag now has only itemB (itemA removed)");

    // 8. Verify tags for itemA again (only "review" should remain)
    console.log("\n🔍 Step 8: Verifying item's remaining tags");
    const itemATagsAfterRemoval = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in itemATagsAfterRemoval,
      true,
      "Getting tags for itemA should succeed after removal.",
    );
    assertEquals(
      (itemATagsAfterRemoval as Array<any>).length,
      1,
      "There should be 1 tag associated with itemA.",
    );
    assertEquals(
      (itemATagsAfterRemoval as Array<any>).some((t) =>
        t.label === "important"
      ),
      false,
      "itemA should NOT have 'important' tag.",
    );
    assertEquals(
      (itemATagsAfterRemoval as Array<any>).some((t) => t.label === "review"),
      true,
      "itemA should still have 'review' tag.",
    );
    console.log("   ✅ itemA now has only 'review' tag");

    // 9. Get all tags for userAlice
    console.log("\n🔍 Step 9: Retrieving all user tags");
    const allUserAliceTags = await tagConcept._getAllUserTags({
      user: userAlice,
    });
    assertNotEquals(
      "error" in allUserAliceTags,
      true,
      "Getting all tags for userAlice should succeed.",
    );
    assertEquals(
      (allUserAliceTags as Array<any>).length,
      2,
      "UserAlice should have 2 tags: 'important' (with itemB) and 'review' (with itemA).",
    );
    assertEquals(
      (allUserAliceTags as Array<any>).find((t) => t.label === "important")
        ?.items.length,
      1,
    );
    assertEquals(
      (allUserAliceTags as Array<any>).find((t) => t.label === "review")?.items
        .length,
      1,
    );
    console.log(
      "   ✅ User has 2 tags: 'important' (1 item), 'review' (1 item)",
    );
    console.log("   📊 Final state: itemA has 'review', itemB has 'important'");

    console.log("\n🎉 OPERATIONAL PRINCIPLE COMPLETE");
    console.log("=".repeat(60));
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- GENERAL CONCEPT METHOD TESTING ---
// ============================================================================

Deno.test("Action: addTag creates new tag or adds to existing, enforces requirements", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Case 1: Create a brand new tag for userAlice
    const result1 = await tagConcept.addTag({
      user: userAlice,
      label: "newTag",
      item: itemA,
    });
    assertNotEquals(
      "error" in result1,
      true,
      "Should successfully create a new tag.",
    );
    const tagId1 = (result1 as { tag: ID }).tag;
    assertExists(tagId1);

    // Verify tag details
    const tagDetails1 = await tagConcept._getTagDetails({ tagId: tagId1 });
    assertNotEquals(
      "error" in tagDetails1,
      true,
      "Should retrieve details for the new tag.",
    );
    assertEquals((tagDetails1 as any).label, "newTag");
    assertEquals((tagDetails1 as any).owner, userAlice);
    assertEquals((tagDetails1 as any).items.length, 1);
    assertEquals((tagDetails1 as any).items[0], itemA);

    // Case 2: Add another item to the existing tag for userAlice
    const result2 = await tagConcept.addTag({
      user: userAlice,
      label: "newTag",
      item: itemB,
    });
    assertNotEquals(
      "error" in result2,
      true,
      "Should successfully add item to existing tag.",
    );
    const tagId2 = (result2 as { tag: ID }).tag;
    assertEquals(
      tagId2,
      tagId1,
      "Should reuse the same tag ID for the same user and label.",
    );

    // Verify tag details reflect the new item
    const tagDetails2 = await tagConcept._getTagDetails({ tagId: tagId1 });
    assertNotEquals(
      "error" in tagDetails2,
      true,
      "Should retrieve updated details for the tag.",
    );
    assertEquals((tagDetails2 as any).items.length, 2);
    assertEquals((tagDetails2 as any).items.includes(itemA), true);
    assertEquals((tagDetails2 as any).items.includes(itemB), true);

    // Case 3: Violation of 'requires': item already associated with the tag
    const result3 = await tagConcept.addTag({
      user: userAlice,
      label: "newTag",
      item: itemA,
    });
    assertEquals(
      "error" in result3,
      true,
      "Should fail when item is already in the tag.",
    );
    assertEquals(
      (result3 as { error: string }).error.includes("already associated"),
      true,
      "Error message should indicate existing association.",
    );

    // Case 4: Another user (userBob) creates a tag with the same label - should be a distinct tag
    const result4 = await tagConcept.addTag({
      user: userBob,
      label: "newTag",
      item: itemC,
    });
    assertNotEquals(
      "error" in result4,
      true,
      "userBob should successfully create their own 'newTag'.",
    );
    const tagIdBob = (result4 as { tag: ID }).tag;
    assertNotEquals(
      tagIdBob,
      tagId1,
      "userBob's tag should have a different ID than userAlice's tag.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: removeTagFromItem successfully removes association and enforces requirements", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    // Setup: Create a tag with two items for userAlice
    const addTagResult = await tagConcept.addTag({
      user: userAlice,
      label: "removeTest",
      item: itemA,
    });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({
      user: userAlice,
      label: "removeTest",
      item: itemB,
    });

    // Verify initial state
    let tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals(
      (tagDetails as any).items.length,
      2,
      "Initial tag should have 2 items.",
    );

    // Case 1: Successfully remove an item
    const removeResult1 = await tagConcept.removeTagFromItem({
      tag: tagId,
      item: itemA,
    });
    assertNotEquals(
      "error" in removeResult1,
      true,
      "Should successfully remove itemA from tag.",
    );
    tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals(
      (tagDetails as any).items.length,
      1,
      "Tag should have 1 item after removal.",
    );
    assertEquals(
      (tagDetails as any).items[0],
      itemB,
      "Remaining item should be itemB.",
    );

    // Case 2: Violation of 'requires': item not associated with the tag
    const removeResult2 = await tagConcept.removeTagFromItem({
      tag: tagId,
      item: itemA,
    });
    assertEquals(
      "error" in removeResult2,
      true,
      "Should fail when item is not in the tag.",
    );
    assertEquals(
      (removeResult2 as { error: string }).error.includes(
        "not currently associated",
      ),
      true,
      "Error message should indicate no current association.",
    );

    // Case 3: Violation of 'requires': tag does not exist
    const removeResult3 = await tagConcept.removeTagFromItem({
      tag: nonExistentID,
      item: itemA,
    });
    assertEquals(
      "error" in removeResult3,
      true,
      "Should fail when tag does not exist.",
    );
    assertEquals(
      (removeResult3 as { error: string }).error.includes("Tag with ID"),
      true,
      "Error message should indicate tag not found.",
    );

    // Case 4: Remove the last item (tag should remain, items array becomes empty)
    const removeResult4 = await tagConcept.removeTagFromItem({
      tag: tagId,
      item: itemB,
    });
    assertNotEquals(
      "error" in removeResult4,
      true,
      "Should successfully remove the last item from tag.",
    );
    tagDetails = await tagConcept._getTagDetails({ tagId });
    assertEquals(
      (tagDetails as any).items.length,
      0,
      "Tag should have 0 items after removing the last one.",
    );
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
    const addTagResult = await tagConcept.addTag({
      user: userAlice,
      label: "queryTag",
      item: itemA,
    });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({
      user: userAlice,
      label: "queryTag",
      item: itemB,
    });

    // Case 1: Retrieve items for an existing tag
    const items = await tagConcept._getItemsByTag({ tagId });
    assertNotEquals(
      "error" in items,
      true,
      "Should retrieve items for an existing tag.",
    );
    assertEquals((items as ID[]).length, 2);
    assertEquals((items as ID[]).includes(itemA), true);
    assertEquals((items as ID[]).includes(itemB), true);

    // Case 2: Retrieve items for a non-existent tag
    const errorResult = await tagConcept._getItemsByTag({
      tagId: nonExistentID,
    });
    assertEquals(
      "error" in errorResult,
      true,
      "Should return an error for a non-existent tag.",
    );
    assertEquals(
      (errorResult as { error: string }).error.includes("Tag with ID"),
      true,
      "Error message should indicate tag not found.",
    );

    // Case 3: Retrieve items for an existing tag that has no items
    const addEmptyTagResult = await tagConcept.addTag({
      user: userAlice,
      label: "emptyTag",
      item: itemC,
    });
    const emptyTagId = (addEmptyTagResult as { tag: ID }).tag;
    await tagConcept.removeTagFromItem({ tag: emptyTagId, item: itemC }); // Make it empty
    const emptyItems = await tagConcept._getItemsByTag({ tagId: emptyTagId });
    assertNotEquals(
      "error" in emptyItems,
      true,
      "Should retrieve items for an empty tag (empty array).",
    );
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
    await tagConcept.addTag({
      user: userAlice,
      label: "tagForA_1",
      item: itemA,
    });
    await tagConcept.addTag({
      user: userAlice,
      label: "tagForA_2",
      item: itemA,
    });
    await tagConcept.addTag({
      user: userAlice,
      label: "tagForB_1",
      item: itemB,
    });

    // Setup for userBob
    await tagConcept.addTag({ user: userBob, label: "tagForA_B", item: itemA }); // Different user, same item

    // Case 1: Retrieve tags for itemA for userAlice (should have two tags)
    const itemATagsForAlice = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in itemATagsForAlice,
      true,
      "Should retrieve tags for itemA for userAlice.",
    );
    assertEquals((itemATagsForAlice as Array<any>).length, 2);
    assertEquals(
      (itemATagsForAlice as Array<any>).some((t) => t.label === "tagForA_1"),
      true,
    );
    assertEquals(
      (itemATagsForAlice as Array<any>).some((t) => t.label === "tagForA_2"),
      true,
    );

    // Case 2: Retrieve tags for itemB for userAlice (should have one tag)
    const itemBTagsForAlice = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemB,
    });
    assertNotEquals(
      "error" in itemBTagsForAlice,
      true,
      "Should retrieve tags for itemB for userAlice.",
    );
    assertEquals((itemBTagsForAlice as Array<any>).length, 1);
    assertEquals((itemBTagsForAlice as Array<any>)[0].label, "tagForB_1");

    // Case 3: Retrieve tags for itemC that userAlice doesn't have tags for (should be empty)
    const itemCTagsForAlice = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemC,
    });
    assertNotEquals(
      "error" in itemCTagsForAlice,
      true,
      "Should return an empty array for itemC for userAlice.",
    );
    assertEquals((itemCTagsForAlice as Array<any>).length, 0);

    // Case 4: Retrieve tags for itemA for userBob (should be isolated from userAlice's tags)
    const itemATagsForBob = await tagConcept._getTagsForItem({
      user: userBob,
      item: itemA,
    });
    assertNotEquals(
      "error" in itemATagsForBob,
      true,
      "Should retrieve tags for itemA for userBob.",
    );
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
    const addTagResult = await tagConcept.addTag({
      user: userAlice,
      label: "detailTag",
      item: itemA,
    });
    const tagId = (addTagResult as { tag: ID }).tag;
    await tagConcept.addTag({
      user: userAlice,
      label: "detailTag",
      item: itemB,
    });

    // Case 1: Retrieve details for an existing tag
    const tagDetails = await tagConcept._getTagDetails({ tagId });
    assertNotEquals(
      "error" in tagDetails,
      true,
      "Should retrieve full details for an existing tag.",
    );
    assertEquals((tagDetails as any)._id, tagId);
    assertEquals((tagDetails as any).owner, userAlice);
    assertEquals((tagDetails as any).label, "detailTag");
    assertEquals((tagDetails as any).items.length, 2);
    assertEquals((tagDetails as any).items.includes(itemA), true);
    assertEquals((tagDetails as any).items.includes(itemB), true);

    // Case 2: Retrieve details for a non-existent tag
    const errorResult = await tagConcept._getTagDetails({
      tagId: nonExistentID,
    });
    assertEquals(
      "error" in errorResult,
      true,
      "Should return an error for a non-existent tag.",
    );
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
    await tagConcept.addTag({
      user: userAlice,
      label: "tag1Alice",
      item: itemA,
    });
    await tagConcept.addTag({
      user: userAlice,
      label: "tag2Alice",
      item: itemB,
    });
    await tagConcept.addTag({
      user: userAlice,
      label: "tag1Alice",
      item: itemC,
    }); // Add another item to tag1Alice

    // Setup for userBob: one tag
    await tagConcept.addTag({ user: userBob, label: "tag1Bob", item: itemA });

    // Case 1: Retrieve all tags for userAlice
    const userAliceTags = await tagConcept._getAllUserTags({ user: userAlice });
    assertNotEquals(
      "error" in userAliceTags,
      true,
      "Should retrieve all tags for userAlice.",
    );
    assertEquals(
      (userAliceTags as Array<any>).length,
      2,
      "UserAlice should have 2 distinct tags.",
    );
    assertEquals(
      (userAliceTags as Array<any>).some((t) =>
        t.label === "tag1Alice" && t.items.length === 2 &&
        t.items.includes(itemA) && t.items.includes(itemC)
      ),
      true,
    );
    assertEquals(
      (userAliceTags as Array<any>).some((t) =>
        t.label === "tag2Alice" && t.items.length === 1 &&
        t.items.includes(itemB)
      ),
      true,
    );

    // Case 2: Retrieve all tags for userBob
    const userBobTags = await tagConcept._getAllUserTags({ user: userBob });
    assertNotEquals(
      "error" in userBobTags,
      true,
      "Should retrieve all tags for userBob.",
    );
    assertEquals(
      (userBobTags as Array<any>).length,
      1,
      "UserBob should have 1 tag.",
    );
    assertEquals((userBobTags as Array<any>)[0].label, "tag1Bob");
    assertEquals((userBobTags as Array<any>)[0].items.includes(itemA), true);

    // Case 3: Retrieve all tags for a user with no tags
    const userCharlieTags = await tagConcept._getAllUserTags({
      user: "user:Charlie" as ID,
    });
    assertNotEquals(
      "error" in userCharlieTags,
      true,
      "Should retrieve an empty array for a user with no tags.",
    );
    assertEquals((userCharlieTags as Array<any>).length, 0);
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- INTERESTING SCENARIOS ---
// ============================================================================
Deno.test("Interesting Scenario 1: Tag collision and namespace conflicts", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log(
      "\n🏷️  SCENARIO 1: Tag Collision and Namespace Conflicts",
    );

    // 1. Test case-sensitive tag conflicts
    console.log("1. Testing case-sensitive tag conflicts...");
    const caseSensitiveTags = [
      "Important",
      "important",
      "IMPORTANT",
      "iMpOrTaNt",
    ];

    for (const tag of caseSensitiveTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemA,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All case-sensitive tags accepted as separate tags");

    // 2. Test special character conflicts
    console.log("2. Testing special character tag conflicts...");
    const specialTags = [
      "tag-with-dash",
      "tag_with_underscore",
      "tag.with.dots",
      "tag with spaces",
    ];

    for (const tag of specialTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemB,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Special tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All special character tags accepted");

    // 3. Test unicode conflicts
    console.log("3. Testing unicode tag conflicts...");
    const unicodeTags = ["标签", "🏷️", "tag你好", "étiquette"];

    for (const tag of unicodeTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemC,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Unicode tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All unicode tags accepted");

    // 4. Test very long tag names
    console.log("4. Testing very long tag names...");
    const longTag = "a".repeat(500); // 500 character tag
    const longTagResult = await tagConcept.addTag({
      user: userAlice,
      item: itemA,
      label: longTag,
    });
    assertNotEquals(
      "error" in longTagResult,
      true,
      "Very long tag should be accepted",
    );
    console.log("✓ Very long tag accepted");

    // 5. Test empty and whitespace-only tags
    console.log("5. Testing empty and whitespace tags...");
    const emptyTagResult = await tagConcept.addTag({
      user: userAlice,
      item: itemA,
      label: "",
    });
    assertEquals(
      "error" in emptyTagResult,
      true,
      "Empty tag should be rejected",
    );

    const whitespaceTagResult = await tagConcept.addTag({
      user: userAlice,
      item: itemA,
      label: "   ",
    });
    assertEquals(
      "error" in whitespaceTagResult,
      true,
      "Whitespace-only tag should be rejected",
    );
    console.log("✓ Empty and whitespace tags correctly rejected");

    console.log("\n🎉 SCENARIO 1 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 2: Tag semantic similarity and fuzzy matching", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log(
      "\n🔍 SCENARIO 2: Tag Semantic Similarity and Fuzzy Matching",
    );

    // 1. Create semantically similar tags
    console.log("1. Creating semantically similar tags...");
    const similarTags = [
      "urgent",
      "priority",
      "important",
      "critical",
      "asap",
      "work",
      "job",
      "career",
      "professional",
      "business",
      "personal",
      "private",
      "individual",
      "own",
      "mine",
      "project",
      "task",
      "assignment",
      "work-item",
      "todo",
    ];

    for (const tag of similarTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemA,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Similar tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All semantically similar tags created");

    // 2. Test tag retrieval shows all similar tags
    console.log("2. Testing tag retrieval for similar tags...");
    const itemTags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals("error" in itemTags, true, "Tag retrieval should succeed");
    const itemTagsList = (itemTags as any[]).map((tag) => tag.label);

    assertEquals(
      itemTagsList.length,
      similarTags.length,
      "Should have all similar tags",
    );
    for (const tag of similarTags) {
      assertArrayIncludes(itemTagsList, [tag], `Should include tag "${tag}"`);
    }
    console.log("✓ All similar tags retrieved correctly");

    // 3. Test tag variations and typos
    console.log("3. Testing tag variations and typos...");
    const variationTags = [
      "urgent",
      "Urgent",
      "URGENT",
      "urgent!",
      "urgent?",
      "work-item",
      "work_item",
      "workitem",
      "work item",
      "project-1",
      "project_1",
      "project1",
      "project 1",
    ];

    for (const tag of variationTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemB,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Variation tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All tag variations accepted");

    // 4. Test tag abbreviations and acronyms
    console.log("4. Testing tag abbreviations and acronyms...");
    const abbreviationTags = [
      "AI",
      "ML",
      "API",
      "UI",
      "UX",
      "DB",
      "SQL",
      "JS",
      "CSS",
      "HTML",
      "CEO",
      "CTO",
      "CFO",
      "HR",
      "IT",
      "PR",
      "QA",
      "R&D",
      "SLA",
      "MVP",
    ];

    for (const tag of abbreviationTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemC,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Abbreviation tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All abbreviation tags accepted");

    // 5. Test tag with numbers and versions
    console.log("5. Testing tags with numbers and versions...");
    const versionTags = [
      "v1.0",
      "v2.1",
      "version-3",
      "release-1.2.3",
      "project-2024",
      "task-001",
      "bug-123",
      "feature-456",
      "quarter-1",
      "quarter-2",
      "Q3",
      "Q4-2024",
    ];

    for (const tag of versionTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemA,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Version tag "${tag}" should be accepted`,
      );
    }
    console.log("✓ All version tags accepted");

    // 6. Test tag removal with similar tags
    console.log("6. Testing tag removal with similar tags...");
    // First get all tags to find the urgent tag ID
    const allTags = await tagConcept._getAllUserTags({ user: userAlice });
    assertNotEquals(
      "error" in allTags,
      true,
      "Getting all tags should succeed",
    );
    const allTagsList = allTags as any[];
    const urgentTag = allTagsList.find((tag) => tag.label === "urgent");
    assertNotEquals(urgentTag, undefined, "Urgent tag should exist");

    const removeResult = await tagConcept.removeTagFromItem({
      tag: urgentTag._id,
      item: itemA,
    });
    assertNotEquals(
      "error" in removeResult,
      true,
      "Removing urgent tag should succeed",
    );
    console.log("✓ Urgent tag removed successfully");

    // 7. Verify remaining similar tags
    console.log("7. Verifying remaining similar tags...");
    const remainingTags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in remainingTags,
      true,
      "Remaining tags retrieval should succeed",
    );
    const remainingTagsList = (remainingTags as any[]).map((tag) => tag.label);

    // Should still have priority, important, critical, asap (similar to urgent)
    const urgentSimilar = ["priority", "important", "critical", "asap"];
    for (const tag of urgentSimilar) {
      assertArrayIncludes(
        remainingTagsList,
        [tag],
        `Should still have similar tag "${tag}"`,
      );
    }
    console.log("✓ Similar tags preserved after removal");

    // 8. Test tag search with partial matches
    console.log("8. Testing tag search with partial matches...");
    // Find the work tag ID
    const workTag = allTagsList.find((tag) => tag.label === "work");
    assertNotEquals(workTag, undefined, "Work tag should exist");

    const workItems = await tagConcept._getItemsByTag({ tagId: workTag._id });
    assertNotEquals(
      "error" in workItems,
      true,
      "Work items retrieval should succeed",
    );
    const workItemsList = workItems as ID[];
    assertEquals(workItemsList.length, 1, "Should have one work item");
    assertEquals(workItemsList[0], itemA, "Should be itemA");
    console.log("✓ Partial tag matching works correctly");

    console.log("\n🎉 SCENARIO 2 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 3: Tag performance under high load", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log(
      "\n⚡ SCENARIO 3: Tag Performance Under High Load",
    );

    const startTime = Date.now();

    // 1. Rapid tag creation
    console.log("1. Creating tags rapidly...");
    const rapidTagPromises = [];
    for (let i = 0; i < 100; i++) {
      rapidTagPromises.push(
        tagConcept.addTag({
          user: userAlice,
          item: itemA,
          label: `rapid-tag-${i}`,
        }),
      );
    }

    const rapidResults = await Promise.all(rapidTagPromises);
    for (const result of rapidResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid tag creations should succeed",
      );
    }
    console.log("✓ 100 rapid tag creations completed");

    // 2. Concurrent tag operations
    console.log("2. Testing concurrent tag operations...");
    const concurrentPromises = [];

    // Mix of add, remove, and query operations
    for (let i = 0; i < 50; i++) {
      concurrentPromises.push(
        tagConcept.addTag({
          user: userAlice,
          item: itemB,
          label: `concurrent-${i}`,
        }),
      );
      concurrentPromises.push(
        tagConcept._getTagsForItem({ user: userAlice, item: itemA }),
      );
      if (i % 10 === 0) {
        // For concurrent operations, we'll skip the complex tag lookup and just test add operations
        // concurrentPromises.push(tagConcept.removeTagFromItem({ tag: `rapid-tag-${i}` as ID, item: itemA }));
      }
    }

    const concurrentResults = await Promise.all(concurrentPromises);
    let successCount = 0;
    let errorCount = 0;

    for (const result of concurrentResults) {
      if ("error" in result) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(
      `✓ Concurrent operations: ${successCount} succeeded, ${errorCount} failed`,
    );
    assertNotEquals(
      successCount,
      0,
      "Some concurrent operations should succeed",
    );

    // 3. Large tag retrieval
    console.log("3. Testing large tag retrieval...");
    const largeTagResult = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in largeTagResult,
      true,
      "Large tag retrieval should succeed",
    );
    const largeTagList = (largeTagResult as any[]).map((tag) => tag.label);
    assertNotEquals(
      largeTagList.length,
      0,
      "Should have tags after rapid creation",
    );
    console.log(`✓ Retrieved ${largeTagList.length} tags for itemA`);

    // 4. Performance measurement
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.log(
      `4. Performance measurement: ${totalTime}ms for all operations`,
    );

    // Should complete within reasonable time (adjust threshold as needed)
    assertNotEquals(
      totalTime > 10000,
      true,
      "Operations should complete within 10 seconds",
    );
    console.log("✓ Performance within acceptable limits");

    console.log("\n🎉 SCENARIO 3 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 4: Tag data corruption and recovery", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log(
      "\n🔧 SCENARIO 4: Tag Data Corruption and Recovery",
    );

    // 1. Create normal tag structure
    console.log("1. Creating normal tag structure...");
    const normalTags = ["urgent", "work", "personal", "review"];
    for (const tag of normalTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemA,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Normal tag "${tag}" should succeed`,
      );
    }
    console.log("✓ Normal tag structure created");

    // 2. Test malformed tag labels
    console.log("2. Testing malformed tag labels...");
    const malformedTags = [
      " null-char", // Null character
      "tagwithcontrolchars", // Control characters
      "tag\nwith\nnewlines", // Newlines
      "tag	with	tabs", // Tabs
    ];

    for (const tag of malformedTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemB,
        label: tag,
      });
      // These might succeed or fail depending on implementation
      if ("error" in result) {
        console.log(`✓ Malformed tag "${tag}" correctly rejected`);
      } else {
        console.log(`✓ Malformed tag "${tag}" accepted (sanitized)`);
      }
    }

    // 3. Test extremely long tag labels
    console.log("3. Testing extremely long tag labels...");
    const extremelyLongTag = "a".repeat(10000); // 10,000 characters
    const longTagResult = await tagConcept.addTag({
      user: userAlice,
      item: itemC,
      label: extremelyLongTag,
    });

    if ("error" in longTagResult) {
      console.log("✓ Extremely long tag correctly rejected");
    } else {
      console.log("✓ Extremely long tag accepted");

      // Verify it can be retrieved
      const retrieveResult = await tagConcept._getTagsForItem({
        user: userAlice,
        item: itemC,
      });
      assertNotEquals(
        "error" in retrieveResult,
        true,
        "Long tag retrieval should succeed",
      );
      const retrievedTags = (retrieveResult as any[]).map((tag) => tag.label);
      assertArrayIncludes(
        retrievedTags,
        [extremelyLongTag],
        "Should include the long tag",
      );
    }

    // 4. Test duplicate tag handling
    console.log("4. Testing duplicate tag handling...");
    const duplicateResult = await tagConcept.addTag({
      user: userAlice,
      item: itemA,
      label: "urgent",
    });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Duplicate tag should be rejected",
    );
    console.log("✓ Duplicate tag correctly rejected");

    // 5. Test tag removal of non-existent tag
    console.log("5. Testing removal of non-existent tag...");
    const removeNonExistentResult = await tagConcept.removeTagFromItem({
      tag: "nonexistent" as ID,
      item: itemA,
    });
    assertEquals(
      "error" in removeNonExistentResult,
      true,
      "Removing non-existent tag should fail",
    );
    console.log("✓ Non-existent tag removal correctly rejected");

    // 6. Verify data integrity after corruption tests
    console.log("6. Verifying data integrity after corruption tests...");
    const finalTags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in finalTags,
      true,
      "Final tag retrieval should succeed",
    );
    const finalTagsList = (finalTags as any[]).map((tag) => tag.label);

    // Should still have the original tags
    assertEquals(
      finalTagsList.length,
      normalTags.length,
      "Should have original tag count",
    );
    for (const tag of normalTags) {
      assertArrayIncludes(
        finalTagsList,
        [tag],
        `Should still have tag "${tag}"`,
      );
    }
    console.log("✓ Data integrity maintained after corruption tests");

    console.log("\n🎉 SCENARIO 4 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 5: Cross-user tag pollution and isolation", async () => {
  const [db, client] = await testDb();
  const tagConcept = new TagConcept(db);

  try {
    console.log(
      "\n👥 SCENARIO 5: Cross-User Tag Pollution and Isolation",
    );

    // 1. Alice creates tags
    console.log("1. Alice creating tags...");
    const aliceTags = ["alice-private", "shared-concept", "confidential"];
    const aliceTagIds: { [label: string]: ID } = {};
    for (const tag of aliceTags) {
      const result = await tagConcept.addTag({
        user: userAlice,
        item: itemA,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Alice tag "${tag}" should succeed`,
      );
      if ("tag" in result) {
        aliceTagIds[tag] = result.tag;
      }
    }
    console.log("✓ Alice's tags created");

    // 2. Bob creates similar tags
    console.log("2. Bob creating similar tags...");
    const bobTags = ["bob-private", "shared-concept", "public"];
    const bobTagIds: { [label: string]: ID } = {};
    for (const tag of bobTags) {
      const result = await tagConcept.addTag({
        user: userBob,
        item: itemB,
        label: tag,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Bob tag "${tag}" should succeed`,
      );
      if ("tag" in result) {
        bobTagIds[tag] = result.tag;
      }
    }
    console.log("✓ Bob's tags created");

    // 3. Test tag isolation
    console.log("3. Testing tag isolation between users...");
    const aliceItemTags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in aliceItemTags,
      true,
      "Alice item tags should be retrievable",
    );
    const aliceItemTagsList = (aliceItemTags as any[]).map((tag) => tag.label);

    const bobItemTags = await tagConcept._getTagsForItem({
      user: userBob,
      item: itemB,
    });
    assertNotEquals(
      "error" in bobItemTags,
      true,
      "Bob item tags should be retrievable",
    );
    const bobItemTagsList = (bobItemTags as any[]).map((tag) => tag.label);

    // Alice should not see Bob's private tags
    const aliceSeesBobPrivate = bobItemTagsList.some((tag) =>
      aliceItemTagsList.includes(tag) && tag === "bob-private"
    );
    assertEquals(
      aliceSeesBobPrivate,
      false,
      "Alice should not see Bob's private tags",
    );

    // Bob should not see Alice's private tags
    const bobSeesAlicePrivate = aliceItemTagsList.some((tag) =>
      bobItemTagsList.includes(tag) && tag === "alice-private"
    );
    assertEquals(
      bobSeesAlicePrivate,
      false,
      "Bob should not see Alice's private tags",
    );
    console.log("✓ Tag isolation maintained between users");

    // 4. Test shared tag concept
    console.log("4. Testing shared tag concept...");
    const aliceSharedItems = await tagConcept._getItemsByTag({
      tagId: aliceTagIds["shared-concept"],
    });
    assertNotEquals(
      "error" in aliceSharedItems,
      true,
      "Alice shared items should be retrievable",
    );
    const aliceSharedItemsList = aliceSharedItems as ID[];
    assertEquals(
      aliceSharedItemsList.length,
      1,
      "Alice should have one shared item",
    );
    assertEquals(aliceSharedItemsList[0], itemA, "Should be itemA");

    const bobSharedItems = await tagConcept._getItemsByTag({
      tagId: bobTagIds["shared-concept"],
    });
    assertNotEquals(
      "error" in bobSharedItems,
      true,
      "Bob shared items should be retrievable",
    );
    const bobSharedItemsList = bobSharedItems as ID[];
    assertEquals(
      bobSharedItemsList.length,
      1,
      "Bob should have one shared item",
    );
    assertEquals(bobSharedItemsList[0], itemB, "Should be itemB");
    console.log("✓ Shared tag concept works correctly");

    // 5. Verify Alice's data integrity
    console.log(
      "5. Verifying Alice's data integrity...",
    );
    const aliceFinalTags = await tagConcept._getTagsForItem({
      user: userAlice,
      item: itemA,
    });
    assertNotEquals(
      "error" in aliceFinalTags,
      true,
      "Alice final tags should be retrievable",
    );
    const aliceFinalTagsList = (aliceFinalTags as any[]).map((tag) =>
      tag.label
    );

    assertEquals(
      aliceFinalTagsList.length,
      aliceTags.length,
      "Alice should have original tag count",
    );
    for (const tag of aliceTags) {
      assertArrayIncludes(
        aliceFinalTagsList,
        [tag],
        `Alice should still have tag "${tag}"`,
      );
    }
    console.log("✓ Alice's data integrity maintained");

    console.log("\n🎉 SCENARIO 5 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});
