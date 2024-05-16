-- local settings = require("secretninjaman.settings")

local function colorMyPencils()
  -- local color = settings.theme or "rose-pine"
  -- local color = "solarized-osaka"
  -- vim.cmd.colorscheme(color)
  -- vim.api.nvim_set_hl(0, "Normal", { bg = "#111111" })
  -- vim.api.nvim_set_hl(0, "Normal", { bg = require("solarized-osaka.colors").default.bg })
  -- vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
  require("colorbuddy").colorscheme("gruvbuddy")
  require("colorizer").setup()

  local c = require("colorbuddy.color").colors
  local Group = require("colorbuddy.group").Group
  local g = require("colorbuddy.group").groups
  local s = require("colorbuddy.style").styles

  Group.new("@variable", c.superwhite, nil)

  Group.new("GoTestSuccess", c.green, nil, s.bold)
  Group.new("GoTestFail", c.red, nil, s.bold)

  -- Group.new('Keyword', c.purple, nil, nil)

  Group.new("TSPunctBracket", c.orange:light():light())

  Group.new("StatuslineError1", c.red:light():light(), g.Statusline)
  Group.new("StatuslineError2", c.red:light(), g.Statusline)
  Group.new("StatuslineError3", c.red, g.Statusline)
  Group.new("StatuslineError3", c.red:dark(), g.Statusline)
  Group.new("StatuslineError3", c.red:dark():dark(), g.Statusline)

  Group.new("pythonTSType", c.red)
  Group.new("goTSType", g.Type.fg:dark(), nil, g.Type)

  Group.new("typescriptTSConstructor", g.pythonTSType)
  Group.new("typescriptTSProperty", c.blue)

  -- vim.cmd [[highlight WinSeparator guifg=#4e545c guibg=None]]
  Group.new("WinSeparator", nil, nil)

  -- I don't think I like highlights for text
  -- Group.new("LspReferenceText", nil, c.gray0:light(), s.bold)
  -- Group.new("LspReferenceWrite", nil, c.gray0:light())

  -- Group.new("TSKeyword", c.purple, nil, s.underline, c.blue)
  -- Group.new("LuaFunctionCall", c.green, nil, s.underline + s.nocombine, g.TSKeyword.guisp)

  Group.new("TSTitle", c.blue)

  -- TODO: It would be nice if we could only highlight
  -- the text with characters or something like that...
  -- but we'll have to stick to that for later.
  Group.new("InjectedLanguage", nil, g.Normal.bg:dark())

  Group.new("LspParameter", nil, nil, s.italic)
  Group.new("LspDeprecated", nil, nil, s.strikethrough)
  Group.new("@function.bracket", g.Normal, g.Normal)
  Group.new("@variable.builtin", c.purple:light():light(), g.Normal)

  -- Group.new("VirtNonText", c.yellow:light():light(), nil, s.italic)
  Group.new("VirtNonText", c.gray3:dark(), nil, s.italic)

  Group.new("TreesitterContext", nil, g.Normal.bg:light())
  Group.new("TreesitterContextLineNumber", c.blue)
  -- hi TreesitterContextBottom gui=underline guisp=Grey
  -- Group.new("TreesitterContextBottom", nil, nil, s.underline)

  Group.new("@property", c.blue)
  Group.new("@punctuation.bracket.rapper", c.gray3, nil, s.none)
  Group.new("@rapper_argument", c.red, nil, s.italic)
  Group.new("@rapper_return", c.orange:light(), nil, s.italic)
  Group.new("@constructor.ocaml", c.orange:light(), nil, s.none)
  Group.new("constant", c.orange, nil, s.none)

  Group.new("@keyword", c.violet, nil, s.none)
  Group.new("@keyword.faded", g.nontext.fg:light(), nil, s.none)
  -- Group.new("@keyword.faded", c.green)

  Group.new("Function", c.yellow, nil, s.none)

  vim.cmd([[
    hi link @function.call.lua LuaFunctionCall
    hi link @lsp.type.variable.lua variable
    hi link @lsp.type.variable.ocaml variable
    hi link @lsp.type.variable.rust variable
    hi link @lsp.type.namespace @namespace
    hi link @punctuation.bracket.rapper @text.literal
    hi link @normal Normal
    hi link @tag.attribute.html type
    hi link @tag.delimiter.html @namespace
  ]])

  Group.new("Normal", c.superwhite, c.gray0)

  -- vim.defer_fn(function()
  --   loadfile(vim.api.nvim_get_runtime_file("lua/colorbuddy/plugins/init.lua", false)[1])()
  -- end, 10)
end

return {
  {
    "nvim-tree/nvim-web-devicons",
    config = function()
      require("nvim-web-devicons").setup()
    end,
  },
  { "folke/tokyonight.nvim" },
  {
    "tjdevries/colorbuddy.nvim",
    dependencies = {
      "norcalli/nvim-colorizer.lua",
    },
    priority = 1000,
    lazy = false,
    config = function()
      -- colorMyPencils()
      vim.cmd.colorscheme("gruvbuddy")
    end,
  },
  {
    "rose-pine/neovim",
    name = "rose-pine",
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    -- config = colorMyPencils(),
    -- require("nvim-web-devicons").setup()
    -- vim.cmd.colorscheme("solarized-osaka")
  },
  {
    "gruvbox-community/gruvbox",
    -- priority = 1000,
    name = "gruvbox",
    -- config = function()
    --   -- require("nvim-web-devicons").setup()
    --   -- vim.cmd.colorscheme("gruvbox")
    --   colorMyPencils()
    -- end,
  },
  {
    "craftzdog/solarized-osaka.nvim",
    name = "solarized-osaka",
    -- lazy = false,
    -- priority = 1000,
    -- config = colorMyPencils(),
    --   vim.cmd.colorscheme("solarized-osaka")
    -- end,
  },
}
