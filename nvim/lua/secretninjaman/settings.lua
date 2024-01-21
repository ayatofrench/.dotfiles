local M = {}

M.nvim_workspace = os.getenv("NVIM_WORKSPACE") or "personal"

M.theme = "solarized-osaka"

M.treesitter_parsers = {
  "astro",
  "bash",
  "c",
  "cmake",
  "cpp",
  "comment",
  "dockerfile",
  "elixir",
  "fish",
  "go",
  "graphql",
  -- "help",
  "html",
  "javascript",
  "json",
  "lua",
  "markdown",
  "norg",
  -- "odin",
  "ocaml",
  "proto",
  "python",
  "regex",
  "ruby",
  "rust",
  "scss",
  "sql",
  "svelte",
  "toml",
  "tsx",
  "typescript",
  "vim",
  "yaml",
  "zig",
}

M.lps_servers = {
  -- LSP
  "astro",
  "clangd",
  -- "cmake",
  "cssls",
  "elixirls",
  "html",
  "jsonls",
  "rust_analyzer",
  "gopls",
  -- "denols",
  "tsserver",
  -- "denols",
  "svelte",
  "prismals",
  "tailwindcss",
  -- "solargraph",
  "eslint",
  "pyright",
  "lua_ls",
  -- "sqlls",
  "yamlls",
  "taplo",
  "vimls",
  "ols",
  "ocamllsp",
  "zls",
  -- -- Formatter
  -- "black",
  -- "prettier",
  -- "stylua",
  -- Linter
  -- "rubocop",
  -- "eslint_d",
  -- "shellcheck",
  -- "tflint",
  -- "yamllint",
}

M.mason_tools = {
  "black",
  "stylua",
  "prettierd",
  "eslint_d",
  -- "mypy",
  "ruff",
  "misspell",
  "shellcheck",
  "shfmt",
  "yamllint",
}

M.telescope_file_ignore_patterns = {
  "%.7z",
  "%.JPEG",
  "%.JPG",
  "%.MOV",
  "%.RAF",
  "%.burp",
  "%.bz2",
  "%.cache",
  "%.class",
  "%.dll",
  "%.docx",
  "%.dylib",
  "%.epub",
  "%.exe",
  "%.flac",
  "%.ico",
  "%.ipynb",
  "%.jar",
  "%.jpeg",
  "%.jpg",
  "%.lock",
  "%.mkv",
  "%.mov",
  "%.mp4",
  "%.otf",
  "%.pdb",
  "%.pdf",
  "%.png",
  "%.rar",
  "%.sqlite3",
  "%.svg",
  "%.tar",
  "%.tar.gz",
  "%.ttf",
  "%.webp",
  "%.zip",
  ".git/",
  ".gradle/",
  ".idea/",
  ".settings/",
  ".vale/",
  ".vscode/",
  "__pycache__/*",
  "build/",
  "env/",
  "gradle/",
  "node_modules/",
  "smalljre_*/*",
  "target/",
  "vendor/*",
  "zig-cache/*",
}
return M
