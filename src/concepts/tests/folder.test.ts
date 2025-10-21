// test_folder_concept.ts
import { Db, MongoClient } from "npm:mongodb";
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
// Assuming FolderConcept now exposes _isDescendant and _collectDescendants publicly for testing,
// similar to other internal query methods like _getFolderDetails.
import FolderConcept, {
  Folder,
  FolderStructure,
  Item,
  User,
} from "../Scriblink/folderConcept.ts"; // Adjust path as necessary for your project
import { ID } from "@utils/types.ts"; // Assuming `freshID` returns `ID` or similar type, and User/Item/Folder extend ID.

// --- Helper functions for testing ---
function assertFolderStructure(
  result: FolderStructure | { error: string },
): FolderStructure {
  if ("error" in result) {
    throw new Error(`Expected folder structure but got error: ${result.error}`);
  }
  return result;
}

function assertFolderArray(result: ID[] | { error: string }): ID[] {
  if ("error" in result) {
    throw new Error(`Expected folder array but got error: ${result.error}`);
  }
  return result;
}

function assertFolderResult(
  result: { folder: ID } | { error: string },
): { folder: ID } {
  if ("error" in result) {
    throw new Error(`Expected folder result but got error: ${result.error}`);
  }
  return result;
}

// --- Constants for testing ---
// Using `as User`, `as Item`, `as Folder` to satisfy type checker for fresh IDs.
const userA = freshID() as User;
const userB = freshID() as User;
const itemA = freshID() as Item;
const itemB = freshID() as Item;
const itemC = freshID() as Item; // For negative tests or items not yet inserted

// --- Principle Test: User initializes root, creates hierarchy, manages items, and deletes folders ---
// ============================================================================
// --- OPERATIONAL PRINCIPLE ---
// ============================================================================

Deno.test("Principle: User initializes root, creates hierarchy, manages items, and deletes folders", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  let rootId: Folder;
  let child1Id: Folder;
  let child2Id: Folder;
  let grandchild1Id: Folder;

  try {
    console.log("\n📁 OPERATIONAL PRINCIPLE: Folder Management Workflow");
    console.log("=".repeat(60));

    // 1. User A initializes a root folder
    console.log("\n🏗️  Step 1: Initializing root folder");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({
        user: userA,
      }),
    );
    rootId = initializeResult.folder as Folder;

    let rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assertEquals(rootDetails.owner, userA);
    assertEquals(rootDetails.title, "Root");
    assertEquals(rootDetails.folders.length, 0);
    assertEquals(rootDetails.elements.length, 0);
    console.log("   ✅ Root folder initialized successfully");

    // 2. User A creates child folders
    console.log("\n📁 Step 2: Creating child folders");
    const createChild1Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child 1",
        parent: rootId,
      }),
    );
    child1Id = createChild1Result.folder as Folder;

    const createChild2Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child 2",
        parent: rootId,
      }),
    );
    child2Id = createChild2Result.folder as Folder;

    // Verify children in root
    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertArrayIncludes(rootDetails.folders, [child1Id, child2Id]);
    assertEquals(rootDetails.folders.length, 2);
    console.log("   ✅ Child folders created: Child 1, Child 2");

    // 3. User A creates a grandchild folder
    console.log("\n📁 Step 3: Creating grandchild folder");
    const createGrandchildResult = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Grandchild 1",
        parent: child1Id,
      }),
    );
    grandchild1Id = createGrandchildResult.folder as Folder;

    // Verify grandchild in child1
    let child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    assertArrayIncludes(child1Details.folders, [grandchild1Id]);
    assertEquals(child1Details.folders.length, 1);
    console.log(
      "   ✅ Grandchild folder created: Grandchild 1 (under Child 1)",
    );

    // 4. User A inserts items into folders
    console.log("\n📦 Step 4: Adding items to folders");
    const insertItemARootResult = await folderConcept.insertItem({
      item: itemA,
      folder: rootId,
    });
    assertNotEquals("error" in insertItemARootResult, true);
    const insertItemBChild1Result = await folderConcept.insertItem({
      item: itemB,
      folder: child1Id,
    });
    assertNotEquals("error" in insertItemBChild1Result, true);

    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertArrayIncludes(rootDetails.elements, [itemA]);
    child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    assertArrayIncludes(child1Details.elements, [itemB]);
    console.log("   ✅ Items added: itemA (root), itemB (child1)");

    // 5. User A moves an item (itemA from root to child1)
    console.log("\n🔄 Step 5: Moving item between folders");
    const insertItemAResult = await folderConcept.insertItem({
      item: itemA,
      folder: child1Id,
    }); // insertItem handles moves
    assertNotEquals("error" in insertItemAResult, true);

    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    rootDetails = assertFolderStructure(rootDetails);
    assertEquals(
      rootDetails.elements.length,
      0,
      "itemA should be moved from root",
    );
    child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    child1Details = assertFolderStructure(child1Details);
    assertArrayIncludes(
      child1Details.elements,
      [itemB, itemA],
      "child1 should contain both itemA and itemB",
    );
    assertEquals(child1Details.elements.length, 2);
    console.log("   ✅ ItemA moved from root to child1");

    // 6. User A moves a folder (child2 from root to child1)
    // Initial: root -> [child1, child2], child1 -> [grandchild1]
    console.log("\n🔄 Step 6: Moving folder between parents");
    const moveChild2Result = await folderConcept.moveFolder({
      folder: child2Id,
      newParent: child1Id,
    });
    assertNotEquals("error" in moveChild2Result, true);

    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertNotEquals("error" in rootDetails, true);
    assert(
      !rootDetails.folders.includes(child2Id),
      "child2 should be removed from root",
    );
    assertEquals(rootDetails.folders.length, 1);
    assertArrayIncludes(rootDetails.folders, [child1Id]);

    child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    assertNotEquals("error" in child1Details, true);
    assertArrayIncludes(
      child1Details.folders,
      [grandchild1Id, child2Id],
      "child1 should now contain child2",
    );
    assertEquals(child1Details.folders.length, 2);
    console.log("   ✅ Child2 moved from root to child1");

    // 7. User A deletes an item (itemB from child1)
    console.log("\n🗑️  Step 7: Deleting item from folder");
    const deleteItemBResult = await folderConcept.deleteItem({ item: itemB });
    assertNotEquals("error" in deleteItemBResult, true);

    child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    assertNotEquals("error" in child1Details, true);
    assert(
      !child1Details.elements.includes(itemB),
      "itemB should be removed from child1",
    );
    assertEquals(child1Details.elements.length, 1); // Only itemA remains
    console.log("   ✅ ItemB deleted from child1");

    // 8. User A deletes a folder (child1, which should also delete grandchild1 and child2)
    // Current hierarchy: root -> [child1], child1 -> [grandchild1, child2]
    // Items: itemA in child1
    console.log("\n🗑️  Step 8: Deleting folder with children (cascade delete)");
    const deleteChild1Result = await folderConcept.deleteFolder(child1Id);
    assertNotEquals("error" in deleteChild1Result, true);

    const child1Check = await folderConcept._getFolderDetails({
      folderId: child1Id,
    });
    assertEquals("error" in child1Check, true, "child1 should be deleted");
    const grandchild1Check = await folderConcept._getFolderDetails({
      folderId: grandchild1Id,
    });
    assertEquals(
      "error" in grandchild1Check,
      true,
      "grandchild1 should be deleted",
    );
    const child2Check = await folderConcept._getFolderDetails({
      folderId: child2Id,
    });
    assertEquals(
      "error" in child2Check,
      true,
      "child2 (now under child1) should be deleted",
    );

    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertNotEquals("error" in rootDetails, true);
    assertEquals(
      rootDetails.folders.length,
      0,
      "root should now be empty of folders",
    );
    assertEquals(
      rootDetails.elements.length,
      0,
      "items previously in child1 or its descendants should be gone",
    );
    console.log("   ✅ Child1 and all descendants deleted (cascade delete)");
    console.log("   📊 Final state: Empty root folder");

    // Verify items are actually gone from the database
    const itemAFind = await db.collection("items").findOne({ _id: itemA });
    assertEquals(itemAFind, null, "itemA should be deleted from the database");
    const itemBFind = await db.collection("items").findOne({ _id: itemB });
    assertEquals(itemBFind, null, "itemB should be deleted from the database");
    console.log("   ✅ All items removed from database");

    console.log("\n🎉 OPERATIONAL PRINCIPLE COMPLETE");
    console.log("=".repeat(60));
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- GENERAL CONCEPT METHOD TESTING ---
// ============================================================================

// --- Action Test: initializeFolder ---
Deno.test("Action: initializeFolder fails if user already has folders", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    // First, successfully initialize
    const successResult = await folderConcept.initializeFolder({ user });
    assertNotEquals("error" in successResult, true);
    assertExists((successResult as { folder: ID }).folder);

    // Second attempt should fail
    const failureResult = await folderConcept.initializeFolder({ user });
    assertEquals("error" in failureResult, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: initializeFolder successfully creates a root for a new user", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const result = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const resultFolder = result.folder as Folder;
    assertExists(resultFolder);

    const folderDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: resultFolder,
      }),
    );
    assertEquals(folderDetails.owner, user);
    assertEquals(folderDetails.title, "Root");
    assertEquals(folderDetails.folders.length, 0);
    assertEquals(folderDetails.elements.length, 0);
  } finally {
    await client.close();
  }
});

// --- Action Test: createFolder ---
Deno.test("Action: createFolder successfully creates a new folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;

    const result = assertFolderResult(
      await folderConcept.createFolder({
        user,
        title: "New Folder",
        parent: rootId,
      }),
    );
    const resultFolder = result.folder as Folder;
    assertExists(resultFolder);

    const newFolderDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: resultFolder,
      }),
    );
    assertEquals(newFolderDetails.owner, user);
    assertEquals(newFolderDetails.title, "New Folder");

    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assertArrayIncludes(rootDetails.folders, [resultFolder]);
  } finally {
    await client.close();
  }
});

Deno.test("Action: createFolder fails if parent folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept.createFolder({
      user,
      title: "Orphan",
      parent: nonExistentFolder,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: createFolder fails if parent folder not owned by user", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user1 = freshID() as User;
    const user2 = freshID() as User;
    const { folder: user2RootId } =
      (await folderConcept.initializeFolder({ user: user2 })) as {
        folder: Folder;
      };

    const result = await folderConcept.createFolder({
      user: user1,
      title: "Intruder",
      parent: user2RootId,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Query Test: _getFolderChildren ---
Deno.test("Query: _getFolderChildren successfully retrieves children", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChild1Result = await folderConcept.createFolder({
      user,
      title: "C1",
      parent: rootId,
    });
    assertNotEquals("error" in createChild1Result, true);
    const child1Id = (createChild1Result as { folder: ID }).folder as Folder;
    const createChild2Result = await folderConcept.createFolder({
      user,
      title: "C2",
      parent: rootId,
    });
    assertNotEquals("error" in createChild2Result, true);
    const child2Id = (createChild2Result as { folder: ID }).folder as Folder;
    const createGrandchildResult = await folderConcept.createFolder({
      user,
      title: "GC1",
      parent: child1Id,
    });
    assertNotEquals("error" in createGrandchildResult, true);
    const grandchild1Id = (createGrandchildResult as { folder: ID })
      .folder as Folder;

    const rootChildren = assertFolderArray(
      await folderConcept._getFolderChildren({
        folderId: rootId,
      }),
    );
    assertEquals(rootChildren.length, 2);
    assertArrayIncludes(rootChildren, [child1Id, child2Id]);

    const child1Children = assertFolderArray(
      await folderConcept._getFolderChildren({
        folderId: child1Id,
      }),
    );
    assertEquals(child1Children.length, 1);
    assertArrayIncludes(child1Children, [grandchild1Id]);

    const child2Children = assertFolderArray(
      await folderConcept._getFolderChildren({
        folderId: child2Id,
      }),
    );
    assertEquals(child2Children.length, 0);
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFolderChildren fails if folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept._getFolderChildren({
      folderId: nonExistentFolder,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Action Test: insertItem ---
Deno.test("Action: insertItem successfully inserts an item", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;

    const result = await folderConcept.insertItem({
      item: itemA,
      folder: rootId,
    });
    assertNotEquals("error" in result, true);

    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assertArrayIncludes(rootDetails.elements, [itemA]);
    assertEquals(rootDetails.elements.length, 1);
  } finally {
    await client.close();
  }
});

Deno.test("Action: insertItem successfully moves an item if already exists elsewhere", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChildResult = await folderConcept.createFolder({
      user,
      title: "Child",
      parent: rootId,
    });
    assertNotEquals("error" in createChildResult, true);
    const childId = (createChildResult as { folder: ID }).folder as Folder;

    await folderConcept.insertItem({ item: itemA, folder: rootId }); // Insert into root
    let rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assertArrayIncludes(rootDetails.elements, [itemA]);
    assertEquals(rootDetails.elements.length, 1);

    await folderConcept.insertItem({ item: itemA, folder: childId }); // Move to child
    rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertNotEquals("error" in rootDetails, true);
    assertEquals(
      rootDetails.elements.length,
      0,
      "itemA should be removed from root",
    );
    let childDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: childId,
      }),
    );
    assertNotEquals("error" in childDetails, true);
    assertArrayIncludes(childDetails.elements, [itemA]);
    assertEquals(childDetails.elements.length, 1);
  } finally {
    await client.close();
  }
});

Deno.test("Action: insertItem is a no-op if item is already in target folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;

    await folderConcept.insertItem({ item: itemA, folder: rootId });
    await folderConcept.insertItem({ item: itemA, folder: rootId }); // Re-insert

    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assertEquals(rootDetails.elements.length, 1); // Should still be 1, no duplicates
  } finally {
    await client.close();
  }
});

Deno.test("Action: insertItem fails if target folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept.insertItem({
      item: itemC,
      folder: nonExistentFolder,
    });
    assertEquals("error" in result, true);
    assertEquals(
      result.error,
      `Target folder with ID ${nonExistentFolder} not found.`,
    );
  } finally {
    await client.close();
  }
});

// --- Query Test: _getFolderItems ---
Deno.test("Query: _getFolderItems successfully retrieves items", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChildResult = await folderConcept.createFolder({
      user,
      title: "Child",
      parent: rootId,
    });
    assertNotEquals("error" in createChildResult, true);
    const childId = (createChildResult as { folder: ID }).folder as Folder;

    await folderConcept.insertItem({ item: itemA, folder: rootId });
    await folderConcept.insertItem({ item: itemB, folder: childId });

    const rootItems = assertFolderArray(
      await folderConcept._getFolderItems({ folderId: rootId }),
    );
    assertEquals(rootItems.length, 1);
    assertArrayIncludes(rootItems, [itemA]);

    const childItems = assertFolderArray(
      await folderConcept._getFolderItems({
        folderId: childId,
      }),
    );
    assertEquals(childItems.length, 1);
    assertArrayIncludes(childItems, [itemB]);
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFolderItems fails if folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept._getFolderItems({
      folderId: nonExistentFolder,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Query Test: _isDescendant (assuming it's made public for testing) ---
Deno.test("Query: _isDescendant correctly identifies descendants", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChild1Result = await folderConcept.createFolder({
      user,
      title: "C1",
      parent: rootId,
    });
    assertNotEquals("error" in createChild1Result, true);
    const child1Id = (createChild1Result as { folder: ID }).folder as Folder;
    const createChild2Result = await folderConcept.createFolder({
      user,
      title: "C2",
      parent: rootId,
    });
    assertNotEquals("error" in createChild2Result, true);
    const child2Id = (createChild2Result as { folder: ID }).folder as Folder;
    const createGrandchildResult = await folderConcept.createFolder({
      user,
      title: "GC1",
      parent: child1Id,
    });
    assertNotEquals("error" in createGrandchildResult, true);
    const grandchild1Id = (createGrandchildResult as { folder: ID })
      .folder as Folder;

    assert(
      await folderConcept.isDescendant(child1Id, rootId),
      "child1 should be descendant of root",
    );
    assert(
      await folderConcept.isDescendant(grandchild1Id, rootId),
      "grandchild1 should be descendant of root",
    );
    assert(
      await folderConcept.isDescendant(grandchild1Id, child1Id),
      "grandchild1 should be descendant of child1",
    );

    assert(
      !await folderConcept.isDescendant(rootId, child1Id),
      "root should not be descendant of child1",
    );
    assert(
      !await folderConcept.isDescendant(child2Id, child1Id),
      "child2 should not be descendant of child1 (sibling)",
    );
    assert(
      !await folderConcept.isDescendant(freshID() as Folder, rootId),
      "non-existent folder should not be descendant of root",
    );
    assert(
      !await folderConcept.isDescendant(child1Id, freshID() as Folder),
      "child1 should not be descendant of non-existent folder",
    );
  } finally {
    await client.close();
  }
});

// --- Action Test: moveFolder ---
Deno.test("Action: moveFolder successfully moves a folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChild1Result = await folderConcept.createFolder({
      user,
      title: "C1",
      parent: rootId,
    });
    assertNotEquals("error" in createChild1Result, true);
    const child1Id = (createChild1Result as { folder: ID }).folder as Folder;
    const createChild2Result = await folderConcept.createFolder({
      user,
      title: "C2",
      parent: rootId,
    });
    assertNotEquals("error" in createChild2Result, true);
    const child2Id = (createChild2Result as { folder: ID }).folder as Folder;

    // Move child2 from root to child1
    const result = await folderConcept.moveFolder({
      folder: child2Id,
      newParent: child1Id,
    });
    assertNotEquals("error" in result, true);
    assertEquals((result as { folder: ID }).folder, child2Id);

    // Verify root no longer contains child2
    let rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assert(
      !rootDetails.folders.includes(child2Id),
      "root should not contain child2",
    );
    assertEquals(rootDetails.folders.length, 1);
    assertArrayIncludes(rootDetails.folders, [child1Id]);

    // Verify child1 now contains child2
    let child1Details = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: child1Id,
      }),
    );
    assertArrayIncludes(child1Details.folders, [child2Id]);
    assertEquals(child1Details.folders.length, 1);
  } finally {
    await client.close();
  }
});

Deno.test("Action: moveFolder fails if folder or newParent not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const nonExistentFolder = freshID() as Folder;
    const nonExistentParent = freshID() as Folder;

    const result1 = await folderConcept.moveFolder({
      folder: nonExistentFolder,
      newParent: rootId,
    });
    assertEquals("error" in result1, true);
    // Just check that an error occurred, don't check the specific message

    const result2 = await folderConcept.moveFolder({
      folder: rootId,
      newParent: nonExistentParent,
    });
    assertEquals("error" in result2, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: moveFolder fails if folders have different owners", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user1 = freshID() as User;
    const user2 = freshID() as User;
    const { folder: user1RootId } =
      (await folderConcept.initializeFolder({ user: user1 })) as {
        folder: Folder;
      };
    const { folder: user2RootId } =
      (await folderConcept.initializeFolder({ user: user2 })) as {
        folder: Folder;
      };

    const result = await folderConcept.moveFolder({
      folder: user1RootId,
      newParent: user2RootId,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: moveFolder fails if moving into itself", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;

    const result = await folderConcept.moveFolder({
      folder: rootId,
      newParent: rootId,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: moveFolder fails if moving into a descendant", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChildResult = await folderConcept.createFolder({
      user,
      title: "Child",
      parent: rootId,
    });
    assertNotEquals("error" in createChildResult, true);
    const childId = (createChildResult as { folder: ID }).folder as Folder;
    const createGrandChildResult = await folderConcept.createFolder({
      user,
      title: "Grandchild",
      parent: childId,
    });
    assertNotEquals("error" in createGrandChildResult, true);
    const grandChildId = (createGrandChildResult as { folder: ID })
      .folder as Folder;

    const result = await folderConcept.moveFolder({
      folder: childId,
      newParent: grandChildId,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Action Test: deleteItem ---
Deno.test("Action: deleteItem successfully removes an item", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    await folderConcept.insertItem({ item: itemA, folder: rootId });

    const result = await folderConcept.deleteItem({ item: itemA });
    assertNotEquals("error" in result, true);

    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assert(!rootDetails.elements.includes(itemA), "itemA should be removed");
    assertEquals(rootDetails.elements.length, 0);
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteItem fails if item not found in any folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentItem = freshID() as Item;
    const result = await folderConcept.deleteItem({ item: nonExistentItem });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Query Test: _collectDescendants (assuming it's made public for testing) ---
Deno.test("Query: _collectDescendants successfully collects all descendant folder IDs", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChild1Result = await folderConcept.createFolder({
      user,
      title: "C1",
      parent: rootId,
    });
    assertNotEquals("error" in createChild1Result, true);
    const child1Id = (createChild1Result as { folder: ID }).folder as Folder;
    const createChild2Result = await folderConcept.createFolder({
      user,
      title: "C2",
      parent: rootId,
    });
    assertNotEquals("error" in createChild2Result, true);
    const child2Id = (createChild2Result as { folder: ID }).folder as Folder;
    const createGrandchildResult = await folderConcept.createFolder({
      user,
      title: "GC1",
      parent: child1Id,
    });
    assertNotEquals("error" in createGrandchildResult, true);
    const grandchild1Id = (createGrandchildResult as { folder: ID })
      .folder as Folder;

    const folderIdsToCollect = new Set<Folder>();
    await folderConcept.collectDescendants(rootId, folderIdsToCollect);

    assertEquals(folderIdsToCollect.size, 4);
    assert(folderIdsToCollect.has(rootId));
    assert(folderIdsToCollect.has(child1Id));
    assert(folderIdsToCollect.has(child2Id));
    assert(folderIdsToCollect.has(grandchild1Id));
  } finally {
    await client.close();
  }
});

// --- Action Test: deleteFolder ---
Deno.test("Action: deleteFolder successfully deletes a folder and its descendants", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChild1Result = await folderConcept.createFolder({
      user,
      title: "C1",
      parent: rootId,
    });
    assertNotEquals("error" in createChild1Result, true);
    const child1Id = (createChild1Result as { folder: ID }).folder as Folder;
    const createChild2Result = await folderConcept.createFolder({
      user,
      title: "C2",
      parent: rootId,
    });
    assertNotEquals("error" in createChild2Result, true);
    const child2Id = (createChild2Result as { folder: ID }).folder as Folder; // sibling
    const createGrandchildResult = await folderConcept.createFolder({
      user,
      title: "GC1",
      parent: child1Id,
    });
    assertNotEquals("error" in createGrandchildResult, true);
    const grandchild1Id = (createGrandchildResult as { folder: ID })
      .folder as Folder; // child of child1

    await folderConcept.insertItem({ item: itemA, folder: child1Id });
    await folderConcept.insertItem({ item: itemB, folder: grandchild1Id });

    // Delete child1 (and its descendant grandchild1 and their items)
    const result = await folderConcept.deleteFolder(child1Id);
    assertNotEquals("error" in result, true);

    const child1Check = await folderConcept._getFolderDetails({
      folderId: child1Id,
    });
    assertEquals("error" in child1Check, true, "child1 should be deleted");
    const grandchild1Check = await folderConcept._getFolderDetails({
      folderId: grandchild1Id,
    });
    assertEquals(
      "error" in grandchild1Check,
      true,
      "grandchild1 should be deleted",
    );

    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({
        folderId: rootId,
      }),
    );
    assert(
      !rootDetails.folders.includes(child1Id),
      "root should not contain child1",
    );
    assertEquals(rootDetails.folders.length, 1); // Only child2 should remain
    assertArrayIncludes(rootDetails.folders, [child2Id]);

    // Ensure items are actually gone
    const itemAFind = await db.collection("items").findOne({ _id: itemA });
    assertEquals(itemAFind, null, "itemA should be deleted from the database");
    const itemBFind = await db.collection("items").findOne({ _id: itemB });
    assertEquals(itemBFind, null, "itemB should be deleted from the database");
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteFolder fails if folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept.deleteFolder(nonExistentFolder);
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteFolder successfully deletes another user's root folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const { folder: userRootId } =
      (await folderConcept.initializeFolder({ user })) as { folder: Folder };

    const result = await folderConcept.deleteFolder(userRootId);
    assertNotEquals("error" in result, true);

    const userRootCheck = await folderConcept._getFolderDetails({
      folderId: userRootId,
    });
    assertEquals(
      "error" in userRootCheck,
      true,
      "User's root folder should be deleted",
    );
  } finally {
    await client.close();
  }
});

// --- Query Test: _getFolderDetails ---
Deno.test("Query: _getFolderDetails successfully retrieves folder details", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const user = freshID() as User;
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user }),
    );
    const rootId = initializeResult.folder as Folder;
    const createChildResult = await folderConcept.createFolder({
      user,
      title: "Child",
      parent: rootId,
    });
    assertNotEquals("error" in createChildResult, true);
    const childId = (createChildResult as { folder: ID }).folder as Folder;
    await folderConcept.insertItem({ item: itemA, folder: rootId });

    const details = await folderConcept._getFolderDetails({ folderId: rootId });
    if ("error" in details) {
      throw new Error(
        `_getFolderDetails failed: ${(details as { error: string }).error}`,
      );
    }
    assertEquals(details.owner, user);
    assertEquals(details.title, "Root");
    assertEquals(details.folders.length, 1);
    assertArrayIncludes(details.folders, [childId]);
    assertEquals(details.elements.length, 1);
    assertArrayIncludes(details.elements, [itemA]);
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFolderDetails fails if folder not found", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    const nonExistentFolder = freshID() as Folder;
    const result = await folderConcept._getFolderDetails({
      folderId: nonExistentFolder,
    });
    assertEquals("error" in result, true);
    // Just check that an error occurred, don't check the specific message
  } finally {
    await client.close();
  }
});

// --- Interesting Scenarios ---
Deno.test("Interesting Scenario 1: Complex folder hierarchy with nested operations", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    console.log("\n🔗 SCENARIO 1: Complex Hierarchy Operations");
    console.log("=".repeat(50));

    let rootId: Folder;
    let level1Id: Folder;
    let level2Id: Folder;
    let level3Id: Folder;

    // 1. Create deep nested hierarchy
    console.log("\n📁 Step 1: Creating deep nested hierarchy");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user: userA }),
    );
    rootId = initializeResult.folder as Folder;

    const level1Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 1",
        parent: rootId,
      }),
    );
    level1Id = level1Result.folder as Folder;

    const level2Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 2",
        parent: level1Id,
      }),
    );
    level2Id = level2Result.folder as Folder;

    const level3Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 3",
        parent: level2Id,
      }),
    );
    level3Id = level3Result.folder as Folder;
    console.log("   ✅ Deep hierarchy created (4 levels: root → L1 → L2 → L3)");

    // 2. Add items at different levels
    console.log("\n📦 Step 2: Adding items at different levels");
    const insertItem1Result = await folderConcept.insertItem({
      item: itemA,
      folder: rootId,
    });
    assertNotEquals(
      "error" in insertItem1Result,
      true,
      "Inserting itemA should succeed",
    );

    const insertItem2Result = await folderConcept.insertItem({
      item: itemB,
      folder: level2Id,
    });
    assertNotEquals(
      "error" in insertItem2Result,
      true,
      "Inserting itemB should succeed",
    );
    console.log("   ✅ Items added: itemA (root), itemB (level2)");

    // 3. Move item between levels
    console.log("\n🔄 Step 3: Moving item between levels");
    const moveResult = await folderConcept.insertItem({
      item: itemA,
      folder: level3Id,
    });
    assertNotEquals("error" in moveResult, true, "Moving itemA should succeed");
    console.log("   ✅ ItemA moved: root → level3 (deepest level)");

    // 4. Verify hierarchy integrity
    console.log("\n🔍 Step 4: Verifying hierarchy integrity");
    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    const level3Details = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: level3Id }),
    );

    assertEquals(
      rootDetails.elements.length,
      0,
      "Root should have no items after move",
    );
    assertEquals(
      level3Details.elements.length,
      1,
      "Level 3 should have moved item",
    );
    assertEquals(
      level3Details.elements[0],
      itemA,
      "Moved item should be in level 3",
    );
    console.log("   ✅ Hierarchy integrity verified");
    console.log("   📊 Final state: root(0 items), level3(1 item: itemA)");

    console.log("\n🎉 SCENARIO 1 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 2: Duplicate folder titles, and moving to non-existent folder", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    console.log("\n⚠️  SCENARIO 2: Error Recovery and Edge Cases");
    console.log("=".repeat(50));

    let rootId: Folder;
    let childId: Folder;

    // 1. Initialize and create basic structure
    console.log("\n🏗️  Step 1: Setting up basic structure");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user: userA }),
    );
    rootId = initializeResult.folder as Folder;

    const childResult = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child Folder",
        parent: rootId,
      }),
    );
    childId = childResult.folder as Folder;
    console.log("   ✅ Basic structure created: root + child folder");

    // 2. Try to create folder with duplicate title (should work)
    console.log("\n📋 Step 2: Testing duplicate title creation");
    const duplicateResult = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child Folder", // Same title
        parent: rootId,
      }),
    );
    console.log(
      "   ✅ Duplicate title creation succeeded (titles can be duplicated)",
    );

    // 3. Add a new item (should succeed)
    console.log("\n📦 Step 3: Testing item addition");
    const newItem = freshID() as Item;
    const addItemResult = await folderConcept.insertItem({
      item: newItem,
      folder: rootId,
    });
    assertNotEquals(
      "error" in addItemResult,
      true,
      "Adding new item should succeed",
    );
    console.log("   ✅ New item added successfully");

    // 4. Try to move item to non-existent folder (should fail)
    console.log("\n🔄 Step 4: Testing move to non-existent folder");
    const nonExistentFolder = freshID() as Folder;
    const moveToNonExistentResult = await folderConcept.insertItem({
      item: itemA,
      folder: nonExistentFolder,
    });
    assertEquals(
      "error" in moveToNonExistentResult,
      true,
      "Moving to non-existent folder should fail",
    );
    console.log("   ✅ Move to non-existent folder correctly rejected");

    // 5. Recover by adding valid item
    console.log("\n🔄 Step 5: Recovering with valid operations");
    const validAddResult = await folderConcept.insertItem({
      item: itemA,
      folder: rootId,
    });
    assertNotEquals(
      "error" in validAddResult,
      true,
      "Valid item addition should succeed",
    );
    console.log("   ✅ Valid item addition succeeded after errors");

    console.log("\n🎉 SCENARIO 2 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 3: Circular reference prevention and hierarchy validation", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    console.log("\n🔄 SCENARIO 3: Circular Reference Prevention");
    console.log("=".repeat(50));

    let rootId: Folder;
    let level1Id: Folder;
    let level2Id: Folder;
    let level3Id: Folder;

    // 1. Create a deep hierarchy
    console.log("\n🏗️  Step 1: Creating deep folder hierarchy");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user: userA }),
    );
    rootId = initializeResult.folder as Folder;

    const level1Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 1",
        parent: rootId,
      }),
    );
    level1Id = level1Result.folder as Folder;

    const level2Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 2",
        parent: level1Id,
      }),
    );
    level2Id = level2Result.folder as Folder;

    const level3Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Level 3",
        parent: level2Id,
      }),
    );
    level3Id = level3Result.folder as Folder;
    console.log("   ✅ Deep hierarchy created: root → L1 → L2 → L3");

    // 2. Test moving folder to be its own descendant (should fail)
    console.log("\n🔄 Step 2: Testing self-descendant prevention");
    const selfDescendantResult = await folderConcept.moveFolder({
      folder: rootId,
      newParent: level3Id, // This would make root a descendant of level3
    });

    // This should fail because it would create a circular reference
    assertEquals(
      "error" in selfDescendantResult,
      true,
      "Moving folder to be its own descendant should fail",
    );
    console.log("   ✅ Self-descendant move correctly blocked");

    // 3. Test moving folder to be its own child (should fail)
    console.log("\n🔄 Step 3: Testing direct circular reference");
    const circularResult = await folderConcept.moveFolder({
      folder: level1Id,
      newParent: level1Id, // This would make level1 a child of itself
    });

    // This should also fail
    assertEquals(
      "error" in circularResult,
      true,
      "Moving folder to be its own child should fail",
    );
    console.log("   ✅ Direct circular reference correctly blocked");

    // 4. Test valid folder creation (should succeed)
    console.log("\n✅ Step 4: Testing valid folder creation");
    const validResult = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Valid Sibling",
        parent: level2Id, // This is valid - sibling of level3
      }),
    );
    console.log("   ✅ Valid folder creation succeeded");

    // 5. Test hierarchy integrity after failed attempts
    console.log("\n🔍 Step 5: Verifying hierarchy integrity");
    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    const level2Details = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: level2Id }),
    );

    // Root should still have only level1 as child
    assertEquals(rootDetails.folders.length, 1, "Root should have 1 child");
    assertEquals(
      rootDetails.folders[0],
      level1Id,
      "Root's child should be level1",
    );

    // Level2 should have level3 and the new valid sibling
    assertEquals(
      level2Details.folders.length,
      2,
      "Level2 should have 2 children",
    );
    console.log(
      "   ✅ Hierarchy integrity maintained after failed circular attempts",
    );

    // 6. Test complex circular reference scenarios
    console.log("\n🔄 Step 6: Testing complex circular scenarios");

    // Try to move level2 to be a descendant of level3 (should fail)
    const complexCircularResult = await folderConcept.moveFolder({
      folder: level2Id,
      newParent: level3Id, // This would make level2 a descendant of level3
    });

    assertEquals(
      "error" in complexCircularResult,
      true,
      "Complex circular reference should be prevented",
    );
    console.log("   ✅ Complex circular reference correctly blocked");

    console.log(
      "   📊 Final state: Clean hierarchy maintained, no circular references",
    );
    console.log("\n🎉 SCENARIO 3 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 4: Order of deletion of folders and items", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    console.log("\n🗑️  SCENARIO 4: Folder Deletion and Cleanup");
    console.log("=".repeat(50));

    let rootId: Folder;
    let child1Id: Folder;
    let child2Id: Folder;
    let grandchildId: Folder;

    // 1. Create complex structure
    console.log("\n🏗️  Step 1: Creating complex folder structure");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user: userA }),
    );
    rootId = initializeResult.folder as Folder;

    const child1Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child 1",
        parent: rootId,
      }),
    );
    child1Id = child1Result.folder as Folder;

    const child2Result = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Child 2",
        parent: rootId,
      }),
    );
    child2Id = child2Result.folder as Folder;

    const grandchildResult = assertFolderResult(
      await folderConcept.createFolder({
        user: userA,
        title: "Grandchild",
        parent: child1Id,
      }),
    );
    grandchildId = grandchildResult.folder as Folder;
    console.log(
      "   ✅ Complex structure created: root → [child1, child2], child1 → [grandchild]",
    );

    // 2. Add items to different folders
    console.log("\n📦 Step 2: Adding items to different folders");
    const insertItem1Result = await folderConcept.insertItem({
      item: itemA,
      folder: child1Id,
    });
    assertNotEquals(
      "error" in insertItem1Result,
      true,
      "Inserting itemA should succeed",
    );

    const insertItem2Result = await folderConcept.insertItem({
      item: itemB,
      folder: grandchildId,
    });
    assertNotEquals(
      "error" in insertItem2Result,
      true,
      "Inserting itemB should succeed",
    );
    console.log("   ✅ Items added: itemA (child1), itemB (grandchild)");

    // 3. Delete folder with children (should succeed and return deleted items)
    console.log("\n🗑️  Step 3: Testing deletion of folder with children");
    const deleteWithChildrenResult = await folderConcept.deleteFolder(child1Id);
    assertNotEquals(
      "error" in deleteWithChildrenResult,
      true,
      "Deleting folder with children should succeed",
    );

    // Check if the result contains information about deleted items
    if ("deletedItems" in deleteWithChildrenResult) {
      const deletedItems = (deleteWithChildrenResult as any).deletedItems;
      console.log(
        `   ✅ Folder deleted with ${deletedItems.length} items removed`,
      );
      console.log(`   📋 Deleted items: ${deletedItems.join(", ")}`);
    } else {
      console.log("   ✅ Folder deleted (no deleted items info returned)");
    }

    // 4. Verify the grandchild folder was also deleted
    console.log("\n🔍 Step 4: Verifying grandchild folder was deleted");
    const grandchildCheckResult = await folderConcept._getFolderDetails({
      folderId: grandchildId,
    });
    assertEquals(
      "error" in grandchildCheckResult,
      true,
      "Grandchild folder should no longer exist",
    );
    console.log("   ✅ Grandchild folder correctly deleted as part of cascade");

    // 5. Verify remaining structure
    console.log("\n🔍 Step 5: Verifying remaining structure");
    const rootDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertEquals(rootDetails.folders.length, 1, "Only one child should remain");
    assertEquals(rootDetails.folders[0], child2Id, "Child 2 should remain");
    console.log("   ✅ Remaining structure verified");
    console.log(
      "   📊 Final state: root → [child2] (child1 and grandchild deleted)",
    );

    // 6. Test deleting root folder (should delete everything)
    console.log("\n🗑️  Step 6: Testing root folder deletion");
    const deleteRootResult = await folderConcept.deleteFolder(rootId);
    assertNotEquals(
      "error" in deleteRootResult,
      true,
      "Deleting root folder should succeed",
    );

    if ("deletedItems" in deleteRootResult) {
      const deletedItems = (deleteRootResult as any).deletedItems;
      console.log(
        `   ✅ Root folder deleted with ${deletedItems.length} items removed`,
      );
    } else {
      console.log("   ✅ Root folder deleted");
    }

    // Verify root no longer exists
    const rootCheckResult = await folderConcept._getFolderDetails({
      folderId: rootId,
    });
    assertEquals(
      "error" in rootCheckResult,
      true,
      "Root folder should no longer exist",
    );
    console.log("   ✅ Root folder correctly deleted");

    console.log("\n🎉 SCENARIO 4 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 5: Rapid operations and concurrency", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  try {
    console.log("\n⚡ SCENARIO 5: Rapid Operations and Concurrency");
    console.log("=".repeat(50));

    let rootId: Folder;

    // 1. Initialize root
    console.log("\n🏗️  Step 1: Initializing root folder");
    const initializeResult = assertFolderResult(
      await folderConcept.initializeFolder({ user: userA }),
    );
    rootId = initializeResult.folder as Folder;
    console.log("   ✅ Root initialized");

    // 2. Rapid folder creation
    console.log("\n⚡ Step 2: Creating multiple folders rapidly");
    const folderPromises = [];
    for (let i = 0; i < 5; i++) {
      folderPromises.push(
        folderConcept.createFolder({
          user: userA,
          title: `Rapid Folder ${i}`,
          parent: rootId,
        }),
      );
    }

    const folderResults = await Promise.all(folderPromises);
    for (const result of folderResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid folder creations should succeed",
      );
    }
    console.log("   ✅ All 5 rapid folder creations succeeded");

    // 3. Rapid item additions
    console.log("\n📦 Step 3: Adding items rapidly");
    const itemPromises = [];
    for (let i = 0; i < 3; i++) {
      itemPromises.push(
        folderConcept.insertItem({
          item: freshID() as Item,
          folder: rootId,
        }),
      );
    }

    const itemResults = await Promise.all(itemPromises);
    for (const result of itemResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid item additions should succeed",
      );
    }
    console.log("   ✅ All 3 rapid item additions succeeded");

    // 4. Verify final state
    console.log("\n🔍 Step 4: Verifying final state after rapid operations");
    const finalDetails = assertFolderStructure(
      await folderConcept._getFolderDetails({ folderId: rootId }),
    );
    assertEquals(finalDetails.folders.length, 5, "Should have 5 folders");
    assertEquals(finalDetails.elements.length, 3, "Should have 3 items");
    console.log("   ✅ Final state verified: 5 folders + 3 items in root");

    // 5. Rapid item operations
    console.log("\n⚡ Step 5: Performing rapid item operations");
    const updatePromises = [];
    for (let i = 0; i < 3; i++) {
      updatePromises.push(
        folderConcept.insertItem({
          item: freshID() as Item,
          folder: finalDetails.folders[i],
        }),
      );
    }

    const updateResults = await Promise.all(updatePromises);
    for (const result of updateResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid item insertions should succeed",
      );
    }
    console.log("   ✅ All 3 rapid item operations succeeded");
    console.log(
      "   📊 Final state: 5 folders + 6 items total (3 in root, 3 in folders)",
    );

    console.log("\n🎉 SCENARIO 5 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});
