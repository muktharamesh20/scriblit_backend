---
timestamp: 'Wed Oct 15 2025 14:26:04 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_142604.b5571f66.md]]'
content_id: d62ebf7a3bb4c383fd379795f29a76acd4d1e0e6fafd53ea465c57131f0d5579
---

# response:

To create the testing file for the `FolderConcept`, we'll follow the pattern of mocking the external dependencies, primarily the `mongodb.Db` and `mongodb.Collection` classes, and the `freshID` utility. This allows us to test the concept's logic in isolation without needing a real database.

Here's the testing file (`src/concepts/Scriblink/folder.test.ts`):

```typescript
// For types
import { ID, Empty } from "@utils/types.ts";
// For assertions (Deno's standard library for testing)
import { assertEquals, assertNotEquals, assertExists, assert, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Re-import the concept and types from the actual files
// Assuming this test file is located at `src/concepts/Scriblink/folder.test.ts`
// relative to the concept file at `src/concepts/Scriblink/folder.ts`.
import FolderConcept from "./folder.ts";
import { Folder, Item, User, FolderStructure } from "./folder.ts";

// --- Mocking External Dependencies ---

// 1. Mock for `freshID`
// We'll override `globalThis.freshID` during tests to provide predictable IDs.
let currentId = 0;
const mockFreshID = () => `mock-id-${++currentId}` as ID;

// 2. Mock for `mongodb.Collection`
// This mock simulates the behavior of a MongoDB collection in memory using a Map.
class MockCollection<T extends { _id: ID }> {
  private data: Map<ID, T> = new Map();
  private name: string; // Store name for debugging/logging, if needed

  constructor(name: string) {
    this.name = name;
  }

  // Simulates `collection.insertOne(doc)`
  async insertOne(doc: T): Promise<any> {
    if (this.data.has(doc._id)) {
      throw new Error(`Duplicate ID: ${doc._id}`);
    }
    this.data.set(doc._id, { ...doc }); // Store a copy
    return { acknowledged: true, insertedId: doc._id };
  }

  // Simulates `collection.findOne(query)`
  async findOne(query: Partial<T> & { [key: string]: any }): Promise<T | null> {
    for (const doc of this.data.values()) {
      let match = true;
      for (const key in query) {
        if (key === "_id") {
          // Handle { _id: { $ne: someId } }
          if (typeof query._id === 'object' && '$ne' in query._id) {
            if (doc._id === query._id.$ne) {
              match = false;
              break;
            }
          } else if (doc._id !== query._id) { // Direct _id match
            match = false;
            break;
          }
        } else if (key === "folders" || key === "elements") {
          // Handle queries like `folders: folderId` or `elements: itemId`
          // which imply checking if an ID exists within the array.
          const queryValue = query[key];
          if (!((doc as any)[key] as ID[]).includes(queryValue)) {
            match = false;
            break;
          }
        } else {
          // Direct equality for other fields
          if ((doc as any)[key] !== query[key]) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        return { ...doc }; // Return a shallow copy
      }
    }
    return null;
  }

  // Simulates `collection.find(query).toArray()` or `collection.find(query).project(...).toArray()`
  find(query: Partial<T> & { [key: string]: any } = {}): {
    toArray(): Promise<T[]>;
    project(projection: { [key: string]: 1 | 0 }): any;
  } {
    let filteredData = Array.from(this.data.values()).filter((doc) => {
      for (const key in query) {
        if (key === "_id") {
          // Handle { _id: { $in: [ids] } }
          if (query._id && typeof query._id === 'object' && '$in' in query._id) {
            if (!query._id.$in.includes(doc._id)) return false;
          } else if (query._id && typeof query._id === 'object' && '$ne' in query._id) {
            if (doc._id === query._id.$ne) return false;
          } else if (doc._id !== query._id) {
            return false;
          }
        } else if (key === "folders" || key === "elements") {
          const queryValue = query[key];
          if (!((doc as any)[key] as ID[]).includes(queryValue)) {
            return false;
          }
        } else {
          if ((doc as any)[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });

    let currentProjection: { [key: string]: 1 | 0 } | null = null;

    return {
      toArray: async () => {
        if (!currentProjection) {
          return filteredData.map(doc => ({...doc}));
        }

        // Apply projection
        return filteredData.map((doc) => {
          const projectedDoc: Partial<T> = {};
          for (const pKey in currentProjection) {
            if (currentProjection[pKey] === 1) {
              (projectedDoc as any)[pKey] = (doc as any)[pKey];
            }
          }
          return projectedDoc as T;
        });
      },
      project: function (projection: { [key: string]: 1 | 0 }) {
        currentProjection = projection;
        return this; // Allow chaining
      },
    };
  }

  // Simulates `collection.updateOne(query, update)`
  async updateOne(
    query: Partial<T> & { [key: string]: any },
    update: { $set?: Partial<T>; $push?: any; $pull?: any; $addToSet?: any },
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }> {
    let matchedCount = 0;
    let modifiedCount = 0;

    for (const doc of this.data.values()) {
      let match = true;
      // Evaluate query against the current document
      for (const key in query) {
        if (key === "_id") {
          if (typeof query._id === 'object' && '$ne' in query._id) {
            if (doc._id === query._id.$ne) {
              match = false;
              break;
            }
          } else if (doc._id !== query._id) {
            match = false;
            break;
          }
        } else if (key === "folders" || key === "elements") {
          const queryValue = query[key];
          if (!((doc as any)[key] as ID[]).includes(queryValue)) {
            match = false;
            break;
          }
        } else {
          if ((doc as any)[key] !== query[key]) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        matchedCount++;
        let docModified = false;
        const currentDoc = this.data.get(doc._id)!; // Get the actual mutable doc from the map

        if (update.$set) {
          for (const setKey in update.$set) {
            if ((currentDoc as any)[setKey] !== (update.$set as any)[setKey]) {
              (currentDoc as any)[setKey] = (update.$set as any)[setKey];
              docModified = true;
            }
          }
        }
        if (update.$push) {
          for (const pushKey in update.$push) {
            if (Array.isArray((currentDoc as any)[pushKey])) {
              (currentDoc as any)[pushKey].push(update.$push[pushKey]);
              docModified = true;
            }
          }
        }
        if (update.$pull) {
          for (const pullKey in update.$pull) {
            if (Array.isArray((currentDoc as any)[pullKey])) {
              const initialLength = (currentDoc as any)[pullKey].length;
              (currentDoc as any)[pullKey] = ((currentDoc as any)[pullKey] as ID[]).filter(
                (id) => id !== update.$pull[pullKey],
              );
              if ((currentDoc as any)[pullKey].length !== initialLength) {
                docModified = true;
              }
            }
          }
        }
        if (update.$addToSet) {
          for (const addToSetKey in update.$addToSet) {
            if (Array.isArray((currentDoc as any)[addToSetKey])) {
              const targetArray = (currentDoc as any)[addToSetKey] as ID[];
              if (!targetArray.includes(update.$addToSet[addToSetKey])) {
                targetArray.push(update.$addToSet[addToSetKey]);
                docModified = true;
              }
            }
          }
        }

        if (docModified) {
          modifiedCount++;
        }
      }
    }
    return { acknowledged: true, matchedCount, modifiedCount };
  }

  // Simulates `collection.deleteMany(query)`
  async deleteMany(
    query: Partial<T> & { [key: string]: any },
  ): Promise<{ acknowledged: boolean; deletedCount: number }> {
    let deletedCount = 0;
    const idsToDelete: ID[] = [];

    for (const doc of this.data.values()) {
      let match = true;
      for (const key in query) {
        if (key === "_id") {
          if (query._id && typeof query._id === 'object' && '$in' in query._id) {
            if (!query._id.$in.includes(doc._id)) {
              match = false;
              break;
            }
          } else if (doc._id !== query._id) {
            match = false;
            break;
          }
        } else {
          if ((doc as any)[key] !== query[key]) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        idsToDelete.push(doc._id);
      }
    }

    for (const id of idsToDelete) {
      this.data.delete(id);
      deletedCount++;
    }
    return { acknowledged: true, deletedCount };
  }

  // Helper for tests to directly inspect or manipulate the in-memory state
  _getData(): Map<ID, T> {
    return this.data;
  }
  _reset(): void {
    this.data.clear();
  }
}

// 3. Mock for `mongodb.Db`
class MockDb {
  collections: Map<string, MockCollection<any>> = new Map();

  collection<T extends { _id: ID }>(name: string): MockCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection<T>(name));
    }
    return this.collections.get(name)!;
  }

  _resetAll(): void {
    this.collections.forEach(col => col._reset());
    this.collections.clear();
  }
}

// --- Test Suite for FolderConcept ---

// Save original freshID before overriding for tests to ensure no side-effects on other modules
const originalFreshID = globalThis.freshID;
globalThis.freshID = mockFreshID; // Override global freshID for testing

Deno.test("FolderConcept", async (t) => {
  let db: MockDb;
  let folderConcept: FolderConcept;
  let foldersCollection: MockCollection<FolderStructure>;

  // Setup for each top-level test block. This ensures a clean state for each method's tests.
  t.beforeEach(() => {
    db = new MockDb();
    // Cast to any because MockDb does not fully implement mongodb.Db, but provides necessary methods.
    folderConcept = new FolderConcept(db as any);
    foldersCollection = db.collection("Folder.folders"); // Access the internal mock collection
    currentId = 0; // Reset ID counter for predictable IDs in each test block
  });

  Deno.test("initializeFolder", async (t) => {
    const user1 = mockFreshID() as User; // user1 = 'mock-id-1'

    await t.step("should create a root folder for a new user", async () => {
      const result = await folderConcept.initializeFolder({ user: user1 });

      assertExists(result);
      assert("folder" in result);
      assertNotEquals(result.folder, undefined); // folder = 'mock-id-2'

      const folderId = result.folder;
      const folderDoc = await foldersCollection.findOne({ _id: folderId });
      assertExists(folderDoc);
      assertEquals(folderDoc?.owner, user1);
      assertEquals(folderDoc?.title, "Root");
      assertEquals(folderDoc?.folders, []);
      assertEquals(folderDoc?.elements, []);
      assertEquals(foldersCollection._getData().size, 1);
    });

    await t.step("should return an error if user already has a root folder", async () => {
      // The state from the previous step ('mock-id-2' owned by 'mock-id-1') persists here.
      const result = await folderConcept.initializeFolder({ user: user1 });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, "user has already created folders");
      assertEquals(foldersCollection._getData().size, 1); // No new folder should be created
    });
  });

  Deno.test("createFolder", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let rootFolderId: Folder; // 'mock-id-2'

    // Setup a common state for all steps within this `createFolder` test block
    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      const initResult = await folderConcept.initializeFolder({ user: user1 });
      rootFolderId = (initResult as { folder: Folder }).folder;
    });

    await t.step("should create a new child folder and link it to the parent", async () => {
      const result = await folderConcept.createFolder({
        user: user1,
        title: "Child Folder",
        parent: rootFolderId,
      });

      assertExists(result);
      assert("folder" in result);
      assertNotEquals(result.folder, undefined); // childFolderId = 'mock-id-3'

      const childFolderId = result.folder;
      const childFolderDoc = await foldersCollection.findOne({ _id: childFolderId });
      assertExists(childFolderDoc);
      assertEquals(childFolderDoc?.owner, user1);
      assertEquals(childFolderDoc?.title, "Child Folder");
      assertEquals(childFolderDoc?.folders, []);
      assertEquals(childFolderDoc?.elements, []);

      const parentFolderDoc = await foldersCollection.findOne({ _id: rootFolderId });
      assertExists(parentFolderDoc);
      assert(parentFolderDoc?.folders.includes(childFolderId));
      assertEquals(foldersCollection._getData().size, 2); // Root + Child
    });

    await t.step("should return an error if parent folder does not exist", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-3'
      const result = await folderConcept.createFolder({
        user: user1,
        title: "Orphan",
        parent: nonExistentFolder,
      });

      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Parent folder with ID ${nonExistentFolder} not found.`);
      assertEquals(foldersCollection._getData().size, 1); // Only root folder should exist
    });

    await t.step("should return an error if parent folder is not owned by the user", async () => {
      const user2 = mockFreshID() as User; // 'mock-id-3'
      const user2RootResult = await folderConcept.initializeFolder({ user: user2 });
      const user2RootFolderId = (user2RootResult as { folder: Folder }).folder; // 'mock-id-4'

      const result = await folderConcept.createFolder({
        user: user1, // User 1 trying to create in User 2's folder
        title: "Stolen Child",
        parent: user2RootFolderId,
      });

      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Parent folder with ID ${user2RootFolderId} is not owned by the user.`);
      assertEquals(foldersCollection._getData().size, 2); // User1 root, User2 root
    });
  });

  Deno.test("moveFolder", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let rootFolderId: Folder; // 'mock-id-2'
    let folderAId: Folder; // 'mock-id-3'
    let folderBId: Folder; // 'mock-id-4'
    let folderCId: Folder; // 'mock-id-5' (Descendant of A)

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      const initResult = await folderConcept.initializeFolder({ user: user1 });
      rootFolderId = (initResult as { folder: Folder }).folder; // 'mock-id-2'

      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: rootFolderId });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'

      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: rootFolderId });
      folderBId = (createB as { folder: Folder }).folder; // 'mock-id-4'

      const createC = await folderConcept.createFolder({ user: user1, title: "Folder C", parent: folderAId });
      folderCId = (createC as { folder: Folder }).folder; // 'mock-id-5'
      // Current structure:
      // Root ('mock-id-2')
      //  - A ('mock-id-3')
      //      - C ('mock-id-5')
      //  - B ('mock-id-4')
    });

    await t.step("should move folder A into folder B", async () => {
      const result = await folderConcept.moveFolder({ folder: folderAId, newParent: folderBId });
      assertExists(result);
      assert("folder" in result);
      assertEquals(result.folder, folderAId);

      const rootFolder = await foldersCollection.findOne({ _id: rootFolderId });
      assertExists(rootFolder);
      assertFalse(rootFolder.folders.includes(folderAId)); // A should no longer be in root
      assert(rootFolder.folders.includes(folderBId)); // B should still be in root

      const folderB = await foldersCollection.findOne({ _id: folderBId });
      assertExists(folderB);
      assert(folderB.folders.includes(folderAId)); // A should now be in B

      const folderA = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderA);
      assert(folderA.folders.includes(folderCId)); // C should still be in A
    });

    await t.step("should move an unparented folder into folder B", async () => {
        const folderDId = mockFreshID() as Folder; // 'mock-id-6'
        await foldersCollection.insertOne({_id: folderDId, owner: user1, title: "Folder D", folders: [], elements: []});
        assertEquals(foldersCollection._getData().get(folderDId)?.title, "Folder D");

        const result = await folderConcept.moveFolder({ folder: folderDId, newParent: folderBId });
        assertExists(result);
        assert("folder" in result);
        assertEquals(result.folder, folderDId);

        const folderB = await foldersCollection.findOne({ _id: folderBId });
        assertExists(folderB);
        assert(folderB.folders.includes(folderDId)); // D should now be in B

        const folderD = await foldersCollection.findOne({ _id: folderDId });
        assertExists(folderD);
        assertEquals(folderD.owner, user1);
    });

    await t.step("should return an error if source folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-6' (if previous step ran, otherwise 'mock-id-6')
      const result = await folderConcept.moveFolder({ folder: nonExistentFolder, newParent: folderBId });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });

    await t.step("should return an error if new parent folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-6'
      const result = await folderConcept.moveFolder({ folder: folderAId, newParent: nonExistentFolder });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `New parent folder with ID ${nonExistentFolder} not found.`);
    });

    await t.step("should return an error if folders have different owners", async () => {
      const user2 = mockFreshID() as User; // 'mock-id-6'
      const user2RootResult = await folderConcept.initializeFolder({ user: user2 });
      const user2RootFolderId = (user2RootResult as { folder: Folder }).folder; // 'mock-id-7'

      const result = await folderConcept.moveFolder({ folder: folderAId, newParent: user2RootFolderId });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folders must have the same owner to be moved. Folder ${folderAId} owner: ${user1}, New parent ${user2RootFolderId} owner: ${user2}`);
    });

    await t.step("should return an error if moving a folder into itself", async () => {
      const result = await folderConcept.moveFolder({ folder: folderAId, newParent: folderAId });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Cannot move a folder into itself.`);
    });

    await t.step("should return an error if moving a folder into its own descendant", async () => {
      const result = await folderConcept.moveFolder({ folder: folderAId, newParent: folderCId });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Cannot move folder ${folderAId} into its own descendant folder ${folderCId}.`);
    });
  });

  Deno.test("insertItem", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let rootFolderId: Folder; // 'mock-id-2'
    let folderAId: Folder; // 'mock-id-3'
    let folderBId: Folder; // 'mock-id-4'
    const item1 = mockFreshID() as Item; // 'mock-id-5'
    const item2 = mockFreshID() as Item; // 'mock-id-6'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      await folderConcept.initializeFolder({ user: user1 });
      rootFolderId = "mock-id-2" as Folder; // Expected ID after initializeFolder for user1

      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: rootFolderId });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'

      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: rootFolderId });
      folderBId = (createB as { folder: Folder }).folder; // 'mock-id-4'
    });

    await t.step("should insert a new item into an empty folder", async () => {
      const result = await folderConcept.insertItem({ item: item1, folder: folderAId });
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      const folderA = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderA);
      assert(folderA.elements.includes(item1));
      assertEquals(folderA.elements.length, 1);
    });

    await t.step("should move an item from one folder to another", async () => {
      // Setup: item1 in folderA
      await folderConcept.insertItem({ item: item1, folder: folderAId });
      let folderA = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderA);
      assert(folderA.elements.includes(item1));

      const result = await folderConcept.insertItem({ item: item1, folder: folderBId });
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      folderA = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderA);
      assertFalse(folderA.elements.includes(item1)); // Should be removed from A

      const folderB = await foldersCollection.findOne({ _id: folderBId });
      assertExists(folderB);
      assert(folderB.elements.includes(item1)); // Should be added to B
      assertEquals(folderB.elements.length, 1);
    });

    await t.step("should do nothing if item is already in the target folder", async () => {
      // Setup: item1 in folderA
      await folderConcept.insertItem({ item: item1, folder: folderAId });
      const folderAInitial = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderAInitial);
      assertEquals(folderAInitial.elements, [item1]);

      const result = await folderConcept.insertItem({ item: item1, folder: folderAId });
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      const folderAUpdated = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderAUpdated);
      assertEquals(folderAUpdated.elements, [item1]); // Should remain the same
    });

    await t.step("should return an error if target folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-7' (if previous step ran, otherwise 'mock-id-5')
      const result = await folderConcept.insertItem({ item: item2, folder: nonExistentFolder });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Target folder with ID ${nonExistentFolder} not found.`);
    });
  });

  Deno.test("deleteFolder", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let rootFolderId: Folder; // 'mock-id-2'
    let folderAId: Folder; // 'mock-id-3'
    let folderBId: Folder; // 'mock-id-4'
    let folderCId: Folder; // 'mock-id-5'
    const item1 = mockFreshID() as Item; // 'mock-id-6'
    const item2 = mockFreshID() as Item; // 'mock-id-7'
    const item3 = mockFreshID() as Item; // 'mock-id-8'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      const initResult = await folderConcept.initializeFolder({ user: user1 });
      rootFolderId = (initResult as { folder: Folder }).folder; // 'mock-id-2'

      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: rootFolderId });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'

      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: rootFolderId });
      folderBId = (createB as { folder: Folder }).folder; // 'mock-id-4'

      const createC = await folderConcept.createFolder({ user: user1, title: "Folder C", parent: folderAId });
      folderCId = (createC as { folder: Folder }).folder; // 'mock-id-5'

      await folderConcept.insertItem({ item: item1, folder: rootFolderId }); // 'mock-id-6'
      await folderConcept.insertItem({ item: item2, folder: folderAId }); // 'mock-id-7'
      await folderConcept.insertItem({ item: item3, folder: folderCId }); // 'mock-id-8'

      // Expected structure:
      // Root ('mock-id-2', item1)
      //  - A ('mock-id-3', item2)
      //      - C ('mock-id-5', item3)
      //  - B ('mock-id-4')
      assertEquals(foldersCollection._getData().size, 4); // Root, A, B, C
      assertEquals((await foldersCollection.findOne({_id: rootFolderId}))?.elements, [item1]);
      assertEquals((await foldersCollection.findOne({_id: folderAId}))?.elements, [item2]);
      assertEquals((await foldersCollection.findOne({_id: folderCId}))?.elements, [item3]);
    });

    await t.step("should delete a folder with no children or items", async () => {
      const result = await folderConcept.deleteFolder(folderBId);
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      const folderB = await foldersCollection.findOne({ _id: folderBId });
      assertEquals(folderB, null); // Folder B should be gone
      assertEquals(foldersCollection._getData().size, 3); // Root, A, C

      const rootFolder = await foldersCollection.findOne({ _id: rootFolderId });
      assertExists(rootFolder);
      assertFalse(rootFolder.folders.includes(folderBId)); // Root should no longer reference B
    });

    await t.step("should delete a folder and all its descendants (subfolders and items)", async () => {
      const result = await folderConcept.deleteFolder(folderAId);
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      const folderA = await foldersCollection.findOne({ _id: folderAId });
      assertEquals(folderA, null); // Folder A should be gone
      const folderC = await foldersCollection.findOne({ _id: folderCId });
      assertEquals(folderC, null); // Folder C (descendant) should be gone

      const rootFolder = await foldersCollection.findOne({ _id: rootFolderId });
      assertExists(rootFolder);
      assertFalse(rootFolder.folders.includes(folderAId)); // Root should no longer reference A

      // Only Root and B should remain
      assertEquals(foldersCollection._getData().size, 2);
      assertExists(await foldersCollection.findOne({ _id: rootFolderId }));
      assertExists(await foldersCollection.findOne({ _id: folderBId }));

      // item2 (in A) and item3 (in C) should implicitly be removed as their containing folders are deleted.
      // item1 (in Root) should still exist.
      assertEquals((await foldersCollection.findOne({_id: rootFolderId}))?.elements, [item1]);
    });

    await t.step("should return an error if folder to delete not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-9'
      const result = await folderConcept.deleteFolder(nonExistentFolder);
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
      assertEquals(foldersCollection._getData().size, 4); // No change
    });
  });

  Deno.test("deleteItem", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let folderAId: Folder; // 'mock-id-3'
    let folderBId: Folder; // 'mock-id-4'
    const item1 = mockFreshID() as Item; // 'mock-id-5'
    const item2 = mockFreshID() as Item; // 'mock-id-6'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      await folderConcept.initializeFolder({ user: user1 }); // rootFolder 'mock-id-2'
      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: "mock-id-2" as Folder });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'
      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: "mock-id-2" as Folder });
      folderBId = (createB as { folder: Folder }).folder; // 'mock-id-4'

      await folderConcept.insertItem({ item: item1, folder: folderAId }); // 'mock-id-5'
      await folderConcept.insertItem({ item: item2, folder: folderBId }); // 'mock-id-6'

      assertEquals((await foldersCollection.findOne({ _id: folderAId }))?.elements, [item1]);
      assertEquals((await foldersCollection.findOne({ _id: folderBId }))?.elements, [item2]);
    });

    await t.step("should delete an item from its containing folder", async () => {
      const result = await folderConcept.deleteItem({ item: item1 });
      assertExists(result);
      assert(!("error" in result));
      assertEquals(result, {});

      const folderA = await foldersCollection.findOne({ _id: folderAId });
      assertExists(folderA);
      assertFalse(folderA.elements.includes(item1));
      assertEquals(folderA.elements.length, 0);

      const folderB = await foldersCollection.findOne({ _id: folderBId });
      assertExists(folderB);
      assert(folderB.elements.includes(item2)); // Item 2 should still be there
    });

    await t.step("should return an error if item not found in any folder", async () => {
      const nonExistentItem = mockFreshID() as Item; // 'mock-id-7'
      const result = await folderConcept.deleteItem({ item: nonExistentItem });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Item with ID ${nonExistentItem} not found in any folder.`);
    });
  });

  Deno.test("_getFolderChildren", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let rootFolderId: Folder; // 'mock-id-2'
    let folderAId: Folder; // 'mock-id-3'
    let folderBId: Folder; // 'mock-id-4'
    let folderCId: Folder; // 'mock-id-5'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      const initResult = await folderConcept.initializeFolder({ user: user1 });
      rootFolderId = (initResult as { folder: Folder }).folder; // 'mock-id-2'

      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: rootFolderId });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'

      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: rootFolderId });
      folderBId = (createB as { folder: Folder }).folder; // 'mock-id-4'

      const createC = await folderConcept.createFolder({ user: user1, title: "Folder C", parent: folderAId });
      folderCId = (createC as { folder: Folder }).folder; // 'mock-id-5'
    });

    await t.step("should retrieve all children of a given folder", async () => {
      const children = await folderConcept._getFolderChildren({ folderId: rootFolderId });
      assertExists(children);
      assert(Array.isArray(children));
      assertEquals((children as Folder[]).length, 2);
      assert((children as Folder[]).includes(folderAId));
      assert((children as Folder[]).includes(folderBId));
    });

    await t.step("should return an empty array if folder has no children", async () => {
      const children = await folderConcept._getFolderChildren({ folderId: folderBId });
      assertExists(children);
      assert(Array.isArray(children));
      assertEquals((children as Folder[]).length, 0);
    });

    await t.step("should return an error if folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-6'
      const result = await folderConcept._getFolderChildren({ folderId: nonExistentFolder });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });
  });

  Deno.test("_getFolderItems", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let folderAId: Folder; // 'mock-id-3'
    const item1 = mockFreshID() as Item; // 'mock-id-4'
    const item2 = mockFreshID() as Item; // 'mock-id-5'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      await folderConcept.initializeFolder({ user: user1 }); // rootFolder 'mock-id-2'
      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: "mock-id-2" as Folder });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'

      await folderConcept.insertItem({ item: item1, folder: folderAId }); // 'mock-id-4'
      await folderConcept.insertItem({ item: item2, folder: folderAId }); // 'mock-id-5'
    });

    await t.step("should retrieve all items of a given folder", async () => {
      const items = await folderConcept._getFolderItems({ folderId: folderAId });
      assertExists(items);
      assert(Array.isArray(items));
      assertEquals((items as Item[]).length, 2);
      assert((items as Item[]).includes(item1));
      assert((items as Item[]).includes(item2));
    });

    await t.step("should return an empty array if folder has no items", async () => {
      const createB = await folderConcept.createFolder({ user: user1, title: "Folder B", parent: "mock-id-2" as Folder });
      const folderBId = (createB as { folder: Folder }).folder; // 'mock-id-6'

      const items = await folderConcept._getFolderItems({ folderId: folderBId });
      assertExists(items);
      assert(Array.isArray(items));
      assertEquals((items as Item[]).length, 0);
    });

    await t.step("should return an error if folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-6' or 'mock-id-7' depending on previous step
      const result = await folderConcept._getFolderItems({ folderId: nonExistentFolder });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });
  });

  Deno.test("_getFolderDetails", async (t) => {
    const user1 = mockFreshID() as User; // 'mock-id-1'
    let folderAId: Folder; // 'mock-id-3'

    t.beforeEach(async () => {
      currentId = 0; // Reset for this group's setup
      await folderConcept.initializeFolder({ user: user1 }); // rootFolder 'mock-id-2'
      const createA = await folderConcept.createFolder({ user: user1, title: "Folder A", parent: "mock-id-2" as Folder });
      folderAId = (createA as { folder: Folder }).folder; // 'mock-id-3'
    });

    await t.step("should retrieve all details for a given folder", async () => {
      const details = await folderConcept._getFolderDetails({ folderId: folderAId });
      assertExists(details);
      assert(!("error" in details)); // Check it's not an error object
      assertEquals((details as FolderStructure)._id, folderAId);
      assertEquals((details as FolderStructure).owner, user1);
      assertEquals((details as FolderStructure).title, "Folder A");
      assertEquals((details as FolderStructure).folders, []);
      assertEquals((details as FolderStructure).elements, []);
    });

    await t.step("should return an error if folder not found", async () => {
      const nonExistentFolder = mockFreshID() as Folder; // 'mock-id-4'
      const result = await folderConcept._getFolderDetails({ folderId: nonExistentFolder });
      assertExists(result);
      assert("error" in result);
      assertEquals(result.error, `Folder with ID ${nonExistentFolder} not found.`);
    });
  });

  // Restore original freshID after all tests are done
  t.afterAll(() => {
    globalThis.freshID = originalFreshID;
  });
});

```
