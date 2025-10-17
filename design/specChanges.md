# Overall Website Changes
There are multiple changes I have made since Assignment 2.  My biggest issue from Assignment 2 was that my main feature might not be feasible in the timeframe that we have.  I wanted to add real-time collaboration (with handwritten notes).  However, trying to interpret handwriting can take up a lot of credits when using AI, and real-time collaboration is difficult to do. Thus, I've removed the shared-notes concept.  The notes are also no longer handwritten, and instead typed which is more feasible and less expensive.

My main feature will now be a tagging feature which allows students to tag lectures based on how urgent it is to come back to.  This makes it simpler to review notes and visually reminds students to come back to the sections that confused them the most (helps students from pushing back studying to the last minute).  It will also summarize each note so the student can quickly glance at the content. The website will also have an folder feature to organize notes.  


# Specific Concept Changes
## Summarizer
In assignment 2, the summarizer concept did not have an LLM component.  Now, I have augmented it with an LLM component that allows you to either manually create the summary or use AI to do it for you for a specific note.

## CollaborativeNotes
I am no longer doing the collaboration feature.  The concept might have been a little too app-specific too.  This feature is now simply Notes.  Notes just have text and an owner associated with them.

## Folder
Multiple changes to the folder concept.  I realized that I needed to add users to the state of the folder concept to track who owns each folder.  I also realized how seperated the concepts actually are (check designFile.md) and that I needed a deleteItem method here and I didn't actually need to delete items in the deleteFolder method (since we're only storing ids... the actual concept implementing the item/note will deal with that).