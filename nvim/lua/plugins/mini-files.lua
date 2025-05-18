return {
  {
    "echasnovski/mini.files",
    lazy = false,
    keys = {
      {
        '<leader>e',
        function()
            local bufname = vim.api.nvim_buf_get_name(0)
            local path = vim.fn.fnamemodify(bufname, ':p')

            -- Noop if the buffer isn't valid.
            if path and vim.uv.fs_stat(path) then
                require('mini.files').open(bufname, false)
            end
        end,
        desc = "File explorer"

      },
    },
    opts = {
      mappings = {
        show_help = "?",
        go_in_plus = '<cr>',
      },
      windows = { width_nofocus = 25 },
      options = { permanent_delete = false },
    },
    config = function(_, opts)
      require("mini.files").setup(opts)
    end,
  },
}
