{ config, pkgs, ... }:

{
    home.username = "aj";
    home.homeDirectory = "/home/aj/";
    home.stateVersion = "23.05";
    home.packages = with pkgs; [
      neofetch
    ];

    programs.home-manager.enble = true;
}
