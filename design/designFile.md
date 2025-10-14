## make sure to link to the snapshots corresponding to the interesting moments

## a design file that explains changes that you made to the design of the application as a whole, and that includes 5-10 pointers to interesting moments (explained below) in your development, each with a couple of sentences explaining it.

Sequences of action executions that correspond to less common cases: probing interesting corners of the functionality, undoing actions with deletions and cancellations, repeating actions with the same arguments, etc. In some of these scenarios actions may be expected to throw errors.

As you work on your implementation, some moments will be worth recording. For example, you might discover that your concept specification was wrong in some way; a test run might expose a subtle bug in a concept implementation; the LLM might generate some code that is unexpectedly good or bad in some way; you might discover a way to simplify your design; and so on. When any such moment arises, you should save a link to the relevant file and place it in your design document. Make sure to save a link to a snapshot in the context area, not a link to a file in the design or source code areas (since those are mutable). If this moment did not arise from running the LLM, you should save the relevant files by creating a little design document to record your observations, and then run the tool with the save option to snapshot the files first.


## Interesting moment 1
This is my first attempt at trying to use the ctx tool to create a concept spec.
![Generating Conecpt Spec Prompt](/Users/muktharamesh/Documents/6104/scriblit_backend/context/design/brainstorming/questioning.md/20251013_232619.9d7e6fff.md)
Interestingly, I tried to give the tool some background information and instead of using the background information to create a better spec, it just changed my old specs to look more like the background information.  Specifically, it changed the purpose to what it wanted the purpose to be.