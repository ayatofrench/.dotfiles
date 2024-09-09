-- install hammerspoon cli
local brewPrefixOutput, _, _, _ = hs.execute("brew --prefix", true)
local brewPrefix = string.gsub(brewPrefixOutput, "%s+", "")
require("hs.ipc")
local ipc = hs.ipc.cliInstall(brewPrefix)
print(string.format("ipc: %s", ipc))

local modkey = "alt"

-- Make all our animations really fast
hs.window.animationDuration = 0

hs.hotkey.bind({ "cmd" }, "return", function()
  hs.execute("open -n -a ghostty")
end)

-- use as a replacement for ReloadConfiguration for now
hs.hotkey.bind({ "cmd", "ctrl", "shift" }, "r", function()
  hs.reload()
end)

hs.hotkey.bind({ "alt", "shift" }, "r", function()
  hs.execute("yabai --stop-service")
  hs.execute("yabai --start-service")
end)

hs.hotkey.bind({ "alt", "shift" }, "e", function()
  hs.execute("yabai --stop-service")
end)

hs.hotkey.bind({ "alt" }, "g", function()
  hs.spaces.gotoSpace(2)
end)


-- import keybindings for yabai
yabai = require("yabai")
