{ config, pkgs, lib, ... }:

let
  isDarwin = pkgs.stdenv.isDarwin;
  isLinux = pkgs.stdenv.isLinux;
in {
  home.stateVersion = "23.05"; # Please read the comment before changing.

  home.packages = with pkgs; [
    asdf-vm
    bat
    btop
    eza
    fd
    fzf
    tree
    watch
    git
    htop
    lazygit
    neofetch
    ripgrep
    stylua
    src-cli
    sqlite
    zellij
    zf

    # Fonts
    recursive
    (pkgs.nerdfonts.override { fonts = ["JetBrainsMono" "VictorMono"]; })
  ] ++ (lib.optionals isDarwin  [
    cachix
  ]) ++ (lib.optionals isLinux [
    ## Rust
#    rustc
#    cargo
    rustup
    beam.packages.erlang.elixir
    picom
    p4
    rofi
    valgrind
    zathura
    xfce.xfce4-terminal
  ]);
  
  programs = {
      home-manager.enable = true;

      direnv = {
        enable = true;
        enableBashIntegration = true; # see note on other shells below
        nix-direnv.enable = true;
      };

      go.enable = true;

      # starship = {
      #     enable = true;
      #     enableZshIntegration = true;
      # };

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
              alias ls='echo; ${pkgs.eza}/bin/eza'
              ${builtins.readFile ./.zshrc}
          '';
          envExtra = ''
              export PATH="$PATH:/usr/local/bin"
          '';
      };

      fish = {
        enable = true;
        interactiveShellInit = lib.strings.concatStrings (lib.strings.intersperse "\n" ([
          (builtins.readFile ./fish/config.fish)
          "set -g SHELL ${pkgs.fish}/bin/fish"
        ]));

        # shellAliases = {
        #   ga = "git add";
        #   gc = "git commit";
        #   gco = "git checkout";
        #   gcp = "git cherry-pick";
        #   gdiff = "git diff";
        #   gl = "git prettylog";
        #   gp = "git push";
        #   gs = "git status";
        #   gt = "git tag";
        # } // (if isLinux then {
        #   # Two decades of using a Mac has made this such a strong memory
        #   # that I'm just going to keep it consistent.
        #   pbcopy = "xclip";
        #   pbpaste = "xclip -o";
        # } else {});

        plugins = map (n: {
          name = n;
          src  = pkgs.fishPlugins.${n}.src;
        }) [
          "fzf-fish"
          "tide"
        ];
      };
  };

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
