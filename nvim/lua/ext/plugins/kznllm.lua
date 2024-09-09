return {
  "chottolabs/kznllm.nvim",
  dependencies = {
    { "nvim-lua/plenary.nvim" },
    -- { 'chottolabs/plenary.nvim' }, -- patched to resolve symlinked directories
  },
  config = function(self)
    local presets = require("kznllm.presets")
    local Path = require("plenary.path")

    -- falls back to `vim.fn.stdpath 'data' .. '/lazy/kznllm/templates'` when the plugin is not locally installed
    local TEMPLATE_DIRECTORY = Path:new(vim.fn.expand(self.dir) .. "/templates")

    -- edit this to change the selected preset (or just fork the repo and add your own)
    local SELECTED_PRESET = presets[1]
    local spec = require(("kznllm.specs.%s"):format(SELECTED_PRESET.provider))

    local function switch_presets()
      table.sort(presets, function(a, _)
        return a == SELECTED_PRESET
      end)
      vim.ui.select(presets, {
        format_item = function(item)
          local options = {}
          for k, v in pairs(item.opts.data_params or {}) do
            if type(v) == "number" then
              local k_parts = {}
              local k_split = vim.split(k, "_")
              for i, term in ipairs(k_split) do
                if i > 1 then
                  table.insert(k_parts, term:sub(0, 3))
                else
                  table.insert(k_parts, term:sub(0, 4))
                end
              end
              table.insert(options, ("%-5s %-5s"):format(table.concat(k_parts, "_"), v))
            end
          end
          table.sort(options)
          return ("%-20s %10s | %s"):format(item.id, item.provider, table.concat(options, " "))
        end,
      }, function(choice)
        if not choice then
          return
        end
        spec = require(("kznllm.specs.%s"):format(choice.provider))
        SELECTED_PRESET = choice
        print(("%-15s provider: %-10s"):format(choice.id, choice.provider))
      end)
    end

    vim.keymap.set({ "n", "v" }, "<leader>m", switch_presets, { desc = "switch between presets" })

    local function llm_fill()
      presets.invoke_llm(
        SELECTED_PRESET.make_data_fn,
        spec.make_curl_args,
        spec.make_job,
        vim.tbl_extend("keep", SELECTED_PRESET.opts, {
          template_directory = TEMPLATE_DIRECTORY,
        })
      )
    end

    vim.keymap.set({ "n", "v" }, "<leader>k", llm_fill, { desc = "Send current selection to LLM llm_fill" })

    -- optional for debugging purposes
    local function debug()
      presets.invoke_llm(
        SELECTED_PRESET.make_data_fn,
        spec.make_curl_args,
        spec.make_job,
        vim.tbl_extend("keep", SELECTED_PRESET.opts, {
          template_directory = TEMPLATE_DIRECTORY,
          debug = true,
        })
      )
    end

    vim.keymap.set({ "n", "v" }, "<leader>d", debug, { desc = "Send current selection to LLM debug" })

    vim.api.nvim_set_keymap("n", "<Esc>", "", {
      noremap = true,
      silent = true,
      callback = function()
        vim.api.nvim_exec_autocmds("User", { pattern = "LLM_Escape" })
      end,
    })
  end,
}
