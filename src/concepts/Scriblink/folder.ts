// --- 1. Interfaces as defined by the concept.md ---

/**
 * Represents a reference to an item (sub-folder or file) contained within a folder.
 * This structure describes the type and ID of a child item, but not the item's full details.
 */
export interface FolderItemReference {
  /** The unique identifier of the contained item. */
  id: string;
  /** Indicates if the item is a sub-folder or a file. */
  type: "folder" | "file";
}

/**
 * Represents a Folder concept, a fundamental organizational unit in a hierarchical file system,
 * capable of containing `Files` (referred to by `FolderItemReference` with type 'file')
 * and other nested `Folders` (referred to by `FolderItemReference` with type 'folder').
 */
export interface Folder {
  /** A globally unique identifier for this folder. */
  id: string;
  /** The user-facing name of the folder. Must be non-empty. */
  name: string;
  /**
   * The `id` of the parent folder. If `null`, this folder is a root folder.
   */
  parentId: string | null;
  /** The timestamp when this folder was initially created. */
  createdAt: Date;
  /** The timestamp when this folder was last modified
   * (e.g., name changed, parent changed, children added/removed). */
  updatedAt: Date;
  /** An array of `FolderItemReference` objects representing the items contained within this folder. */
  children: FolderItemReference[];
}

// --- 2. Helper Functions (not part of the concept itself, but necessary for implementation) ---

/**
 * Generates a simple, unique ID string for new folders.
 * In a real-world application, this would typically use a robust UUID library (e.g., 'uuid').
 */
function generateUniqueId(): string {
  return `f_${Math.random().toString(36).substring(2, 11)}`;
}

// --- 3. FolderService Class implementing the specified behaviors ---

/**
 * A service class responsible for managing Folder operations,
 * implementing all behaviors and adhering to the properties defined in the `Folder` concept.
 * This service uses an in-memory Map to simulate data storage.
 */
export class FolderService {
  // In-memory storage for folders, mapping folder ID to Folder object.
  private folders: Map<string, Folder> = new Map();

  /**
   * Retrieves a folder by its unique ID.
   * @param id The ID of the folder to retrieve.
   * @returns The folder object if found, otherwise `undefined`.
   *          Returns a copy to prevent direct modification of internal state.
   */
  getFolderById(id: string): Folder | undefined {
    const folder = this.folders.get(id);
    return folder ? { ...folder } : undefined;
  }

  /**
   * Creates a new folder with the given name and parent.
   * @param name The name for the new folder.
   * @param parentId The ID of the parent folder, or `null` for a root folder.
   * @returns The newly created folder object.
   * @throws Error if `name` is empty or if `parentId` is provided but no folder with that ID exists.
   *
   * @post-conditions:
   * - A new `Folder` object exists with a unique `id`.
   * - `createdAt` and `updatedAt` are set to the current time.
   * - If `parentId` is provided, the parent folder's `updatedAt` is updated,
   *   and the new folder's `FolderItemReference` is added to its `children`.
   */
  createFolder(name: string, parentId: string | null): Folder {
    if (!name || name.trim() === "") {
      throw new Error("Folder name cannot be empty.");
    }

    const now = new Date();
    const newFolder: Folder = {
      id: generateUniqueId(),
      name: name.trim(),
      parentId: parentId,
      createdAt: now,
      updatedAt: now,
      children: [],
    };

    this.folders.set(newFolder.id, newFolder);

    // Post-condition handling for parent folder
    if (parentId !== null) {
      const parentFolder = this.folders.get(parentId);
      if (!parentFolder) {
        // If parent doesn't exist, remove the newly created folder to maintain data integrity.
        this.folders.delete(newFolder.id);
        throw new Error(`Parent folder with ID '${parentId}' not found.`);
      }
      parentFolder.children.push({ id: newFolder.id, type: "folder" });
      parentFolder.updatedAt = new Date();
      this.folders.set(parentId, parentFolder); // Update parent in map
    }

    return { ...newFolder }; // Return a copy
  }

  /**
   * Renames an existing folder.
   * @param folderId The ID of the folder to rename.
   * @param newName The new name for the folder. Must be non-empty.
   * @returns The updated folder object.
   * @throws Error if `folderId` not found or `newName` is empty.
   *
   * @pre-conditions:
   * - A folder with `folderId` must exist.
   * @post-conditions:
   * - The `name` property of the specified folder is updated.
   * - The `updatedAt` property of the folder is updated.
   */
  renameFolder(folderId: string, newName: string): Folder {
    if (!newName || newName.trim() === "") {
      throw new Error("New folder name cannot be empty.");
    }

    const folder = this.folders.get(folderId);
    if (!folder) {
      throw new Error(`Folder with ID '${folderId}' not found.`);
    }

    folder.name = newName.trim();
    folder.updatedAt = new Date();
    this.folders.set(folderId, folder); // Update folder in map
    return { ...folder };
  }

  /**
   * Moves an existing folder to a new parent folder.
   * @param folderId The ID of the folder to move.
   * @param newParentId The ID of the new parent folder, or `null` to make it a root folder.
   * @returns The moved folder object.
   * @throws Error if pre-conditions are not met (folder not found, new parent not found, moving into self/descendant).
   *
   * @pre-conditions:
   * - A folder with `folderId` must exist.
   * - If `newParentId` is provided, a folder with `newParentId` must exist.
   * - A folder cannot be moved into itself or one of its descendants.
   * @post-conditions:
   * - The `parentId` property of the specified folder is updated.
   * - The `updatedAt` property of the folder is updated.
   * - The `FolderItemReference` for `folderId` is removed from the old parent's `children` (if any).
   * - The `FolderItemReference` for `folderId` is added to the new parent's `children` (if `newParentId` is not null).
   * - The `updatedAt` of both old and new parent folders (if applicable) are updated.
   */
  moveFolder(folderId: string, newParentId: string | null): Folder {
    const folderToMove = this.folders.get(folderId);
    if (!folderToMove) {
      throw new Error(`Folder with ID '${folderId}' not found.`);
    }

    // Pre-condition: If newParentId is provided, a folder with newParentId must exist.
    let newParentFolder: Folder | undefined;
    if (newParentId !== null) {
      newParentFolder = this.folders.get(newParentId);
      if (!newParentFolder) {
        throw new Error(
          `New parent folder with ID '${newParentId}' not found.`,
        );
      }
      // Pre-condition: A folder cannot be moved into itself or one of its descendants.
      if (
        folderId === newParentId || this.isDescendant(folderId, newParentId)
      ) {
        throw new Error("Cannot move a folder into itself or its descendant.");
      }
    }

    const oldParentId = folderToMove.parentId;

    // Post-condition: Remove from old parent's children (if any).
    if (oldParentId !== null) {
      const oldParentFolder = this.folders.get(oldParentId);
      if (oldParentFolder) {
        oldParentFolder.children = oldParentFolder.children.filter(
          (item) => !(item.id === folderId && item.type === "folder"),
        );
        oldParentFolder.updatedAt = new Date();
        this.folders.set(oldParentId, oldParentFolder); // Update old parent in map
      }
    }

    // Post-condition: Update parentId of the folder being moved.
    folderToMove.parentId = newParentId;
    folderToMove.updatedAt = new Date();
    this.folders.set(folderId, folderToMove); // Update moved folder in map

    // Post-condition: Add to new parent's children (if newParentId is not null).
    if (newParentFolder) {
      newParentFolder.children.push({ id: folderId, type: "folder" });
      newParentFolder.updatedAt = new Date();
      this.folders.set(newParentId!, newParentFolder); // Update new parent in map
    }

    return { ...folderToMove };
  }

  /**
   * Helper method to determine if a potential parent is a descendant of the folder being moved.
   * @param ancestorId The ID of the potential ancestor folder.
   * @param descendantId The ID of the potential descendant folder.
   * @returns `true` if `descendantId` is a descendant of `ancestorId`, `false` otherwise.
   */
  private isDescendant(ancestorId: string, descendantId: string): boolean {
    let currentFolderId: string | null = descendantId;
    while (currentFolderId !== null) {
      if (currentFolderId === ancestorId) {
        return true;
      }
      const currentFolder = this.folders.get(currentFolderId);
      currentFolderId = currentFolder ? currentFolder.parentId : null;
    }
    return false;
  }

  /**
   * Adds a reference to a folder or file to a folder's contents.
   * This operation assumes the `parentId` of the `itemId` (if it's a folder) is already correctly set
   * to `folderId` or is about to be set by a related operation (like `moveFolder` or `createFolder`).
   * This method primarily updates the `children` array of the target `folderId`.
   * @param folderId The ID of the folder to add the item to.
   * @param itemId The ID of the item (sub-folder or file) to add.
   * @param itemType The type of the item being added.
   * @returns The updated folder object.
   * @throws Error if `folderId` not found, or if the item is already a child of `folderId`.
   *
   * @pre-conditions:
   * - A folder with `folderId` must exist.
   * - The item with `itemId` must exist and match `itemType` (assumed by `addFolderItem`, but not explicitly checked for `file` type without a `FileService`).
   * - The item must not already be a child of `folderId`.
   * @post-conditions:
   * - A new `FolderItemReference` is added to the `children` array of the specified `folderId`.
   * - The `updatedAt` property of `folderId` is updated.
   */
  addFolderItem(
    folderId: string,
    itemId: string,
    itemType: "folder" | "file",
  ): Folder {
    const folder = this.folders.get(folderId);
    if (!folder) {
      throw new Error(`Folder with ID '${folderId}' not found.`);
    }

    // Pre-condition: The item must not already be a child of folderId.
    if (
      folder.children.some((child) =>
        child.id === itemId && child.type === itemType
      )
    ) {
      throw new Error(
        `Item with ID '${itemId}' and type '${itemType}' is already a child of folder '${folderId}'.`,
      );
    }

    // Basic consistency check if adding a folder as child:
    // The child folder should either not have a parent, or its parent should be this folderId.
    // If it's a folder being added and it has a different parent, `moveFolder` should be used.
    if (itemType === "folder") {
      const childFolder = this.folders.get(itemId);
      if (!childFolder) {
        throw new Error(`Child folder with ID '${itemId}' not found.`);
      }
      // If the child folder's parentId is not this folderId, it's an inconsistent state
      // unless this `addFolderItem` is designed to implicitly update the child's parentId.
      // Following "exactly as written", this method just updates the *parent's* children list.
      // For robust systems, a dedicated `moveFolder` handles parentId changes.
    }

    folder.children.push({ id: itemId, type: itemType });
    folder.updatedAt = new Date();
    this.folders.set(folderId, folder); // Update folder in map
    return { ...folder };
  }

  /**
   * Removes a reference to an item (sub-folder or file) from a folder's contents.
   * This method only removes the reference from the parent folder's `children` array.
   * It does *not* delete the actual item (sub-folder or file) itself.
   * @param folderId The ID of the folder to remove the item from.
   * @param itemId The ID of the item (sub-folder or file) to remove.
   * @returns The updated folder object.
   * @throws Error if `folderId` not found or item not a child of the specified folder.
   *
   * @pre-conditions:
   * - A folder with `folderId` must exist.
   * - The item with `itemId` must be a child of `folderId`.
   * @post-conditions:
   * - The `FolderItemReference` for `itemId` is removed from the `children` array of `folderId`.
   * - The `updatedAt` property of `folderId` is updated.
   */
  removeFolderItem(folderId: string, itemId: string): Folder {
    const folder = this.folders.get(folderId);
    if (!folder) {
      throw new Error(`Folder with ID '${folderId}' not found.`);
    }

    const initialChildrenCount = folder.children.length;
    folder.children = folder.children.filter((child) => child.id !== itemId);

    // Pre-condition check: if the count didn't change, the item wasn't a child.
    if (folder.children.length === initialChildrenCount) {
      throw new Error(
        `Item with ID '${itemId}' not found as a child of folder '${folderId}'.`,
      );
    }

    folder.updatedAt = new Date();
    this.folders.set(folderId, folder); // Update folder in map
    return { ...folder };
  }

  /**
   * Clears all folders from the service's in-memory storage.
   * (This operation is not part of the `folder.md` concept specification but is useful for testing or resetting state.)
   */
  clearAllFolders(): void {
    this.folders.clear();
  }
}
