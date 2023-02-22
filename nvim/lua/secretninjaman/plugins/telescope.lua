local M = {
"nvim-telescope/telescope.nvim",
  cmd = "Telescope",
  version = "*",
  dependencies = {
    "nvim-telescope/telescope-file-browser.nvim",
    'nvim-telescope/telescope-fzf-native.nvim',
    "nvim-lua/plenary.nvim",
  },
config = function()
local telescope = require("telescope")
local conf = require("telescope.config").values
local actions = require("telescope.actions")

telescope.setup({
    defaults = {
        prompt_prefix = " >",
        color_devicons = true,

        file_previewer = require("telescope.previewers").vim_buffer_cat.new,
        grep_previewer = require("telescope.previewers").vim_buffer_vimgrep.new,
        qflist_previewer = require("telescope.previewers").vim_buffer_qflist.new,

        mappings = {

            i = {

                ["<C-x>"] = false,

                ["<C-q>"] = actions.send_to_qflist,

                ["<CR>"] = actions.select_default,

            },

        },
    },

    extensions = {
        fzf = {
            fuzzy = true, -- false will only do exact matching
            override_generic_sorter = true, -- override the generic sorter
            override_file_sorter = true, -- override the file sorter
            case_mode = "smart_case", -- or "ignore_case" or "respect_case"
            -- the default case_mode is "smart_case"
        },
        file_browser = {
            -- hijack_netrw = true,
            hidden = true,
            respect_gitignore = false,
        }
    },

    pickers = {
        find_files = {
            hidden = true,
        }
    }
    --[[

	extensions = {

		fzy_native = {

			override_generic_sorter = false,

			override_file_sorter = true,

		},

	},

    ]]

})
require('telescope').load_extension('fzf')
require("telescope").load_extension("file_browser")
end
}


return M
