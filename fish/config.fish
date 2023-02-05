export GOROOT="/usr/local/go"
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$GOROOT/bin:$PATH"

# pnpm
export PNPM_HOME="/home/secretninjaman/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
# pnpm end

# rust/cargo
fish_add_path $HOME/.cargo/bin

alias nvim="$HOME/./nvim.appimage"
alias vim="nvim"
alias vi="nvim"

direnv hook fish | source
