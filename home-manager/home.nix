{ config, pkgs, ... }:

{
    home = {
        username = "aj";
        homeDirectory = "/home/aj";
        stateVersion = "master";
    };

    home.username = "aj";
    home.homeDirectory = "/home/aj/";
    home.stateVersion = "master";
    home.packages = with pkgs; [
      neofetch
    ];

    programs.home-manager.enble = true;
}
