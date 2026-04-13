# FAMILY: content.publishing

## SKILLS
### content.topic.map
- **Purpose**: Map a high-level idea into a 10-article cluster.
- **Motions**: Brainstorm -> Group -> Sequence -> Tag.

### content.outline.build
- **Purpose**: Build a structured outline with H1-H3 hierarchy and SEO keywords.
- **Workflow**: Identify Goal -> Map Sections -> Insert Data Points -> Verify Flow.

### content.edit.review
- **Purpose**: Perform a multi-pass review (Grammar, Tone, LeeWay Standard compliance).
- **Workflow**: Scan for Passive Voice -> Check Keyword Density -> Verify 5W+H Header.

---

# WORKFLOW: content.blog_pipeline
1. **Trigger**: "Write blog series on [X]"
2. **Execute**: `content.topic.map`
3. **Loop**: For each topic, run `content.outline.build` -> `content.draft.prepare` (via local writing agent).
4. **Finalize**: `content.edit.review` -> `content.format.publish` to [Local CMS/Static Site].
