local ls = require("luasnip")

local s = ls.s
local t = ls.text_node

ls.add_snippets("lua", {
  s("ignore", t("--stylua: ignore")),
})
