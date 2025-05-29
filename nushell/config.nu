$env.config.hooks = {
  pre_prompt: [{ ||
    if (which direnv | is-empty) {
      return
    }

    direnv export json | from json | default {} | load-env
    if 'ENV_CONVERSIONS' in $env and 'PATH' in $env.ENV_CONVERSIONS {
      $env.PATH = do $env.ENV_CONVERSIONS.PATH.from_string $env.PATH
    }
  }]
}

$env.config.completions = {
  algorithm:      prefix
  case_sensitive: false
  partial:        true
  quick:          true
  external: {
    enable:      true
    max_results: 100
    completer:   {|tokens: list<string>|
      let expanded = scope aliases | where name == $tokens.0 | get --ignore-errors expansion.0

      mut expanded_tokens = if $expanded != null and $tokens.0 != "cd" {
        $expanded | split row " " | append ($tokens | skip 1)
      } else {
        $tokens
      }

      $expanded_tokens.0 = ($expanded_tokens.0 | str trim --left --char "^")

      fish --command $"complete '--do-complete=($expanded_tokens | str join ' ')'"
      | $"value(char tab)description(char newline)" + $in
      | from tsv --flexible --no-infer
    }
  }
}

$env.config.keybindings = [
  {
    name: tmux_sessionizer
    modifier: control
    keycode: char_f
    mode: [ emacs vi_normal vi_insert ]
    event: {
      send: executehostcommand
      cmd: "tmux-sessionizer"
    }
  }
]

source ~/.config/nushell/zoxide.nu
source ~/.config/nushell/starship.nu
source ~/.config/nushell/tmux-sessionizer.nu
