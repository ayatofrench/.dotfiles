-- @type vim.lsp.Config
return {
	cmd = { "pnpm", "biome", "lsp-proxy" },
	filetypes = { "javascript", "javascriptreact", "typescript", "typescriptreact", "astro" },
	root_markers = { "biome.jsonc" },
}
