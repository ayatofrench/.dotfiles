# Amp Prompt Extractions (straight)

Verbatim prompt extractions from Amp (ampcode.com) HTTP captures, kept as a
reference for aligning Pi subagents (`../oracle.md`, `../librarian.md`,
`../search.md`, etc.). No edits or merges — re-extract rather than hand-fix.

## Files

| File | Source capture | What it is |
| --- | --- | --- |
| `amp-main-system-anthropic.md` | `~/.pi/amp-request` | Main-thread system prompt (Claude, smart mode), all system blocks |
| `amp-main-tools-anthropic.md` | `~/.pi/amp-request` | Tool descriptions + schemas, incl. `finder`, `oracle`, `librarian`, `Task`, `handoff` |
| `amp-main-system-openai.md` | `~/.pi/amp-codex-request` | Main-thread system prompt variant sent to GPT/codex models |
| `amp-main-tools-openai.md` | `~/.pi/amp-codex-request` | Tool set for the OpenAIResponses variant |
| `amp-oracle.md` | `~/.pi/oracle-request` | Oracle subagent system prompt + its tool allowlist |
| `amp-searcher.md` | `~/.pi/searcher-request` | Finder/searcher subagent prompt (Gemini) |
| `amp-searcher-gemini-scout.md` | `~/.pi/gemini-scout-request` | Second capture of the same subagent (differs slightly) |
| `amp-review.md` | `~/personal/amp-proxy/review-request` | Code-review agent prompt (`amp review`) |

Captures date from 2026-02/03 (Amp 0.0.177…). Re-run the extractor after new
captures:

```bash
python3 ~/personal/amp-proxy/extract-prompts.py
```

## Why captures instead of the binary (as of 2026-08-17)

- Amp's binary references prompts by name only (`systemPrompt: "deep" |
  "rush" | "review" | "low" | "large"`); the text lives server-side.
- Since ~mid-2026, thread actors run on Amp's servers: the CLI only opens a
  json-rpc executor websocket (`/actors/gateway/threadActor/websocket/`) and
  runs tools locally. Provider LLM requests never traverse the client, so
  mitmproxy no longer sees prompts.
- To re-capture (works for older Amp or if the architecture reverts):
  ```bash
  mitmdump --listen-port 8889 \
    --set ssl_verify_upstream_trusted_ca=$HOME/Downloads/ZscalerRootCertificate-2048-SHA256.crt \
    -s ~/personal/amp-proxy/dump-amp-prompts.py
  # then, in another shell:
  NODE_EXTRA_CA_CERTS=~/.mitmproxy/mitmproxy-ca-cert.pem \
  HTTP_PROXY=http://localhost:8889 HTTPS_PROXY=http://localhost:8889 amp
  ```
  The addon also dumps executor websocket frames (`*-ws-thread.log`) in case
  prompt content ever rides over that channel.
