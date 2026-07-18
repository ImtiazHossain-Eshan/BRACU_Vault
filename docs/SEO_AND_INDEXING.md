# SEO And Indexing

BRACU Vault targets course and resource discovery queries from BRAC University CSE students.

## Indexable Pages

Indexable:

- Homepage
- Orbit page
- Course pages

Noindex:

- Dashboard
- Brand page
- Verify page
- Admin page

## Signals

Current source signals:

- Static sitemap at `/sitemap.xml`
- `robots.txt` with sitemap reference
- Canonical URLs pointing to `https://bracuvault.me`
- Per-course titles and descriptions
- WebSite JSON-LD
- CollectionPage JSON-LD for courses
- FAQPage JSON-LD on the homepage

## Search Console Workflow

After a production deployment:

1. Open Google Search Console.
2. Submit `https://bracuvault.me/sitemap.xml`.
3. Inspect `https://bracuvault.me`.
4. Request indexing for the homepage.
5. Inspect key course URLs and request indexing if needed.

## Duplicate Host Prevention

Cloudflare should redirect these hosts to the apex:

- `www.bracuvault.me`
- `bracu-vault.pages.dev`

Canonical tags help, but a 301 redirect is stronger and avoids crawl budget waste.

