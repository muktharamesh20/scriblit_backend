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
} from "../Scriblink/folder.ts"; // Adjust path as necessary for your project
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
Deno.test("Principle: User initializes root, creates hierarchy, manages items, and deletes folders", async () => {
  const [db, client] = await testDb();
  const folderConcept = new FolderConcept(db);

  let rootId: Folder;
  let child1Id: Folder;
  let child2Id: Folder;
  let grandchild1Id: Folder;

  try {
    // 1. User A initializes a root folder
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

    // 2. User A creates child folders
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

    // 3. User A creates a grandchild folder
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

    // 4. User A inserts items into folders
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

    // 5. User A moves an item (itemA from root to child1)
    const moveItemAResult = await folderConcept.insertItem({
      item: itemA,
      folder: child1Id,
    }); // insertItem handles moves
    assertNotEquals("error" in moveItemAResult, true);

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

    // 6. User A moves a folder (child2 from root to child1)
    // Initial: root -> [child1, child2], child1 -> [grandchild1]
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

    // 7. User A deletes an item (itemB from child1)
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

    // 8. User A deletes a folder (child1, which should also delete grandchild1 and child2)
    // Current hierarchy: root -> [child1], child1 -> [grandchild1, child2]
    // Items: itemA in child1
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

    // Verify items are actually gone from the database
    const itemAFind = await db.collection("items").findOne({ _id: itemA });
    assertEquals(itemAFind, null, "itemA should be deleted from the database");
    const itemBFind = await db.collection("items").findOne({ _id: itemB });
    assertEquals(itemBFind, null, "itemB should be deleted from the database");
  } finally {
    await client.close();
  }
});

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
    assertEquals(
      (failureResult as { error: string }).error,
      "user has already created folders",
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Parent folder with ID ${nonExistentFolder} not found.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Parent folder with ID ${user2RootId} is not owned by the user.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Folder with ID ${nonExistentFolder} not found.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Folder with ID ${nonExistentFolder} not found.`,
    );
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
    assertEquals(
      (result1 as { error: string }).error,
      `Folder with ID ${nonExistentFolder} not found.`,
    );

    const result2 = await folderConcept.moveFolder({
      folder: rootId,
      newParent: nonExistentParent,
    });
    assertEquals("error" in result2, true);
    assertEquals(
      (result2 as { error: string }).error,
      `New parent folder with ID ${nonExistentParent} not found.`,
    );
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
    assert(
      (result as { error: string }).error?.startsWith(
        "Folders must have the same owner",
      ),
      "Error message for different owners mismatch",
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Cannot move a folder into itself.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Cannot move folder ${childId} into its own descendant folder ${grandChildId}.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Item with ID ${nonExistentItem} not found in any folder.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Folder with ID ${nonExistentFolder} not found.`,
    );
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
    assertEquals(
      (result as { error: string }).error,
      `Folder with ID ${nonExistentFolder} not found.`,
    );
  } finally {
    await client.close();
  }
});
