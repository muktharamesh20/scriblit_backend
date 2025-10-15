---
timestamp: 'Wed Oct 15 2025 16:23:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_162336.75642d2c.md]]'
content_id: d23ad6d4c4b0a23c2347f7978d77b5128d524c79b707eee1277804a0d9ff715b
---

# prompt:

Edit this to use the same files and to look more like the likertsurveyconcept test file.

```typescript
// test_folder_concept.ts (or similar name in your test directory)
import { Db, MongoClient } from "npm:mongodb";
import { assert, assertEquals, assertExists, assertNotEquals, assertArrayIncludes, assertRejects } from "jsr:@std/assert";
import { afterAll, beforeAll, describe, test } from "jsr:@std/testing/bdd";
import { testDb, freshID } from "@utils/database.ts";
import FolderConcept, { User, Item, Folder, FolderStructure } from "../Scriblink/folder.ts"; // Adjust path as necessary for your project

// Extended class for testing private methods `isDescendant` and `collectDescendants`
class ExtendedFolderConceptForTesting extends FolderConcept {
  public async testIsDescendant(targetId: Folder, ancestorId: Folder): Promise<boolean> {
    return await this.isDescendant(targetId, ancestorId);
  }
  public async testCollectDescendants(f: Folder, folderIdsToDelete: Set<Folder>): Promise<void> {
    return await this.collectDescendants(f, folderIdsToDelete);
  }
}

describe("FolderConcept", () => {
  let db: Db;
  let client: MongoClient;
  let folderConcept: FolderConcept;
  let extendedFolderConcept: ExtendedFolderConceptForTesting; // Instance for testing private methods

  // Persistent IDs for testing across steps to simulate continuous interaction
  let user1: User;
  let user2: User;
  let rootId: Folder;
  let child1Id: Folder;
  let child2Id: Folder;
  let grandchild1Id: Folder;
  let user2RootId: Folder;

  let item1: Item;
  let item2: Item;
  let item3: Item; // For negative tests or later insertion

  beforeAll(async () => {
    [db, client] = await testDb(); // Get a fresh, cleared test database
    folderConcept = new FolderConcept(db);
    extendedFolderConcept = new ExtendedFolderConceptForTesting(db); // Instantiate extended class

    user1 = freshID();
    user2 = freshID();

    item1 = freshID();
    item2 = freshID();
    item3 = freshID(); // An item not yet inserted, for testing failure cases
  });

  afterAll(async () => {
    await client.close(); // Close the database connection after all tests are done
  });

  // Main test suite for FolderConcept operations, using steps for continuity
  test("Folder concept operations", async (test) => {
    // -------------------------------------------------------------------------
    // 1. initializeFolder
    // -------------------------------------------------------------------------
    await test.step("1.1 initializeFolder - success (first user)", async () => {
      const result = await folderConcept.initializeFolder({ user: user1 });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);
      assertExists(result.folder);
      rootId = result.folder; // Store the root folder ID for subsequent tests

      const folderDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in folderDetails, true, `Expected no error, got: ${JSON.stringify(folderDetails)}`);
      assertEquals(folderDetails.owner, user1);
      assertEquals(folderDetails.title, "Root");
      assertEquals(folderDetails.folders.length, 0);
      assertEquals(folderDetails.elements.length, 0);
    });

    await test.step("1.2 initializeFolder - failure (user already has folders)", async () => {
      const result = await folderConcept.initializeFolder({ user: user1 });
      assertEquals("error" in result, true);
      assertEquals(result.error, "user has already created folders");
    });

    await test.step("1.3 initializeFolder - success (second user)", async () => {
      const result = await folderConcept.initializeFolder({ user: user2 });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);
      assertExists(result.folder);
      user2RootId = result.folder; // Store the root folder ID for user2

      const folderDetails = await folderConcept._getFolderDetails({ folderId: user2RootId });
      assertNotEquals("error" in folderDetails, true);
      assertEquals(folderDetails.owner, user2);
      assertEquals(folderDetails.title, "Root");
    });

    // -------------------------------------------------------------------------
    // 2. createFolder
    // -------------------------------------------------------------------------
    await test.step("2.1 createFolder - success (child of root)", async () => {
      const result1 = await folderConcept.createFolder({ user: user1, title: "Child 1", parent: rootId });
      assertNotEquals("error" in result1, true, `Expected no error, got: ${JSON.stringify(result1)}`);
      assertExists(result1.folder);
      child1Id = result1.folder;

      const result2 = await folderConcept.createFolder({ user: user1, title: "Child 2", parent: rootId });
      assertNotEquals("error" in result2, true, `Expected no error, got: ${JSON.stringify(result2)}`);
      assertExists(result2.folder);
      child2Id = result2.folder;

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertEquals(child1Details.owner, user1);
      assertEquals(child1Details.title, "Child 1");
      assertEquals(child1Details.folders.length, 0);
      assertEquals(child1Details.elements.length, 0);

      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assertArrayIncludes(rootDetails.folders, [child1Id, child2Id]);
      assertEquals(rootDetails.folders.length, 2);
    });

    await test.step("2.2 createFolder - success (grandchild of root)", async () => {
      const result = await folderConcept.createFolder({ user: user1, title: "Grandchild 1", parent: child1Id });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);
      assertExists(result.folder);
      grandchild1Id = result.folder;

      const grandchild1Details = await folderConcept._getFolderDetails({ folderId: grandchild1Id });
      assertNotEquals("error" in grandchild1Details, true);
      assertEquals(grandchild1Details.owner, user1);
      assertEquals(grandchild1Details.title, "Grandchild 1");

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertArrayIncludes(child1Details.folders, [grandchild1Id]);
      assertEquals(child1Details.folders.length, 1);
    });

    await test.step("2.3 createFolder - failure (parent not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept.createFolder({
        user: user1,
        title: "Orphan",
        parent: nonExistentFolder,
      });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Parent folder with ID ${nonExistentFolder} not found.`);
    });

    await test.step("2.4 createFolder - failure (parent not owned by user)", async () => {
      const result = await folderConcept.createFolder({
        user: user1,
        title: "Intruder",
        parent: user2RootId, // Try to create a folder under user2's root with user1
      });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Parent folder with ID ${user2RootId} is not owned by the user.`);
    });

    // -------------------------------------------------------------------------
    // 3. _getFolderChildren (Query)
    // -------------------------------------------------------------------------
    await test.step("3.1 _getFolderChildren - success", async () => {
      const rootChildren = await folderConcept._getFolderChildren({ folderId: rootId });
      assertNotEquals("error" in rootChildren, true);
      assertEquals(rootChildren.length, 2);
      assertArrayIncludes(rootChildren, [child1Id, child2Id]);

      const child1Children = await folderConcept._getFolderChildren({ folderId: child1Id });
      assertNotEquals("error" in child1Children, true);
      assertEquals(child1Children.length, 1);
      assertArrayIncludes(child1Children, [grandchild1Id]);

      const child2Children = await folderConcept._getFolderChildren({ folderId: child2Id });
      assertNotEquals("error" in child2Children, true);
      assertEquals(child2Children.length, 0);
    });

    await test.step("3.2 _getFolderChildren - failure (folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept._getFolderChildren({ folderId: nonExistentFolder });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });

    // -------------------------------------------------------------------------
    // 4. insertItem
    // -------------------------------------------------------------------------
    await test.step("4.1 insertItem - success (initial insert)", async () => {
      const result1 = await folderConcept.insertItem({ item: item1, folder: rootId });
      assertNotEquals("error" in result1, true, `Expected no error, got: ${JSON.stringify(result1)}`);

      const result2 = await folderConcept.insertItem({ item: item2, folder: child1Id });
      assertNotEquals("error" in result2, true, `Expected no error, got: ${JSON.stringify(result2)}`);

      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assertArrayIncludes(rootDetails.elements, [item1]);
      assertEquals(rootDetails.elements.length, 1);

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertArrayIncludes(child1Details.elements, [item2]);
      assertEquals(child1Details.elements.length, 1);
    });

    await test.step("4.2 insertItem - success (move item to another folder)", async () => {
      const result = await folderConcept.insertItem({ item: item1, folder: child1Id });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);

      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assertEquals(rootDetails.elements.length, 0); // item1 should be removed from root

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertArrayIncludes(child1Details.elements, [item2, item1]); // item1 should be added to child1
      assertEquals(child1Details.elements.length, 2);
    });

    await test.step("4.3 insertItem - success (re-insert same item to same folder - no-op)", async () => {
      const result = await folderConcept.insertItem({ item: item2, folder: child1Id });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertEquals(child1Details.elements.length, 2); // Count should remain 2, no duplicate added
    });

    await test.step("4.4 insertItem - failure (target folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept.insertItem({ item: item3, folder: nonExistentFolder });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Target folder with ID ${nonExistentFolder} not found.`);
    });

    // -------------------------------------------------------------------------
    // 5. _getFolderItems (Query)
    // -------------------------------------------------------------------------
    await test.step("5.1 _getFolderItems - success", async () => {
      const rootItems = await folderConcept._getFolderItems({ folderId: rootId });
      assertNotEquals("error" in rootItems, true);
      assertEquals(rootItems.length, 0); // item1 was moved out

      const child1Items = await folderConcept._getFolderItems({ folderId: child1Id });
      assertNotEquals("error" in child1Items, true);
      assertEquals(child1Items.length, 2);
      assertArrayIncludes(child1Items, [item1, item2]); // Order might not be guaranteed by $addToSet

      const child2Items = await folderConcept._getFolderItems({ folderId: child2Id });
      assertNotEquals("error" in child2Items, true);
      assertEquals(child2Items.length, 0);
    });

    await test.step("5.2 _getFolderItems - failure (folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept._getFolderItems({ folderId: nonExistentFolder });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });

    // -------------------------------------------------------------------------
    // 6. isDescendant (Private method, tested via extended class)
    // -------------------------------------------------------------------------
    await test.step("6.1 testIsDescendant - success (true cases)", async () => {
      // Current hierarchy: root -> [child1, child2], child1 -> [grandchild1]
      assert(await extendedFolderConcept.testIsDescendant(child1Id, rootId), "child1 is descendant of root");
      assert(await extendedFolderConcept.testIsDescendant(grandchild1Id, rootId), "grandchild1 is descendant of root");
      assert(await extendedFolderConcept.testIsDescendant(grandchild1Id, child1Id), "grandchild1 is descendant of child1");
    });

    await test.step("6.2 testIsDescendant - success (false cases)", async () => {
      assert(!await extendedFolderConcept.testIsDescendant(rootId, child1Id), "root is not descendant of child1");
      assert(!await extendedFolderConcept.testIsDescendant(child2Id, child1Id), "child2 is not descendant of child1 (sibling)");
      assert(!await extendedFolderConcept.testIsDescendant(freshID(), rootId), "non-existent folder is not descendant of root");
      assert(!await extendedFolderConcept.testIsDescendant(child1Id, freshID()), "child1 is not descendant of non-existent folder");
    });

    // -------------------------------------------------------------------------
    // 7. moveFolder
    // -------------------------------------------------------------------------
    await test.step("7.1 moveFolder - success (move child2 from root to child1)", async () => {
      // Initial state: root -> [child1, child2], child1 -> [grandchild1]
      const result = await folderConcept.moveFolder({ folder: child2Id, newParent: child1Id });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);
      assertEquals(result.folder, child2Id);

      // Verify root no longer contains child2
      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assert(!rootDetails.folders.includes(child2Id), "root should not contain child2");
      assertEquals(rootDetails.folders.length, 1);
      assertArrayIncludes(rootDetails.folders, [child1Id]);

      // Verify child1 now contains child2
      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assertArrayIncludes(child1Details.folders, [grandchild1Id, child2Id]);
      assertEquals(child1Details.folders.length, 2);

      // New hierarchy: root -> [child1], child1 -> [grandchild1, child2]
    });

    await test.step("7.2 moveFolder - success (move child2 from child1 back to root)", async () => {
      // Initial state: root -> [child1], child1 -> [grandchild1, child2]
      const result = await folderConcept.moveFolder({ folder: child2Id, newParent: rootId });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);
      assertEquals(result.folder, child2Id);

      // Verify child1 no longer contains child2
      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assert(!child1Details.folders.includes(child2Id), "child1 should not contain child2");
      assertEquals(child1Details.folders.length, 1);
      assertArrayIncludes(child1Details.folders, [grandchild1Id]);

      // Verify root now contains child2 again
      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assertArrayIncludes(rootDetails.folders, [child1Id, child2Id]);
      assertEquals(rootDetails.folders.length, 2);

      // New hierarchy: root -> [child1, child2], child1 -> [grandchild1]
    });

    await test.step("7.3 moveFolder - failure (folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result1 = await folderConcept.moveFolder({ folder: nonExistentFolder, newParent: rootId });
      assertEquals("error" in result1, true);
      assertEquals(result1.error, `Folder with ID ${nonExistentFolder} not found.`);

      const result2 = await folderConcept.moveFolder({ folder: child1Id, newParent: nonExistentFolder });
      assertEquals("error" in result2, true);
      assertEquals(result2.error, `New parent folder with ID ${nonExistentFolder} not found.`);
    });

    await test.step("7.4 moveFolder - failure (different owners)", async () => {
      const result = await folderConcept.moveFolder({ folder: child1Id, newParent: user2RootId });
      assertEquals("error" in result, true);
      assert(result.error?.startsWith("Folders must have the same owner"), "Error message for different owners mismatch");
    });

    await test.step("7.5 moveFolder - failure (move into self)", async () => {
      const result = await folderConcept.moveFolder({ folder: child1Id, newParent: child1Id });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Cannot move a folder into itself.`);
    });

    await test.step("7.6 moveFolder - failure (move into descendant)", async () => {
      // Current hierarchy: root -> [child1, child2], child1 -> [grandchild1]
      const result = await folderConcept.moveFolder({ folder: child1Id, newParent: grandchild1Id });
      assertEquals("error" in result, true);
      assertEquals(
        result.error,
        `Cannot move folder ${child1Id} into its own descendant folder ${grandchild1Id}.`,
      );
    });

    // -------------------------------------------------------------------------
    // 8. deleteItem
    // -------------------------------------------------------------------------
    await test.step("8.1 deleteItem - success", async () => {
      // item2 is in child1
      const result = await folderConcept.deleteItem({ item: item2 });
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);

      const child1Details = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertNotEquals("error" in child1Details, true);
      assert(!child1Details.elements.includes(item2), "item2 should be removed from child1"); // item2 removed
      assertEquals(child1Details.elements.length, 1); // Only item1 remains
      assertArrayIncludes(child1Details.elements, [item1]);
    });

    await test.step("8.2 deleteItem - failure (item not found in any folder)", async () => {
      const result = await folderConcept.deleteItem({ item: item3 }); // item3 was never inserted
      assertEquals("error" in result, true);
      assertEquals(result.error, `Item with ID ${item3} not found in any folder.`);
    });

    // -------------------------------------------------------------------------
    // 9. collectDescendants (Private method, tested via extended class)
    // -------------------------------------------------------------------------
    await test.step("9.1 testCollectDescendants - success", async () => {
      // Current hierarchy: root -> [child1, child2], child1 -> [grandchild1]
      // Items: item1 in child1
      const folderIdsToCollect = new Set<Folder>();
      await extendedFolderConcept.testCollectDescendants(rootId, folderIdsToCollect);
      assertEquals(folderIdsToCollect.size, 4); // root, child1, child2, grandchild1
      assert(folderIdsToCollect.has(rootId));
      assert(folderIdsToCollect.has(child1Id));
      assert(folderIdsToCollect.has(child2Id));
      assert(folderIdsToCollect.has(grandchild1Id));
    });

    // -------------------------------------------------------------------------
    // 10. deleteFolder
    // -------------------------------------------------------------------------
    await test.step("10.1 deleteFolder - success (delete child1 and its descendant grandchild1)", async () => {
      // Current hierarchy: root -> [child1, child2], child1 -> [grandchild1]
      // Items: item1 in child1
      const result = await folderConcept.deleteFolder(child1Id);
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);

      // Verify child1 is deleted
      const child1Check = await folderConcept._getFolderDetails({ folderId: child1Id });
      assertEquals("error" in child1Check, true);
      assertEquals(child1Check.error, `Folder with ID ${child1Id} not found.`);

      // Verify grandchild1 is deleted
      const grandchild1Check = await folderConcept._getFolderDetails({ folderId: grandchild1Id });
      assertEquals("error" in grandchild1Check, true);
      assertEquals(grandchild1Check.error, `Folder with ID ${grandchild1Id} not found.`);

      // Verify root no longer lists child1
      const rootDetails = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in rootDetails, true);
      assert(!rootDetails.folders.includes(child1Id), "root should not contain child1");
      assertEquals(rootDetails.folders.length, 1); // Only child2 should remain
      assertArrayIncludes(rootDetails.folders, [child2Id]);

      // Verify child2 still exists and is unaffected
      const child2Check = await folderConcept._getFolderDetails({ folderId: child2Id });
      assertNotEquals("error" in child2Check, true);
      assertEquals(child2Check.owner, user1);
    });

    await test.step("10.2 deleteFolder - success (delete root folder for user2)", async () => {
      // user2RootId has no children or items currently.
      const result = await folderConcept.deleteFolder(user2RootId);
      assertNotEquals("error" in result, true, `Expected no error, got: ${JSON.stringify(result)}`);

      const user2RootCheck = await folderConcept._getFolderDetails({ folderId: user2RootId });
      assertEquals("error" in user2RootCheck, true);
      assertEquals(user2RootCheck.error, `Folder with ID ${user2RootId} not found.`);
    });

    await test.step("10.3 deleteFolder - failure (folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept.deleteFolder(nonExistentFolder);
      assertEquals("error" in result, true);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });

    // -------------------------------------------------------------------------
    // 11. _getFolderDetails (Query)
    // -------------------------------------------------------------------------
    await test.step("11.1 _getFolderDetails - success", async () => {
      const details = await folderConcept._getFolderDetails({ folderId: rootId });
      assertNotEquals("error" in details, true);
      assertEquals(details.owner, user1);
      assertEquals(details.title, "Root");
      assertEquals(details.folders.length, 1); // Only child2 remains after child1 deletion
      assertArrayIncludes(details.folders, [child2Id]);
      assertEquals(details.elements.length, 0); // All items were moved/deleted with their folders
    });

    await test.step("11.2 _getFolderDetails - failure (folder not found)", async () => {
      const nonExistentFolder = freshID();
      const result = await folderConcept._getFolderDetails({ folderId: nonExistentFolder });
      assertEquals("error" in result, true);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });
  });
});

```

```
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

const authorA = "author:Alice" as ID;
const respondentB = "respondent:Bob" as ID;
const respondentC = "respondent:Charlie" as ID;

Deno.test("Principle: Author creates survey, respondent answers, author views results", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // 1. Author creates a survey with a 1-5 scale
    const createSurveyResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Customer Satisfaction",
      scaleMin: 1,
      scaleMax: 5,
    });
    assertNotEquals(
      "error" in createSurveyResult,
      true,
      "Survey creation should not fail.",
    );
    const { survey } = createSurveyResult as { survey: ID };
    assertExists(survey);

    // 2. Author adds several questions
    const addQ1Result = await surveyConcept.addQuestion({
      survey,
      text: "How satisfied are you with our product?",
    });
    assertNotEquals(
      "error" in addQ1Result,
      true,
      "Adding question 1 should not fail.",
    );
    const { question: q1 } = addQ1Result as { question: ID };

    const addQ2Result = await surveyConcept.addQuestion({
      survey,
      text: "How likely are you to recommend us?",
    });
    assertNotEquals(
      "error" in addQ2Result,
      true,
      "Adding question 2 should not fail.",
    );
    const { question: q2 } = addQ2Result as { question: ID };

    const questions = await surveyConcept._getSurveyQuestions({ survey });
    assertEquals(
      questions.length,
      2,
      "There should be two questions in the survey.",
    );

    // 3. A respondent submits their answers to those questions
    const submitR1Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q1,
      value: 5,
    });
    assertEquals(
      "error" in submitR1Result,
      false,
      "Submitting response 1 should succeed.",
    );

    const submitR2Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q2,
      value: 4,
    });
    assertEquals(
      "error" in submitR2Result,
      false,
      "Submitting response 2 should succeed.",
    );

    // 4. The author can view the collected responses
    const surveyResponses = await surveyConcept._getSurveyResponses({ survey });
    assertEquals(
      surveyResponses.length,
      2,
      "There should be two responses for the survey.",
    );
    assertEquals(surveyResponses.find((r) => r.question === q1)?.value, 5);
    assertEquals(surveyResponses.find((r) => r.question === q2)?.value, 4);

    const respondentAnswers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(
      respondentAnswers.length,
      2,
      "The respondent should have two answers recorded.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: createSurvey requires scaleMin < scaleMax", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    const invalidResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 5,
      scaleMax: 1,
    });
    assertEquals(
      "error" in invalidResult,
      true,
      "Should fail when scaleMin > scaleMax.",
    );

    const equalResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 3,
      scaleMax: 3,
    });
    assertEquals(
      "error" in equalResult,
      true,
      "Should fail when scaleMin == scaleMax.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addQuestion requires an existing survey", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  const nonExistentSurveyId = "survey:fake" as ID;

  try {
    const result = await surveyConcept.addQuestion({
      survey: nonExistentSurveyId,
      text: "This will fail",
    });
    assertEquals(
      "error" in result,
      true,
      "Adding a question to a non-existent survey should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: submitResponse requirements are enforced", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // Setup a valid survey and question
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };

    // Requires: question must exist
    const nonExistentQuestionId = "question:fake" as ID;
    const res1 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: nonExistentQuestionId,
      value: 3,
    });
    assertEquals(
      "error" in res1,
      true,
      "Submitting a response to a non-existent question should fail.",
    );

    // Requires: respondent must not have already submitted a response
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    }); // First submission is OK
    const res2 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 4,
    }); // Second submission fails
    assertEquals(
      "error" in res2,
      true,
      "Submitting a response twice for the same question should fail.",
    );
    assertEquals(
      (res2 as { error: string }).error,
      "Respondent has already answered this question. Use updateResponse to change it.",
    );

    // Requires: value must be within survey's scale
    const res3 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 0,
    }); // Below min
    assertEquals(
      "error" in res3,
      true,
      "Submitting a value below the minimum scale should fail.",
    );
    const res4 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 6,
    }); // Above max
    assertEquals(
      "error" in res4,
      true,
      "Submitting a value above the maximum scale should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateResponse successfully updates a response and enforces requirements", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  try {
    // Setup
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    });

    // Requires: A response must already exist to be updated
    const res1 = await surveyConcept.updateResponse({
      respondent: respondentC,
      question,
      value: 4,
    });
    assertEquals(
      "error" in res1,
      true,
      "Updating a non-existent response should fail.",
    );

    // Requires: value must be within survey's scale
    const res2 = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 6,
    });
    assertEquals(
      "error" in res2,
      true,
      "Updating with a value outside the scale should fail.",
    );

    // Successful update
    const successResult = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 5,
    });
    assertEquals(
      "error" in successResult,
      false,
      "A valid update should succeed.",
    );

    // Verify the update
    const answers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(answers.length, 1, "There should still be only one answer.");
    assertEquals(
      answers[0].value,
      5,
      "The answer's value should be updated to 5.",
    );
  } finally {
    await client.close();
  }
});
```
