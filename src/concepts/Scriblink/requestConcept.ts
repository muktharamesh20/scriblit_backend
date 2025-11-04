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
}
