import { Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Import all the individual concepts
import PasswordAuthConcept from "./passwordAuthConcept.ts";
import FolderConcept from "./folderConcept.ts";
import NotesConcept from "./notesConcept.ts";
import TagConcept from "./tagsConcept.ts";
import SummariesConcept from "./summariesConcept.ts";

// Collection prefix to ensure namespace separation (unused but kept for consistency)
const _PREFIX = "Request" + ".";

// Generic types for the concept's external dependencies
export type User = ID;
export type Item = ID;
export type Folder = ID;
export type Note = ID;
export type Tag = ID;

/**
 * Request types for different operations
 */
export interface UserRegistrationRequest {
  username: string;
  password: string;
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface NoteCreationRequest {
  user: User;
  title?: string;
  content: string;
  folder: Folder;
  tags?: string[];
  generateSummary?: boolean;
}

export interface NoteUpdateRequest {
  user: User;
  noteId: Note;
  title?: string;
  content?: string;
  tags?: string[];
  generateSummary?: boolean;
}

export interface FolderCreationRequest {
  user: User;
  title: string;
  parentFolderId: Folder;
}

export interface TaggingRequest {
  user: User;
  itemId: Item;
  tagLabel: string;
}

/**
 * Response types for operations
 */
export interface UserRegistrationResponse {
  user: User;
  rootFolder: Folder;
}

export interface NoteCreationResponse {
  note: Note;
  folder: Folder;
  tags?: Tag[];
  summary?: string;
}

/**
 * @concept Request
 * @purpose To orchestrate complex operations across multiple concepts
 * @principle Provides high-level operations that coordinate between authentication,
 *           folder management, note creation, tagging, and summarization concepts.
 */
export default class RequestConcept {
  // Individual concept instances
  private auth: PasswordAuthConcept;
  private folders: FolderConcept;
  private notes: NotesConcept;
  private tags: TagConcept;
  private summaries: SummariesConcept;

  constructor(private readonly db: Db) {
    // Initialize all concept instances
    this.auth = new PasswordAuthConcept(db);
    this.folders = new FolderConcept(db);
    this.notes = new NotesConcept(db);
    this.tags = new TagConcept(db);
    this.summaries = new SummariesConcept(db);
  }

  /**
   * Action: Deletes a folder and all its contents.
   * @param folderId The ID of the folder to delete
   * @param user The user performing the action
   * @effects Removes the folder, all its subfolders, and all notes within them
   * @returns Success or error
   */
  async deleteFolder(
    { folderId, user }: { folderId: Folder; user: User },
  ): Promise<Empty | { error: string }> {
    console.log("🚀 [RequestConcept.deleteFolder] Starting folder deletion:", {
      folderId,
      user,
    });

    // First verify the folder exists and belongs to the user
    const folderDetails = await this.folders._getFolderDetails({ folderId });
    if ("error" in folderDetails) {
      return folderDetails;
    }

    if (folderDetails.owner !== user) {
      return { error: "Folder does not belong to the user" };
    }

    // Prevent deletion of root folders (folders with title "Root")
    if (folderDetails.title === "Root") {
      return { error: "Cannot delete root folder" };
    }

    // Collect all descendant folders to find all notes that need to be deleted
    console.log(
      "🔍 [RequestConcept.deleteFolder] Collecting descendant folders...",
    );
    const folderIdsToDelete = new Set<Folder>();
    await this.collectDescendants(folderId, folderIdsToDelete);
    console.log(
      "📁 [RequestConcept.deleteFolder] Found folders to delete:",
      Array.from(folderIdsToDelete),
    );

    // Collect all notes from these folders
    const notesToDelete = new Set<Note>();
    for (const folderIdToDelete of folderIdsToDelete) {
      const folder = await this.folders._getFolderDetails({
        folderId: folderIdToDelete,
      });
      if (!("error" in folder)) {
        for (const noteId of folder.elements) {
          notesToDelete.add(noteId as Note);
        }
      }
    }
    console.log(
      "📄 [RequestConcept.deleteFolder] Found notes to delete:",
      Array.from(notesToDelete),
    );

    // Delete all notes in these folders
    console.log("🗑️ [RequestConcept.deleteFolder] Deleting notes...");
    for (const noteId of notesToDelete) {
      const deleteNoteResult = await this.notes.deleteNote({ noteId, user });
      if ("error" in deleteNoteResult) {
        console.error(
          "❌ [RequestConcept.deleteFolder] Failed to delete note:",
          noteId,
          deleteNoteResult.error,
        );
        // Continue deleting other notes even if one fails
      } else {
        console.log("✅ [RequestConcept.deleteFolder] Deleted note:", noteId);
      }
    }

    // Delete the folder and all its descendants using the folder concept
    console.log("🗑️ [RequestConcept.deleteFolder] Deleting folders...");
    const result = await this.folders.deleteFolder({ f: folderId });
    if ("error" in result) {
      console.error(
        "❌ [RequestConcept.deleteFolder] Failed to delete folders:",
        result.error,
      );
      return result;
    }

    console.log(
      "✅ [RequestConcept.deleteFolder] Successfully deleted folder and all contents",
    );
    return {};
  }
  /**
   * Action: Gets all tags for a specific item.
   * @param request Item and user details
   * @returns List of tag objects with tagId and label or error
   */
  async getItemTags(
    { user, itemId }: { user: User; itemId: Item },
  ): Promise<{ tagId: Tag; label: string }[] | { error: string }> {
    return await this.tags._getTagsForItem({ user, item: itemId });
  }

  /**
   * Action: Gets all tags for a user.
   * @param request User details
   * @returns List of all user's tags or error
   */
  async getUserTags(
    { user }: { user: User },
  ): Promise<{ tags: string[] } | { error: string }> {
    const result = await this.tags._getAllUserTags({ user });

    if ("error" in result) {
      return result;
    }

    // Extract tag labels from TagStructure array
    return { tags: result.map((tag) => tag.label) };
  }

  /**
   * Action: Sets a summary for an item.
   * @param request Summary details
   * @effects Creates or updates a summary for the item
   * @returns Summary document or error
   */
  async setSummary(
    { user, itemId, summary }: { user: User; itemId: Item; summary: string },
  ): Promise<{ summary: string } | { error: string }> {
    // Verify the item belongs to the user
    const note = await this.notes.notes.findOne({ _id: itemId as Note });
    if (!note) {
      return { error: "Item not found" };
    }

    if (note.owner !== user) {
      return { error: "Item does not belong to user" };
    }

    const result = await this.summaries.setSummary({
      item: itemId,
      summary: summary,
    });

    if ("error" in result) {
      return result;
    }

    return { summary: result.summary };
  }

  /**
   * Action: Gets the summary for an item.
   * @param request Item details
   * @returns Summary text or error
   */
  async getSummary(
    { user, itemId }: { user: User; itemId: Item },
  ): Promise<{ summary: string | null } | { error: string }> {
    // Verify the item belongs to the user
    const note = await this.notes.notes.findOne({ _id: itemId as Note });
    if (!note) {
      return { error: "Item not found" };
    }

    if (note.owner !== user) {
      return { error: "Item does not belong to user" };
    }

    const result = await this.summaries.getSummary({ item: itemId });

    if ("error" in result) {
      return result;
    }

    return { summary: result.summary };
  }

  /**
   * Action: Gets all summaries for a user's notes.
   * @param request User details
   * @returns List of summaries or error
   */
  async getUserSummaries(
    { user }: { user: User },
  ): Promise<
    { summaries: Array<{ itemId: Item; summary: string }> } | { error: string }
  > {
    // Get all user's notes
    const notes = await this.notes.getNotesByUser({ ownerId: user });
    if ("error" in notes) {
      return notes;
    }

    // Fetch summaries for each note
    const summaries: Array<{ itemId: Item; summary: string }> = [];
    for (const note of notes) {
      const summaryResult = await this.summaries.getSummary({
        item: note._id as Item,
      });
      if (!("error" in summaryResult) && summaryResult.summary) {
        summaries.push({
          itemId: note._id as Item,
          summary: summaryResult.summary,
        });
      }
    }

    return { summaries };
  }

  /**
   * Helper function to collect all descendants of a given folder.
   * @param folderId The ID of the folder to collect descendants from.
   * @param folderIdsToDelete The set of folder IDs to collect descendants into.
   * @effects Collects all descendants of the given folder and adds them to the set.
   */
  private async collectDescendants(
    folderId: Folder,
    folderIdsToDelete: Set<Folder>,
  ): Promise<void> {
    const folder = await this.folders._getFolderDetails({ folderId });
    if ("error" in folder) {
      return;
    }
    folderIdsToDelete.add(folderId);
    for (const childId of folder.folders) {
      await this.collectDescendants(childId, folderIdsToDelete);
    }
  }
}
