-- Auto Completion
return {
  {
    "saghen/blink.cmp",
    dependencies = "LuaSnip",
    version = "1.*",
    event = "InsertEnter",

    -- @module 'blink.cmp'
    -- @type blink.cmp.Config
    opts = {
      cmdline = {
        keymap = { preset = "inherit" },
        completion = { menu = { auto_show = true } },
      },
      keymap = {
        ["<Tab>"] = { "select_next", "snippet_forward", "fallback" },
      },
      completion = {
        list = {
          selection = { preselect = false, auto_insert = true },
          max_items = 10,
        },
        documentation = { auto_show = true },
      },
      snippets = { preset = "luasnip" },
      sources = {
        default = function()
          local sources = { "lsp", "buffer" }
          local ok, node = pcall(vim.treesitter.get_node)

          if ok and node then
            if not vim.tbl_contains({ "comment", "line_comment", "block_comment" }, node:type()) then
              table.insert(sources, "path")
            end
            if node:type() ~= "string" then
              table.insert(sources, "snippets")
            end
          end

          return sources
        end,
      },
    },
    config = function(_, opts)
      require("blink.cmp").setup(opts)

      vim.lsp.config("*", { capabilities = require("blink.cmp").get_lsp_capabilities(nil, true) })
    end,
  },
}
