export def tmux-sessionizer [] {
  let selected = try {
      fd . $'($env.HOME)/personal' $'($env.HOME)/projects' $'($env.HOME)/work/va' $'($env.HOME)/work' $'($env.HOME)' --min-depth 1 --max-depth 1 -H --type d 
      | each {|p| 
          $p | str replace --all $env.HOME '~'
        } 
      | get 0 
      | fzf
  } catch {
    print "No paths found"
    return
  }

  mut selected_name = ($selected | path basename)
  let expanded_path = ($selected | path expand)
  let tmux_running = (ps | where name =~ 'tmux' | is-not-empty)

  if ($selected_name | is-empty) {
    return
  }

  if ($selected_name | str starts-with ".") {
    $selected_name = ($selected_name | str replace "." "_")
  }

  if (tmux has-session -t=$"($selected_name)" | complete | get exit_code) == 1 {
    print "does not have session"
    tmux new-session -ds $"($selected_name)" -c $"($expanded_path)"
    tmux select-window -t $"($selected_name):1"
  }

  if not $tmux_running and ($env | get -o TMUX | is-empty) {
    tmux attach
  } 

  tmux switch-client -t $"($selected_name)"
}

