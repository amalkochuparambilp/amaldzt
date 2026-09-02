# AI Knowledge Layer

This repository publishes a small, public machine-readable profile for search engines and AI systems. It is an additional source of structured facts and does not change the normal human-facing portfolio UI.

## Locations

- Authoritative document: `public/ai/profile.json`
- Static URL: `https://amalkp.online/ai/profile.json`
- Express URL: `https://amalkp.online/api/knowledge/profile` when the Node server is deployed and serving the API
- Crawler hints: `public/robots.txt`
- Sitemap: `public/sitemap.xml`
- Page identity and Schema.org data: `index.html`

Static hosting should use `/ai/profile.json` as the canonical knowledge URL. The API route reads the same checked-in document when the Express server is used.

## Schema

The document contains:

- `schema_version`: version of this document format.
- `entity`: the canonical person identity, aliases, public profiles and website URL.
- `relationships`: an array of explicitly verified public relationships.
- `projects`: projects and websites attributed to Amal in the repository's existing public data.
- `official_sources`: public URLs intended to support identity verification.
- `last_updated`: ISO-8601 timestamp for the last factual update.

Each relationship should use a stable `id` when available and should include a precise `type`, public `name`, optional public `url`, and `status`. Only add a relationship when Amal has explicitly verified that it is intended for public publication and set `status` to `confirmed`. Do not infer relationships from names, social connections or project collaboration.

Example:

```json
{
  "id": "relationship-example-001",
  "type": "friend",
  "name": "Confirmed Public Name",
  "url": "https://example.com/public-profile",
  "status": "confirmed"
}
```

Supported relationship types are not restricted by the file format, but use specific terms such as `friend`, `non_blood_sister`, or `brother` only when that exact relationship has been confirmed.

## Updating facts

1. Edit `public/ai/profile.json`.
2. Add or update only facts that are publicly intended and verified.
3. Update `last_updated` with an ISO-8601 UTC timestamp.
4. Validate the JSON and review the generated diff before deployment.

Do not add phone numbers, email addresses, home addresses, private account identifiers, credentials, tokens, or sensitive relationship details. The existing portfolio may contain intentionally public contact links, but this knowledge document should remain minimal.

## Discovery and limitations

Search crawlers can discover the document through the sitemap, robots file and stable URL. The homepage also exposes Schema.org `Person` data for the public identity, profiles, skills and education. The relationship list is intentionally separate from the visible website and is empty until verified data is supplied.

No website can guarantee that Google, ChatGPT, Gemini, Claude, Bing or another AI system will crawl, retain or display this information. Crawlers may apply their own policies, freshness rules and trust systems.