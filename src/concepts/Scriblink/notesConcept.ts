import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Note" + ".";

// Generic types for the concept's external dependencies
type User = ID;

// Internal entity types, represented as IDs
type Note = ID;

/**
 * State: A set of Notes with
 *   - _id: Note (unique identifier for the note)
 *   - title: String
 *   - content: String
 *   - owner: User
 *   - date_created: Date
 *   - last_modified: Date
 *
 * Invariants:
 * - each note has exactly one owner
 * - last_modified ≥ date_created
 * - only the owner can modify or delete the note
 */
interface NoteStructure {
  _id: Note;
  title: string;
  content: string;
  owner: User;
  date_created: Date;
  last_modified: Date;
}

/**
 * @concept Notes
 * @purpose records written information
 * @principle Each user can create and manage their own notes.
 *            A note belongs to exactly one user and contains a title and body text.
 *            Users can view, edit, rename, and delete their own notes.
 */
export default class NotesConcept {
  notes: Collection<NoteStructure>;

  constructor(private readonly db: Db) {
    this.notes = this.db.collection(PREFIX + "notes");
  }

  /**
   * Helper method to find a note and optionally check ownership.
   * This centralizes the "note exists" and "only the owner can modify or delete the note" invariants.
   * @param noteId The ID of the note to retrieve.
   * @param user The user attempting to access the note (optional, for ownership check).
   * @returns The NoteStructure if found and owned (if user provided), or an error object.
   */
  private async _getNoteDetails(
    noteId: Note,
    user?: User, // Optional user for ownership check, passed for modification/deletion actions
  ): Promise<NoteStructure | { error: string }> {
    try {
      const note = await this.notes.findOne({ _id: noteId });
      if (!note) {
        return { error: `Note with ID ${noteId} not found.` };
      }
      // Enforce "only the owner can modify or delete the note" invariant
      if (user && note.owner !== user) {
        return {
          error:
            `User ${user} is not authorized to access/modify note ${noteId}.`,
        };
      }
      return note;
    } catch (e: any) {
      console.error(`Error getting note details for ${noteId}:`, e);
      return {
        error: `Error getting note details for ${noteId}: ${e.message}`,
      };
    }
  }

  /**
   * Action: Creates a new note.
   * @param title An optional title for the new note. If not provided, defaults to "Untitled".
   * @param user The user who will own this note.
   * @effects Creates a new note with the specified (or default) title, an empty content string,
   *          the given owner, and current timestamps for creation and modification.
   * @returns The ID of the newly created note, or an error.
   */
  async createNote(
    { title, user }: { title?: string; user: User },
  ): Promise<{ note: Note } | { error: string }> {
    const noteId = freshID() as Note;
    const now = new Date(); // Set current time for both creation and modification

    const newNote: NoteStructure = {
      _id: noteId,
      title: title ?? "Untitled", // Default title if none is provided
      content: "", // New notes start with empty content
      owner: user,
      date_created: now,
      last_modified: now,
    };

    try {
      await this.notes.insertOne(newNote);
      return { note: noteId };
    } catch (e: any) {
      console.error(`Error creating note for user ${user}:`, e);
      return { error: `Failed to create note: ${e.message}` };
    }
  }

  /**
   * Action: Deletes a note.
   * @param noteId The ID of the note to delete.
   * @param user The user attempting to delete the note. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Deletes the note from the database.
   * @returns An empty object on successful deletion, or an error.
   */
  async deleteNote(
    { noteId, user }: { noteId: Note; user: User },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner using the helper.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails (e.g., not found or not owner)
    }

    try {
      const deleteResult = await this.notes.deleteOne({ _id: noteId });
      if (deleteResult.deletedCount === 1) {
        return {}; // Success
      } else {
        // This case should ideally not be hit if _getNoteDetails succeeded,
        // but included for robustness against concurrent operations.
        return {
          error:
            `Failed to delete note ${noteId}. Note not found or already deleted.`,
        };
      }
    } catch (e: any) {
      console.error(`Error deleting note ${noteId}:`, e);
      return { error: `Failed to delete note: ${e.message}` };
    }
  }

  /**
   * Action: Renames the title of a note.
   * @param newTitle The new title for the note.
   * @param noteId The ID of the note to rename.
   * @param user The user attempting to rename the note. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Updates the title of the specified note. Note: `last_modified` is NOT updated as per prompt.
   * @returns An empty object on successful renaming, or an error.
   */
  async setTitle(
    { newTitle, noteId, user }: { newTitle: string; noteId: Note; user: User },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails
    }

    // Check if the title is actually changing to avoid unnecessary database writes
    if (existingNote.title === newTitle) {
      return {}; // No change needed, consider it a successful no-op.
    }

    try {
      // Update only the title. The prompt specifically excludes updating last_modified here.
      const updateResult = await this.notes.updateOne(
        { _id: noteId },
        { $set: { title: newTitle } },
      );

      if (updateResult.modifiedCount === 1) {
        return {}; // Success
      } else {
        return { error: `Failed to update title for note ${noteId}.` };
      }
    } catch (e: any) {
      console.error(`Error setting title for note ${noteId}:`, e);
      return { error: `Failed to set title: ${e.message}` };
    }
  }

  /**
   * Action: Replaces the content associated with a note.
   * @param newContent The new body text for the note.
   * @param noteId The ID of the note to update.
   * @param user The user attempting to update the content. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Replaces the `content` field and updates `last_modified` to the current time.
   * @returns An empty object on successful content update, or an error.
   */
  async updateContent(
    { newContent, noteId, user }: {
      newContent: string;
      noteId: Note;
      user: User;
    },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails
    }

    // Check if the content is actually changing to avoid unnecessary database writes
    if (existingNote.content === newContent) {
      return {}; // No change needed, consider it a successful no-op.
    }

    const now = new Date();
    try {
      const updateResult = await this.notes.updateOne(
        { _id: noteId },
        { $set: { content: newContent, last_modified: now } }, // Update content and last_modified date
      );

      if (updateResult.modifiedCount === 1) {
        return {}; // Success
      } else {
        return { error: `Failed to update content for note ${noteId}.` };
      }
    } catch (e: any) {
      console.error(`Error updating content for note ${noteId}:`, e);
      return { error: `Failed to update content: ${e.message}` };
    }
  }

  // --- Query methods (for viewing notes, adhering to "Users can view... their own notes") ---

  /**
   * Query: Retrieves all stored details for a given note ID, ensuring ownership.
   * This is the public interface for viewing a single note.
   * @param noteId The ID of the note to retrieve.
   * @param user The user attempting to view the note.
   * @returns `NoteStructure` object if found and owned by the user, otherwise an error.
   */
  async getNoteDetails(
    { noteId, user }: { noteId: Note; user: User },
  ): Promise<NoteStructure | { error: string }> {
    // Reuses the private helper which includes the crucial ownership check.
    return await this._getNoteDetails(noteId, user);
  }

  /**
   * Query: Retrieves all notes owned by a specific user.
   * @param ownerId The ID of the user whose notes are to be retrieved.
   * @returns An array of `NoteStructure` objects owned by the user, or an error.
   */
  async getNotesByUser(
    { ownerId }: { ownerId: User },
  ): Promise<NoteStructure[] | { error: string }> {
    try {
      const notes = await this.notes.find({ owner: ownerId }).toArray();
      return notes;
    } catch (e: any) {
      console.error(`Error getting notes for user ${ownerId}:`, e);
      return { error: `Failed to retrieve notes for user: ${e.message}` };
    }
  }
}
