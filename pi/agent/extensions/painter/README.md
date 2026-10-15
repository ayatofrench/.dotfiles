# Painter

Amp-style blocking image generation and editing exposed as the `painter` tool. There is no `image_gen` alias.

## Configuration

Painter resolves the nearest trusted `<workspace>/.pi/agents/painter.md`, falling back to `~/.pi/agent/agents/painter.md`.

Frontmatter:

```yaml
---
name: painter
description: Generate or edit raster images.
backend: codex # auto | pi | codex
model: openrouter/openai/gpt-image-2
---
```

The Markdown body supplies stable image-generation guidance.

### Backends

- `auto`: use the configured Pi image model when its provider has authentication; otherwise use Codex.
- `pi`: require the configured Pi image model. Pi 0.82 currently exposes image generation through OpenRouter, so use an exact `openrouter/<model-id>` reference such as:
  - `openrouter/openai/gpt-image-2`
  - `openrouter/google/gemini-3-pro-image`
  - `openrouter/google/gemini-3.1-flash-image-preview`
- `codex`: run `codex exec --profile default --ephemeral` and use Codex's subscription-backed native `image_gen` capability. The explicit `default` Codex profile prevents a custom provider (such as Azure) from leaking into image generation. Painter stages Codex in an isolated temporary directory and grants write access only to the selected output directory.

`auto` falls back only when the direct provider is not configured. It does not retry a failed or billed direct request through Codex.

## Tool behavior

`painter` accepts a complete prompt, up to three workspace-local reference image paths, and an optional workspace-local output path. Outputs are normalized to PNG, returned inline, and saved under `output/painter/` by default. Existing files are preserved by selecting a versioned sibling.

Run `/reload` after changing the extension or global Painter definition.
