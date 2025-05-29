export def tmux-sessionizer [] {
  let selected = try {
      fd . $'($env.HOME)/personal' $'($env.HOME)/work/va' $'($env.HOME)/work' $'($env.HOME)' --min-depth 1 --max-depth 1 -H --type d 
      | each {|p| 
          $p | str replace --all $env.HOME '~'
        } 
      | get 0 
      | fzf
  } catch {
    print "No paths found"
    return
  }

  let selected_name = ($selected | path basename)
  let expanded_path = ($selected | path expand)
  let tmux_running = (ps | where name =~ 'tmux' | is-not-empty)

  if not $tmux_running and ($env | get -i TMUX | is-empty) {
    tmux new-session -ds $selected_name -c $expanded_path
    return
  } 

  if (tmux has-session -t=$"($selected_name)" | complete | get exit_code) == 1 {
    tmux new-session -ds $selected_name -c $expanded_path
  }

  tmux switch-client -t $selected_name
}

