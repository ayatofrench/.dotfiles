local M = {}

local whichOS = function()
  local handle = io.popen("uname")
  local output = handle:read("*a")
  local format = output:gsub("[\n\r]", "")

  handle:close()

  return format
end

function M.isDarwin()
  return whichOS() == "Darwin"
end

return M
