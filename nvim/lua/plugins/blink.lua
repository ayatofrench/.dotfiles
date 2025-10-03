return {
	{
		"saghen/blink.cmp",
		build = "cargo build --release",
		dependencies = "L3MON4D3/LuaSnip",
		event = "InsertEnter",
		opts = {
			completion = {
				list = {
					selection = { preselect = false, auto_insert = true },
					max_items = 10,
				},
				documentation = { auto_show = true },
			},
			snippets = { preset = "luasnip" },
			cmdline = { enabled = false },
		},
		config = function(_, opts)
			require("blink.cmp").setup(opts)

			vim.lsp.config("*", { capabilities = require("blink.cmp").get_lsp_capabilities(nil, true) })
		end,
	},
}
