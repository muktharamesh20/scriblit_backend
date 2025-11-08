# Design Document

Scriblink started off as a note-taking app with real-time collaboration and handwritten notes.  It also started off with a very different visual design.  There have been many design changes, both major and minor, which has led to Scriblink looking the way it does today.

---

## Major Redesigns #1 (Before Implementation)

In Assignment 2, I chose to make an app with:
- Collaborative note-taking
- Hand-written notes

This also came with multiple different concepts such as “sections” to make collaborative hand-written notes be more user-friendly.

However, due to concerns about time constraints, the first major redesign was created.  I ended up adding:
- Automated summaries of notes
- Tagging of notes

Instead of helping students take better notes and be more present in lectures, this tool now helps students review their notes after lecture by letting them mark which notes they want to come back to, and getting summaries of their notes automatically.

---

## Major Redesigns #2 (Implementing it the First Time)

Throughout the design process, I noticed multiple missing functionalities within my app. Some of these include:
- Adding a search bar (to the front end).  This was using existing query methods in order to make it easier for users to search through their notes, titles, and summaries, to go back to some content that they want to review.
- I realized that all users need a root folder created for them immediately after they register for the app.  Otherwise, the folder hierarchy wouldn’t work.
- Additionally, my original concept design forgot about how to insert/move folders properly, so I added it in.
- Adding hashing to passwords to add privacy and make authentication more secure.  Context actually automatically tried adding other libraries to make my passwordAuth concept more secure.  Password hashing (with SHA) was cool because it was simple to implement and made storing passwords more secure and less risky.
- Automatically displaying tagged notes based on priority + recency (aka the tag overview section)
- In my old design, there was a complex way of filtering by folder, tag, and recency.  Now, there’s a very simple visual way to do this that highlights the highest priority notes that are most recent first
  - Additionally, once you’re done reviewing high priority notes, there’s a simple way to remove them from the dashboard itself
  -  All of this helps our goal of making it easier for the user to come back and review notes by reducing the friction for them to actually find the troublesome notes.
- Adding users to the state of Folder (to keep track of who had access to which)
  - In order to control access to different folders, I realized I needed to add the ownerId to the folder state.
- Deletion of summaries and tags (associated with the tag) when you delete a note
  - In a bug which revealed I was accidentally associating summaries with note names instead of note id’s, I also recognized that I forgot about a sync.  I needed to delete the summaries and tags of a note every time a deleted the note itself.
- Realizing autogenerate summaries should only autogenerate if there’s nothing inside
  - I wanted summaries to autogenerate every time you made a change, but this would burn up credits for gemini.  Additionally, suppose that you manually edited a summary.  You wouldn’t want the AI to replace your summary with a completely new one randomly.  Thus, summaries are only automatically generated if there’s a certain word count (you’ve actually started to write notes), you’re exiting a note (so you’re done writing), and there is no summary already existing for the note now.  However, the option to regenerate the summary with AI is always there in case the users want to do that.

---

## Visual Changes

- Added a markdown editor to the website.  This is better for organization.
- Used visual design study to create a better design for the app.  It was very minimalist, and the color and font were chosen to convey professionalism while also some comfort.  It was also laid out to draw your eyes to the three main sections: the search bar, your folders/notes hierarchy, and finally your tagged notes which are sorted by priority.
- I also created a couple versions of the logo, and the current one goes very well with the rest of the app.
- I also added a button to check the summaries of notes from the dashboard itself.  The search bar lets you search for things inside of summaries, but you can also hover over a note and a ✨ shows up.  Clicking on it gives you a popup that lets you skim through the summary of the note and lets you regenerate the summary or edit the summary if you don’t like it.

---

## Major Concept Redesigns #3 (Tweaking the Design)

During the last week of designing the site, I made a few more design changes.

### Adding the Syncs
This made some of the logic (ie deleting all the subfolders and notes under a parent folder) a lot simpler.  It also helped assure me of the correctness of my code more than my frontend logic did.

### Adding auth tokens
One problem with the previous version of Scriblink’s design is that if you were at the login page, you could simply type in the dashboard’s url and you would be logged in as the previous user.  There were no time limits in place log ins, and this just has a lot of security issues as discussed in lecture.

In order to address this, I changed the passwordAuth concept to have a few more methods.  Register and authenticate would now give you a JWT token which would expire after a specified time period.  Authenticate would not take in passwords and usernames, but instead these JWT tokens.

### Optimizing usefulness of JWT tokens
An issue I ran into was deciding how long these JWT tokens should last.  There is something in the frontend that if you click log out, the browser will forget that you were logged in, but there’s always the security risk that the JWT token is leaked and then someone would just have access to your account without anyone knowing.  

In order to fix this, I added the `refresh()` action.  Basically, the idea is every time that you do an action, you get a new access token.  However, your access token time limit is very small, only 5 minutes.  Thus, if you are inactive for more than 5 minutes, you are logged out.  However, if you do any action (ie you are writing your notes, or tagging your notes, or looking at summaries), then your browser gets a new JWT token, extending your time logged in.  If you’re in a lecture taking notes, you will be considered active and will extend your time.

This way, users are logged out after 5 minutes of inactivity, and authentication is much more secure.
This was implemented in the syncs.

### Changing all routes to syncs
Unfortunately, all routes except register and authenticate needed authentication (Users don’t want strangers to be able to access their notes).  This meant that every route had to have a “sync”.  However, this also served the dual purpose of allowing us to refresh the JWT tokens and extending the user’s session, so it ended up working out.

### Removing refresh buttons on tagOverview
I had a refresh button on the top of tagOverview.  However, I wanted it to update automatically every time there was an update to the tags instead of me manually having to make it update.  Thus, I made it trigger on any tag changes or any time you entered the dashboard.

### Switched error message of AI summary generation
I used to just display the error message that my Summary Concept gave me (ie “The summary contained meta language and was invalid”).  However, this would just be confusing to users and they don’t need to know that.  Instead, now there are only two error messages.  
- “This note is too short to generate a summary”
- “Error generating high quality summary.  Please try again or create your own”.

### Making tagsOverview going faster
The section which displayed tags on the dashboard was super slow, and only got slower after I added password authentication and deployed to render.  It took upwards of 30 seconds to show up upon loading, and over 30 seconds to update when you added or deleted a tag from a note.

I realized the reason was because a certain section of code was calling the API for every single note the user had, and then trying to find and organize the tags and dates associated with that note.  I realized making the backend do a lot of this logic could help improve performance as we would only make one API call rather than 50, and only use 1 authentication request (and token update!) rather than 50.  Changing it to a single call which returned all of that information dramatically sped everything up to under 5 seconds before a refresh.
