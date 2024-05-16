local M = {
  "L3MON4D3/LuaSnip",

  dependencies = {
    -- Adds a number of user-friendly snippets
    "rafamadriz/friendly-snippets",
  },
  --   config = function()
  --     local ls = require("luasnip")
  --     local types = require("luasnip.util.types")
  --     require("luasnip.loaders.from_vscode").lazy_load()
  --
  --     ls.setup({
  --       history = true,
  --
  --       updateevents = "TextChanged,TextChangedI",
  --
  --       enable_autosnippets = true,
  --
  --       ext_opts = {
  --         [types.choiceNode] = {
  --           active = {
  --             virt_text = { { " « ", "NonTest" } },
  --           },
  --         },
  --       },
  --     })
  --
  --     for _, ft_path in ipairs(vim.api.nvim_get_runtime_file("lua/secretninjaman/snippets/ft/*.lua", true)) do
  --       loadfile(ft_path)()
  --     end
  --
  --     vim.keymap.set({ "i", "s" }, "<c-k>", function()
  --       if ls.expand_or_jumpable() then
  --         ls.expand_or_jump()
  --       end
  --     end, { silent = true })
  --
  --     vim.keymap.set({ "i", "s" }, "<c-j>", function()
  --       if ls.jumpable(-1) then
  --         ls.jump(-1)
  --       end
  --     end, { silent = true })
  --
  --     vim.keymap.set("i", "<c-l>", function()
  --       if ls.choice_active() then
  --         ls.change_choice(1)
  --       end
  --     end)
  --
  --     vim.keymap.set("i", "<c-u>", require("luasnip.extras.select_choice"))
  --
  --     -- vim.keymap.set("n", "<leader><leader>s
  --   end,
}

return M
