/**
 * Synchronizations for Scriblink concepts
 * Coordinates actions between authentication, folders, notes, tags, and summaries
 */

import {
  Folder,
  Notes,
  PasswordAuth,
  Request,
  Requesting,
  Summaries,
  Tags,
} from "@concepts";
import { actions, Sync } from "@engine";

/********************************** System Syncs **********************************/

/**
 * When a user is registered, automatically create their root folder
 */
export const CreateRootFolderOnRegistration: Sync = (
  { user },
) => ({
  when: actions(
    [PasswordAuth.register, {}, { user }],
  ),
  then: actions([
    Folder.initializeFolder,
    { user },
  ]),
});

/**
 * When a note is deleted, remove it from any folder it's in
 */
export const RemoveNoteFromFolderOnDeletion: Sync = ({ note }) => ({
  when: actions([
    Notes.deleteNote,
    { note },
  ]),
  then: actions([
    Folder.deleteItem,
    { item: note },
  ]),
});

/**
 * When an item summary is deleted, also delete the summary
 */
export const DeleteSummaryOnItemDeletion: Sync = ({ item }) => ({
  when: actions([
    Folder.deleteItem,
    { item },
  ]),
  then: actions([
    Summaries.deleteSummary,
    { item },
  ]),
});

/********************************** User Requests **********************************/

/** when a note is created, initialize it by adding it to the correct folder */
export const InitializeNewlyCreatedNote: Sync = (
  {
    user,
    content,
    folder,
    title,
    note,
  },
) => ({
  when: actions(
    [Notes.createNote, { user, title, folder, content }, { note }],
  ),
  then: actions(
    [Folder.insertItem, { item: note, folder }],
    [Notes.updateContent, { user, note, newContent: content }],
  ),
});

export const CreateNoteResponse: Sync = (
  { folder, note },
) => ({
  when: actions(
    [Notes.createNote, { folder }, { note }],
  ),
  then: actions([Requesting.respond, { folder, note: note }]),
});

export const CreateFolderRequest: Sync = (
  { request, user, title, parentFolderId },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Scriblink/createFolder", user, title, parentFolderId },
    { request },
  ]),
  then: actions([Folder.createFolder, { user, title, parentFolderId }]),
});

export const CreateFolderResponse: Sync = ({ request, folder }) => ({
  when: actions(
    [Requesting.request, { path: "/Scriblink/createFolder" }, { request }],
    [Folder.createFolder, {}, { folder }],
  ),
  then: actions([Requesting.respond, { request, folder }]),
});

export const DeleteNoteRequest: Sync = ({ request, user, noteId }) => ({
  when: actions([
    Requesting.request,
    { path: "/Scriblink/deleteNote", user, noteId },
    { request },
  ]),
  then: actions([Notes.deleteNote, { user, noteId }]),
});

export const DeleteNoteResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Scriblink/deleteNote" }, { request }],
    [Notes.deleteNote, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DeleteSummaryRequest: Sync = ({ request, user, noteId }) => ({
  when: actions([
    Requesting.request,
    { path: "/Scriblink/deleteSummary", user, noteId },
    { request },
  ]),
  then: actions([Summaries.deleteSummary, { user, noteId }]),
});

export const DeleteSummaryResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Scriblink/deleteSummary" }, { request }],
    [Summaries.deleteSummary, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DeleteFolderRequest: Sync = ({ request, user, folderId }) => ({
  when: actions([
    Requesting.request,
    { path: "/Scriblink/deleteFolder", user, folderId },
    { request },
  ]),
  then: actions([Folder.deleteFolder, { user, folderId }]),
});

export const DeleteFolderResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Scriblink/deleteFolder" }, { request }],
    [Folder.deleteFolder, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});
