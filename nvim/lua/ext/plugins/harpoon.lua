return {
  "ThePrimeagen/harpoon",
  branch = "harpoon2",
  opts = {
    settings = {
      save_on_toggle = true,
    },
  },
  config = function()
    local harpoon = require("harpoon")

    harpoon:setup()

    vim.keymap.set("n", "<leader>a", function()
      harpoon:list():add()
    end)
    vim.keymap.set("n", "<c-e>", function()
      harpoon.ui:toggle_quick_menu(require("harpoon"):list())
    end)

    for idx, key in ipairs({ "h", "j", "k", "l", "'" }) do
      vim.keymap.set("n", string.format("<c-%s>", key), function()
        harpoon:list():select(idx)
      end)
    end
  end,
}
