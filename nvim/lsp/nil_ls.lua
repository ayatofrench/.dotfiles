-- @type vim.lsp.Config
return {
    cmd = { 'nil' },
    filetypes = { 'nix' },
    single_file_support = true,
    root_markers = {'.git', '.jj', 'flake.nix'},
}
