<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## UI story coverage

Every component added under `src/components/ui/` must include a matching
`<Component>.ui.story.vue` in `src/pages/Stories/components/` in the same
change. The story must be auto-registered in the Stories catalog, document the
component's public API, and demonstrate its important states and interactions.
Update the UI story catalog tests whenever the expected component/story set
changes.

## Import paths

Parent-directory imports (`../`) are forbidden. Import files from the same
directory with `./`; import files outside the current directory through an
absolute `~/` alias.

## Component reuse

Before creating any component, inspect the existing component catalog and
codebase for a suitable reusable component. If no suitable component exists,
explain the proposed component and ask the developer for approval before
creating it. Do not introduce a new component without that approval; this
prevents redundant and duplicate implementations.

## UI text

Do not render user-facing copy as raw text in UI templates. Always use the
shared `Text` component from `~/components/ui` for visible headings, labels,
descriptions, messages, and other textual content.
