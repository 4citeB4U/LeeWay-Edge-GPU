# FAMILY: creator.youtube_ops

## SKILLS
### creator.script.prepare
- **Purpose**: Transform a topic into a high-retention video script (Hook, Value, CTA).

### creator.thumbnail.queue
- **Purpose**: Generate 4 thumbnail concepts based on competitor CTR high-performers.

### creator.analytics.review
- **Purpose**: Process exported CSV analytics to find the "Retension Drop" point and propose a fix for the next video.

---

# WORKFLOW: creator.video_publish_cycle
1. **Trigger**: "Publish New Video: [Topic]"
2. **Execute**: `creator.topic.plan` -> `creator.script.prepare`.
3. **Analyze**: `creator.title.optimize` -> `creator.thumbnail.queue`.
4. **Finalize**: `creator.description.prepare` -> `creator.upload.manage` (via browser adapter).
