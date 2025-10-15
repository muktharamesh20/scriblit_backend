---
timestamp: 'Wed Oct 15 2025 16:13:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_161348.ac09aef8.md]]'
content_id: 649adee636a32606f286fe05ee7488c0701fe7a46b80bf01886bc6ad6d11312d
---

# file: src/concepts/Scriblink/folder.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Folder" + ".";

// Generic types for the concept's external dependencies
export type User = ID;
export type Item = ID;

// Internal entity types, represented as IDs
export type Folder = ID;

/**
 * State: A set of Folders with an owner, title, contained set of Folders, and elements set of Items.
 */
export interface FolderStructure {
  _id: Folder;
  owner: User;
  title: string;
  folders: Folder[];
  elements: Item[];
}

/**
 * @concept Folder
 * @purpose To organize items hierarchically
 */
export default class FolderConcept {
  folders: Collection<FolderStructure>;
  elements: Collection<Item>;

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
      { $push: { folders: folderId } }, // Use $push to add the child ID to the parent's list
    );

    return { folder: folderId };
  }

  /**
   * Helper function to check if targetId is a hierarchical descendant of ancestorId.
   * This prevents moving a folder into its own subfolder (which would create a cycle).
   */
  private async isDescendant(
    targetId: Folder,
    ancestorId: Folder,
  ): Promise<boolean> {
    const queue: Folder[] = [ancestorId];
    const visited: Set<Folder> = new Set(); // Track visited folders to prevent infinite loops in cycles

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      // Skip if already visited or if current is the target itself (handled by earlier checks)
      if (visited.has(currentId) || currentId === targetId) {
        continue;
      }
      visited.add(currentId);

      const folderDoc = await this.folders.findOne({ _id: currentId });
      if (!folderDoc) {
        // Data inconsistency: A folder ID in a parent's 'folders' array doesn't exist as a document.
        console.warn(
          `Folder ID ${currentId} found in hierarchy but document missing.`,
        );
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
   * @requires f2 is not hierarchically a descendant of f1. Both folders must have the same owner.
   * @effects If f1 is already in a folder, it is removed from that folder and moved into f2.
   *          If f1 is a new folder (not currently linked to any parent), it is just added to f2.
   */
  async moveFolder(
    { folder: f1Id, newParent: f2Id }: { folder: Folder; newParent: Folder },
  ): Promise<{ folder: Folder } | { error: string }> {
    const f1 = await this.folders.findOne({ _id: f1Id });
    const f2 = await this.folders.findOne({ _id: f2Id });

    if (!f1) {
      return { error: `Folder with ID ${f1Id} not found.` };
    }
    if (!f2) {
      return { error: `New parent folder with ID ${f2Id} not found.` };
    }

    // Requirement: Both folders must have the same owner.
    if (f1.owner !== f2.owner) {
      return {
        error:
          `Folders must have the same owner to be moved. Folder ${f1Id} owner: ${f1.owner}, New parent ${f2Id} owner: ${f2.owner}`,
      };
    }

    // Requirement: f2 is not hierarchically a descendant of f1.
    // Also, a folder cannot be moved into itself.
    if (f1Id === f2Id) {
      return { error: `Cannot move a folder into itself.` };
    }
    if (await this.isDescendant(f2Id, f1Id)) {
      return {
        error:
          `Cannot move folder ${f1Id} into its own descendant folder ${f2Id}.`,
      };
    }

    // Effect: If f1 is already in a folder, remove it from that folder.
    // We find any folder whose 'folders' array contains f1Id (and is not f1 itself)
    // and remove f1Id from its children.
    await this.folders.updateOne(
      { folders: f1Id, _id: { $ne: f1Id } }, // Query for the current parent of f1
      { $pull: { folders: f1Id } }, // Remove f1Id from its 'folders' array
    );
    // If f1 was a root folder or not linked to any parent, this operation will simply affect 0 documents, which is correct.

    // Effect: Move it into f2 (add f1Id to f2's 'folders' array).
    // Use $addToSet to ensure f1Id is added only once (prevents duplicates).
    await this.folders.updateOne(
      { _id: f2Id },
      { $addToSet: { folders: f1Id } },
    );

    return { folder: f1Id };
  }

  async insertItem(
    { item, folder }: { item: Item; folder: Folder },
  ): Promise<Empty | { error: string }> {
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
        return {};
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
      return {};
    } else {
      // This implies either the folder was not found (already checked) or $addToSet did nothing
      // because the item was already present (which would have been caught by oldParentFolder check
      // unless concurrency issues, or if the item was already in the target folder without being removed from an old one
      // which the $addToSet handles by doing nothing).
      // Given the prior checks, a modifiedCount of 0 here is unlikely unless another operation interfered.
      return {
        error:
          `Failed to insert item ${item} into folder ${folder}. Item might already be present.`,
      };
    }
  }

  async collectDescendants(
    f: Folder,
    folderIdsToDelete: Set<Folder>,
  ): Promise<void> {
    const folderDoc = await this.folders.findOne({ _id: f });
    if (!folderDoc) {
      return;
    }
    folderIdsToDelete.add(f);
    for (const childId of folderDoc.folders) {
      await this.collectDescendants(childId, folderIdsToDelete);
    }
  }

  /**
   * Action: Deletes a folder and all its contents (subfolders and their contents).
   * @param f The ID of the folder to delete.
   * @effects Deletes the specified folder, all its child folders, and all items contained within them.
   */
  async deleteFolder(
    f: Folder,
  ): Promise<Empty | { error: string }> {
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
      { $pull: { folders: f } }, // Remove 'f' from its parent's 'folders' array
    );

    // Delete all collected folders (f and its descendants) in one go
    const deleteResult = await this.folders.deleteMany({
      _id: { $in: Array.from(folderIdsToDelete) },
    });

    if (deleteResult.deletedCount > 0) {
      return {};
    } else {
      // This might happen if 'f' itself was the only one and it failed deletion,
      // or if it was a root folder with no children and the update for parent failed because no parent.
      // However, if collectDescendants found it, it should be deleted.
      return {
        error:
          `Failed to delete folder ${f} or its contents. No documents were deleted.`,
      };
    }
  }

  /**
   * Action: Deletes an item from the folder hierarchy.
   * It finds the folder containing the item and removes the item from that folder.
   * @param item The ID of the item to delete.
   * @effects Removes the item from whichever folder it is currently located in.
   */
  async deleteItem(
    { item }: { item: Item },
  ): Promise<Empty | { error: string }> {
    // Find the folder that contains this item
    const containingFolder = await this.folders.findOne({ elements: item });

    if (!containingFolder) {
      return { error: `Item with ID ${item} not found in any folder.` };
    }

    // Remove the item from its containing folder's elements array
    const deleteResult = await this.folders.updateOne(
      { _id: containingFolder._id },
      { $pull: { elements: item } },
    );

    if (deleteResult.modifiedCount === 1) {
      return {};
    } else {
      // This could happen if, for example, the item was removed by another process
      // between the findOne and updateOne calls, or if the update failed for another reason.
      return {
        error:
          `Failed to delete item ${item} from folder ${containingFolder._id}.`,
      };
    }
  }

  /**
   * Query: Retrieves all children of a given folder ID.
   * @param folderId The ID of the folder to retrieve.
   * @returns `Folder[]` object if found, otherwise `null`.
   */
  async _getFolderChildren(
    { folderId }: { folderId: Folder },
  ): Promise<Folder[] | { error: string }> {
    const folder = await this._getFolderDetails({ folderId });
    if ("error" in folder) {
      return { error: folder.error };
    }
    return folder.folders ?? [];
  }

  /**
   * Query: Retrieves all items of a given folder ID.
   * @param folderId The ID of the folder to retrieve.
   * @returns `Item[]` object if found, otherwise `[]`.
   */
  async _getFolderItems(
    { folderId }: { folderId: Folder },
  ): Promise<Item[] | { error: string }> {
    const folder = await this._getFolderDetails({ folderId });
    if ("error" in folder) {
      return { error: folder.error };
    }
    return folder.elements ?? [];
  }

  /**
   * Retrieves all stored details for a given folder ID.
   * @param folderId The ID of the folder to retrieve.
   * @returns `FolderStructure` object if found, otherwise `null`.
   */
  async _getFolderDetails(
    { folderId }: { folderId: Folder },
  ): Promise<FolderStructure | { error: string }> {
    try {
      const folder = await this.folders.findOne({ _id: folderId });
      return folder ?? { error: `Folder with ID ${folderId} not found.` };
    } catch (e: any) {
      console.error(`Error getting folder details for ${folderId}:`, e);
      return {
        error: `Error getting folder details for ${folderId}: ${e.message}`,
      };
    }
  }
}

```
