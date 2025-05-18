local M = {}

M.setup = function()
  local group = vim.api.nvim_create_augroup("custom-treesitter", { clear = true })
  local ensure_installed = {
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
    "markdown_inline",
    "norg",
    "odin",
    "ocaml",
    --   "pkl",
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

  require("nvim-treesitter.configs").setup({
    ensure_installed = ensure_installed,
    sync_install = false,
    auto_install = true,
    modules = {},
    ignore_install = {},
    highlight = {
      enable = true, -- false will disable the whole extension
      disable = {}, -- list of language that will be disabled
      additional_vim_regex_highlighting = { "slim" },
    },
    incremental_selection = {
      enable = true,
      keymaps = {
        init_selection = "<CR>",
        scope_incremental = "<CR>",
        node_incremental = "<TAB>",
        node_decremental = "<S-TAB>",
      },
    },
    endwise = {
      enable = false,
    },
    textobjects = {
      select = {
        enable = true,
        -- Automatically jump forward to textobj, similar to targets.vim
        lookahead = true,
        keymaps = {
          -- You can use the capture groups defined in textobjects.scm
          ["af"] = "@function.outer",
          ["if"] = "@function.inner",
          ["ac"] = "@class.outer",
          ["ic"] = "@class.inner",
          ["al"] = "@loop.outer",
          ["il"] = "@loop.inner",
          ["ib"] = "@block.inner",
          ["ab"] = "@block.outer",
          ["ir"] = "@parameter.inner",
          ["ar"] = "@parameter.outer",
        },
      },
    },
  })

  -- require("nvim-ts-autotag").setup()

  local syntax_on = {
    elixir = true,
    go = true,
    typescript = true,
    typescriptreact = true,
    javascript = true,
    javascriptreact = true,
    astro = true,
    python = true,
    --    pkl = true,
  }

  vim.api.nvim_create_autocmd("FileType", {
    group = group,
    callback = function(args)
      local bufnr = args.buf
      local ft = vim.bo[bufnr].filetype
      pcall(vim.treesitter.start)

      if syntax_on[ft] then
        vim.bo[bufnr].syntax = "on"
      end
    end,
  })
end

return M
