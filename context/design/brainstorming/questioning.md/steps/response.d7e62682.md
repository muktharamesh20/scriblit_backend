---
timestamp: 'Wed Oct 15 2025 00:28:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_002842.e45437c6.md]]'
content_id: d7e626822f5661272a231e6b3a36ae36b83df8ba52a0d142b59b566abb34535f
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Scriblink" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Item = ID;

// Internal entity types, represented as IDs
type Folder = ID;

/**
 * State: A set of Folders with an owner, title, contained set of Folders, and elements set of Items.
 */
interface FolderStructure {
  _id: Folder;
  owner: User;
  title: string;
  folders: Folder[]; // IDs of child folders
  elements: Item[];  // IDs of contained items
}

/**
 * @concept Folder
 * @purpose To organize items hierarchically
 */
export default class LikertSurveyConcept { // Note: Class name 'LikertSurveyConcept' seems inconsistent with 'Folder' concept.
  folders: Collection<FolderStructure>;
  elements: Collection<Item>; // This collection is not used in the Folder concept logic as described.

  constructor(private readonly db: Db) {
    this.folders = this.db.collection(PREFIX + "folders");
    this.elements = this.db.collection(PREFIX + "elements");
  }

  /**
   * Action: Creates the initial root folder for a user.
   * @requires user has not created any other folders
   * @effects A new root folder associated with the user is created and its ID is returned.
   */
  async initializeFolder(
    { user }: {
      user: User;
    },
  ): Promise<{ folder: Folder } | { error: string }> {
    if (await this.folders.findOne({ owner: user })) {
      return { error: "user has already created folders" };
    }

    const folderId = freshID() as Folder;

    await this.folders.insertOne({
      _id: folderId,
      owner: user,
      title: "Root",
      folders: [],
      elements: [],
    });
    return { folder: folderId };
  }

  /**
   * Action: Creates a new folder as a child of an existing parent folder.
   * @requires parent exists and has owner u
   * @effects A new folder with the given title is created as a child of the parent.
   */
  async createFolder(
    { user, title, parent }: { user: User; title: string; parent: Folder },
  ): Promise<{ folder: Folder } | { error: string }> {
    const existingParent = await this.folders.findOne({ _id: parent });
    if (!existingParent) {
      return { error: `Parent folder with ID ${parent} not found.` };
    }
    if (existingParent.owner !== user) {
      return {
        error: `Parent folder with ID ${parent} is not owned by the user.`,
      };
    }
    const folderId = freshID() as Folder;

    // Create the new folder document itself with no children or elements initially
    await this.folders.insertOne({
      _id: folderId,
      owner: user,
      title,
      folders: [],
      elements: [],
    });

    // Link the new folder to its parent by adding its ID to the parent's 'folders' array
    await this.folders.updateOne(
      { _id: parent },
      { $push: { folders: folderId } } // Use $push to add the child ID to the parent's list
    );

    return { folder: folderId };
  }

  /**
   * Helper function to check if targetId is a hierarchical descendant of ancestorId.
   * This prevents moving a folder into its own subfolder (which would create a cycle).
   */
  private async isDescendant(targetId: Folder, ancestorId: Folder): Promise<boolean> {
    let queue: Folder[] = [ancestorId];
    let visited: Set<Folder> = new Set(); // Track visited folders to prevent infinite loops in cycles or redundant checks

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      // If the current folder IS the target, it means targetId is directly ancestorId or an ancestor itself
      // We are looking for 'targetId' being a child of 'ancestorId' at any level
      if (currentId === targetId) {
        // This case would mean targetId is ancestorId itself.
        // The check 'f1 === f2' in moveFolder handles this directly.
        // We are interested if targetId appears deeper in the hierarchy from ancestorId.
        continue;
      }

      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const folderDoc = await this.folders.findOne({ _id: currentId });
      if (!folderDoc) {
        // Data inconsistency: A folder ID in a parent's 'folders' array doesn't exist as a document.
        console.warn(`Folder ID ${currentId} found in hierarchy but document missing.`);
        continue;
      }

      // If targetId is a direct child of currentId, then it is a descendant of ancestorId
      if (folderDoc.folders.includes(targetId)) {
        return true;
      }

      // Add all children of currentId to the queue to check their descendants
      for (const childId of folderDoc.folders) {
        if (!visited.has(childId)) { // Only add if not already processed/queued
          queue.push(childId);
        }
      }
    }
    return false;
  }

  /**
   * Action: Moves a folder (f1) into another folder (f2).
   * @requires f2 is not hierarchically a descendent of f1. Both folders must have the same owner.
   * @effects If f1 is already in a folder, remove it from that folder and move it into f2.
   *          If f1 is a new folder, just add it to f2.
   */
  async moveFolder(
    { folder: f1, newParent: f2 }: { folder: Folder; newParent: Folder },
  ): Promise<{ folder: Folder } | { error: string }> {
    // 1. Validate f1 and f2 exist
    const folder1Doc = await this.folders.findOne({ _id: f1 });
    const folder2Doc = await this.folders.findOne({ _id: f2 });

    if (!folder1Doc) {
      return { error: `Folder to move (f1) with ID ${f1} not found.` };
    }
    if (!folder2Doc) {
      return { error: `Target parent folder (f2) with ID ${f2} not found.` };
    }

    // 2. Check owner
    if (folder1Doc.owner !== folder2Doc.owner) {
      return { error: "Both folders must have the same owner to be moved." };
    }

    // 3. Check for cyclical dependency (f2 is not a descendant of f1)
    if (f1 === f2) {
      return { error: "Cannot move a folder into itself." };
    }
    if (await this.isDescendant(f2, f1)) {
      return { error: `Cannot move folder ${f1} into its own descendant ${f2}.` };
    }

    // 4. Remove f1 from its current parent (if any)
    // Find the current parent of f1. This requires searching all folders.
    const currentParentDoc = await this.folders.findOne({ folders: f1 });

    if (currentParentDoc) {
      if (currentParentDoc._id === f2) {
        // f1 is already a child of f2, no action needed.
        return { folder: f1 };
      }
      // Remove f1 from its current parent's 'folders' array
      await this.folders.updateOne(
        { _id: currentParentDoc._id },
        { $pull: { folders: f1 } }
      );
    }
    // If currentParentDoc is null, f1 is a root-level folder or not currently linked to any parent.

    // 5. Add f1 to f2's 'folders' array
    await this.folders.updateOne(
      { _id: f2 },
      { $addToSet: { folders: f1 } } // $addToSet ensures it's only added once even if somehow it was already there
    );

    return { folder: f1 };
  }

  /**
   * Helper function to recursively collect all descendant folder IDs.
   * @param folderId The ID of the current folder to process.
   * @param folderIdsToDelete A Set to accumulate all folder IDs (including the initial one) to be deleted.
   */
  private async collectDescendants(folderId: Folder, folderIdsToDelete: Set<Folder>): Promise<void> {
    const folderDoc = await this.folders.findOne({ _id: folderId });
    if (!folderDoc) {
      // Folder might have been deleted by another process or is a dangling reference, skip.
      return;
    }

    // Add the current folder to the set for deletion
    folderIdsToDelete.add(folderId);

    // Recursively process child folders
    for (const childFolderId of folderDoc.folders) {
      // Prevent infinite recursion in case of accidental cycles (though moveFolder should prevent this)
      if (!folderIdsToDelete.has(childFolderId)) {
        await this.collectDescendants(childFolderId, folderIdsToDelete);
      }
    }
    // Items are implicitly removed from the hierarchy as their containing folder is deleted.
    // Since Item is just an ID, we don't delete separate Item documents from 'this.elements' collection
    // unless the specification explicitly states so.
  }

  /**
   * Action: Deletes a folder and all its contents (subfolders and their contents).
   * @param f The ID of the folder to delete.
   * @effects Deletes the specified folder, all its child folders, and all items contained within them.
   */
  async deleteFolder(f: Folder): Promise<{ success: boolean } | { error: string }> {
    const targetFolder = await this.folders.findOne({ _id: f });
    if (!targetFolder) {
      return { error: `Folder with ID ${f} not found.` };
    }

    const folderIdsToDelete = new Set<Folder>();
    await this.collectDescendants(f, folderIdsToDelete); // Collect f and all its children/descendants

    // Before deleting the folder itself, remove its ID from its parent's 'folders' array.
    // This assumes a folder has at most one parent due to how `createFolder` and `moveFolder` link folders.
    await this.folders.updateOne(
      { folders: f }, // Find any folder that lists 'f' as a child
      { $pull: { folders: f } } // Remove 'f' from its parent's 'folders' array
    );

    // Delete all collected folders (f and its descendants) in one go
    const deleteResult = await this.folders.deleteMany({ _id: { $in: Array.from(folderIdsToDelete) } });

    if (deleteResult.deletedCount > 0) {
      return { success: true };
    } else {
      // This might happen if 'f' itself was the only one and it failed deletion,
      // or if it was a root folder with no children and the update for parent failed because no parent.
      // However, if collectDescendants found it, it should be deleted.
      return { error: `Failed to delete folder ${f} or its contents. No documents were deleted.` };
    }
  }

  /**
   * Action: Inserts an item into a specified folder.
   * @param item The ID of the item to insert.
   * @param folder The ID of the target folder.
   * @effects If the item is already in a folder, it is removed from that folder and inserted into the target folder.
   *          Otherwise, the item is simply inserted into the target folder.
   */
  async insertItem(
    { item, folder }: { item: Item; folder: Folder },
  ): Promise<{ success: boolean } | { error: string }> {
    const targetFolder = await this.folders.findOne({ _id: folder });
    if (!targetFolder) {
      return { error: `Target folder with ID ${folder} not found.` };
    }

    // 1. Find the current folder containing the item, if any.
    // We query for any folder whose 'elements' array contains the 'item' ID.
    const oldParentFolder = await this.folders.findOne({ elements: item });

    // 2. If the item is already in a folder, remove it from there.
    if (oldParentFolder) {
      // If the item is already in the target folder, no action is needed, return success.
      if (oldParentFolder._id === folder) {
        return { success: true };
      }

      // Remove the item from its old parent's 'elements' array.
      await this.folders.updateOne(
        { _id: oldParentFolder._id },
        { $pull: { elements: item } },
      );
    }

    // 3. Insert the item into the target folder.
    // Using $addToSet ensures that the item ID is unique within the folder's elements array.
    const insertResult = await this.folders.updateOne(
      { _id: folder },
      { $addToSet: { elements: item } },
    );

    if (insertResult.modifiedCount === 1) {
      return { success: true };
    } else {
      // This implies either the folder was not found (already checked) or $addToSet did nothing
      // because the item was already present (which would have been caught by oldParentFolder check
      // unless concurrency issues, or if the item was already in the target folder without being removed from an old one
      // which the $addToSet handles by doing nothing).
      // Given the prior checks, a modifiedCount of 0 here is unlikely unless another operation interfered.
      return { error: `Failed to insert item ${item} into folder ${folder}. Item might already be present.` };
    }
  }
}
```
