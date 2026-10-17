# EcoCycle image assets

All five source images were supplied by the project owner in the conversation on 2026-10-16. No stock-site downloads or hotlinked photographs are used. No photographer, license or partner affiliation is invented. The original sources/licensing were not supplied; record that information here when available before public distribution.

The files were encoded locally as WebP (quality 82; mobile variants quality 80), with proportional resizing and no upscaling. Responsive variants have a `-640` suffix. The original attachments are unchanged. In-page crops use CSS `object-fit: cover`.

| User image | Local file | Main size | Main use |
| --- | --- | --- | --- |
| 1 — electronics pile at an industrial site | `ewaste-hero.webp` | 1440 × 803, about 102 KB | Homepage hero; electronics/cable category cards |
| 2 — electronics sorting team | `electronics-sorting-team.webp` | 1100 × 836, about 106 KB | Homepage recycling feature; account preview pages |
| 3 — overhead discarded electronics | `discarded-electronics.webp` | 735 × 412, about 83 KB | Homepage impact section; About; category cards |
| 4 — recycling facility | `recycling-facility.webp` | 510 × 572, about 66 KB | About recycling process |
| 5 — collection truck | `electronics-collection-truck.webp` | 736 × 736, about 114 KB | How It Works; Services collector section |

Additional responsive files: `ewaste-hero-640.webp`, `electronics-sorting-team-640.webp`, `discarded-electronics-640.webp`, `electronics-collection-truck-640.webp`.

Combined image payload on disk: approximately 700 KB for all nine files. A browser selects a suitable variant; it does not need both sizes of every photo.

Photographs are illustrative. They do not establish an EcoCycle-owned facility, collection partner, certification, service area or actual employee identity. Captions and copy avoid those claims.

## Optional category photographs

The supplied images do not provide clear, standalone photos of batteries, chargers or keyboards. Those three cards deliberately use Lucide illustrations with the same color palette. No missing URL is requested. To replace these illustrations later, supply:

- `batteries.webp` — batteries prepared for separate collection.
- `chargers.webp` — phone chargers and laptop power adapters.
- `keyboards.webp` — standalone computer keyboards.

Use images you have permission to publish, ideally at least 640 × 400 pixels, and add their metadata to `src/data/siteContent.js`. Existing category labels and fallback illustrations remain usable without them.
