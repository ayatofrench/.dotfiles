local methods = vim.lsp.protocol.Methods

vim.api.nvim_create_autocmd("LspAttach", {
	callback = function(args)
		local client = assert(vim.lsp.get_client_by_id(args.data.client_id), "must have valid client")
		local function keymap(lhs, rhs, desc, mode)
			mode = mode or "n"
			vim.keymap.set(mode, lhs, rhs, { buffer = args.buf, desc = desc })
		end
		-- if client:supports_method('textDocument/completion') then
		--   vim.lsp.completion.enable(true, client.id, args.buf, { autotrigger = true })
		-- end
		if client:supports_method(methods.textDocument_definition) then
			keymap("gd", function()
				require("fzf-lua").lsp_definitions({ jump1 = true })
			end, "Go to definition")
			keymap("gD", function()
				require("fzf-lua").lsp_definitions({ jump1 = false })
			end, "Peek definition")
		end
	end,
})

vim.diagnostic.config({
	virtual_text = {
		prefix = "",
		spacing = 2,
		format = function(diagnostic)
			local message = ""
			if diagnostic.source then
				message = string.format("%s %s", message, diagnostic.source)
			end
			if diagnostic.code then
				message = string.format("%s [%s]", message, diagnostic.code)
			end

			return message .. " "
		end,
	},
})

-- Set up LSP servers.
vim.api.nvim_create_autocmd({ "BufReadPre", "BufNewFile" }, {
	once = true,
	callback = function()
		local server_configs = vim.iter(vim.api.nvim_get_runtime_file("lsp/*.lua", true))
			:map(function(file)
				return vim.fn.fnamemodify(file, ":t:r")
			end)
			:totable()
		vim.lsp.enable(server_configs)
	end,
})

vim.keymap.set("n", "<leader>lf", vim.lsp.buf.format)
