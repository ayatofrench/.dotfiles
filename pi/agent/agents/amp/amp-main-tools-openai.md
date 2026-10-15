---
# Straight extraction from Amp capture `amp-codex-request` (2026-02-02).
# POST /api/provider/openai/v1/responses, model gpt-5.2-codex
# Text below is verbatim from the request body.
---

## Tool: apply_patch

Apply a patch to one or more files using the Codex patch format.

This tool is preferred for single file edits in deep mode. Do not use it for auto-generated changes (like package.json updates) or when scripting is more efficient (like search and replace across a codebase).

You MUST read the file with `Read` before applying a patch to it. Even if you already read it, read it again before applying a patch.

## Patch Format

The patch must be wrapped in `*** Begin Patch` and `*** End Patch` markers.

Each operation starts with one of three headers:
- `*** Add File: <path>` - create a new file. Every following line must start with `+`.
- `*** Delete File: <path>` - remove an existing file. Nothing follows.
- `*** Update File: <path>` - patch an existing file (optionally with a rename via `*** Move to:`).

## Rules
- **Include at least 3-5 context lines** (lines starting with ` `) around changes to ensure unique matching
- **When editing conflict markers**, ensure their length matches the file's existing marker length (e.g., jj markers like `<<<<<<<`, `%%%%%%%`, or `\\\\`/longer).
- For Add File: every content line MUST start with `+` (which gets stripped)
- For Update File hunks: lines start with ` ` (context), `-` (remove), or `+` (add)
- Use multiple `@@` context blocks when needed to accurately locate the edit position
- Use `*** End of File` marker to anchor changes at end of file
- Multiple files can be patched in a single call
- File paths can be relative or absolute
- Don't use apply patch for edits that an available linter or formatter could do based on the instructions in the users AGENTS.md file.

# Examples

Add a new file
```json
{"patchText":"*** Begin Patch\n*** Add File: path/to/new/file.ts\n+const hello = 'world'\n+export { hello }\n*** End Patch"}
```

Simple update with context
```json
{"patchText":"*** Begin Patch\n*** Update File: src/utils/helpers.ts\n@@\n function processData(input: string) {\n-  const result = input.trim()\n-  return result\n+  const result = input.trim().toLowerCase()\n+  return result || 'default'\n }\n*** End Patch"}
```

Update a nested structure (include extra context lines to disambiguate the edit)
```json
{"patchText":"*** Begin Patch\n*** Update File: src/services/user-service.ts\n@@\n class UserService {\n   async updateUser(id: string, data: UserData) {\n     const user = await this.findById(id)\n-    user.name = data.name\n+    user.name = data.name?.trim() || user.name\n+    user.updatedAt = new Date()\n     await this.save(user)\n   }\n }\n*** End Patch"}
```

Use multiple @@ blocks to skip intervening code
```json
{"patchText":"*** Begin Patch\n*** Update File: src/config/settings.ts\n@@\n const defaultConfig = {\n   name: 'myapp',\n   version: '1.0.0',\n@@\n   logging: {\n-    level: 'info',\n+    level: 'debug',\n     format: 'json',\n   },\n*** End Patch"}
```

Editing content within jj conflict markers
```json
{"patchText":"*** Begin Patch\n*** Update File: src/config.ts\n@@\n <<<<<<< Conflict 1 of 1\n %%%%%%% Changes from base to side #1\n \\\\\\       (rebase destination)\n- const API_URL = 'http://localhost:3000'\n+ const API_URL = 'https://api.example.com'\n +++++++ Contents of side #2\n const API_URL = 'http://staging.example.com'\n >>>>>>> Conflict 1 of 1 ends\n*** End Patch"}
```

Deleting a file
```json
{"patchText":"*** Begin Patch\n*** Delete File: path/to/delete.ts\n*** End Patch"}
```

Moving/renaming a file with changes
```json
{"patchText":"*** Begin Patch\n*** Update File: src/old-name.ts\n*** Move to: src/new-name.ts\n@@\n-export function oldName() {\n+export function newName() {\n   return 'hello'\n }\n*** End Patch"}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "patchText": {
      "description": "The full patch text that describes all changes to be made",
      "type": "string"
    }
  },
  "required": [
    "patchText"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: find_thread

Find Amp threads (conversation threads with the agent) using a query DSL.

## What this tool finds

This tool searches **Amp threads** (conversations with the agent), NOT git commits. Use this when the user asks about threads, conversations, or Amp history.

## Query syntax

- **Keywords**: Bare words or quoted phrases for text search: `auth` or `"race condition"`
- **File filter**: `file:path` to find threads that touched a file: `file:src/auth/login.ts`
- **Repo filter**: `repo:url` to scope to a repository: `repo:github.com/owner/repo` or `repo:owner/repo`
- **Author filter**: `author:name` to find threads by a user: `author:alice` or `author:me` for your own threads
- **Date filters**: `after:date` and `before:date` to filter by date: `after:2024-01-15`, `after:7d`, `before:2w`
- **Task filter**: `task:id` to find threads that worked on a task: `task:142`. Use `task:142+` to include threads that worked on the task's dependencies, `task:142^` to include dependents (tasks that depend on this task), or `task:142+^` for both.
- **Cluster filter**: `cluster_of:id` to find threads in the same cluster as a thread: `cluster_of:T-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Combine filters**: Use implicit AND: `auth file:src/foo.ts repo:amp after:7d`

All matching is case-insensitive. File paths use partial matching. Date formats: ISO dates (`2024-01-15`), relative days (`7d`), or weeks (`2w`).

## When to use this tool

- "which thread touched this file" / "which thread modified this file"
- "what thread last changed X" / "find the thread that edited X"
- "find threads about X" / "search threads mentioning Y"
- Any question about Amp thread history or previous Amp conversations
- When the user says "thread" and is referring to Amp work, not git commits

## When NOT to use this tool

- If the user asks about git commits, git history, or git blame → use git commands instead
- If the user wants to know WHO (a person) made changes → use git log

# Examples

User asks: "Find threads where we discussed the monorepo migration"
```json
{"query":"monorepo migration","limit":10}
```

User asks: "Show me threads that modified src/server/index.ts"
```json
{"query":"file:src/server/index.ts","limit":5}
```

User asks: "What threads have touched this file?" (for current file in github.com/sourcegraph/amp)
```json
{"query":"file:core/src/tools/tool-service.ts repo:sourcegraph/amp"}
```

User asks: "Find auth-related threads in the amp repo"
```json
{"query":"auth repo:sourcegraph/amp"}
```

User asks: "Show me my recent threads"
```json
{"query":"author:me","limit":10}
```

User asks: "Find threads from the last week about authentication"
```json
{"query":"auth after:7d","limit":10}
```

User asks: "Which threads worked on task 142 and its dependencies?"
```json
{"query":"task:142+"}
```

User asks: "Show me all threads related to task 50 and tasks that depend on it"
```json
{"query":"task:50^"}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query using DSL syntax. Supports keywords, file:path, repo:url, author:name, after:date, before:date, task:id, and cluster_of:id filters."
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of threads to return. Defaults to 20."
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: finder

Intelligently search your codebase: Use it for complex, multi-step search tasks where you need to find code based on functionality or concepts rather than exact matches. Anytime you want to chain multiple grep calls you should use this tool.

WHEN TO USE THIS TOOL:
- You must locate code by behavior or concept
- You need to run multiple greps in sequence
- You must correlate or look for connection between several areas of the codebase.
- You must filter broad terms ("config", "logger", "cache") by context.
- You need answers to questions such as "Where do we validate JWT authentication headers?" or "Which module handles file-watcher retry logic"

WHEN NOT TO USE THIS TOOL:
- When you know the exact file path - use Read directly
- When looking for specific symbols or exact strings - use glob or Grep
- When you need to create, modify files, or run terminal commands

USAGE GUIDELINES:
1. Always spawn multiple search agents in parallel to maximise speed.
2. Formulate your query as a precise engineering request.
   ✓ "Find every place we build an HTTP error response."
   ✗ "error handling search"
3. Name concrete artifacts, patterns, or APIs to narrow scope (e.g., "Express middleware", "fs.watch debounce").
4. State explicit success criteria so the agent knows when to stop (e.g., "Return file paths and line numbers for all JWT verification calls").
5. Never issue vague or exploratory commands - be definitive and goal-oriented.


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search query describing to the agent what it should. Be specific and include technical terms, file types, or expected code patterns to help the agent find relevant code. Formulate the query in a way that makes it clear to the agent when it has found the right thing."
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: glob

Fast file pattern matching tool that works with any codebase size

Use this tool to find files by name patterns across your codebase. It returns matching file paths sorted by most recent modification time first.

## File pattern syntax

- `**/*.js` - All JavaScript files in any directory
- `src/**/*.ts` - All TypeScript files under the src directory (searches only in src)
- `*.json` - All JSON files in the current directory
- `**/*test*` - All files with "test" in their name
- `web/src/**/*` - All files under the web/src directory
- `**/*.{js,ts}` - All JavaScript and TypeScript files (alternative patterns)
- `src/[a-z]*/*.ts` - TypeScript files in src subdirectories that start with lowercase letters

# Examples

Find all typescript files in the codebase
```json
{"filePattern":"**/*.ts"}
```

Find all test files under a specific directory
```json
{"filePattern":"src/**/*test*.ts"}
```

Search for svelte component files in the web/src directory
```json
{"filePattern":"web/src/**/*.svelte"}
```

Find the 10 most recently modified JSON files
```json
{"filePattern":"**/*.json","limit":10}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "filePattern": {
      "type": "string",
      "description": "Glob pattern like \"**/*.js\" or \"src/**/*.ts\" to match files"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return"
    },
    "offset": {
      "type": "number",
      "description": "Number of results to skip (for pagination)"
    }
  },
  "required": [
    "filePattern"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: Grep

Search for exact text patterns in files using ripgrep, a fast keyword search tool.

# When to use this tool
- Finding exact text matches (variable names, function calls, specific strings)
- Use finder for semantic/conceptual searches

# Strategy
- Use 'path' or 'glob' to narrow searches; run multiple focused calls rather than one broad search
- Uses Rust-style regex (escape `{` and `}`); use `literal: true` for literal text search

# Constraints
- Results are limited to 100 matches (up to 10 per file)
- Lines are truncated at 200 characters

# Examples

Find a specific function name across the codebase
```json
{"pattern":"registerTool","path":"core/src"}
```

Search for interface definitions in a specific directory
```json
{"pattern":"interface ToolDefinition","path":"core/src/tools"}
```

Use a case-sensitive search to find the exact string `ERROR:`
```json
{"pattern":"ERROR:","caseSensitive":true}
```

Find TODO comments in frontend code
```json
{"pattern":"TODO:","path":"web/src"}
```

Find a specific function name in test files
```json
{"pattern":"restoreThreads","glob":"**/*.test.ts"}
```

Find all REST API endpoint definitions
```json
{"pattern":"app\\.(get|post|put|delete)\\([\"']","path":"server"}
```

Locate CSS class definition in stylesheets
```json
{"pattern":"\\.container\\s*\\{","path":"web/src/styles"}
```

# Complementary to finder
- Use finder first to locate relevant code concepts
- Then use Grep to find specific implementations or all occurrences
- For complex tasks, iterate between both tools to refine your understanding


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "pattern": {
      "type": "string",
      "description": "The pattern to search for (regex)"
    },
    "path": {
      "type": "string",
      "description": "The file or directory path to search in. Cannot be used with glob."
    },
    "glob": {
      "type": "string",
      "description": "The glob pattern to search for. Cannot be used with path."
    },
    "caseSensitive": {
      "type": "boolean",
      "description": "Whether to search case-sensitively"
    },
    "literal": {
      "type": "boolean",
      "description": "Whether to treat the pattern as a literal string instead of a regex"
    }
  },
  "required": [
    "pattern"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: handoff

Hand off work to a new thread that runs in the background. Use this tool when you need to continue work in a fresh context because:
- The current thread is getting too long and context is degrading
- You want to start a new focused task while preserving context from the current thread
- The current thread's context window is near capacity

When you call this tool:
1. A new thread will be created with relevant context from this thread
2. The new thread will start running in the background
3. The current thread continues to run - you can finish up any remaining work

When the user message tells you to continue the work or to handoff to only one new thread, you should follow to the new thread by setting follow to true.

The goal parameter should describe what work should continue in the new thread. Keep it short—a single sentence or at most one paragraph. Focus on what needs to be done next, not what was already completed.

Use the mode parameter when the user explicitly requests a different agent mode (e.g., "deep", "smart", "rush") for the new thread.

<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "goal": {
      "type": "string",
      "description": "A short description of the next task to accomplish in the new thread. Should be a single sentence or at most one paragraph. Focus on what needs to be done next, not what was already completed."
    },
    "follow": {
      "type": "boolean",
      "default": false,
      "description": "If true, navigate to the new thread after creation. Use this when the current thread is stopping and work should continue in the new thread."
    },
    "mode": {
      "type": "string",
      "description": "The agent mode for the new thread. Defaults to the current thread's agent mode if not specified."
    }
  },
  "required": [
    "goal",
    "follow"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: librarian

The Librarian - a specialized codebase understanding agent that helps answer questions about large, complex codebases.
The Librarian works by reading from GitHub - it can see the private repositories the user approved access to in addition to all public repositories on GitHub.

The Librarian acts as your personal multi-repository codebase expert, providing thorough analysis and comprehensive explanations across repositories.

It's ideal for complex, multi-step analysis tasks where you need to understand code architecture, functionality, and patterns across multiple repositories.

WHEN TO USE THE LIBRARIAN:
- Understanding complex multi-repository codebases and how they work
- Exploring relationships between different repositories
- Analyzing architectural patterns across large open-source projects
- Finding specific implementations across multiple codebases
- Understanding code evolution and commit history
- Getting comprehensive explanations of how major features work
- Exploring how systems are designed end-to-end across repositories

WHEN NOT TO USE THE LIBRARIAN:
- Simple local file reading (use Read directly)  
- Local codebase searches (use finder)
- Code modifications or implementations (use other tools)
- Questions not related to understanding existing repositories

USAGE GUIDELINES:
1. Be specific about what repositories or projects you want to understand
2. Provide context about what you're trying to achieve
3. The Librarian will explore thoroughly across repositories before providing comprehensive answers
4. Expect detailed, documentation-quality responses suitable for sharing
5. When getting an answer from the Librarian, show it to the user in full, do not summarize it.

EXAMPLES:
- "How does authentication work in the Kubernetes codebase?"
- "Explain the architecture of the React rendering system"
- "Find how database migrations are handled in Rails"
- "Understand the plugin system in the VSCode codebase"
- "Compare how different web frameworks handle routing"
- "What changed in commit abc123 in my private repository?"
- "Show me the diff for commit fb492e2 in github.com/mycompany/private-repo"


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Your question about the codebase. Be specific about what you want to understand or explore."
    },
    "context": {
      "type": "string",
      "description": "Optional context about what you're trying to achieve or background information."
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: look_at

Extract specific information from a local file (including PDFs, images, and other media).

Use this tool when you need to extract or summarize information from a file without getting the literal contents. Always provide a clear objective describing what you want to learn or extract.

Pass reference files when you need to compare two or more things.

## When to use this tool

- Analyzing PDFs, images, or media files that the Read tool cannot interpret
- Extracting specific information or summaries from documents
- Describing visual content in images or diagrams
- When you only need analyzed/extracted data, not raw file contents

## When NOT to use this tool

- For source code or plain text files where you need exact contents—use Read instead
- When you need to edit the file afterward (you need the literal content from Read)
- For simple file reading where no interpretation is needed

# Examples

Summarize a local PDF document with a specific goal
```json
{"path":"docs/specs/system-design.pdf","objective":"Summarize main architectural decisions.","context":"We are evaluating this system design for a new project we are building."}
```

Describe what is shown in an image file
```json
{"path":"assets/mockups/homepage.png","objective":"Describe the layout and main UI elements.","context":"We are creating a UI component library and need to understand the visual structure."}
```

Compare two screenshots to identify visual differences
```json
{"path":"screenshots/before.png","objective":"Identify all visual differences between the two screenshots.","context":"We are reviewing UI changes for a feature update and need to document all differences.","referenceFiles":["screenshots/after.png"]}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Workspace-relative or absolute path to the file to analyze."
    },
    "objective": {
      "type": "string",
      "description": "Natural-language description of the analysis goal (e.g., summarize, extract data, describe image)."
    },
    "context": {
      "type": "string",
      "description": "The broader goal and context for the analysis. Include relevant background information about what you are trying to achieve and why this analysis is needed."
    },
    "referenceFiles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Optional list of workspace-relative or absolute paths to reference files for comparison (e.g., to compare two screenshots or documents)."
    }
  },
  "required": [
    "path",
    "objective",
    "context"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: oracle

Consult the Oracle - an AI advisor powered by OpenAI's GPT-5.2 reasoning model that can plan, review, and provide expert guidance.

The Oracle has access to the following tools: Read, Grep, glob, web_search, read_web_page, read_thread, find_thread.

The Oracle acts as your senior engineering advisor and can help with:

WHEN TO USE THE ORACLE:
- Code reviews and architecture feedback
- Finding a bug in multiple files
- Planning complex implementations or refactoring
- Analyzing code quality and suggesting improvements
- Answering complex technical questions that require deep reasoning

WHEN NOT TO USE THE ORACLE:
- Simple file reading or searching tasks (use Read or Grep directly)
- Codebase searches (use finder)
- Web browsing and searching (use read_web_page or web_search)
- Basic code modifications and when you need to execute code changes (do it yourself or use Task)

USAGE GUIDELINES:
1. Be specific about what you want the Oracle to review, plan, or debug
2. Provide relevant context about what you're trying to achieve. If you know that 3 files are involved, list them and they will be attached.

# Examples

Review the authentication system architecture and suggest improvements
```json
{"task":"Review the authentication architecture and suggest improvements","files":["src/auth/index.ts","src/auth/jwt.ts"]}
```

Plan the implementation of real-time collaboration features
```json
{"task":"Plan the implementation of real-time collaboration feature"}
```

Analyze the performance bottlenecks in the data processing pipeline
```json
{"task":"Analyze performance bottlenecks","context":"Users report slow response times when processing large datasets"}
```

Review this API design and suggest better patterns
```json
{"task":"Review API design","context":"This is a REST API for user management","files":["src/api/users.ts"]}
```

Debug failing tests after refactor
```json
{"task":"Help debug why tests are failing","context":"Tests fail with \"undefined is not a function\" after refactoring the auth module","files":["src/auth/auth.test.ts"]}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "task": {
      "type": "string",
      "description": "The task or question you want the Oracle to help with. Be specific about what kind of guidance, review, or planning you need."
    },
    "context": {
      "type": "string",
      "description": "Optional context about the current situation, what you've tried, or background information that would help the Oracle provide better guidance."
    },
    "files": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Optional list of specific file paths (text files, images) that the Oracle should examine as part of its analysis. These files will be attached to the Oracle input."
    }
  },
  "required": [
    "task"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: painter

Generate an image using an AI model.

IMPORTANT: Only invoke this tool when the user explicitly asks to use the "painter" tool. Do not use this tool automatically or proactively.

- When using this tool, request a single image at a time. Multiple input reference images are OK.
- Use savePath to specify the output file path only if the user explicitly asks for it.

## When to use this tool

- When the user explicitly asks to use the "painter" tool
- When the user explicitly requests image generation using this tool

## When NOT to use this tool

- Do NOT use automatically for UI mockups, diagrams, or icons—only unless explicitly requested by user
- For code-linked diagrams—use the "mermaid" tool instead
- For analyzing existing images—use the "look_at" tool instead

## Example Scenarios

- **Generate a image from user description**: Provide only a prompt with detailed visual instructions. No inputImagePaths needed.
- **Create with reference**: Provide one or more reference images provided by the user for style/content inspiration. The model will use these as guidance to create a new image matching your prompt. Your prompt should describe how to use each reference (e.g., "match the color palette from the first image", "use the icon style from the second").
- **Edit/composite images**: Provide the image to edit and optionally another image with elements to incorporate. The prompt should describe what to change or how to combine them.

# Examples

Generate an app icon for a CLI tool
```json
{"prompt":"1024x1024 app icon. Dark background #1a1a2e. Glowing terminal cursor symbol in cyan #00d9ff. Minimal, modern style for macOS dock."}
```

Generate a hero image using existing brand assets as reference
```json
{"prompt":"Hero image for documentation landing page. Match the color palette from the first image and icon style from the second. Abstract flowing code symbols. 1920x600 dimensions.","inputImagePaths":["/Users/alice/project/docs/assets/brand-colors.png","/Users/alice/project/docs/assets/icon-style.png"]}
```

Redact sensitive data from a terminal screenshot
```json
{"prompt":"Blur or redact any visible API keys, tokens, passwords, or email addresses in this terminal screenshot. Keep command output readable. Preserve dimensions.","inputImagePaths":["/Users/alice/project/docs/screenshots/terminal-output.png"]}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "Detailed instructions for image generation based on user requirements. Include specifics about design, layout, style, colors, composition, and any other visual details the user mentioned."
    },
    "inputImagePaths": {
      "type": "array",
      "description": "Optional image paths provided by the user for editing or style guidance. Maximum 3 images allowed. Each image path should be same as the `sourcePath` provided by the user.",
      "maxItems": 3,
      "items": {
        "type": "string"
      }
    },
    "savePath": {
      "type": "string",
      "description": "Optional URI string to save the generated image. Must be an absolute file URI. Only valid when a single image is generated."
    }
  },
  "required": [
    "prompt"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: Read

Read a file or list a directory from the file system. If the path is a directory, it returns a line-numbered list of entries. If the file or directory doesn't exist, an error is returned.

- The path parameter MUST be an absolute path.
- By default, this tool returns the first 500 lines. To read more, call it multiple times with different read_ranges.
- Use the Grep tool to find specific content in large files or files with long lines.
- If you are unsure of the correct file path, use the glob tool to look up filenames by glob pattern.
- The contents are returned with each line prefixed by its line number. For example, if a file has contents "abc\
", you will receive "1: abc\
". For directories, entries are returned one per line (without line numbers) with a trailing "/" for subdirectories.
- This tool can read images (such as PNG, JPEG, and GIF files) and present them to the model visually.
- When possible, call this tool in parallel for all files you will want to read.
      - Avoid tiny repeated slices (e.g., 50\u2011line chunks). If you need more context from the same file, read a larger range or the full default window instead.

<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "The absolute path to the file or directory (MUST be absolute, not relative)."
    },
    "read_range": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "minItems": 2,
      "maxItems": 2,
      "description": "An array of two integers specifying the start and end line numbers to view. Line numbers are 1-indexed. If not provided, defaults to [1, 1000]. Examples: [500, 700], [700, 1400]"
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: read_thread

Read and extract relevant content from another Amp thread by its ID.

This tool fetches a thread (locally or from the server if synced), renders it as markdown, and uses AI to extract only the information relevant to your specific goal. This keeps context concise while preserving important details.

## When to use this tool

- When the user pastes or references an Amp thread URL (format: https://ampcode.com/threads/T-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) in their message
- When the user references a thread ID (format: T-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or @T-abc123)
- When the user asks to "apply the same approach from [thread URL]"
- When the user says "do what we did in [thread URL]"
- When the user says "implement the plan we devised in [thread URL]"
- When you need to extract specific information from a referenced thread

## When NOT to use this tool

- When no thread ID is mentioned
- When working within the current thread (context is already available)

## Parameters

- **threadID**: The thread identifier in format T-{uuid} (e.g., "T-a38f981d-52da-47b1-818c-fbaa9ab56e0c")
- **goal**: A clear description of what information you're looking for in that thread. Be specific about what you need to extract.

# Examples

User asks "Implement the plan we devised in https://ampcode.com/threads/T-3f1beb2b-bded-4fda-96cc-1af7192f24b6"
```json
{"threadID":"T-3f1beb2b-bded-4fda-96cc-1af7192f24b6","goal":"Extract the implementation plan, design decisions, architecture approach, and any code patterns or examples discussed"}
```

User asks: "Do what we did in https://ampcode.com/threads/T-f916b832-c070-4853-8ab3-5e7596953bec, but for the Oracle tool"
```json
{"threadID":"T-f916b832-c070-4853-8ab3-5e7596953bec","goal":"Extract the implementation approach, code patterns, techniques used, and any relevant code examples that can be adapted for the Oracle tool"}
```

User asks: "Take the SQL queries from https://ampcode.com/threads/T-95e73a95-f4fe-4f22-8d5c-6297467c97a5 and turn it into a reusable script"
```json
{"threadID":"T-95e73a95-f4fe-4f22-8d5c-6297467c97a5","goal":"Extract all SQL queries, their purpose, parameters, and any context needed to understand how to make them reusable"}
```

User asks: "Apply the same fix from @T-def456 to this issue"
```json
{"threadID":"T-def456","goal":"Extract the bug description, root cause, the fix/solution, and relevant code changes"}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "threadID": {
      "type": "string",
      "description": "The thread ID in format T-{uuid} (e.g., \"T-a38f981d-52da-47b1-818c-fbaa9ab56e0c\")"
    },
    "goal": {
      "type": "string",
      "description": "A clear description of what information you need from the thread. Be specific about what to extract."
    }
  },
  "required": [
    "threadID",
    "goal"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: read_web_page

Read the contents of a web page at a given URL.

When only the url parameter is set, it returns the contents of the webpage converted to Markdown.

When an objective is provided, it returns excerpts relevant to that objective.

If the user asks for the latest or recent contents, pass `forceRefetch: true` to ensure the latest content is fetched.

Do NOT use for access to localhost or any other local or non-Internet-accessible URLs; use `curl` via the Bash instead.

# Examples

Summarize recent changes for a library. Force refresh because freshness is important.
```json
{"url":"https://example.com/changelog","objective":"Summarize the API changes in this software library.","forceRefetch":true}
```

Extract all text content from a web page
```json
{"url":"https://example.com/docs/getting-started"}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "The URL of the web page to read"
    },
    "objective": {
      "type": "string",
      "description": "A natural-language description of the research goal. If set, only relevant excerpts will be returned. If not set, the full content of the web page will be returned. "
    },
    "forceRefetch": {
      "type": "boolean",
      "description": "Force a live fetch of the URL (default: use a cached version that may be a few days old)"
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: shell_command

Runs a shell command and returns its output.
- Always set the `workdir` param when using the shell_command function. Do not use `cd` unless absolutely necessary.

<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "command": {
      "type": "string",
      "description": "The shell script to execute in the user's default shell"
    },
    "workdir": {
      "type": "string",
      "description": "The working directory to execute the command in"
    },
    "login": {
      "type": "boolean",
      "description": "Whether to run the shell with login shell semantics. Defaults to true."
    },
    "timeout_ms": {
      "type": "number",
      "description": "The timeout for the command in milliseconds"
    }
  },
  "required": [
    "command"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: skill

Load a specialized skill that provides domain-specific instructions and workflows.

When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.

The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.

Parameters:
- name: The name of the skill to load (must match one of the skills listed below)

Example: To use the web-browser skill for interacting with web pages, call this tool with name: "web-browser"

# Available Skills

- **building-skills**: Use when creating any skill/agent skill/amp skill. Load FIRST—before researching existing skills or writing SKILL.md. Provides required structure, naming conventions, and frontmatter format.
- **code-review**: Run comprehensive code review using the code_review tool.
- **walkthrough**: Explore and visualize codebase architecture. Use when asked to "walk me through", "show how X works", "explain the flow", "diagram the architecture", or understand how components connect and interact.

<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the skill to load"
    },
    "arguments": {
      "type": "string",
      "description": "Optional arguments to pass to the skill"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: Task

Perform a task (a sub-task of the user's overall task) using a sub-agent that has access to the following tools: Grep, glob, Read, Bash, edit_file, create_file, format_file, read_web_page, get_diagnostics, web_search, finder, skill, task_list.


When to use the Task tool:
- When you need to perform complex multi-step tasks
- When you need to run an operation that will produce a lot of output (tokens) that is not needed after the sub-agent's task completes
- When you are making changes across many layers of an application (frontend, backend, API layer, etc.), after you have first planned and spec'd out the changes so they can be implemented independently by multiple sub-agents
- When the user asks you to launch an "agent" or "subagent", because the user assumes that the agent will do a good job

When NOT to use the Task tool:
- When you are performing a single logical task, such as adding a new feature to a single part of an application.
- When you're reading a single file (use Read), performing a text search (use Grep), editing a single file (use edit_file)
- When you're not sure what changes you want to make. Use all tools available to you to determine the changes to make.

How to use the Task tool:
- Run multiple sub-agents concurrently if the tasks may be performed independently (e.g., if they do not involve editing the same parts of the same file), by including multiple tool uses in a single assistant message.
- You will not see the individual steps of the sub-agent's execution, and you can't communicate with it until it finishes, at which point you will receive a summary of its work.
- Include all necessary context from the user's message and prior assistant steps, as well as a detailed plan for the task, in the task description. Be specific about what the sub-agent should return when finished to summarize its work.
- Tell the sub-agent how to verify its work if possible (e.g., by mentioning the relevant test commands to run).
- When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "The task for the agent to perform. Be specific about what needs to be done and include any relevant context."
    },
    "description": {
      "type": "string",
      "description": "A very short description of the task that can be displayed to the user."
    }
  },
  "required": [
    "prompt",
    "description"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: undo_edit

Undo the last edit made to a file.

This command reverts the most recent edit made to the specified file.
It will restore the file to its state before the last edit was made.

Returns a git-style diff showing the changes that were undone as formatted markdown.


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "The absolute path to the file whose last edit should be undone (must be absolute, not relative)"
    }
  },
  "required": [
    "path"
  ],
  "additionalProperties": true
}
```
</details>

## Tool: web_search

Search the web for information relevant to a research objective.

Use when you need up-to-date or precise documentation. Use `read_web_page` to fetch full content from a specific URL.

# Examples

Get API documentation for a specific provider
```json
{"objective":"I want to know the request fields for the Stripe billing create customer API. Prefer Stripe's docs site."}
```

See usage documentation for newly released library features
```json
{"objective":"I want to know how to use SvelteKit remote functions, which is a new feature shipped in the last month.","search_queries":["sveltekit","remote function"]}
```


<details><summary>parameters</summary>

```json
{
  "type": "object",
  "properties": {
    "objective": {
      "type": "string",
      "description": "A natural-language description of the broader task or research goal, including any source or freshness guidance"
    },
    "search_queries": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Optional keyword queries to ensure matches for specific terms are prioritized (recommended for best results)"
    },
    "max_results": {
      "type": "number",
      "description": "The maximum number of results to return (default: 5)"
    }
  },
  "required": [
    "objective"
  ],
  "additionalProperties": true
}
```
</details>

