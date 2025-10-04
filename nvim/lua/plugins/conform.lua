return {
	"stevearc/conform.nvim",
	opts = {
		notify_on_error = false,
		notify_no_formatters = false,
		formatters_by_ft = {
			astro = { "biome" },
			lua = { "stylua" },
			javascript = { "oxfmt" },
			javascriptreact = { "oxfmt" },
			typescript = { "oxfmt" },
			typescriptreact = { "oxfmt" },
			python = { "ruff_format" },
		},
		format_on_save = function()
			if vim.g.minifiles_active then
				return nil
			end

			return {}
		end,
	},
	init = function()
		vim.o.formatexpr = "v:lua.require'conform'.formatexpr()"
	end,
}
