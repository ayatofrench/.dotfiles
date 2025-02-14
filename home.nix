{
  config,
  pkgs,
  lib,
  outputs,
  ...
}: let
  isDarwin = pkgs.stdenv.isDarwin;
  isLinux = pkgs.stdenv.isLinux;
in {
  nixpkgs.overlays = [
    outputs.overlays.additions
  ];

  nixpkgs.config.allowUnfree = true;

  home.stateVersion = "23.05"; # Please read the comment before changing.

  home.packages = with pkgs;
    [
      # Tools
      bat
      eza
      fd
      fzf
      zf
      tree
      watch
      #git
      htop
      neofetch
      ripgrep
      #src-cli
      sqlite
      gh
      pipx
      #zellij

      # Formatters
      alejandra
      stylua

      # Fonts
      (pkgs.nerdfonts.override {fonts = ["JetBrainsMono"];})
      pixelcode
    ]
    ++ (lib.optionals isDarwin [
      cachix
    ])
    ++ (lib.optionals isLinux [
      # Global dev tools
      asdf-vm
      btop
      distrobox
      nodejs_20
      nodejs_20.pkgs.pnpm
      rustup
      tree-sitter
      valgrind
      xfce.xfce4-terminal

      # Apps
      asciinema
      asciinema-agg
      brave
      discord
      flameshot
      kooha
      telegram-desktop
      youtube-music
      zathura
      syncthing
      # mullvad
      # mullvad-vpn

      # Desktop setup
      bspwm
      sxhkd
      picom
      rofi
      dmenu
      feh
      polybar
    ]);

  programs = {
    home-manager.enable = true;

    direnv = {
      enable = isLinux;
      enableBashIntegration = true; # see note on other shells below
      nix-direnv.enable = true;
    };

    go.enable = true;

    zoxide.enable = isLinux;

    tmux = {
      enable = true;
      terminal = "tmux-256color";
      plugins = with pkgs; [
        tmuxPlugins.catppuccin
      ];
      extraConfig = ''
        ${builtins.readFile ./tmux/.tmux.conf}
      '';
    };

    zsh = {
      enable = true;
      autosuggestion.enable = true;
      plugins = [
        {
          name = "zsh-history-substring-search";
          file = "zsh-history-substring-search.zsh";
          src = pkgs.fetchFromGitHub {
            owner = "zsh-users";
            repo = "zsh-history-substring-search";
            rev = "v1.0.2";
            sha256 = "0y8va5kc2ram38hbk2cibkk64ffrabfv1sh4xm7pjspsba9n5p1y";
          };
        }
      ];
      sessionVariables = {ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE = "underline";};
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
      interactiveShellInit = lib.strings.concatStrings (lib.strings.intersperse "\n" [
        (builtins.readFile ./fish/config.fish)
        "
            if test -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
              fenv source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
            end

            if test -e /nix/var/nix/profiles/default/etc/profile.d/nix.sh
              fenv source /nix/var/nix/profiles/default/etc/profile.d/nix.sh
            end

            set -g SHELL ${pkgs.fish}/bin/fish
          "
      ]);

      shellAliases =
        {
          ga = "git add";
          gc = "git commit";
          gco = "git checkout";
          gcp = "git cherry-pick";
          gdiff = "git diff";
          gl = "git prettylog";
          gp = "git push";
          gs = "git status";
          gt = "git tag";
        }
        // (
          if isLinux
          then {
            # Two decades of using a Mac has made this such a strong memory
            # that I'm just going to keep it consistent.
            # pbcopy = "xclip";
            # pbpaste = "xclip -o";
          }
          else {}
        );

      plugins =
        map (n: {
          name = n;
          src = pkgs.fishPlugins.${n}.src;
        }) [
          "fzf-fish"
          "tide"
        ]
        ++ [
          {
            name = "foreign-env";
            src = pkgs.fetchFromGitHub {
              owner = "oh-my-fish";
              repo = "plugin-foreign-env";
              rev = "dddd9213272a0ab848d474d0cbde12ad034e65bc";
              sha256 = "00xqlyl3lffc5l0viin1nyp819wf81fncqyz87jx8ljjdhilmgbs";
            };
          }
        ];
    };
  };

  home.file = {
    ".xinitrc" = {
      executable = true;
      source = ./bspwm/xinitrc;
    };
  };

  fonts.fontconfig.enable = true;

  xdg.configFile = {
    "ghostty/config".text = builtins.readFile ./ghostty.linux;
    "tmux/tmux.conf".text = builtins.readFile ./tmux/.tmux.conf;
    "bspwm/bspwmrc" = {
      executable = true;
      source = ./bspwm/bspwmrc;
    };
    "sxhkd/sxhkdrc" = {
      executable = true;
      source = ./bspwm/sxhkdrc;
    };
    "polybar/config.ini" = {
      source = ./polybar/config.ini;
    };
    "polybar/launch.sh" = {
      executable = true;
      source = ./polybar/launch.sh;
    };
  };

  home.sessionVariables = {
    LANG = "en_US.UTF-8";
    LC_CTYPE = "en_US.UTF-8";
    LC_ALL = "en_US.UTF-8";
    EDITOR = "nvim";
    TERM = "ghostty";
  };

  home.language.base = "en_US.UTF-8";
}
