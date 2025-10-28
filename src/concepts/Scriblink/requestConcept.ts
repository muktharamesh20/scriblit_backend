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
   * Action: Registers a new user and automatically creates their root folder.
   * @param request User registration details
   * @effects Creates a new user account and initializes their folder structure
   * @returns User ID and root folder ID, or an error
   */
  async registerUser(
    request: UserRegistrationRequest,
  ): Promise<UserRegistrationResponse | { error: string }> {
    // Register the user
    const authResult = await this.auth.register(request);
    if ("error" in authResult) {
      return authResult;
    }

    const { user } = authResult;

    // Create root folder for the user
    const folderResult = await this.folders.initializeFolder({ user });
    if ("error" in folderResult) {
      return {
        error: `Failed to create root folder for user: ${folderResult.error}`,
      };
    }

    return {
      user,
      rootFolder: folderResult.folder,
    };
  }

  /**
   * Action: Authenticates a user and returns their root folder.
   * @param request User login credentials
   * @returns User ID and root folder ID, or error
   */
  async loginUser(
    request: UserLoginRequest,
  ): Promise<{ user: User; rootFolder: Folder } | { error: string }> {
    console.log(
      "🔐 [RequestConcept.loginUser] Login attempt for:",
      request.username,
    );
    console.log(
      "🔍 [RequestConcept.loginUser] Request received:",
      JSON.stringify(request, null, 2),
    );

    const authResult = await this.auth.authenticate(request);

    console.log("🔍 [RequestConcept.loginUser] Auth result:", authResult);

    if ("error" in authResult) {
      console.error(
        "❌ [RequestConcept.loginUser] Authentication failed:",
        authResult.error,
      );
      return authResult;
    }

    const { user } = authResult;
    console.log(
      "✅ [RequestConcept.loginUser] Authentication successful for user:",
      user,
    );

    // Find or create the user's root folder
    const existingFolders = await this.folders.folders.find({ owner: user })
      .toArray();

    let rootFolder;
    if (existingFolders.length > 0) {
      // Find folder titled "Root" or use the first folder
      rootFolder = existingFolders.find((folder) => folder.title === "Root") ||
        existingFolders[0];
    } else {
      // No folders exist, create root folder
      const folderResult = await this.folders.initializeFolder({ user });
      if ("error" in folderResult) {
        return {
          error: `Failed to initialize root folder: ${folderResult.error}`,
        };
      }
      rootFolder = { _id: folderResult.folder };
    }

    return {
      user,
      rootFolder: rootFolder._id,
    };
  }

  /**
   * Action: Creates a new note with optional folder placement, tagging, and summarization.
   * @param request Note creation details
   * @effects Creates a note, places it in the specified folder, applies tags, and optionally generates a summary
   * @returns Note ID, folder ID, applied tags, and summary (if generated)
   */
  async createNote(
    request: NoteCreationRequest,
  ): Promise<NoteCreationResponse | { error: string }> {
    console.log(
      "🚀 [RequestConcept.createNote] Starting note creation:",
      request,
    );

    const {
      user,
      title,
      content,
      folder: folderId,
      tags = [],
      generateSummary = false,
    } = request;

    console.log("🔍 [RequestConcept.createNote] Parsed parameters:", {
      user,
      title,
      folderId,
      contentLength: content?.length,
    });

    // Verify the folder exists and belongs to the user
    console.log("🔍 [RequestConcept.createNote] Verifying folder:", folderId);
    const folderDetails = await this.folders._getFolderDetails({ folderId });
    if ("error" in folderDetails) {
      console.error(
        "❌ [RequestConcept.createNote] Invalid folder:",
        folderDetails.error,
      );
      return { error: `Invalid folder: ${folderDetails.error}` };
    }
    if (folderDetails.owner !== user) {
      console.error(
        "❌ [RequestConcept.createNote] Folder doesn't belong to user",
      );
      return { error: "Folder does not belong to the user" };
    }
    console.log("✅ [RequestConcept.createNote] Folder verified");

    // Create the note (no folderId in note structure)
    console.log(
      "🔄 [RequestConcept.createNote] Creating note in Notes concept",
    );
    const noteResult = await this.notes.createNote({ title, user });
    if ("error" in noteResult) {
      console.error(
        "❌ [RequestConcept.createNote] Failed to create note:",
        noteResult.error,
      );
      return noteResult;
    }

    const { note } = noteResult;
    console.log("✅ [RequestConcept.createNote] Note created:", note);

    // Update note content
    console.log("🔄 [RequestConcept.createNote] Updating note content");
    const contentResult = await this.notes.updateContent({
      newContent: content,
      noteId: note,
      user,
    });
    if ("error" in contentResult) {
      console.error(
        "❌ [RequestConcept.createNote] Failed to update content:",
        contentResult.error,
      );
      return { error: contentResult.error };
    }
    console.log("✅ [RequestConcept.createNote] Content updated");

    // Place note in the specified folder
    console.log(
      "🔄 [RequestConcept.createNote] Adding note to folder:",
      folderId,
    );
    const folderResult = await this.folders.insertItem({
      item: note,
      folder: folderId,
    });
    if ("error" in folderResult) {
      console.error(
        "❌ [RequestConcept.createNote] Failed to add note to folder:",
        folderResult.error,
      );
      return { error: folderResult.error };
    }
    console.log("✅ [RequestConcept.createNote] Note added to folder");

    const response: NoteCreationResponse = {
      note,
      folder: folderId,
    };

    // Apply tags if provided
    if (tags && tags.length > 0) {
      const appliedTags: Tag[] = [];
      for (const tagLabel of tags) {
        const tagResult = await this.tags.addTag({
          user,
          label: tagLabel,
          item: note,
        });
        if ("error" in tagResult) {
          console.warn(`Failed to apply tag "${tagLabel}": ${tagResult.error}`);
        } else {
          appliedTags.push(tagResult.tag);
        }
      }
      if (appliedTags.length > 0) {
        response.tags = appliedTags;
      }
    }

    // Generate summary if requested
    if (generateSummary) {
      const summaryResult = await this.summaries.setSummaryWithAI({
        text: content,
        item: note,
      });
      if ("error" in summaryResult) {
        console.warn(`Failed to generate summary: ${summaryResult.error}`);
      } else {
        response.summary = summaryResult.summary;
      }
    }

    console.log(
      "✅ [RequestConcept.createNote] Note creation completed successfully:",
      response,
    );
    return response;
  }

  /**
   * Action: Updates an existing note with new content, folder placement, tags, and summary.
   * @param request Note update details
   * @effects Updates note content, moves to new folder if specified, updates tags, and optionally regenerates summary
   * @returns Success or error
   */
  async updateNote(
    request: NoteUpdateRequest,
  ): Promise<Empty | { error: string }> {
    const { user, noteId, title, content, tags, generateSummary } = request;

    // Verify note exists and belongs to user
    const noteDetails = await this.notes.getNoteDetails({ noteId, user });
    if ("error" in noteDetails) {
      return noteDetails;
    }

    // Update title if provided
    if (title !== undefined) {
      const titleResult = await this.notes.setTitle({
        newTitle: title,
        noteId,
        user,
      });
      if ("error" in titleResult) {
        return titleResult;
      }
    }

    // Update content if provided
    if (content !== undefined) {
      const contentResult = await this.notes.updateContent({
        newContent: content,
        noteId,
        user,
      });
      if ("error" in contentResult) {
        return contentResult;
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Get current tags for the note
      const currentTags = await this.tags._getTagsForItem({
        user,
        item: noteId,
      });
      if (!("error" in currentTags)) {
        // Remove all current tags
        for (const tag of currentTags) {
          await this.tags.removeTagFromItem({ tag: tag.tagId, item: noteId });
        }
      }

      // Add new tags
      for (const tagLabel of tags) {
        await this.tags.addTag({ user, label: tagLabel, item: noteId });
      }
    }

    // Regenerate summary if requested and content was updated
    if (generateSummary && content !== undefined) {
      const summaryResult = await this.summaries.setSummaryWithAI({
        text: content,
        item: noteId,
      });
      if ("error" in summaryResult) {
        console.warn(`Failed to regenerate summary: ${summaryResult.error}`);
      }
    }

    return {};
  }

  /**
   * Action: Creates a new folder for a user.
   * @param request Folder creation details
   * @effects Creates a new folder as a child of the specified parent folder
   * @returns Folder ID or error
   */
  async createFolder(
    request: FolderCreationRequest,
  ): Promise<{ folder: Folder } | { error: string }> {
    const { user, title, parentFolderId } = request;

    // Verify parent folder exists and belongs to user
    const parentDetails = await this.folders._getFolderDetails({
      folderId: parentFolderId,
    });
    if ("error" in parentDetails) {
      return { error: `Invalid parent folder: ${parentDetails.error}` };
    }
    if (parentDetails.owner !== user) {
      return { error: "Parent folder does not belong to the user" };
    }

    // Create the folder
    return await this.folders.createFolder({
      user,
      title,
      parent: parentFolderId,
    });
  }

  /**
   * Action: Move a folder to a new parent.
   * @param request Move folder details
   * @effects Moves the folder to the new parent
   * @returns Success or error
   */
  async moveFolder(
    request: { folderId: Folder; newParentId: Folder; user: User },
  ): Promise<{ success: boolean } | { error: string }> {
    const { folderId, newParentId, user } = request;

    // Verify the folder exists and belongs to the user
    const folderDetails = await this.folders._getFolderDetails({ folderId });
    if ("error" in folderDetails) {
      return { error: `Invalid folder: ${folderDetails.error}` };
    }
    if (folderDetails.owner !== user) {
      return { error: "Folder does not belong to the user" };
    }

    // Verify the new parent exists and belongs to the user
    const parentDetails = await this.folders._getFolderDetails({
      folderId: newParentId,
    });
    if ("error" in parentDetails) {
      return { error: `Invalid parent folder: ${parentDetails.error}` };
    }
    if (parentDetails.owner !== user) {
      return { error: "Parent folder does not belong to the user" };
    }

    // Move the folder using the folder concept
    const result = await this.folders.moveFolder({
      folder: folderId,
      newParent: newParentId,
    });

    if ("error" in result) {
      return result;
    }

    return { success: true };
  }

  /**
   * Action: Moves a note to a different folder.
   * @param noteId The ID of the note to move
   * @param user The user performing the action
   * @param folderId The ID of the folder to move the note to
   * @effects Updates the note's folder association via folder.elements
   * @returns Success or error
   */
  async moveNote(
    { noteId, user, folderId }: { noteId: Note; user: User; folderId: Folder },
  ): Promise<Empty | { error: string }> {
    // Verify the target folder exists and belongs to the user
    const folderDetails = await this.folders._getFolderDetails({ folderId });
    if ("error" in folderDetails) {
      return { error: `Invalid folder: ${folderDetails.error}` };
    }
    if (folderDetails.owner !== user) {
      return { error: "Folder does not belong to the user" };
    }

    // Verify note exists and belongs to user
    const noteDetails = await this.notes.getNoteDetails({ noteId, user });
    if ("error" in noteDetails) {
      return noteDetails;
    }

    // Insert the note into the target folder (handles the move)
    const moveResult = await this.folders.insertItem({
      item: noteId,
      folder: folderId,
    });
    if ("error" in moveResult) {
      return moveResult;
    }

    return {};
  }

  /**
   * Action: Tags an item with a specific label.
   * @param request Tagging details
   * @effects Associates the item with the specified tag
   * @returns Tag ID or error
   */
  async tagItem(
    request: TaggingRequest,
  ): Promise<{ tag: Tag } | { error: string }> {
    const { user, itemId, tagLabel } = request;
    return await this.tags.addTag({ user, label: tagLabel, item: itemId });
  }

  /**
   * Action: Removes a tag from an item.
   * @param user The user performing the action
   * @param itemId The item to untag
   * @param tagId The tag to remove
   * @effects Removes the association between the item and tag
   * @returns Success or error
   */
  async untagItem(
    { _user, itemId, tagId }: { _user: User; itemId: Item; tagId: Tag },
  ): Promise<Empty | { error: string }> {
    return await this.tags.removeTagFromItem({ tag: tagId, item: itemId });
  }

  /**
   * Action: Generates a summary for a note.
   * @param user The user requesting the summary
   * @param noteId The note to summarize
   * @effects Creates or updates a summary for the note using AI
   * @returns Summary text or error
   */
  async generateSummary(
    { user, noteId }: { user: User; noteId: Note },
  ): Promise<{ summary: string } | { error: string }> {
    // Get note details to verify ownership and get content
    const noteDetails = await this.notes.getNoteDetails({ noteId, user });
    if ("error" in noteDetails) {
      return noteDetails;
    }

    // Generate summary
    const summaryResult = await this.summaries.setSummaryWithAI({
      text: noteDetails.content,
      item: noteId,
    });

    if ("error" in summaryResult) {
      return summaryResult;
    }

    return { summary: summaryResult.summary };
  }

  /**
   * Query: Gets all notes for a user with optional filtering.
   * Augments each note with a virtual 'folderId' field for display purposes.
   * @param user The user whose notes to retrieve
   * @param folderId Optional folder to filter by
   * @param tagLabel Optional tag to filter by
   * @returns Array of notes with their details (including computed folderId)
   */
  async getUserNotes(
    { user, folderId, tagLabel }: {
      user: User;
      folderId?: Folder;
      tagLabel?: string;
    },
  ): Promise<{ notes: unknown[] } | { error: string }> {
    // Get all notes for the user
    const notesResult = await this.notes.getNotesByUser({ ownerId: user });
    if ("error" in notesResult) {
      return notesResult;
    }

    // Get all folders for this user to determine which folder each note belongs to
    const allFolders = await this.folders.folders.find({ owner: user })
      .toArray();

    // Create a map of noteId -> folderId for quick lookup
    const noteToFolderMap = new Map();
    for (const folder of allFolders) {
      for (const noteId of folder.elements) {
        noteToFolderMap.set(noteId, folder._id);
      }
    }

    // Augment notes with folderId for display purposes
    let notesWithFolder = notesResult.map((note) => ({
      ...note,
      folderId: noteToFolderMap.get(note._id) || null,
    }));

    // Filter by folder if specified
    if (folderId !== undefined) {
      notesWithFolder = notesWithFolder.filter((note) =>
        note.folderId === folderId
      );
    }

    // Filter by tag if specified
    if (tagLabel !== undefined && tagLabel !== null) {
      const tagResult = await this.tags._getAllUserTags({ user });
      if ("error" in tagResult) {
        return { error: `Failed to get tags: ${tagResult.error}` };
      }

      const tagWithLabel = tagResult.find((tag) => tag.label === tagLabel);
      if (tagWithLabel) {
        notesWithFolder = notesWithFolder.filter((note) =>
          tagWithLabel.items.includes(note._id)
        );
      } else {
        notesWithFolder = []; // No notes with this tag
      }
    }

    return { notes: notesWithFolder };
  }

  /**
   * Query: Gets the folder structure for a user.
   * @param user The user whose folders to retrieve
   * @param folderId Optional specific folder to get details for
   * @returns Folder structure or error
   */
  async getFolderStructure(
    { user, folderId }: { user: User; folderId?: Folder },
  ): Promise<{ folders: unknown[]; items: unknown[] } | { error: string }> {
    if (folderId !== undefined) {
      // Get specific folder details
      const folderDetails = await this.folders._getFolderDetails({ folderId });
      if ("error" in folderDetails) {
        return folderDetails;
      }
      if (folderDetails.owner !== user) {
        return { error: "Folder does not belong to the user" };
      }
      // Get full folder objects for child folders with nested structure
      const childFolders = [];
      for (const folderId of folderDetails.folders) {
        const childFolder = await this.folders._getFolderDetails({ folderId });
        if (!("error" in childFolder)) {
          // Recursively get nested folders
          const nestedStructure = await this.getFolderStructure({
            user,
            folderId: childFolder._id,
          });
          if (!("error" in nestedStructure)) {
            childFolders.push({
              ...childFolder,
              children: nestedStructure.folders,
              items: nestedStructure.items,
            });
          } else {
            childFolders.push(childFolder);
          }
        }
      }

      return {
        folders: childFolders,
        items: folderDetails.elements,
      };
    } else {
      // Get user's notes
      const userNotes = await this.notes.getNotesByUser({ ownerId: user });
      if ("error" in userNotes) {
        return userNotes;
      }

      // Always try to get or create a root folder for this user
      let _rootFolder;

      // First, try to find existing folders
      const existingFolders = await this.folders.folders.find({ owner: user })
        .toArray();

      if (existingFolders.length > 0) {
        // Use the first folder as root (or find one with title "Root")
        _rootFolder = existingFolders.find((folder) =>
          folder.title === "Root"
        ) || existingFolders[0];
      } else {
        // No folders exist, try to create one
        const rootFolderResult = await this.folders.initializeFolder({ user });
        if ("error" in rootFolderResult) {
          // If initializeFolder fails, the user might have folders but they're not being found
          // Try to find any folder for this user with a different query
          const anyFolder = await this.folders.folders.findOne({ owner: user });
          if (anyFolder) {
            _rootFolder = anyFolder;
          } else {
            // If still no folder found, create a basic one manually
            const folderId = freshID() as Folder;
            await this.folders.folders.insertOne({
              _id: folderId,
              owner: user,
              title: "Root",
              folders: [],
              elements: [],
            });
            _rootFolder = {
              _id: folderId,
              owner: user,
              title: "Root",
              folders: [],
              elements: [],
            };
          }
        } else {
          _rootFolder = {
            _id: rootFolderResult.folder,
            owner: user,
            title: "Root",
            folders: [],
            elements: [],
          };
        }
      }

      // Get all folders for the user to show the proper hierarchy
      const allFolders = await this.folders.folders.find({ owner: user })
        .toArray();

      return {
        folders: allFolders,
        items: userNotes.map((note) => note._id),
      };
    }
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
    const result = await this.folders.deleteFolder(folderId);
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
   * Action: Deletes a note.
   * @param request Note deletion details
   * @effects Deletes the note from the database
   * @returns Empty object or error
   */
  async deleteNote(
    { noteId, user }: { noteId: Note; user: User },
  ): Promise<Empty | { error: string }> {
    console.log("🗑️ [RequestConcept.deleteNote] Deleting note:", noteId);

    // Verify the note belongs to the user
    const note = await this.notes.notes.findOne({ _id: noteId });
    if (!note) {
      return { error: "Note not found" };
    }

    if (note.owner !== user) {
      return { error: "Note does not belong to user" };
    }

    return await this.notes.deleteNote({ noteId, user });
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
   * Action: Deletes the summary for an item.
   * @param request Item details
   * @effects Removes the summary from the database
   * @returns Empty object or error
   */
  async deleteSummary(
    { user, itemId }: { user: User; itemId: Item },
  ): Promise<Empty | { error: string }> {
    // Verify the item belongs to the user
    const note = await this.notes.notes.findOne({ _id: itemId as Note });
    if (!note) {
      return { error: "Item not found" };
    }

    if (note.owner !== user) {
      return { error: "Item does not belong to user" };
    }

    return await this.summaries.deleteSummary({ item: itemId });
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
