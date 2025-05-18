return {
  "yacineMTB/pyrepl.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    require("pyrepl").setup({
      url = "http://localhost:5000/execute",
    })
  end,
  keys = {
    {
      "<leader>rp",
      function()
        require("pyrepl").run_selected_lines()
      end,
      mode = "v",
      desc = "Run selected lines",
    },
  },
}
