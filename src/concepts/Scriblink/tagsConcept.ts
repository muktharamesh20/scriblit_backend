import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Tag" + "."; // Using "Tag" prefix for this concept

// Generic types for the concept's external dependencies (from the example)
type User = ID;
type Item = ID;

// Internal entity type for a Tag, consistent with Folder
type Tag = ID;

/**
 * Interface representing the structure of a Tag document in the database.
 * @state A set of Tags, each with an owner, a label (string), and a set of associated Items.
 */
interface TagStructure {
  _id: Tag; // Unique ID for the tag itself
  owner: User; // The user who owns this tag (assuming tags are user-specific)
  label: string; // The human-readable label for the tag (e.g., "urgent", "todo")
  items: Item[]; // An array of Item IDs that are flagged by this tag
}

/**
 * @concept Tags
 * @purpose To flag items for later, enabling a user to easily access items with a specific label.
 * @principle A user labels items to flag them. Later, the user can retrieve items by their tags.
 */
export default class TagConcept {
  tags: Collection<TagStructure>;

  constructor(private readonly db: Db) {
    // Initialize the MongoDB collection for tags
    this.tags = this.db.collection(PREFIX + "tags");
  }

  /**
   * Action: Associates an item with a given tag label for a specific user.
   * If a tag with the given label doesn't exist for the user, a new one is created.
   * The item is added to the tag's list of associated items.
   *
   * @param user The ID of the user attempting to add the tag.
   * @param label The string label of the tag (e.g., "important", "review").
   * @param item The ID of the item to be flagged with this tag.
   *
   * @requires There must not already exist an association between this `user`, `label`, and `item`.
   *           In other words, the `item` should not already be present in the `items` list of the
   *           tag identified by `user` and `label`.  Tag also should not be empty or whitespace.
   *
   * @effects If the tag (for the given `user` and `label`) doesn't exist, it's created and the `item` is added.
   *          If the tag exists but the `item` is not associated, the `item` is added to its `items` list.
   *
   * @returns On success, an object containing the ID of the tag (`tag`).
   *          On failure (e.g., item already tagged, database error), an object containing an `error` string.
   */
  async addTag(
    { user, label, item }: { user: User; label: string; item: Item },
  ): Promise<{ tag: Tag } | { error: string }> {
    // First, try to find an existing tag for this user with this label.
    const existingTag = await this.tags.findOne({ owner: user, label });

    if (label.trim() === "") {
      return {
        error: "Tag cannot be empty or whitespace.",
      };
    }

    if (existingTag) {
      // Check the 'requires' clause: "there does not already exist a tag associated with that label and item".
      // If the item is already in the existing tag's 'items' array, the requirement is violated.
      if (existingTag.items.includes(item)) {
        return {
          error:
            `Item ${item} is already associated with tag "${label}" (ID: ${existingTag._id}) for user ${user}.`,
        };
      }

      // If the item is not present, add it to the existing tag's 'items' array.
      // $addToSet ensures that 'item' is added only if it's not already there (which we've already checked).
      const updateResult = await this.tags.updateOne(
        { _id: existingTag._id },
        { $addToSet: { items: item } },
      );

      if (updateResult.modifiedCount === 1) {
        return { tag: existingTag._id };
      } else {
        // This scenario indicates an unexpected failure, as the item was checked as not present.
        return {
          error:
            `Failed to add item ${item} to existing tag "${label}" (ID: ${existingTag._id}) for user ${user}. No document was modified.`,
        };
      }
    } else {
      // No existing tag found for this user and label, so create a new one.
      // The 'requires' clause is naturally met as no such association exists.
      const tagId = freshID() as Tag;
      try {
        await this.tags.insertOne({
          _id: tagId,
          owner: user,
          label,
          items: [item], // Initialize with the first item
        });
        return { tag: tagId };
      } catch (e: any) {
        console.error(
          `Error creating new tag "${label}" for user ${user} with item ${item}:`,
          e,
        );
        return {
          error: `Error creating tag: ${e.message}`,
        };
      }
    }
  }

  /**
   * Action: Removes an item's association with a specific tag.
   * This action unflags an item from a given tag.
   *
   * @param tagId The ID of the tag from which the item should be removed.
   * @param item The ID of the item to be unflagged.
   *
   * @requires The tag specified by `tagId` must exist, AND the `item` must currently be associated with this tag.
   *
   * @effects Removes the `item` from the `items` list of the specified `tag`.
   *          If the `items` list becomes empty after removal, the tag itself is not deleted (as per prompt, not specified).
   *
   * @returns On success, an empty object (`{}`).
   *          On failure (e.g., tag not found, item not associated, database error), an object containing an `error` string.
   */
  async removeTagFromItem(
    { tag: tagId, item }: { tag: Tag; item: Item },
  ): Promise<Empty | { error: string }> {
    // Attempt to remove the item from the tag.
    // The query { _id: tagId, items: item } ensures both 'requires' are met:
    // 1. The tag with `tagId` exists.
    // 2. The `item` is present within that tag's `items` array.
    const updateResult = await this.tags.updateOne(
      { _id: tagId, items: item }, // Filter: Find the tag AND ensure the item is present
      { $pull: { items: item } }, // Update: Remove the item from the array
    );

    if (updateResult.modifiedCount === 1) {
      // Item was successfully removed.
      return {};
    } else if (updateResult.matchedCount === 0) {
      // No document was matched by the query. This means either:
      // a) The tag itself does not exist.
      // b) The tag exists, but the item was not found in its 'items' array.
      // We need to distinguish these two cases to provide a more specific error message.
      const tagCheck = await this.tags.findOne({ _id: tagId });
      if (!tagCheck) {
        return { error: `Tag with ID ${tagId} not found.` };
      } else {
        return {
          error:
            `Item ${item} is not currently associated with tag ${tagId}. No action taken.`,
        };
      }
    } else {
      // This case should ideally not happen if matchedCount is 1 but modifiedCount is 0 for $pull,
      // but it's a fallback for unexpected database behavior.
      return {
        error:
          `Failed to remove item ${item} from tag ${tagId}. Unknown issue (matched: ${updateResult.matchedCount}, modified: ${updateResult.modifiedCount}).`,
      };
    }
  }

  // --- Query Methods (Following the pattern of the provided FolderConcept) ---

  /**
   * Query: Retrieves all items associated with a given tag ID.
   *
   * @param tagId The ID of the tag.
   * @returns An array of `Item` IDs if the tag is found, otherwise an object with an `error` string.
   */
  async _getItemsByTag(
    { tagId }: { tagId: Tag },
  ): Promise<Item[] | { error: string }> {
    const tag = await this._getTagDetails({ tagId });
    if ("error" in tag) {
      return { error: tag.error }; // Return error if tag not found
    }
    return tag.items ?? []; // Return items (or empty array if null/undefined)
  }

  /**
   * Query: Retrieves all tags for a specific user that are associated with a given item ID.
   * This method searches across all tags owned by the user to find those that contain the specified item.
   *
   * @param user The ID of the user whose tags are being queried.
   * @param item The ID of the item to find associated tags for.
   *
   * @returns An array of objects containing tag ID and label that match the criteria.
   *          Returns an object with an `error` string on database query failure.
   */
  async _getTagsForItem(
    { user, item }: { user: User; item: Item },
  ): Promise<{ tagId: Tag; label: string }[] | { error: string }> {
    try {
      // Find tags belonging to the user that also contain the specified item in their 'items' array.
      const tags = await this.tags.find({ owner: user, items: item }).toArray();
      return tags.map((tag) => ({
        tagId: tag._id,
        label: tag.label,
      }));
    } catch (e: any) {
      console.error(`Error getting tags for item ${item} for user ${user}:`, e);
      return {
        error: `Error getting tags for item ${item}: ${e.message}`,
      };
    }
  }

  /**
   * Query: Retrieves all stored details for a given tag ID.
   *
   * @param tagId The ID of the tag to retrieve.
   * @returns The `TagStructure` object if found, otherwise an object with an `error` string.
   */
  async _getTagDetails(
    { tagId }: { tagId: Tag },
  ): Promise<TagStructure | { error: string }> {
    try {
      const tag = await this.tags.findOne({ _id: tagId });
      return tag ?? { error: `Tag with ID ${tagId} not found.` }; // Return tag or specific error
    } catch (e: any) {
      console.error(`Error getting tag details for ${tagId}:`, e);
      return {
        error: `Error getting tag details for ${tagId}: ${e.message}`,
      };
    }
  }

  /**
   * Query: Retrieves all tags owned by a specific user.
   *
   * @param user The ID of the user whose tags are to be retrieved.
   * @returns An array of `TagStructure` objects owned by the user.
   *          Returns an object with an `error` string on database query failure.
   */
  async _getAllUserTags(
    { user }: { user: User },
  ): Promise<TagStructure[] | { error: string }> {
    try {
      const tags = await this.tags.find({ owner: user }).toArray();
      return tags;
    } catch (e: any) {
      console.error(`Error getting all tags for user ${user}:`, e);
      return {
        error: `Error getting all tags for user ${user}: ${e.message}`,
      };
    }
  }
}
