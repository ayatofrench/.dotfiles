# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
        # We have color support; assume it's compliant with Ecma-48
        # (ISO/IEC-6429). (Lack of such support is extremely rare, and such
        # a case would tend to support setf rather than setaf.)
        color_prompt=yes
    else
        color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

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

# source ~/.zsh_profile

alias la="ls -a"
alias ll="ls -alh"

alias mv="mv -i" # warn me about overwriting files

alias gs="git status"
alias gb="git branch"
alias gl="git log --oneline -n 10"
alias vim="nvim"

# go
# export PATH="$HOME/go/bin:$PATH"
#
# # turso
# export PATH="$HOME/.turso:$PATH"
 
# fnm
#export PATH="/home/aj/.local/share/fnm:$PATH"
#eval "`fnm env`"

# export FLYCTL_INSTALL="$HOME/.fly"
# export PATH="$FLYCTL_INSTALL/bin:$PATH"

# export BUN_INSTALL="$HOME/.bun"
# export PATH="$BUN_INSTALL/bin:$PATH"
#
# export PATH="$HOME/.cargo/bin:$PATH"

## Autocomplete
# append completions to fpath
fpath=(${ASDF_DIR}/completions $fpath)
# initialise completions with ZSH's compinit
autoload -Uz compinit && compinit

# . "$HOME/.asdf/asdf.sh"
#. $(dirname $(dirname $(readlink -f $(which asdf))))/share/asdf-vm/asdf.sh

#eval "$(opam env)"
#eval "$(direnv hook zsh)"
