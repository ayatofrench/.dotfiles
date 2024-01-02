{ inputs, pkgs, ... }:

{
  homebrew = {
    enable = true;
    casks  = [
      "discord"
      "google-chrome"
      "istat-menus"
      "raycast"
    ];
  };
}
