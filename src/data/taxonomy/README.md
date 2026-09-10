# Community taxonomy data

Two data files back the community fields in the registration wizard:

| File | Backs | Verified? |
| --- | --- | --- |
| `casteTaxonomy.json` | Religion → Caste → Subcaste comboboxes | **No — partial seed** |
| `konguKulams.json` | Kongu Vellalar Gounder Kulam / Koottam selector | **No — sourced, unreviewed** |

Both carry a `meta` block recording provenance, a `verified` flag, and an `unresolved`
list. The UI reads `meta.verified`; while it is `false`, every combobox backed by the
file also accepts free-text entry, so a missing option never blocks a registration.

---

## Open task 1 — complete the caste/subcaste taxonomy

**Status: not done. This is a data task, not a coding task.**

`casteTaxonomy.json` currently contains:

- a complete `religions` list (from the product spec),
- a narrow starter set of caste names taken from the Tamil Nadu BC/MBC list,
- **no subcastes at all**.

To finish it:

1. Transcribe the full approved community list from the Tamil Nadu Department of
   Backward Classes, Most Backward Classes and Minorities Welfare —
   <https://www.bcmbcmw.tn.gov.in/bclist.htm>, mirrored on
   <https://tn.data.gov.in/catalog/list-backward-classesbc-most-backward-classesmbc-and-denotified-communitiesdnc-tamil-nadu>.
   The PDF was not machine-readable during seeding, so this needs a person or a
   proper PDF extraction pass.
2. Map each community to a religion. The government list is flat and administrative —
   it is **not** organised by religion, and some communities span more than one.
   This mapping is editorial and must be reviewed by someone who knows the domain.
3. Populate subcastes only from a citable published source. Record the source in
   `meta.sources` and reference it from each entry's `attestedBy`.
4. Extend beyond Tamil Nadu only when the platform actually serves those markets.

**Do not populate this file from an LLM's recollection.** These lists carry real
social weight, and a plausible-looking wrong entry is worse than a missing one —
which is why the free-text fallback exists.

When the file is genuinely reviewed, set `meta.verified` to `true`. That flag turns
off the free-text fallback and makes the comboboxes strict.

---

## Open task 2 — review the Kongu Vellalar kulam list

**Status: seeded from sources, awaiting community review.**

`konguKulams.json` holds 152 entries transcribed from two community-maintained
sources that agree on the great majority of names:

- <https://konguvellalargounders.blogspot.com/p/kongu-vellalar-kulam-kootam_5.html> (145 entries)
- <http://kongupavalangattivellalagounder.blogspot.com/2018/03/list-of-kongu-vellalar-kootams-kongu.html> (151 entries)

Each entry records which source attested it in `attestedBy`. Entries attested by
only one source need the closest scrutiny.

Before launch, a community-knowledgeable reviewer should:

1. Confirm English spellings and add Tamil-script names (only 5 entries have them).
2. Resolve the probable duplicate variants flagged in `meta.unresolved` —
   Chellam/Sellan, Cheran/Seran/Seralan, Nettai Maniyan/Maniyan.
3. Cross-check against a printed community reference. Neither blog is an
   authoritative published register.

### A note on the count

The spec described "roughly 60" kulams. The sources describe about **145** in total,
of which roughly **64** are commonly cited as the major or currently-active subsects.
The "60" figure appears to refer to those major subsects rather than the full list.
The seed carries the full list; if the product wants only the major ones, add a
`major: true` flag per entry during review rather than deleting entries.

---

## Editing these files

They are plain JSON and are safe for a non-developer to edit. Structure:

```jsonc
// casteTaxonomy.json
{ "religions": [ { "id", "label", "castes": [ { "id", "label", "subcastes": [ { "id", "label" } ] } ] } ] }

// konguKulams.json
{ "kulams": [ { "id", "name", "tamil"?, "aliases"?, "attestedBy" } ] }
```

`id` values are stable keys — existing profiles reference them. Change a `label`
freely; **never** change or reuse an `id`.

The server also exposes the taxonomy at `GET /api/taxonomy` so an admin tool can read
it without a rebuild. See the `CasteTaxonomy` model in `prisma/schema.prisma` for the
DB-backed version that supersedes these files once an admin starts editing.
