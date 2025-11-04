/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Feel free to delete these example inclusions
  "/api/Folder/_getFolderDetails":
    "allow anyone to get the details of a folder",
  "/api/Folder/isDescendant":
    "allow anyone to check if a folder is a descendant of another folder",
  "/api/Folder/insertItem": "allow anyone to insert an item into a folder",
  "/api/Folder/collectDescendants":
    "allow anyone to collect the descendants of a folder",
  "/api/Folder/deleteFolder": "allow anyone to delete a folder",
  "/api/Folder/deleteItem": "allow anyone to delete an item from a folder",
  "/api/Folder/_getFolderChildren":
    "allow anyone to get the children of a folder",
  "/api/Folder/_getFolderItems": "allow anyone to get the items in a folder",
  "/api/Notes/_getNoteDetails": "allow anyone to get the details of a note",
  "/api/Notes/deleteNote": "allow anyone to delete a note",
  "/api/Notes/setTitle": "allow anyone to set the title of a note",
  "/api/Notes/updateContent": "allow anyone to update the content of a note",
  "/api/Notes/getNoteDetails": "allow anyone to get the details of a note",
  "/api/Notes/getNotesByUser": "allow anyone to get the notes by a user",
  "/api/PasswordAuth/register": "allow anyone to register a user",
  "/api/Summaries/setSummary": "allow anyone to set a summary",
  "/api/Summaries/setSummaryWithAI": "allow anyone to set a summary with AI",
  "/api/Summaries/getSummary": "allow anyone to get a summary",
  "/api/Summaries/deleteSummary": "allow anyone to delete a summary",
  "/api/Tags/addTag": "allow anyone to add a tag to an item",
  "/api/Tags/removeTagFromItem": "allow anyone to remove a tag from an item",
  "/api/Tags/updateTags": "allow anyone to update the tags of an item",
  "/api/Tags/_getTagsForItem": "allow anyone to get the tags for an item",
  "/api/Tags/_getTagDetails": "allow anyone to get the details of a tag",
  "/api/Tags/_getAllUserTags": "allow anyone to get all the tags for a user",
  "/api/Folder/_getRootFolderId":
    "allow anyone to get the root folder id for a user",
  "/api/Folder/getFolderStructure":
    "allow anyone to get the folder structure for a user",
  "/api/Folder/getAllFolders": "allow anyone to get all the folders for a user",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  "/api/Notes/createNote",
  "/api/Folder/createFolder",
  "/api/Folder/moveFolder",
];
