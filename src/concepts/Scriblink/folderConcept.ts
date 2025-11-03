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
  title: string;
  owner: User;
  folders: Folder[];
  elements: Item[];
}

/**
 * @concept Folder
 * @purpose To organize items hierarchically
 */
export default class FolderConcept {
  folders: Collection<FolderStructure>;

  constructor(private readonly db: Db) {
    this.folders = this.db.collection(PREFIX + "folders");
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
   * Internal helper: Get folder details by ID
   */
  async _getFolderDetails(
    { folderId }: { folderId: Folder },
  ): Promise<FolderStructure | { error: string }> {
    const folder = await this.folders.findOne({ _id: folderId });
    if (!folder) {
      return { error: `Folder with ID ${folderId} not found.` };
    }
    return folder;
  }

  /**
   * Helper function to check if targetId is a hierarchical descendant of ancestorId.
   * This prevents moving a folder into its own subfolder (which would create a cycle).
   */
  async isDescendant(
    targetId: Folder,
    ancestorId: Folder,
  ): Promise<boolean> {
    const queue: Folder[] = [ancestorId];
    const visited: Set<Folder> = new Set(); // Track visited folders to prevent infinite loops in cycles
    let iterationCount = 0;

    while (queue.length > 0) {
      iterationCount++;
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
      const isDirectChild = folderDoc.folders.includes(targetId);

      if (isDirectChild) {
        return true;
      }

      // Add all children of currentId to the queue to check their descendants
      const newChildren = folderDoc.folders.filter((childId) =>
        !visited.has(childId)
      );

      for (const childId of newChildren) {
        queue.push(childId);
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
    const isDescendantResult = await this.isDescendant(f2Id, f1Id);
    if (isDescendantResult) {
      return {
        error:
          `Cannot move folder ${f1Id} into its own descendant folder ${f2Id}.`,
      };
    }

    // CRITICAL: Ensure single-parent invariant
    console.log(
      "🔄 [FolderConcept.moveFolder] Starting move operation - Step 1: Remove from all current parents",
    );
    // Step 1: Remove f1 from ALL current parents (including any duplicates)
    const removeResult = await this.folders.updateMany(
      { folders: f1Id },
      { $pull: { folders: f1Id } },
    );

    console.log("✅ [FolderConcept.moveFolder] Step 1 complete:", {
      removedFromParents: removeResult.modifiedCount,
      matchedParents: removeResult.matchedCount,
    });

    // Step 2: Add f1 to the new parent ONLY
    console.log("🔄 [FolderConcept.moveFolder] Step 2: Adding to new parent");
    const addResult = await this.folders.updateOne(
      { _id: f2Id },
      { $addToSet: { folders: f1Id } },
    );

    console.log("✅ [FolderConcept.moveFolder] Step 2 complete:", {
      addedToParent: addResult.modifiedCount,
      matchedParent: addResult.matchedCount,
    });

    // Step 3: Final safety check - remove from any remaining parents
    console.log(
      "🔄 [FolderConcept.moveFolder] Step 3: Safety check - removing from any remaining parents",
    );
    const safetyResult = await this.folders.updateMany(
      { folders: f1Id, _id: { $ne: f2Id } },
      { $pull: { folders: f1Id } },
    );

    if (safetyResult.modifiedCount > 0) {
      console.log("⚠️ [FolderConcept.moveFolder] Safety cleanup performed:", {
        additionalParentsRemoved: safetyResult.modifiedCount,
      });
    }

    // Final verification: Check that the move was successful
    console.log(
      "🔍 [FolderConcept.moveFolder] Final verification - checking folder structure",
    );
    const finalF1 = await this.folders.findOne({ _id: f1Id });
    const finalF2 = await this.folders.findOne({ _id: f2Id });

    console.log("🔍 [FolderConcept.moveFolder] Final state:", {
      movedFolder: finalF1
        ? {
          _id: finalF1._id,
          title: finalF1.title,
          folders: finalF1.folders,
          elements: finalF1.elements,
        }
        : null,
      parentFolder: finalF2
        ? {
          _id: finalF2._id,
          title: finalF2.title,
          folders: finalF2.folders,
          elements: finalF2.elements,
        }
        : null,
      isInParent: finalF2 ? finalF2.folders.includes(f1Id) : false,
    });

    console.log(
      "✅ [FolderConcept.moveFolder] Move operation completed successfully",
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

  /**
   * Helper function to collect all descendants of a given folder.
   * @param f The ID of the folder to collect descendants from.
   * @param folderIdsToDelete The set of folder IDs to collect descendants into.
   * @effects Collects all descendants of the given folder and adds them to the set.
   */
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
  ): Promise<Item[] | { error: string }> {
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
      return Array.from(folderIdsToDelete).map((id) => id as Item);
    }
    return { error: `Failed to delete folder ${f} or its contents.` };
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
   * Query: Retrieves the root folder ID for a given user.
   * @param user The user to get the root folder for.
   * @returns `Folder` ID if found or created, otherwise an error.
   */
  async _getRootFolderId(
    { user }: { user: User },
  ): Promise<{ rootFolder: Folder } | { error: string }> {
    console.log(
      "🔍 [FolderConcept._getRootFolderId] Getting root folder for user:",
      user,
    );
    // First, try to find existing folders for this user
    const existingFolders = await this.folders.find({ owner: user })
      .toArray();

    if (existingFolders.length > 0) {
      // Find folder titled "Root" or use the first folder
      const rootFolder = existingFolders.find((folder) =>
        folder.title === "Root"
      ) || existingFolders[0];
      return { rootFolder: rootFolder._id };
    } else {
      // No folders exist, create root folder
      const folderResult = await this.initializeFolder({ user });
      if ("error" in folderResult) {
        return {
          error: `Failed to initialize root folder: ${folderResult.error}`,
        };
      }
      return { rootFolder: folderResult.folder };
    }
  }
}
