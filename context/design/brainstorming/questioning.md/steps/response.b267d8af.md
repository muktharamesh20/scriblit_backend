---
timestamp: 'Wed Oct 15 2025 16:19:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_161905.8edbc5c4.md]]'
content_id: b267d8afbd1901eea602f40cc1b3c68c482adf2526e375952f3c48dd36261ae6
---

# response:

To implement the testing file for the `FolderConcept` class, we'll follow the pattern established by the `LikertSurveyConcept` example. This involves:

1. **MongoDB Setup:** Connecting to a real MongoDB instance (assuming `mongodb://localhost:27017` is running) and using a unique database name for each test run to ensure isolation without needing to clear collections `beforeEach`.
2. **`Deno.test` Structure:** Organizing tests into logical `Deno.test` blocks with nested `t.step` calls for clarity and granular reporting.
3. **Assertion Library:** Using `https://deno.land/std/assert` for all assertions.
4. **Test Cases:** Covering both successful operations and expected error conditions for each `Action` and `Query` method.
5. **Private Method Testing:** Creating an `ExtendedFolderConcept` subclass solely for testing the private `isDescendant` method, as requested. Other `_get*` query methods are accessed directly as they are part of the concept's observable behavior.
6. **Continuous State:** Building up the folder and item hierarchy throughout the test suite, only clearing the database once at the very beginning of the entire suite and dropping it at the end.
7. **ID Management:** Using `freshID()` to generate unique IDs for users, folders, and items.

**To run these tests:**

1. **Ensure MongoDB is running** on `mongodb://localhost:27017`.
2. **Save the provided `FolderConcept.ts`** as `src/concepts/Scriblink/folder.ts`.
3. **Save the `freshID` utility** at `src/utils/database.ts` (if you don't have it, a minimal version for string IDs would be `export const freshID = () => crypto.randomUUID();`).
4. **Save the `types.ts` utility** at `src/utils/types.ts` (if you don't have it, a minimal version would be `export type ID = string; export type Empty = Record<string, never>;`).
5. **Save the following code** as `src/concepts/Scriblink/folder.test.ts`.
6. **Run with Deno:** `deno test --allow-net --allow-read src/concepts/Scriblink/folder.test.ts` ( `--allow-net` is for MongoDB connection, `--allow-read` if `freshID` or other utils load local files).

```typescript
// src/concepts/Scriblink/folder.test.ts
import {
  assert,
  assertEquals,
  assertFalse,
  assertObjectMatch,
  assertTrue,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import { Db, MongoClient } from "npm:mongodb"; // Using npm:mongodb as per concept file
import { freshID, ID } from "../../utils/database.ts"; // Adjust path as needed

import FolderConcept, { Folder, FolderStructure, Item, User } from "./folder.ts"; // Adjust path as needed

// --- MongoDB Setup ---
const client = new MongoClient("mongodb://localhost:27017");
// Using a unique DB name for each test run to ensure isolation without needing to manually clear.
// This ensures a clean slate for each overall test execution.
const DB_NAME = `test_folder_concept_${Date.now()}`;
let db: Db;
let folderConcept: FolderConcept;

// --- Extended Class for Private Method Testing ---
// This class is created solely for testing the private 'isDescendant' method.
class ExtendedFolderConcept extends FolderConcept {
  public async testIsDescendant(
    targetId: Folder,
    ancestorId: Folder,
  ): Promise<boolean> {
    // Casting 'this' to 'any' allows access to private methods for testing purposes.
    return (this as any).isDescendant(targetId, ancestorId);
  }
}
let extendedFolderConcept: ExtendedFolderConcept;

// --- Helper function to ensure collections are clean (used once at start) ---
async function clearCollections(dbInstance: Db) {
  // Delete all documents from the 'Folder.folders' collection.
  await dbInstance.collection("Folder.folders").deleteMany({});
  // The 'elements' collection is not explicitly used by FolderConcept for storing Item documents,
  // but rather stores Item IDs within FolderStructure.elements array.
  // Including it here for completeness if a related concept *did* use it.
  // await dbInstance.collection("Folder.elements").deleteMany({});
}

// --- FolderConcept Integration Test Suite ---
Deno.test("FolderConcept Integration Tests", { sanitizeOps: false, sanitizeResources: false }, async (t) => {
  // Connect to MongoDB and initialize concept classes
  await client.connect();
  db = client.db(DB_NAME);
  folderConcept = new FolderConcept(db);
  extendedFolderConcept = new ExtendedFolderConcept(db);

  console.log(`Connected to MongoDB for FolderConcept tests on DB: ${DB_NAME}`);

  // Clear collections once at the beginning of the entire test suite run.
  // This ensures a fresh state for the entire run, adhering to "don't clear before each test"
  // while still providing isolation between different runs of the test file.
  await clearCollections(db);

  // Define variables to hold IDs that will be used across multiple test steps
  let user1: User;
  let rootFolder1Id: Folder;
  let childFolder1Id: Folder;
  let childFolder2Id: Folder;
  let grandchildFolderId: Folder; // A child of childFolder1Id
  let standaloneFolderId: Folder; // A folder created for user1 but without a parent link

  let user2: User;
  let rootFolder2Id: Folder;

  let user3: User;
  let rootFolder3Id: Folder;

  let itemA: Item;
  let itemB: Item;
  let itemC: Item; // For testing item insertion into non-existent folder
  let itemD: Item; // For testing item within a folder that gets deleted

  try {
    // --- Test `initializeFolder` action ---
    await t.step("initializeFolder: Happy path and error cases", async (ts) => {
      user1 = freshID() as User;
      user2 = freshID() as User;

      await ts.step("should initialize a root folder for user1 successfully", async () => {
        const result = await folderConcept.initializeFolder({ user: user1 });
        assertTrue("folder" in result); // Check if success object is returned
        rootFolder1Id = (result as { folder: Folder }).folder; // Store the ID for later tests

        // Verify the created folder's details directly from the database
        const folderDoc = await folderConcept._getFolderDetails({ folderId: rootFolder1Id });
        assertFalse("error" in folderDoc); // Ensure no error on retrieval
        assertEquals((folderDoc as FolderStructure).owner, user1);
        assertEquals((folderDoc as FolderStructure).title, "Root");
        assertEquals((folderDoc as FolderStructure).folders.length, 0); // Should have no child folders
        assertEquals((folderDoc as FolderStructure).elements.length, 0); // Should have no items
      });

      await ts.step("should return an error if user1 tries to initialize folders again", async () => {
        const result = await folderConcept.initializeFolder({ user: user1 });
        assertTrue("error" in result); // Check if error object is returned
        assertEquals((result as { error: string }).error, "user has already created folders");
      });

      await ts.step("should allow user2 to initialize their own root folder", async () => {
        const result = await folderConcept.initializeFolder({ user: user2 });
        assertTrue("folder" in result);
        rootFolder2Id = (result as { folder: Folder }).folder; // Store for later
        const folderDoc = await folderConcept._getFolderDetails({ folderId: rootFolder2Id });
        assertFalse("error" in folderDoc);
        assertEquals((folderDoc as FolderStructure).owner, user2);
      });
    });

    // --- Test `createFolder` action ---
    await t.step("createFolder: Creating child folders and error cases", async (ts) => {
      await ts.step("should create Child Folder 1 under Root Folder 1", async () => {
        const result = await folderConcept.createFolder({
          user: user1,
          title: "Child Folder 1",
          parent: rootFolder1Id,
        });
        assertTrue("folder" in result);
        childFolder1Id = (result as { folder: Folder }).folder; // Store for later

        // Verify the new child folder's details
        const childFolderDoc = await folderConcept._getFolderDetails({ folderId: childFolder1Id });
        assertFalse("error" in childFolderDoc);
        assertEquals((childFolderDoc as FolderStructure).owner, user1);
        assertEquals((childFolderDoc as FolderStructure).title, "Child Folder 1");

        // Verify that Root Folder 1 now lists Child Folder 1 as a child
        const rootFolderDoc = await folderConcept._getFolderDetails({ folderId: rootFolder1Id });
        assertFalse("error" in rootFolderDoc);
        assertTrue((rootFolderDoc as FolderStructure).folders.includes(childFolder1Id));
      });

      await ts.step("should create Child Folder 2 under Root Folder 1", async () => {
        const result = await folderConcept.createFolder({
          user: user1,
          title: "Child Folder 2",
          parent: rootFolder1Id,
        });
        assertTrue("folder" in result);
        childFolder2Id = (result as { folder: Folder }).folder; // Store for later

        // Verify Root Folder 1 now has two children
        const rootFolderDoc = await folderConcept._getFolderDetails({ folderId: rootFolder1Id });
        assertFalse("error" in rootFolderDoc);
        assertTrue((rootFolderDoc as FolderStructure).folders.includes(childFolder2Id));
        assertEquals((rootFolderDoc as FolderStructure).folders.length, 2);
      });

      await ts.step("should create Grandchild Folder under Child Folder 1", async () => {
        const result = await folderConcept.createFolder({
          user: user1,
          title: "Grandchild Folder",
          parent: childFolder1Id,
        });
        assertTrue("folder" in result);
        grandchildFolderId = (result as { folder: Folder }).folder; // Store for later

        // Verify Child Folder 1 lists Grandchild Folder as a child
        const child1FolderDoc = await folderConcept._getFolderDetails({ folderId: childFolder1Id });
        assertFalse("error" in child1FolderDoc);
        assertTrue((child1FolderDoc as FolderStructure).folders.includes(grandchildFolderId));
        assertEquals((child1FolderDoc as FolderStructure).folders.length, 1);
      });

      await ts.step("should return an error if parent folder not found", async () => {
        const nonExistentFolder: Folder = freshID() as Folder;
        const result = await folderConcept.createFolder({
          user: user1,
          title: "Orphan",
          parent: nonExistentFolder,
        });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Parent folder with ID ${nonExistentFolder} not found.`);
      });

      await ts.step("should return an error if parent folder is not owned by the user", async () => {
        // user1 tries to create a folder inside rootFolder2Id (owned by user2)
        const result = await folderConcept.createFolder({
          user: user1,
          title: "Unauthorized Child",
          parent: rootFolder2Id,
        });
        assertTrue("error" in result);
        assertEquals(
          (result as { error: string }).error,
          `Parent folder with ID ${rootFolder2Id} is not owned by the user.`,
        );
      });
    });

    // --- Test `isDescendant` private helper method (via ExtendedFolderConcept) ---
    await t.step("private isDescendant method (via ExtendedFolderConcept)", async (ts) => {
      // Current hierarchy for user1:
      // Root Folder 1 (rootFolder1Id)
      //   - Child Folder 1 (childFolder1Id)
      //     - Grandchild Folder (grandchildFolderId)
      //   - Child Folder 2 (childFolder2Id)

      // Create a third user and their root folder for unrelated tests
      user3 = freshID() as User;
      await folderConcept.initializeFolder({ user: user3 });
      rootFolder3Id = (await folderConcept.folders.findOne({ owner: user3, title: "Root" }))!._id;

      await ts.step("should return true for a direct child", async () => {
        assertTrue(await extendedFolderConcept.testIsDescendant(childFolder1Id, rootFolder1Id));
      });

      await ts.step("should return true for an indirect descendant", async () => {
        assertTrue(await extendedFolderConcept.testIsDescendant(grandchildFolderId, rootFolder1Id));
      });

      await ts.step("should return false if not a descendant (sibling)", async () => {
        assertFalse(await extendedFolderConcept.testIsDescendant(childFolder2Id, childFolder1Id));
      });

      await ts.step("should return false for self", async () => {
        assertFalse(await extendedFolderConcept.testIsDescendant(rootFolder1Id, rootFolder1Id));
      });

      await ts.step("should return false if target is an ancestor", async () => {
        assertFalse(await extendedFolderConcept.testIsDescendant(rootFolder1Id, childFolder1Id));
      });

      await ts.step("should return false for unrelated folders (different owners or branches)", async () => {
        assertFalse(await extendedFolderConcept.testIsDescendant(childFolder1Id, rootFolder3Id));
        assertFalse(await extendedFolderConcept.testIsDescendant(rootFolder3Id, rootFolder1Id));
      });
    });

    // --- Test `moveFolder` action ---
    await t.step("moveFolder: Moving folders and edge cases", async (ts) => {
      // Current hierarchy for user1:
      // Root Folder 1 (rootFolder1Id)
      //   - Child Folder 1 (childFolder1Id)
      //     - Grandchild Folder (grandchildFolderId)
      //   - Child Folder 2 (childFolder2Id)

      // Create a folder that will be made "standalone" (no parent link) for testing this scenario
      const standaloneResult = await folderConcept.createFolder({ user: user1, title: "Standalone Folder", parent: rootFolder1Id });
      standaloneFolderId = (standaloneResult as { folder: Folder }).folder;
      // Remove it from its parent (rootFolder1Id) to make it explicitly standalone (no parent link)
      await folderConcept.folders.updateOne({ _id: rootFolder1Id }, { $pull: { folders: standaloneFolderId } });
      const root1ChildrenAfterPull = await folderConcept._getFolderChildren({ folderId: rootFolder1Id });
      assertFalse((root1ChildrenAfterPull as Folder[]).includes(standaloneFolderId), "Standalone folder should be removed from root's children");

      await ts.step("should move Child Folder 1 from Root Folder 1 to Child Folder 2", async () => {
        // Move childFolder1Id (current parent: rootFolder1Id) to childFolder2Id
        const result = await folderConcept.moveFolder({ folder: childFolder1Id, newParent: childFolder2Id });
        assertTrue("folder" in result);
        assertEquals(result.folder, childFolder1Id);

        // Verify childFolder1Id is no longer in Root Folder 1's children
        const updatedRoot1 = await folderConcept._getFolderDetails({ folderId: rootFolder1Id });
        assertFalse("error" in updatedRoot1);
        assertFalse((updatedRoot1 as FolderStructure).folders.includes(childFolder1Id));

        // Verify childFolder1Id is now in Child Folder 2's children
        const updatedChild2 = await folderConcept._getFolderDetails({ folderId: childFolder2Id });
        assertFalse("error" in updatedChild2);
        assertTrue((updatedChild2 as FolderStructure).folders.includes(childFolder1Id));

        // Verify childFolder1Id still retains its own children (Grandchild Folder)
        const updatedChild1 = await folderConcept._getFolderDetails({ folderId: childFolder1Id });
        assertFalse("error" in updatedChild1);
        assertTrue((updatedChild1 as FolderStructure).folders.includes(grandchildFolderId));
      });

      // After previous step, current hierarchy for user1:
      // Root Folder 1 (rootFolder1Id)
      //   - Child Folder 2 (childFolder2Id)
      //     - Child Folder 1 (childFolder1Id)
      //       - Grandchild Folder (grandchildFolderId)
      //     - Standalone Folder (standaloneFolderId) (no parent)

      await ts.step("should return an error if trying to move a folder into itself", async () => {
        const result = await folderConcept.moveFolder({ folder: childFolder1Id, newParent: childFolder1Id });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, "Cannot move a folder into itself.");
      });

      await ts.step("should return an error if new parent is a descendant of the folder being moved", async () => {
        // Attempt to move childFolder1Id (which contains grandchildFolderId) into grandchildFolderId
        const result = await folderConcept.moveFolder({ folder: childFolder1Id, newParent: grandchildFolderId });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Cannot move folder ${childFolder1Id} into its own descendant folder ${grandchildFolderId}.`);
      });

      await ts.step("should return an error if folder to move not found", async () => {
        const nonExistent: Folder = freshID() as Folder;
        const result = await folderConcept.moveFolder({ folder: nonExistent, newParent: childFolder2Id });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Folder with ID ${nonExistent} not found.`);
      });

      await ts.step("should return an error if new parent not found", async () => {
        const nonExistent: Folder = freshID() as Folder;
        const result = await folderConcept.moveFolder({ folder: childFolder1Id, newParent: nonExistent });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `New parent folder with ID ${nonExistent} not found.`);
      });

      await ts.step("should return an error if folders have different owners", async () => {
        // Try to move childFolder1Id (owned by user1) to rootFolder2Id (owned by user2)
        const result = await folderConcept.moveFolder({ folder: childFolder1Id, newParent: rootFolder2Id });
        assertTrue("error" in result);
        assert((result as { error: string }).error.startsWith("Folders must have the same owner"));
      });

      await ts.step("should move a folder that currently has no parent into a new parent", async () => {
        // standaloneFolderId has no current parent link in the hierarchy
        const result = await folderConcept.moveFolder({ folder: standaloneFolderId, newParent: childFolder2Id });
        assertTrue("folder" in result);
        assertEquals(result.folder, standaloneFolderId);

        // Verify standaloneFolderId is now in Child Folder 2's children
        const updatedChild2 = await folderConcept._getFolderDetails({ folderId: childFolder2Id });
        assertFalse("error" in updatedChild2);
        assertTrue((updatedChild2 as FolderStructure).folders.includes(standaloneFolderId));
      });
    });

    // --- Test `insertItem` action ---
    await t.step("insertItem: Adding and moving items", async (ts) => {
      itemA = freshID() as Item;
      itemB = freshID() as Item;
      itemC = freshID() as Item; // For testing insertion into non-existent folder
      itemD = freshID() as Item; // For testing item deletion later

      const nonExistentFolder: Folder = freshID() as Folder;

      await ts.step("should insert itemA into childFolder1Id", async () => {
        const result = await folderConcept.insertItem({ item: itemA, folder: childFolder1Id });
        assertTrue(Object.keys(result).length === 0); // Empty object indicates success

        const child1Items = await folderConcept._getFolderItems({ folderId: childFolder1Id });
        assertFalse("error" in child1Items);
        assertTrue((child1Items as Item[]).includes(itemA));
        assertEquals((child1Items as Item[]).length, 1);
      });

      await ts.step("should insert itemB into childFolder1Id (alongside itemA)", async () => {
        const result = await folderConcept.insertItem({ item: itemB, folder: childFolder1Id });
        assertTrue(Object.keys(result).length === 0);

        const child1Items = await folderConcept._getFolderItems({ folderId: childFolder1Id });
        assertFalse("error" in child1Items);
        assertTrue((child1Items as Item[]).includes(itemA));
        assertTrue((child1Items as Item[]).includes(itemB));
        assertEquals((child1Items as Item[]).length, 2);
      });

      await ts.step("should move itemA from childFolder1Id to childFolder2Id", async () => {
        const result = await folderConcept.insertItem({ item: itemA, folder: childFolder2Id });
        assertTrue(Object.keys(result).length === 0);

        // Verify itemA is removed from childFolder1Id
        const child1Items = await folderConcept._getFolderItems({ folderId: childFolder1Id });
        assertFalse("error" in child1Items);
        assertFalse((child1Items as Item[]).includes(itemA)); // itemA should be gone
        assertTrue((child1Items as Item[]).includes(itemB)); // itemB should still be there
        assertEquals((child1Items as Item[]).length, 1);

        // Verify itemA is added to childFolder2Id
        const child2Items = await folderConcept._getFolderItems({ folderId: childFolder2Id });
        assertFalse("error" in child2Items);
        assertTrue((child2Items as Item[]).includes(itemA));
        assertEquals((child2Items as Item[]).length, 1);
      });

      await ts.step("should do nothing (return success) if item is already in the target folder", async () => {
        // itemA is already in childFolder2Id
        const result = await folderConcept.insertItem({ item: itemA, folder: childFolder2Id });
        assertTrue(Object.keys(result).length === 0); // Still success, no error or change

        const child2Items = await folderConcept._getFolderItems({ folderId: childFolder2Id });
        assertFalse("error" in child2Items);
        assertTrue((child2Items as Item[]).includes(itemA));
        assertEquals((child2Items as Item[]).length, 1); // Item count should remain the same
      });

      await ts.step("should return an error if target folder not found", async () => {
        const result = await folderConcept.insertItem({ item: itemC, folder: nonExistentFolder });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Target folder with ID ${nonExistentFolder} not found.`);
      });
    });

    // --- Test `deleteItem` action ---
    await t.step("deleteItem: Removing items from folders", async (ts) => {
      // Current item locations: itemB in childFolder1Id, itemA in childFolder2Id

      await ts.step("should delete itemB from childFolder1Id", async () => {
        const result = await folderConcept.deleteItem({ item: itemB });
        assertTrue(Object.keys(result).length === 0); // Success

        const child1Items = await folderConcept._getFolderItems({ folderId: childFolder1Id });
        assertFalse("error" in child1Items);
        assertFalse((child1Items as Item[]).includes(itemB)); // itemB should be gone
        assertEquals((child1Items as Item[]).length, 0); // childFolder1Id should now be empty of items
      });

      await ts.step("should return an error if item not found in any folder", async () => {
        const nonExistentItem: Item = freshID() as Item;
        const result = await folderConcept.deleteItem({ item: nonExistentItem });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Item with ID ${nonExistentItem} not found in any folder.`);
      });

      await ts.step("should delete itemA from childFolder2Id", async () => {
        const result = await folderConcept.deleteItem({ item: itemA });
        assertTrue(Object.keys(result).length === 0);

        const child2Items = await folderConcept._getFolderItems({ folderId: childFolder2Id });
        assertFalse("error" in child2Items);
        assertFalse((child2Items as Item[]).includes(itemA)); // itemA should be gone
        assertEquals((child2Items as Item[]).length, 0); // childFolder2Id should now be empty of items
      });
    });

    // --- Test `deleteFolder` action ---
    await t.step("deleteFolder: Deleting folders and their contents", async (ts) => {
      // Current state for user1 (after previous deletions and moves):
      // Root Folder 1 (rootFolder1Id)
      //   - Child Folder 2 (childFolder2Id)
      //     - Child Folder 1 (childFolder1Id)
      //       - Grandchild Folder (grandchildFolderId)
      //     - Standalone Folder (standaloneFolderId)
      // All items (itemA, itemB) were deleted in the previous step.

      // Add a new item (itemD) to Grandchild Folder for testing recursive deletion with contents
      await folderConcept.insertItem({ item: itemD, folder: grandchildFolderId });
      const gfItemsBeforeDelete = await folderConcept._getFolderItems({ folderId: grandchildFolderId });
      assertFalse("error" in gfItemsBeforeDelete);
      assertEquals((gfItemsBeforeDelete as Item[]).length, 1);
      assertTrue((gfItemsBeforeDelete as Item[]).includes(itemD));

      const nonExistentFolder: Folder = freshID() as Folder;

      await ts.step("should delete a leaf folder (standaloneFolderId)", async () => {
        const result = await folderConcept.deleteFolder(standaloneFolderId);
        assertTrue(Object.keys(result).length === 0); // Success

        // Verify standaloneFolderId is no longer found in the database
        const deletedFolder = await folderConcept._getFolderDetails({ folderId: standaloneFolderId });
        assertTrue("error" in deletedFolder); // Should return an error indicating it's not found

        // Verify it's removed from its parent (childFolder2Id)'s children list
        const parentF2 = await folderConcept._getFolderDetails({ folderId: childFolder2Id });
        assertFalse("error" in parentF2);
        assertFalse((parentF2 as FolderStructure).folders.includes(standaloneFolderId));
      });

      await ts.step("should delete a folder with children and items, and all its descendants", async () => {
        // Delete childFolder1Id, which contains grandchildFolderId, and grandchildFolderId contains itemD.
        const result = await folderConcept.deleteFolder(childFolder1Id);
        assertTrue(Object.keys(result).length === 0); // Success

        // Verify childFolder1Id and its descendant, grandchildFolderId, are deleted
        const deletedF1 = await folderConcept._getFolderDetails({ folderId: childFolder1Id });
        assertTrue("error" in deletedF1);
        const deletedGF = await folderConcept._getFolderDetails({ folderId: grandchildFolderId });
        assertTrue("error" in deletedGF);

        // Verify childFolder1Id is removed from its parent (childFolder2Id)'s children list
        const parentF2 = await folderConcept._getFolderDetails({ folderId: childFolder2Id });
        assertFalse("error" in parentF2);
        assertFalse((parentF2 as FolderStructure).folders.includes(childFolder1Id));

        // ItemD was in grandchildFolderId; its "deletion" is implied by its containing folder being deleted.
        // There's no separate `_getItemDetails` to verify itemD's individual existence.
      });

      await ts.step("should return an error if folder to delete not found", async () => {
        const result = await folderConcept.deleteFolder(nonExistentFolder);
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Folder with ID ${nonExistentFolder} not found.`);
      });
    });

    // --- Test Query methods (`_getFolderChildren`, `_getFolderItems`, `_getFolderDetails`) ---
    await t.step("Query methods (_getFolderChildren, _getFolderItems, _getFolderDetails)", async (ts) => {
      // Create a fresh, simple hierarchy for clear query tests
      await clearCollections(db); // Clear specific collections for this query test block
      const queryUser: User = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: queryUser });
      const queryRootId = (initResult as { folder: Folder }).folder;

      const child1Result = await folderConcept.createFolder({ user: queryUser, title: "Query Child 1", parent: queryRootId });
      const queryChild1Id = (child1Result as { folder: Folder }).folder;

      const child2Result = await folderConcept.createFolder({ user: queryUser, title: "Query Child 2", parent: queryRootId });
      const queryChild2Id = (child2Result as { folder: Folder }).folder;

      const grandchildResult = await folderConcept.createFolder({ user: queryUser, title: "Query Grandchild", parent: queryChild1Id });
      const queryGrandchildId = (grandchildResult as { folder: Folder }).folder;

      const queryItemX: Item = freshID() as Item;
      const queryItemY: Item = freshID() as Item;
      await folderConcept.insertItem({ item: queryItemX, folder: queryRootId });
      await folderConcept.insertItem({ item: queryItemY, folder: queryChild1Id });

      await ts.step("_getFolderDetails should retrieve correct folder structure", async () => {
        const rootDetails = await folderConcept._getFolderDetails({ folderId: queryRootId });
        assertFalse("error" in rootDetails);
        assertObjectMatch(rootDetails as FolderStructure, { // Check key properties
          _id: queryRootId,
          owner: queryUser,
          title: "Root",
        });
        // Check children and items arrays
        assertEquals((rootDetails as FolderStructure).folders.length, 2);
        assertTrue((rootDetails as FolderStructure).folders.includes(queryChild1Id));
        assertTrue((rootDetails as FolderStructure).folders.includes(queryChild2Id));
        assertEquals((rootDetails as FolderStructure).elements.length, 1);
        assertTrue((rootDetails as FolderStructure).elements.includes(queryItemX));

        const child1Details = await folderConcept._getFolderDetails({ folderId: queryChild1Id });
        assertFalse("error" in child1Details);
        assertObjectMatch(child1Details as FolderStructure, {
          _id: queryChild1Id,
          owner: queryUser,
          title: "Query Child 1",
        });
        assertEquals((child1Details as FolderStructure).folders.length, 1);
        assertTrue((child1Details as FolderStructure).folders.includes(queryGrandchildId));
        assertEquals((child1Details as FolderStructure).elements.length, 1);
        assertTrue((child1Details as FolderStructure).elements.includes(queryItemY));
      });

      await ts.step("_getFolderDetails should return error if folder not found", async () => {
        const nonExistent: Folder = freshID() as Folder;
        const result = await folderConcept._getFolderDetails({ folderId: nonExistent });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Folder with ID ${nonExistent} not found.`);
      });


      await ts.step("_getFolderChildren should return direct children", async () => {
        const rootChildren = await folderConcept._getFolderChildren({ folderId: queryRootId });
        assertFalse("error" in rootChildren);
        assert(Array.isArray(rootChildren));
        assertEquals((rootChildren as Folder[]).length, 2);
        assertTrue((rootChildren as Folder[]).includes(queryChild1Id));
        assertTrue((rootChildren as Folder[]).includes(queryChild2Id));

        const child1Children = await folderConcept._getFolderChildren({ folderId: queryChild1Id });
        assertFalse("error" in child1Children);
        assert(Array.isArray(child1Children));
        assertEquals((child1Children as Folder[]).length, 1);
        assertTrue((child1Children as Folder[]).includes(queryGrandchildId));

        const child2Children = await folderConcept._getFolderChildren({ folderId: queryChild2Id });
        assertFalse("error" in child2Children);
        assert(Array.isArray(child2Children));
        assertEquals((child2Children as Folder[]).length, 0); // No children
      });

      await ts.step("_getFolderChildren should return error if folder not found", async () => {
        const nonExistent: Folder = freshID() as Folder;
        const result = await folderConcept._getFolderChildren({ folderId: nonExistent });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Folder with ID ${nonExistent} not found.`);
      });

      await ts.step("_getFolderItems should return items in a folder", async () => {
        const rootItems = await folderConcept._getFolderItems({ folderId: queryRootId });
        assertFalse("error" in rootItems);
        assert(Array.isArray(rootItems));
        assertEquals((rootItems as Item[]).length, 1);
        assertTrue((rootItems as Item[]).includes(queryItemX));

        const child1Items = await folderConcept._getFolderItems({ folderId: queryChild1Id });
        assertFalse("error" in child1Items);
        assert(Array.isArray(child1Items));
        assertEquals((child1Items as Item[]).length, 1);
        assertTrue((child1Items as Item[]).includes(queryItemY));

        const child2Items = await folderConcept._getFolderItems({ folderId: queryChild2Id });
        assertFalse("error" in child2Items);
        assert(Array.isArray(child2Items));
        assertEquals((child2Items as Item[]).length, 0); // No items
      });

      await ts.step("_getFolderItems should return error if folder not found", async () => {
        const nonExistent: Folder = freshID() as Folder;
        const result = await folderConcept._getFolderItems({ folderId: nonExistent });
        assertTrue("error" in result);
        assertEquals((result as { error: string }).error, `Folder with ID ${nonExistent} not found.`);
      });
    });

  } finally {
    // Ensure the test database is dropped and the client is closed, regardless of test outcomes.
    await db.dropDatabase();
    await client.close();
    console.log(`Cleaned up DB: ${DB_NAME} and disconnected from MongoDB.`);
  }
});
```
