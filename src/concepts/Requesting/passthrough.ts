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
  "/api/PasswordAuth/register": "allow anyone to register a user",
  "/api/PasswordAuth/authenticate": "allow anyone to authenticate a user",
  "/api/Notes/getNoteDetails": "allow anyone to get the details of a note",
  "/api/Notes/getNotesByUser": "allow anyone to get the notes by a user",
  "/api/Tags/_getTagsForItem": "allow anyone to get the tags for an item",
  "/api/Tags/_getAllUserTags": "allow anyone to get all the tags for a user",
  "/api/Folder/_getRootFolderId":
    "allow anyone to get root folder id because it gives no info to the requester",
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
  "/api/Folder/deleteFolder", // Use Requesting syncs for authentication
  "/api/Notes/deleteNote", // Use Requesting syncs for authentication
  "/api/Notes/setTitle", // Use Requesting syncs for authentication
  "/api/Folder/insertItem",
  "/api/Tags/removeTagFromItem",
  "/api/Summaries/deleteSummary",
  "/api/Notes/updateContent",
  "/api/Tags/addTag",
  "/api/Summaries/setSummary",
  "/api/Summaries/setSummaryWithAI",
  "/api/Summaries/getSummary",

  // passthrough routes that are not public
  "/api/Notes/_getNoteDetails",
  "/api/Folder/initializeFolder",
  "/api/Folder/isDescendant",
  "/api/Folder/collectDescendants",
  "/api/Folder/deleteItem",
  "/api/Folder/_getFolderChildren",
  "/api/Folder/_getFolderItems",
  "/api/Folder/_getFolderDetails",
  "/api/PasswordAuth/refresh",
  "/api/PasswordAuth/_getUserFromToken",
  "/api/PasswordAuth/_generateNewAccessToken",
  "/api/Summaries/validateSummary",
  "/api/Summaries/validateSummaryLength",
  "/api/Summaries/validateContentRelevance",
  "/api/Summaries/validateNoMetaLanguage",
  "/api/Tags/updateTags",
  "/api/Tags/_getItemsByTag",
  "/api/Tags/_getTagDetails",
  "/api/Folder/_getFolderDetails",
];
