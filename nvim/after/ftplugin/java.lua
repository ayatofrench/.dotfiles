local data = assert(vim.fn.stdpath("data")) --[[@as string]]

local project_name = vim.fn.fnamemodify(vim.fn.getcwd(), ":p:h:t")
local workspace_dir = vim.fn.expand("$HOME/work/va/" .. project_name)

local config = {
  cmd = {
    "java",
    "-Declipse.application=org.eclipse.jdt.ls.core.id1",
    "-Dosgi.bundles.defaultStartLevel=4",
    "-Declipse.product=org.eclipse.jdt.ls.core.product",
    "-Dlog.protocol=true",
    "-Dlog.level=ALL",
    "-Xmx1g",
    "--add-modules=ALL-SYSTEM",
    "--add-opens",
    "java.base/java.util=ALL-UNNAMED",
    "--add-opens",
    "java.base/java.lang=ALL-UNNAMED",
    "-jar",
    data .. "/mason/packages/jdtls/plugins/org.eclipse.equinox.launcher_1.6.900.v20240613-2009.jar",
    "-configuration",
    data .. "/mason/packages/jdtls/config_mac_arm",
    "-data",
    workspace_dir,
  },
  settings = {
    java = {},
  },

  init_options = {
    bundles = {},
  },
}

require("jdtls").start_or_attach(config)
