
# User specific environment
if ! [[ "$PATH" =~ "$HOME/.local/bin:$HOME/bin:" ]]
then
    PATH="$HOME/.local/bin:$HOME/bin:$PATH"
fi
export PATH

if ! [[ "$PATH" =~ "$HOME/.local/bin/scripts:$HOME/bin:" ]]
then
    PATH="$HOME/.local/bin/scripts:$HOME/bin:$PATH"
fi
export PATH

source ~/.zsh_profile

alias la="ls -a"
alias ll="ls -alh"

alias mv="mv -i" # warn me about overwriting files

alias gs="git status"
alias gb="git branch"
alias gl="git log --oneline -n 10"
alias vim="nvim"

# go
export PATH="$HOME/go/bin:$PATH"

# turso
export PATH="$HOME/.turso:$PATH"
 
# fnm
export PATH="/home/aj/.local/share/fnm:$PATH"
eval "`fnm env`"

eval "$(direnv hook zsh)"
