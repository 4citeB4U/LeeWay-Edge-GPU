# WORKFLOW: full_service_dispatcher

1. **TRIGGER**: "Start Dispatching Shift"
2. **ACTIVE_FAMILIES**: [logistics, telephony, email]
3. **SEQUENCE**:
    - **Step 1**: Run `logistics.dispatch.triangulate_loads` for all active drivers.
    - **Step 2**: If profitable loads found, run `logistics.broker.negotiate_load`.
    - **Step 3**: Use `telephony.google_voice.outbound` to call the broker.
    - **Step 4**: Upon agreement, use `email.gmail.send_reply` to send insurance/MC info.
    - **Step 5**: Log full transaction to `MemoryStore`.

---

# WORKFLOW: automatic_marketing_lead_gen

1. **TRIGGER**: "Launch Lead Gen for [Keyword]"
2. **ACTIVE_FAMILIES**: [marketing, web, email]
3. **SEQUENCE**:
    - **Step 1**: `web.search.execute` for local vendors matching [Keyword].
    - **Step 2**: `web.scrape.extract` to find owner names and email addresses.
    - **Step 3**: `marketing.seo.local_optimize` to generate a "Sample Audit" for that site.
    - **Step 4**: `email.gmail.prioritize_and_draft` a personalized audit proposal.
    - **Step 5**: Wait for human "APPROVE" signal before sending.

---

# WORKFLOW: tech_help_desk_auto_respond

1. **TRIGGER**: Incoming support email or ticket.
2. **ACTIVE_FAMILIES**: [technical, email]
3. **SEQUENCE**:
    - **Step 1**: Parse email for keywords like "Broken", "Internet", "Slow".
    - **Step 2**: If "Slow", run `technical.os.performance_tune` instructions via remote agent.
    - **Step 3**: If "Internet", run `technical.iot.reconnect_mesh`.
    - **Step 4**: Draft a step-by-step resolution email for the user.
