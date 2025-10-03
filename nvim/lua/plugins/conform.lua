return {
	{
		"stevearc/conform.nvim",
		opts = {
			formatters_by_ft = {
				astro = { "biome" },
				lua = { "stylua" },
				typescript = { "biome" },
				typescriptreact = { "biome" },
				python = { "ruff_format" },
			},
			format_on_save = {
				timeout_ms = 500,
			},
		},
	},
}
