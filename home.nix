{ config, pkgs, lib, ... }:

{
  # Home Manager needs a bit of information about you and the paths it should
  # manage.
  home.username = "aj";
  home.homeDirectory = "/home/aj";

  # This value determines the Home Manager release that your configuration is
  # compatible with. This helps avoid breakage when a new Home Manager release
  # introduces backwards incompatible changes.
  #
  # You should not change this value, even if you update Home Manager. If you do
  # want to update the value, then make sure to first check the Home Manager
  # release notes.
  home.stateVersion = "23.05"; # Please read the comment before changing.

  # The home.packages option allows you to install Nix packages into your
  # environment.
  home.packages = with pkgs; [
    bat
    btop
    direnv
    eza
    fd
    fzf
    go
    htop
    lazygit
    neofetch
    ripgrep
    stylua
    zellij
    zf

    ## Rust
    rustc
    cargo

    # Fonts
    (pkgs.nerdfonts.override { fonts = [ "JetBrainsMono" ]; })
    # # Adds the 'hello' command to your environment. It prints a friendly
    # # "Hello, world!" when run.
    # pkgs.hello

    # # It is sometimes useful to fine-tune packages, for example, by applying
    # # overrides. You can do that directly here, just don't forget the
    # # parentheses. Maybe you want to install Nerd Fonts with a limited number of
    # # fonts?
    # (pkgs.nerdfonts.override { fonts = [ "FantasqueSansMono" ]; })

    # # You can also create simple shell scripts directly inside your
    # # configuration. For example, this adds a command 'my-hello' to your
    # # environment:
    # (pkgs.writeShellScriptBin "my-hello" ''
    #   echo "Hello, ${config.home.username}!"
    # '')
  ];
  
  programs = {
      home-manager.enable = true;

      direnv = {
        enable = true;
        enableBashIntegration = true; # see note on other shells below
        nix-direnv.enable = true;
      };

      go.enable = true;

      starship = {
          enable = true;
          enableZshIntegration = true;
      };

      zoxide.enable = true;
      
      zsh = {
          enable = true;
          enableAutosuggestions = true;
          plugins = [{
              name = "zsh-history-substring-search";
              file = "zsh-history-substring-search.zsh";
              src = pkgs.fetchFromGitHub {
                owner = "zsh-users";
                repo = "zsh-history-substring-search";
                rev = "v1.0.2";
                sha256 = "0y8va5kc2ram38hbk2cibkk64ffrabfv1sh4xm7pjspsba9n5p1y";
              };
          }];
          sessionVariables = { ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE = "underline"; };
          initExtra = ''
              alias ls='echo; ${pkgs.exa}/bin/exa'
              ${builtins.readFile ./.zshrc}
          '';
          envExtra = ''
              export PATH="$PATH:/usr/local/bin"
          '';
      };
  };

  # Home Manager is pretty good at managing dotfiles. The primary way to manage
  # plain files is through 'home.file'.
  home.file = {
    # # Building this configuration will create a copy of 'dotfiles/screenrc' in
    # # the Nix store. Activating the configuration will then make '~/.screenrc' a
    # # symlink to the Nix store copy.
    # ".screenrc".source = dotfiles/screenrc;

    # # You can also set the file content immediately.
    # ".gradle/gradle.properties".text = ''
    #   org.gradle.console=verbose
    #   org.gradle.daemon.idletimeout=3600000
    # '';
  };
   
  fonts.fontconfig.enable = true;
  
  xdg.configFile = with lib;
      mkMerge [
          {
              "starship.toml".text = builtins.readFile ./starship.toml;
          }
      ];

  home.sessionVariables = {
    EDITOR = "nvim";
  };
}