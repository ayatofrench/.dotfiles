return {
  "chottolabs/kznllm.nvim",
  dependencies = {
    { "j-hui/fidget.nvim" },
  },
  config = function()
    local presets = require("kznllm.presets.basic")

    vim.g.PRESET_IDX = 1
    vim.keymap.set({ "n", "v" }, "<leader>m", function()
      presets.switch_presets(presets.options)
    end, { desc = "switch between presets" })

    local function invoke_with_opts(opts)
      return function()
        local preset = presets.load_selected_preset(presets.options)
        preset.invoke(opts)
      end
    end

    vim.keymap.set(
      { "n", "v" },
      "<leader>K",
      invoke_with_opts({ debug = true }),
      { desc = "Send current selection to LLM debug" }
    )
    vim.keymap.set(
      { "n", "v" },
      "<leader>k",
      invoke_with_opts({ debug = false }),
      { desc = "Send current selection to LLM llm_fill" }
    )

    vim.api.nvim_set_keymap("n", "<Esc>", "", {
      noremap = true,
      silent = true,
      callback = function()
        vim.api.nvim_exec_autocmds("User", { pattern = "LLM_Escape" })
      end,
    })
  end,
}
