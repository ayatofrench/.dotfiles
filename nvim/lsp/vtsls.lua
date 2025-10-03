local vtsls_inlay_hints = {
	enumMemberValues = { enabled = true },
	functionLikeReturnTypes = { enabled = true },
	functionParameterTypes = { enabled = true },
	parameterNames = { enabled = "all" },
	parameterNameWhenArgumentMatchesNames = { enabled = true },
	propertyDeclarationTypes = { enabled = true },
	variableTypes = { enabled = true },
	variableTypeWhenTypeMatchesNames = { enabled = true },
}

---@type vim.lsp.Config
return {
	cmd = { "vtsls", "--stdio" },
	filetypes = { "javascript", "javascriptreact", "typescript", "typescriptreact" },
	settings = {
		complete_function_calls = true,
		vtsls = {
			autoUseWorkspaceTsdk = true,
			experimental = {
				completion = {
					enableServerSideFuzzyMatch = true,
				},
			},
			format = { enable = false },
		},
		typescript = {
			updateImportOnFileMove = { enabled = "always" },
			suggest = {
				completeFunctionCalls = true,
			},
			tsserver = {
				maxTsServerMemory = 12288,
			},
			inlayHints = vtsls_inlay_hints,
		},
		javascript = { inlayHints = vtsls_inlay_hints },
	},
}
