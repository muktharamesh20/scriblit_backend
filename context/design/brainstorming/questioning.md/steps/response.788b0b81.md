---
timestamp: 'Wed Oct 15 2025 16:14:56 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_161456.42fa12e1.md]]'
content_id: 788b0b81f74562e000b9ffcb80de8d6013bceac3cd502cdefe807c262f0b8ce6
---

# response:

To implement the testing file for the `FolderConcept`, I will follow the structure and testing methodology demonstrated by the `LikertSurveyConcept` (as inferred from standard practices for Deno and MongoDB testing with `MongoMemoryServer`). This includes:

* Using `MongoMemoryServer` for an in-memory database.
* Setting up `beforeAll`, `afterAll`, and `beforeEach` hooks for database management.
* Testing both successful actions and required error conditions for each public method.
* Verifying the `effects` of actions using the concept's query methods.
* Creating an extended class specifically for testing `private` helper methods, and using the original `FolderConcept` for all other tests.
* Utilizing `freshID()` for generating unique IDs.

First, I'll provide the necessary mock `freshID` and `ID` types to make the test file self-contained for the purpose of this exercise, as these utility files were not provided in the prompt. In a real project, these would be imported from shared utilities.

```typescript
// src/concepts/Scriblink/folder.test.ts

// --- Mocks for external utilities (if not provided in actual project) ---
// In a real project, these would be imported from "@utils/types.ts" and "@utils/database.ts"
export type ID = string & { __id: true };
export type Empty = Record<string, never>;

let currentTestIdCounter = 0;
const freshID = (): ID => {
  currentTestIdCounter++;
  return `test-id-${currentTestIdCounter}` as ID;
};
// --- End Mocks ---


import { assert, assertEquals, assertExists, assertNotEquals, assertObjectMatch } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MongoClient, Db } from "npm:mongodb";
import { MongoMemoryServer } from "npm:mongodb-memory-server";
import FolderConcept, { Folder, Item, User } from "./folder.ts";

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let folderConcept: FolderConcept;

// Extended class for testing private methods
class ExtendedFolderConcept extends FolderConcept {
  constructor(db: Db) {
    super(db);
  }

  public async _testIsDescendant(targetId: Folder, ancestorId: Folder): Promise<boolean> {
    // Expose the private method for testing
    return await (this as any).isDescendant(targetId, ancestorId);
  }

  public async _testCollectDescendants(f: Folder, folderIdsToDelete: Set<Folder>): Promise<void> {
    // Expose the private method for testing
    await (this as any).collectDescendants(f, folderIdsToDelete);
  }
}

Deno.test({
  name: "FolderConcept",
  // Sanitize options are often set to false for MongoDB tests to avoid false positives
  // related to database connections or operations running past test completion.
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(test) {
    test.beforeAll(async () => {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      client = new MongoClient(uri);
      await client.connect();
      db = client.db("testdb");
      folderConcept = new FolderConcept(db);
    });

    test.afterAll(async () => {
      await client.close();
      await mongod.stop();
    });

    test.beforeEach(async () => {
      // Clear database state before each test
      await db.dropDatabase();
      // Re-initialize concept to ensure it has fresh collections pointing to the cleared db
      folderConcept = new FolderConcept(db);
      currentTestIdCounter = 0; // Reset ID counter for predictable IDs in each test
    });

    await test.step("initializeFolder", async (t) => {
      await t.step("should create a root folder for a new user", async () => {
        const userId = freshID() as User;
        const result = await folderConcept.initializeFolder({ user: userId });

        assertExists(result);
        assert("folder" in result);
        const folderId = result.folder;

        const folderDoc = await folderConcept._getFolderDetails({ folderId });
        assertExists(folderDoc);
        assert("owner" in folderDoc); // Check if it's a FolderStructure or an error
        assertEquals(folderDoc.owner, userId);
        assertEquals(folderDoc.title, "Root");
        assertEquals(folderDoc.folders.length, 0);
        assertEquals(folderDoc.elements.length, 0);
      });

      await t.step("should return an error if user already has folders", async () => {
        const userId = freshID() as User;
        await folderConcept.initializeFolder({ user: userId }); // First call

        const result = await folderConcept.initializeFolder({ user: userId }); // Second call
        assert("error" in result);
        assertEquals(result.error, "user has already created folders");
      });
    });

    await test.step("createFolder", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const rootFolderId = initResult.folder;

      await t.step("should create a new child folder under an existing parent", async () => {
        const newFolderTitle = "Child Folder";
        const result = await folderConcept.createFolder({
          user: userId,
          title: newFolderTitle,
          parent: rootFolderId,
        });

        assertExists(result);
        assert("folder" in result);
        const childFolderId = result.folder;

        const childFolderDoc = await folderConcept._getFolderDetails({
          folderId: childFolderId,
        });
        assertExists(childFolderDoc);
        assert("owner" in childFolderDoc);
        assertEquals(childFolderDoc.owner, userId);
        assertEquals(childFolderDoc.title, newFolderTitle);
        assertEquals(childFolderDoc.folders.length, 0);
        assertEquals(childFolderDoc.elements.length, 0);

        const parentFolderDoc = await folderConcept._getFolderDetails({
          folderId: rootFolderId,
        });
        assertExists(parentFolderDoc);
        assert("folders" in parentFolderDoc);
        assertEquals(parentFolderDoc.folders.length, 1);
        assertEquals(parentFolderDoc.folders[0], childFolderId);
      });

      await t.step("should return an error if parent folder not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept.createFolder({
          user: userId,
          title: "Orphan",
          parent: nonExistentFolderId,
        });

        assert("error" in result);
        assertEquals(
          result.error,
          `Parent folder with ID ${nonExistentFolderId} not found.`,
        );
      });

      await t.step("should return an error if parent folder not owned by user", async () => {
        const otherUserId = freshID() as User;
        const otherUserInitResult = await folderConcept.initializeFolder({
          user: otherUserId,
        });
        assert("folder" in otherUserInitResult);
        const otherRootFolderId = otherUserInitResult.folder;

        const result = await folderConcept.createFolder({
          user: userId, // Current user
          title: "Forbidden Child",
          parent: otherRootFolderId, // Other user's folder
        });

        assert("error" in result);
        assertEquals(
          result.error,
          `Parent folder with ID ${otherRootFolderId} is not owned by the user.`,
        );
      });
    });

    await test.step("isDescendant (private helper)", async (t) => {
      const extendedConcept = new ExtendedFolderConcept(db);

      const ownerId = freshID() as User;
      const r1 = await folderConcept.initializeFolder({ user: ownerId });
      assert("folder" in r1);
      const root = r1.folder;

      const r2 = await folderConcept.createFolder({ user: ownerId, title: "F1", parent: root });
      assert("folder" in r2);
      const f1 = r2.folder;

      const r3 = await folderConcept.createFolder({ user: ownerId, title: "F2", parent: root });
      assert("folder" in r3);
      const f2 = r3.folder;

      const r4 = await folderConcept.createFolder({ user: ownerId, title: "F1_1", parent: f1 });
      assert("folder" in r4);
      const f1_1 = r4.folder;

      const r5 = await folderConcept.createFolder({ user: ownerId, title: "F1_1_1", parent: f1_1 });
      assert("folder" in r5);
      const f1_1_1 = r5.folder;

      await t.step("should return true if target is a direct child of ancestor", async () => {
        assertEquals(await extendedConcept._testIsDescendant(f1, root), true);
      });

      await t.step("should return true if target is a grandchild of ancestor", async () => {
        assertEquals(await extendedConcept._testIsDescendant(f1_1, root), true);
        assertEquals(await extendedConcept._testIsDescendant(f1_1_1, f1), true);
      });

      await t.step("should return true if target is a deep descendant", async () => {
        assertEquals(await extendedConcept._testIsDescendant(f1_1_1, root), true);
      });

      await t.step("should return false if target is a sibling", async () => {
        assertEquals(await extendedConcept._testIsDescendant(f2, f1), false);
      });

      await t.step("should return false if target is the ancestor itself", async () => {
        assertEquals(await extendedConcept._testIsDescendant(root, root), false);
        assertEquals(await extendedConcept._testIsDescendant(f1, f1), false);
      });

      await t.step("should return false if target is a parent of ancestor", async () => {
        assertEquals(await extendedConcept._testIsDescendant(root, f1), false);
        assertEquals(await extendedConcept._testIsDescendant(f1, f1_1), false);
      });

      await t.step("should return false if folders are unrelated", async () => {
        const r6 = await folderConcept.initializeFolder({ user: freshID() as User });
        assert("folder" in r6);
        const unrelatedRoot = r6.folder;
        assertEquals(await extendedConcept._testIsDescendant(unrelatedRoot, root), false);
      });
    });

    await test.step("moveFolder", async (t) => {
      const ownerId = freshID() as User;
      const r1 = await folderConcept.initializeFolder({ user: ownerId });
      assert("folder" in r1);
      const root = r1.folder;

      const r2 = await folderConcept.createFolder({ user: ownerId, title: "F1", parent: root });
      assert("folder" in r2);
      const f1 = r2.folder;

      const r3 = await folderConcept.createFolder({ user: ownerId, title: "F2", parent: root });
      assert("folder" in r3);
      const f2 = r3.folder;

      const r4 = await folderConcept.createFolder({ user: ownerId, title: "F3", parent: f1 });
      assert("folder" in r4);
      const f3 = r4.folder; // f3 is child of f1

      await t.step("should move a folder from one parent to another", async () => {
        // Current state: root -> [f1, f2], f1 -> [f3]
        // Move f3 into f2
        const moveResult = await folderConcept.moveFolder({ folder: f3, newParent: f2 });
        assert("folder" in moveResult);
        assertEquals(moveResult.folder, f3);

        const f1Children = await folderConcept._getFolderChildren({ folderId: f1 });
        assertEquals(f1Children.length, 0); // f3 should be removed from f1

        const f2Children = await folderConcept._getFolderChildren({ folderId: f2 });
        assertEquals(f2Children.length, 1);
        assertEquals(f2Children[0], f3); // f3 should be added to f2
      });

      await t.step("should move a root-level folder to be a child of another folder", async () => {
        // Current state (from beforeEach): root -> [f1, f2]
        // This test re-uses f1, f2 but previous test modified it, so let's set up fresh.
        await db.dropDatabase();
        folderConcept = new FolderConcept(db);
        const userId = freshID() as User;
        const rootRes = await folderConcept.initializeFolder({ user: userId });
        assert("folder" in rootRes);
        const rootF = rootRes.folder;
        const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: rootF });
        assert("folder" in f1Res);
        const f1_root = f1Res.folder;

        const f_standalone = freshID() as Folder;
        await folderConcept.folders.insertOne({ _id: f_standalone, owner: userId, title: "Standalone", folders: [], elements: [] });

        const moveResult = await folderConcept.moveFolder({ folder: f_standalone, newParent: f1_root });
        assert("folder" in moveResult);
        assertEquals(moveResult.folder, f_standalone);

        const f1Children = await folderConcept._getFolderChildren({ folderId: f1_root });
        assertEquals(f1Children.length, 1);
        assertEquals(f1Children[0], f_standalone);

        const rootChildren = await folderConcept._getFolderChildren({ folderId: rootF });
        assertEquals(rootChildren.length, 1); // Only f1_root should still be there
      });


      await t.step("should return an error if folder to move (f1) not found", async () => {
        const nonExistentF1 = freshID() as Folder;
        const result = await folderConcept.moveFolder({
          folder: nonExistentF1,
          newParent: root,
        });
        assert("error" in result);
        assertEquals(result.error, `Folder with ID ${nonExistentF1} not found.`);
      });

      await t.step("should return an error if new parent folder (f2) not found", async () => {
        const nonExistentF2 = freshID() as Folder;
        const result = await folderConcept.moveFolder({
          folder: f1, // f1 is still there
          newParent: nonExistentF2,
        });
        assert("error" in result);
        assertEquals(
          result.error,
          `New parent folder with ID ${nonExistentF2} not found.`,
        );
      });

      await t.step("should return an error if folders have different owners", async () => {
        const otherOwnerId = freshID() as User;
        const otherRootResult = await folderConcept.initializeFolder({
          user: otherOwnerId,
        });
        assert("folder" in otherRootResult);
        const otherRoot = otherRootResult.folder;

        const result = await folderConcept.moveFolder({
          folder: f1, // Owned by `ownerId`
          newParent: otherRoot, // Owned by `otherOwnerId`
        });
        assert("error" in result);
        assert(result.error.startsWith("Folders must have the same owner"));
      });

      await t.step("should return an error if moving a folder into itself", async () => {
        const result = await folderConcept.moveFolder({ folder: f1, newParent: f1 });
        assert("error" in result);
        assertEquals(result.error, `Cannot move a folder into itself.`);
      });

      await t.step("should return an error if moving a folder into its own descendant", async () => {
        // Setup: root -> F1 -> F1_1
        const rootRes = await folderConcept.initializeFolder({ user: freshID() as User });
        assert("folder" in rootRes);
        const rootFolder = rootRes.folder;

        const f1Res = await folderConcept.createFolder({ user: rootRes.folder, title: "F1", parent: rootFolder });
        assert("folder" in f1Res);
        const F1 = f1Res.folder;

        const f1_1Res = await folderConcept.createFolder({ user: rootRes.folder, title: "F1_1", parent: F1 });
        assert("folder" in f1_1Res);
        const F1_1 = f1_1Res.folder;

        const result = await folderConcept.moveFolder({ folder: F1, newParent: F1_1 });
        assert("error" in result);
        assertEquals(
          result.error,
          `Cannot move folder ${F1} into its own descendant folder ${F1_1}.`,
        );
      });
    });

    await test.step("insertItem", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const rootFolderId = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: rootFolderId });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const f2Res = await folderConcept.createFolder({ user: userId, title: "F2", parent: rootFolderId });
      assert("folder" in f2Res);
      const f2 = f2Res.folder;

      const item1 = freshID() as Item;
      const item2 = freshID() as Item;

      await t.step("should insert an item into an empty folder", async () => {
        const result = await folderConcept.insertItem({ item: item1, folder: f1 });
        assert("error" in result === false); // Should be success

        const itemsInF1 = await folderConcept._getFolderItems({ folderId: f1 });
        assertEquals(itemsInF1.length, 1);
        assertEquals(itemsInF1[0], item1);
      });

      await t.step("should insert an item into a folder with existing items", async () => {
        // item1 is already in f1 from previous step, let's add item2
        const result = await folderConcept.insertItem({ item: item2, folder: f1 });
        assert("error" in result === false);

        const itemsInF1 = await folderConcept._getFolderItems({ folderId: f1 });
        assertEquals(itemsInF1.length, 2);
        assert(itemsInF1.includes(item1));
        assert(itemsInF1.includes(item2));
      });

      await t.step("should move an item from one folder to another", async () => {
        // item1 is in f1, move to f2
        const result = await folderConcept.insertItem({ item: item1, folder: f2 });
        assert("error" in result === false);

        const itemsInF1 = await folderConcept._getFolderItems({ folderId: f1 });
        assertEquals(itemsInF1.length, 1); // Only item2 should remain
        assertEquals(itemsInF1[0], item2);

        const itemsInF2 = await folderConcept._getFolderItems({ folderId: f2 });
        assertEquals(itemsInF2.length, 1);
        assertEquals(itemsInF2[0], item1);
      });

      await t.step("should do nothing if inserting an item already in the target folder", async () => {
        // item1 is in f2, insert it again into f2
        const itemsInF2Before = await folderConcept._getFolderItems({ folderId: f2 });
        assertEquals(itemsInF2Before.length, 1);
        assertEquals(itemsInF2Before[0], item1);

        const result = await folderConcept.insertItem({ item: item1, folder: f2 });
        assert("error" in result === false); // Still a success, just no change

        const itemsInF2After = await folderConcept._getFolderItems({ folderId: f2 });
        assertEquals(itemsInF2After.length, 1); // Should still be 1 item
        assertEquals(itemsInF2After[0], item1);
      });

      await t.step("should return an error if target folder not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept.insertItem({ item: item1, folder: nonExistentFolderId });
        assert("error" in result);
        assertEquals(
          result.error,
          `Target folder with ID ${nonExistentFolderId} not found.`,
        );
      });
    });

    await test.step("collectDescendants (private helper)", async (t) => {
      const extendedConcept = new ExtendedFolderConcept(db);

      const userId = freshID() as User;
      const r1 = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in r1);
      const root = r1.folder;

      const r2 = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in r2);
      const f1 = r2.folder;

      const r3 = await folderConcept.createFolder({ user: userId, title: "F2", parent: root });
      assert("folder" in r3);
      const f2 = r3.folder;

      const r4 = await folderConcept.createFolder({ user: userId, title: "F1_1", parent: f1 });
      assert("folder" in r4);
      const f1_1 = r4.folder;

      const r5 = await folderConcept.createFolder({ user: userId, title: "F1_2", parent: f1 });
      assert("folder" in r5);
      const f1_2 = r5.folder;

      const r6 = await folderConcept.createFolder({ user: userId, title: "F1_1_1", parent: f1_1 });
      assert("folder" in r6);
      const f1_1_1 = r6.folder;

      await t.step("should collect only the target folder if it has no children", async () => {
        const folderIds = new Set<Folder>();
        await extendedConcept._testCollectDescendants(f2, folderIds);
        assertEquals(folderIds.size, 1);
        assert(folderIds.has(f2));
      });

      await t.step("should collect target folder and its direct children", async () => {
        const folderIds = new Set<Folder>();
        await extendedConcept._testCollectDescendants(f1, folderIds);
        assertEquals(folderIds.size, 3);
        assert(folderIds.has(f1));
        assert(folderIds.has(f1_1));
        assert(folderIds.has(f1_2));
        assertFalse(folderIds.has(f1_1_1)); // Should not include grandchildren unless specified
      });

      await t.step("should collect target folder and all its descendants recursively", async () => {
        const folderIds = new Set<Folder>();
        await extendedConcept._testCollectDescendants(root, folderIds);
        assertEquals(folderIds.size, 6); // root, f1, f2, f1_1, f1_2, f1_1_1
        assert(folderIds.has(root));
        assert(folderIds.has(f1));
        assert(folderIds.has(f2));
        assert(folderIds.has(f1_1));
        assert(folderIds.has(f1_2));
        assert(folderIds.has(f1_1_1));
      });

      await t.step("should not add non-existent folders to the set", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const folderIds = new Set<Folder>();
        await extendedConcept._testCollectDescendants(nonExistentFolderId, folderIds);
        assertEquals(folderIds.size, 0);
      });
    });

    await test.step("deleteFolder", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const root = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const f2Res = await folderConcept.createFolder({ user: userId, title: "F2", parent: root });
      assert("folder" in f2Res);
      const f2 = f2Res.folder;

      const f1_1Res = await folderConcept.createFolder({ user: userId, title: "F1_1", parent: f1 });
      assert("folder" in f1_1Res);
      const f1_1 = f1_1Res.folder;

      const item1 = freshID() as Item;
      const item2 = freshID() as Item;
      await folderConcept.insertItem({ item: item1, folder: f1 });
      await folderConcept.insertItem({ item: item2, folder: f1_1 });

      await t.step("should delete a folder with no children and no items", async () => {
        const deleteResult = await folderConcept.deleteFolder(f2);
        assert("error" in deleteResult === false);

        const f2Details = await folderConcept._getFolderDetails({ folderId: f2 });
        assert("error" in f2Details); // Should be deleted

        const rootChildren = await folderConcept._getFolderChildren({ folderId: root });
        assertEquals(rootChildren.length, 1); // f2 should be removed from root's children
        assertEquals(rootChildren[0], f1);
      });

      await t.step("should delete a folder and all its descendants and their items", async () => {
        // State: root -> [f1], f1 -> [f1_1], f1 has item1, f1_1 has item2
        const deleteResult = await folderConcept.deleteFolder(f1);
        assert("error" in deleteResult === false);

        const f1Details = await folderConcept._getFolderDetails({ folderId: f1 });
        assert("error" in f1Details);
        const f1_1Details = await folderConcept._getFolderDetails({ folderId: f1_1 });
        assert("error" in f1_1Details);

        const rootChildren = await folderConcept._getFolderChildren({ folderId: root });
        assertEquals(rootChildren.length, 0); // f1 should be removed from root's children

        // Items are "deleted" by being removed from their folders.
        // We can check if they are still referenced in any folder.
        const item1Exists = await folderConcept.folders.findOne({ elements: item1 });
        assertNotExists(item1Exists);
        const item2Exists = await folderConcept.folders.findOne({ elements: item2 });
        assertNotExists(item2Exists);
      });

      await t.step("should return an error if folder to delete not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept.deleteFolder(nonExistentFolderId);
        assert("error" in result);
        assertEquals(
          result.error,
          `Folder with ID ${nonExistentFolderId} not found.`,
        );
      });
    });

    await test.step("deleteItem", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const root = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const item1 = freshID() as Item;
      const item2 = freshID() as Item;
      await folderConcept.insertItem({ item: item1, folder: f1 });
      await folderConcept.insertItem({ item: item2, folder: f1 });

      await t.step("should delete an item from its containing folder", async () => {
        const deleteResult = await folderConcept.deleteItem({ item: item1 });
        assert("error" in deleteResult === false);

        const itemsInF1 = await folderConcept._getFolderItems({ folderId: f1 });
        assertEquals(itemsInF1.length, 1);
        assertEquals(itemsInF1[0], item2); // item1 should be gone
      });

      await t.step("should return an error if item not found in any folder", async () => {
        const nonExistentItem = freshID() as Item;
        const result = await folderConcept.deleteItem({ item: nonExistentItem });
        assert("error" in result);
        assertEquals(
          result.error,
          `Item with ID ${nonExistentItem} not found in any folder.`,
        );
      });
    });

    await test.step("_getFolderChildren", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const root = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const f2Res = await folderConcept.createFolder({ user: userId, title: "F2", parent: root });
      assert("folder" in f2Res);
      const f2 = f2Res.folder;

      const f1_1Res = await folderConcept.createFolder({ user: userId, title: "F1_1", parent: f1 });
      assert("folder" in f1_1Res);
      const f1_1 = f1_1Res.folder;

      await t.step("should retrieve all children of an existing folder", async () => {
        const childrenOfRoot = await folderConcept._getFolderChildren({ folderId: root });
        assertEquals(childrenOfRoot.length, 2);
        assert(childrenOfRoot.includes(f1));
        assert(childrenOfRoot.includes(f2));

        const childrenOfF1 = await folderConcept._getFolderChildren({ folderId: f1 });
        assertEquals(childrenOfF1.length, 1);
        assertEquals(childrenOfF1[0], f1_1);
      });

      await t.step("should return an empty array for a folder with no children", async () => {
        const childrenOfF1_1 = await folderConcept._getFolderChildren({ folderId: f1_1 });
        assertEquals(childrenOfF1_1.length, 0);
      });

      await t.step("should return an error if folder not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept._getFolderChildren({
          folderId: nonExistentFolderId,
        });
        assert("error" in result);
        assertEquals(
          result.error,
          `Folder with ID ${nonExistentFolderId} not found.`,
        );
      });
    });

    await test.step("_getFolderItems", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const root = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const item1 = freshID() as Item;
      const item2 = freshID() as Item;
      await folderConcept.insertItem({ item: item1, folder: f1 });
      await folderConcept.insertItem({ item: item2, folder: f1 });

      await t.step("should retrieve all items of an existing folder", async () => {
        const itemsInF1 = await folderConcept._getFolderItems({ folderId: f1 });
        assertEquals(itemsInF1.length, 2);
        assert(itemsInF1.includes(item1));
        assert(itemsInF1.includes(item2));
      });

      await t.step("should return an empty array for a folder with no items", async () => {
        const itemsInRoot = await folderConcept._getFolderItems({ folderId: root });
        assertEquals(itemsInRoot.length, 0);
      });

      await t.step("should return an error if folder not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept._getFolderItems({
          folderId: nonExistentFolderId,
        });
        assert("error" in result);
        assertEquals(
          result.error,
          `Folder with ID ${nonExistentFolderId} not found.`,
        );
      });
    });

    await test.step("_getFolderDetails", async (t) => {
      const userId = freshID() as User;
      const initResult = await folderConcept.initializeFolder({ user: userId });
      assert("folder" in initResult);
      const root = initResult.folder;

      const f1Res = await folderConcept.createFolder({ user: userId, title: "F1", parent: root });
      assert("folder" in f1Res);
      const f1 = f1Res.folder;

      const item1 = freshID() as Item;
      await folderConcept.insertItem({ item: item1, folder: f1 });

      await t.step("should retrieve all details for an existing folder", async () => {
        const rootDetails = await folderConcept._getFolderDetails({ folderId: root });
        assert("owner" in rootDetails);
        assertEquals(rootDetails._id, root);
        assertEquals(rootDetails.owner, userId);
        assertEquals(rootDetails.title, "Root");
        assertEquals(rootDetails.folders, [f1]);
        assertEquals(rootDetails.elements, []);

        const f1Details = await folderConcept._getFolderDetails({ folderId: f1 });
        assert("owner" in f1Details);
        assertEquals(f1Details._id, f1);
        assertEquals(f1Details.owner, userId);
        assertEquals(f1Details.title, "F1");
        assertEquals(f1Details.folders, []);
        assertEquals(f1Details.elements, [item1]);
      });

      await t.step("should return an error if folder not found", async () => {
        const nonExistentFolderId = freshID() as Folder;
        const result = await folderConcept._getFolderDetails({
          folderId: nonExistentFolderId,
        });
        assert("error" in result);
        assertEquals(
          result.error,
          `Folder with ID ${nonExistentFolderId} not found.`,
        );
      });
    });
  },
});
```
