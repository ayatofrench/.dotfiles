local M = {
  "folke/noice.nvim",
  event = "VeryLazy",
  opts = {
    -- add any options here
    messages = {
      enabled = false,
    },
  },
  dependencies = {
    -- if you lazy-load any plugin below, make sure to add proper `module="..."` entries
    "MunifTanjim/nui.nvim",
  },
}

return M
