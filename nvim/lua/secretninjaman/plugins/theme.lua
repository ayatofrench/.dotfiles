function ColorMyPencils()
  -- local color = color or "rose-pine"
  -- vim.cmd.colorscheme(color)
  vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
  vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
end

local M = {
  "catppuccin/nvim",
  priority = 1000,
  name = "catppuccin",
  config = function()
    require("nvim-web-devicons").setup()
    vim.cmd.colorscheme("gruvbox")
    ColorMyPencils()
  end,
}
-- local M = {
--   "gruvbox-community/gruvbox",
--   priority = 1000,
--   name = "gruvbox",
--   config = function()
--     require("nvim-web-devicons").setup()
--     vim.cmd.colorscheme("gruvbox")
--     ColorMyPencils()
--   end,
-- }

return M
