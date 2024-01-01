-- Pull in the wezterm API
local wezterm = require("wezterm")
local hslUtil = require("hsl")
local hsl = hslUtil.hslToHex

-- This table will hold the configuration.
local config = {}

-- In newer versions of wezterm, use the config_builder which will
-- help provide clearer error messages
if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.default_prog = { "/home/aj/.nix-profile/bin/fish", "-l" }

-- This is where you actually apply your config choices

-- For example, changing the color scheme:
config.colors = {
  -- For this to work there needs to be a Bigint lib to convert to hex
  -- background = hsl(186, 8, 65),
  background = "#00141a",
}

config.font = wezterm.font("Fragment Mono")
-- config.font = wezterm.font(os.getenv("FONT"))
-- config.font = wezterm.font("Mononoki Nerd Font")
-- config.font = wezterm.font("Recursive Mono Linear Static")
-- config.font = wezterm.font("CommitMono")
-- config.font = wezterm.font("Iosevka Comfy")
-- config.font = wezterm.font("Hack Nerd Font")
-- config.font = wezterm.font("JetBrainsMono Nerd Font")
-- config.font = wezterm.font("VictorMono Nerd Font")
config.font_size = 20

config.window_decorations = "NONE"
config.enable_tab_bar = false

-- and finally, return the configuration to wezterm
return config
