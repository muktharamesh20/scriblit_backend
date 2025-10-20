---
timestamp: 'Mon Oct 20 2025 18:53:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185348.382bce2e.md]]'
content_id: 036f56e5264452650df259493a841c8aa81b0dea6a418582611a3ae114a966d2
---

# concept specifications:

**concept Summaries\[Item]**
-**purpose**
\- highlights the most important part of Item
-**principle**
\- the user can either manually create a summary or ask an LLM to generate one.
\- If AI is chosen, the LLM receives the Item content and then returns a concise, readable summary.
\- The user can accept or edit this summary.

* **state**
  * a set of `Item` with
    * summary String

  * invariants
    -every item has at most one summary
    -summary is a concise, relevant, and readable highlight of the item's content
    -summary contains no meta-language or AI disclaimers
    -summary is at most 50% the length of the item's content or under 150 words
* **actions**
  * setSummary(summary: String, item: Item): (s: Summary)
    * effect if `item` already exists, change the summary associated with `item` to `summary`.
    * If `item` does not exist in Summaries, create a new summary for `item` with a summary `summary`.
  * setSummaryWithAI(text: String, item: Item): (s: Summary)
    * requires text is nonempty
    * effect creates a summary of `text` with an LLM and associates it with the item
  * deleteSummary(item: Item): (i: Item)
    * requires item has a summary ssociated with it
    * effect deletes the summary associated with the item
