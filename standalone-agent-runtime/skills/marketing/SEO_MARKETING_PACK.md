# SKILL: marketing.seo.local_optimize

## PURPOSE
To perform a full local SEO audit and optimization cycle for a specific vendor or business location.

## TRIGGER
"Optimize local SEO for [Business Name]"

## REQUIRED ADAPTERS
- browser.adapter
- search.adapter

## WORKFLOW
1. **Identify Business Entity**: Extract Name, Address, Phone (NAP) from local data.
2. **Scan Competitors**: Perform search for primary keyword + location; identify top 3 map results.
3. **Audit Citations**: Check Yelp, Google Maps, and Facebook for NAP consistency.
4. **Keyword Clustering**: Group primary keywords into Intent clusters (e.g., "Emergency Repair" vs "Maintenance").
5. **Schema Generation**: Produce JSON-LD LocalBusiness schema for the website.
6. **Action Report**: Generate a prioritized list of citation fixes and content updates.

## VALIDATION
- NAP Consistency Score > 90%
- Priority Keywords Map found
- Valid JSON-LD Generated

---

# SKILL: marketing.youtube.optimize

## PURPOSE
To optimize a YouTube video for maximum search visibility and retention before distribution.

## TRIGGER
"Optimize my YouTube video on [Topic]"

## WORKFLOW
1. **Trend Detection**: Scrape top 5 videos for [Topic] and extract high-performing tags.
2. **Title Generation**: Create 3 click-worthy titles using A/B testing psychology.
3. **Description Builder**: Write SEO-optimized description with timestamped chapters.
4. **Thumbnail Audit**: Analyze competitor thumbnails (color, text density) via computer vision.
5. **Tagging**: Map the video to the 15 most relevant high-volume, low-competition tags.

## VALIDATION
- Focus Keyword in first 100 characters of description.
- Chapter markers valid format.
