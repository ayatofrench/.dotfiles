-- Completion framework
local M = {
  "hrsh7th/nvim-cmp",
  dependencies = {
    "hrsh7th/cmp-nvim-lsp",
    "hrsh7th/cmp-nvim-lua",
    "hrsh7th/cmp-nvim-lsp-signature-help",
    "hrsh7th/cmp-path",
    "hrsh7th/cmp-buffer",
    "saadparwaiz1/cmp_luasnip",
    "L3MON4D3/LuaSnip",
  },
  config = function()
    -- Completion Plugin Setup
    --
    local cmp = require("cmp")
    local source_mapping = {
      buffer = "[Buffer]",
      nvim_lsp = "[LSP]",
      nvim_lua = "[Lua]",
      path = "[Path]",
    }
    local lspkind = require("lspkind")

    cmp.setup({
      -- Enable LSP snippets
      snippet = {
        expand = function(args)
          require("luasnip").lsp_expand(args.body)
        end,
      },

      mapping = {
        ["<C-p>"] = cmp.mapping.select_prev_item(),
        ["<C-n>"] = cmp.mapping.select_next_item(),
        -- Add tab support
        ["<S-Tab>"] = cmp.mapping.select_prev_item(),
        ["<Tab>"] = cmp.mapping.select_next_item(),
        ["<C-S-f>"] = cmp.mapping.scroll_docs(-4),
        ["<C-f>"] = cmp.mapping.scroll_docs(4),
        ["<C-Space>"] = cmp.mapping.complete(),
        ["<C-e>"] = cmp.mapping.close(),
        ["<CR>"] = cmp.mapping.confirm({
          behavior = cmp.ConfirmBehavior.Insert,
          select = true,
        }),
      },

      -- Installed sources:

      sources = {
        { name = "nvim_lsp", keyword_length = 3 }, -- from language server
        { name = "nvim_lsp_signature_help" }, -- display function signatures with current parameter emphasized
        { name = "nvim_lua", keyword_length = 2 }, -- complete neovim's Lua runtime API such vim.lsp.*
        { name = "buffer", keyword_length = 2 }, -- source current buffer
        { name = "luasnip" }, -- nvim-cmp source for vim-vsnip
        { name = "calc" }, -- source for math calculation
        { name = "path" }, -- file paths
      },

      -- window = {
      --     completion = cmp.config.window.bordered(),
      --     documentation = cmp.config.window.bordered(),
      -- },

      formatting = {
        fields = { "menu", "abbr", "kind" },
        format = lspkind.cmp_format({
          menu = source_mapping,
        }),
        -- format = function(entry, item)
        -- local menu_icon ={
        --     nvim_lsp = 'λ',
        --     luasnip = '⋗',
        --     buffer = 'Ω',
        --     path = '🖫',
        -- }
        -- item.menu = menu_icon[entry.source.name]
        -- item.kind = lspkind.presets.default[item.kind]
        --     local menu = source_mapping[entry.source.name]
        --     item.menu = menu
        --     return item
        -- end,
      },
    })
  end,
}

return M