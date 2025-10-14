# prompt: I created a spec for my website Scriblink.  However, there are a few modifications that I want to make the Scriblink.  I'm supplying my original spec, and what I want to change, as well as some background on what a concept and specification are.  Use the background information to correctly modify my original spec to reflect the changes that I want.


The original Spec
"
![@spec](/Users/muktharamesh/Documents/6104/scriblit_backend/design/scriblinkSpec.md)"

What I want to change: "
![@specChanges](/Users/muktharamesh/Documents/6104/scriblit_backend/design/specChanges.md)"


## Background
What is a concept:
![@sconceptOverview](/Users/muktharamesh/Documents/6104/scriblit_backend/design/background/concept-design-overview.md)

What a good concept spec contains.
![@generatingConcepts](/Users/muktharamesh/Documents/6104/scriblit_backend/design/background/concept-specifications.md)


Spec examples
![@examples](/Users/muktharamesh/Documents/6104/scriblit_backend/design/background/detailed/concept-state.md)

Spec Rubric:
![@rubric](/Users/muktharamesh/Documents/6104/scriblit_backend/design/background/detailed/concept-rubric.md)
# response:

# response:

Here is the modified Scriblink website specification, incorporating your requested changes and maintaining the structure and principles of a good concept specification as outlined in your background materials.

---

# Scriblink Website Specification (Modified)

## 1. Introduction
Scriblink is an online collaborative whiteboard application. Users can draw, write, and share ideas in real-time with others. This document outlines the core features and technical requirements for the Scriblink website.

## 2. User Roles
*   **Guest User**: Can join a public board with a temporary ID. Limited features.
*   **Registered User**: Can create an account, save boards, manage privacy, and invite specific users.

## 3. Core Features

### 3.1. Whiteboard Functionality
*   **Drawing Tools**:
    *   **Pen Tool**: Draw freeform lines. Includes options for **stroke thickness (thin, medium, thick)**.
    *   **Eraser Tool**: Remove drawing elements.
    *   **Shapes Tool**: Draw predefined shapes, including **Line, Rectangle, Circle, and Arrow**.
*   **Text Tool**:
    *   Select the Text Tool from the toolbar to activate text input mode.
    *   Click anywhere on the canvas to place a text box.
    *   Users can type multi-line text into the active text box.
    *   Text boxes are **resizeable** by dragging their corners/edges.
    *   Text boxes are **draggable** across the canvas.
    *   **Basic Formatting**: Options for Font size (small, medium, large) and a limited selection of Font families (e.g., Arial, Times New Roman, Courier New).
    *   **Text Color**: Text will adopt the currently selected color from the color palette.
    *   **Real-time Collaboration**: Text entered by one user is instantly visible to all participants.
    *   **Editing Existing Text Boxes**: Other users can select and edit text boxes created by others. (Refer to section 6.1 Open Questions regarding conflict resolution).
*   **Color Palette**: Select various colors for drawing and text.
*   **Undo/Redo**: Revert or re-apply drawing and text actions.
*   **Real-time Synchronization**: All drawing and text actions are visible to all participants instantly.

### 3.2. Board Management
*   **Create New Board**: Start a fresh whiteboard session.
*   **Save Board**: Registered users can save the current state of a board.
*   **Load Board**: Registered users can retrieve a previously saved board.
*   **Share Board**: Generate a shareable link for others to join.
*   **Board Access Control (Registered Users Only)**: Registered users can define how others access their boards.
    *   **Public**: Anyone with the link can join and edit.
    *   **Private**: Only explicitly invited registered users can join.
    *   **Shared Read-Only**: Invited registered users can view the board content but *cannot* make any changes (drawing, typing, erasing). Guest users cannot access Read-Only boards.

### 3.3. User Accounts (Registered Users Only)
*   **Registration/Login**: Create an account using email/password.
*   **Dashboard**: View and manage all owned/shared boards.
*   **Profile Management**: Update user details.

### 3.4. Collaboration Features
*   **Participant List**: View active users currently on the board.

## 4. Technical Requirements

### 4.1. Frontend
*   **Framework**: React.js
*   **State Management**: **Zustand**
*   **Real-time Communication**: WebSockets (e.g., Socket.IO)
*   **Drawing Canvas**: HTML5 Canvas API

### 4.2. Backend
*   **Language/Framework**: Node.js (Express)
*   **Database**: MongoDB (for user accounts, board metadata, saved board data, and text box data including content, position, size, and formatting)
*   **Real-time Communication**: WebSockets (e.g., Socket.IO)
*   **Authentication**: JWT (JSON Web Tokens)

### 4.3. Deployment
*   **Cloud Platform**: AWS (EC2, S3 for static assets)
*   **CI/CD**: GitHub Actions

## 5. Future Considerations (Out of Scope for v1)
*   Image upload to boards.
*   Version history for boards.
*   Custom tool creation.
*   Audio/Video chat.
*   Advanced text formatting options (bold, italic, underline).

## 6. Open Questions
### 6.1. Text Tool Collaboration Conflict Resolution
*   When multiple users attempt to edit the same text box concurrently, how will conflicts be resolved?
    *   **Option A**: "Last edit wins" (simplest for v1).
    *   **Option B**: Implement a basic locking mechanism (more complex, but prevents data loss for concurrent edits).
    *   *Decision to be made during detailed design phase.*

---