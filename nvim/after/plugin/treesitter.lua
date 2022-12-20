-- Treesitter Plugin Setup

require('nvim-treesitter.configs').setup {
  autotag = {
    enable = true,
  },
  ensure_installed = "all",
  sync_install = false,
  -- highlight = {
  --   -- enable = true,
  --   additional_vim_regex_highlighting = false,
  -- },
  ident = { enable = true },
  rainbow = {
    enable = true,
    extended_mode = true,
    max_file_lines = nil,
  }
}
