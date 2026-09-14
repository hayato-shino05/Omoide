# Omoide Music

## Product context

Omoide is a birthday-memory web app: a shared place to celebrate, record, and revisit memories. Music is a listening layer inside that experience, not a separate music service.

## Product goal

Let a user choose one song, preview it, confirm it, and keep listening while they remain in the birthday-memory experience. The selected reference must be safe to carry between the picker, player, composer, and published memory card.

## Core capabilities

1. `MusicPlayer`: desktop now-playing bar with Play/Pause, previous/next, shuffle (🔀), repeat modes (🔁 off/all/one), custom progress-filled seek bar, volume control, lyrics drawer toggle, and song picker button.
2. `LyricsDrawer`: expandable/collapsible drawer presenting real-time synchronized LRC lyrics with smooth auto-scroll.
3. `MobileBottomDock`: mobile listening bar and navigation entry, with safe-area-aware placement.
4. `SongPickerModal`: search-first picker for curated presets (Cloudflare R2 + Supabase) and provider results (Jamendo, SoundCloud); preview is temporary, confirmation is explicit.
5. `State Persistence`: playback position, active track, shuffle, and repeat modes persist across browser refreshes and sessions via Zustand and `localStorage`.
6. `SelectedMusicTrackRow` & `MusicComment`: selection in post composer and memory cards preserving attached track references.

## Core interaction

`choose → preview → confirm` is the mental model.

- Preview starts or stops listening only; it does not commit a selection.
- `Confirm` commits the selected `provider:trackId` to the calling surface.
- `Cancel` or `Escape` stops preview and leaves the previously confirmed value unchanged.
- Loading, empty, unavailable, blocked, playback-error, and retry states are explicit and recoverable where possible.
- A page transition or unmount stops audio and does not retain an unconfirmed choice.

A post has one attached song. Music actions must not replace, clear, or otherwise lose the written memory.

## Shared contract

The cross-surface value is `provider:trackId`. The provider is explicit in the reference and must never be inferred from a title. Existing provider boundaries remain in place, including Jamendo and SoundCloud where supported by the current product. Invalid, stale, blocked, or unavailable references are not silently rewritten to another provider.

## Visual and interaction direction

- Keep all 13 seasonal and celebration themes. Music chrome consumes the existing `--music-*` semantic tokens rather than introducing per-theme visual forks.
- Use the soft, rounded, layered-surface language established by Time Capsule.
- Borrow the density and now-playing interaction model familiar from Spotify, without copying Spotify branding, colors, or identity.
- Preserve the birthday-memory hierarchy: the memory and community content remain primary; music is a calm supporting layer.
- Keep controls touchable, keyboard-operable, clearly labelled, and understandable without color or motion alone.
- Respect responsive layout, safe areas, focus restoration, screen-reader status, and `prefers-reduced-motion`.

## Explicit non-goals

This product slice does not add music upload, playlists, queues, lyrics, recommendations, a new provider, or a separate music library. It does not change the `provider:trackId` contract, the existing 13 themes, or production-gate concerns outside the five surfaces.

## Acceptance bar

The redesign is acceptable only when the five surfaces share the same selection and playback mental model, preserve confirmed data across responsive modes, and provide accessible default, loading, empty, error, retry, and reduced-motion behavior. User-visible copy belongs to i18n; raw provider errors, credentials, and internal implementation details must not be shown.

## Assumptions and evidence boundary

This document records the product direction agreed for the redesign. Detailed component behavior and token ownership remain in `docs/ux/music-redesign/DESIGN.md`, `docs/ux/music-redesign/EXPERIENCE.md`, and the feature documents beside them. Those documents also identify behavior that still needs runtime or assistive-technology verification; this product context does not treat such open questions as confirmed behavior.
