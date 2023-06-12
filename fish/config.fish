fish_add_path GOROOT="/usr/local/go"
fish_add_path GOPATH="$HOME/go"
fish_add_path PATH="$GOPATH/bin:$GOROOT/bin:$PATH"

fish_add_path NVM_DIR="~/.nvm"
# pnpm
fish_add_path ~/.local/share/pnpm
# pnpm end

# rust/cargo
fish_add_path ~/.cargo/bin

# fish_add_path /home/secretninjaman/.local/bin/zig
fish_add_path -m ~/.local/bin
fish_add_path -m ~/.local/bin/scripts
# alias nvim="$HOME/./nvim.appimage"

# deno
set -x DENO_INSTALL /home/secretninjaman/.deno
set -x PATH $DENO_INSTALL/bin:$PATH

alias vim="nvim"
alias vi="nvim"

alias lsa="ls -a"
# direnv hook fish | source


function sshagent_findsockets
	find /tmp -uid (id -u) -type s -name agent.\* 2>/dev/null
end

function sshagent_testsocket
    if [ ! -x (command which ssh-add) ] ;
        echo "ssh-add is not available; agent testing aborted"
        return 1
    end

    if [ X"$argv[1]" != X ] ;
    	set -xg SSH_AUTH_SOCK $argv[1]
    end

    if [ X"$SSH_AUTH_SOCK" = X ]
    	return 2
    end

    if [ -S $SSH_AUTH_SOCK ] ;
        ssh-add -l > /dev/null
        if [ $status = 2 ] ;
            echo "Socket $SSH_AUTH_SOCK is dead!  Deleting!"
            rm -f $SSH_AUTH_SOCK
            return 4
        else ;
            echo "Found ssh-agent $SSH_AUTH_SOCK"
            return 0
        end
    else ;
        echo "$SSH_AUTH_SOCK is not a socket!"
        return 3
    end
end


function ssh_agent_init
    # ssh agent sockets can be attached to a ssh daemon process or an
    # ssh-agent process.

    set -l AGENTFOUND 0

    # Attempt to find and use the ssh-agent in the current environment
    if sshagent_testsocket ;
        set AGENTFOUND 1
    end

    # If there is no agent in the environment, search /tmp for
    # possible agents to reuse before starting a fresh ssh-agent
    # process.
    if [ $AGENTFOUND = 0 ];
        for agentsocket in (sshagent_findsockets)
            if [ $AGENTFOUND != 0 ] ;
	            break
            end
            if sshagent_testsocket $agentsocket ;
	       set AGENTFOUND 1
	    end

        end
    end

    # If at this point we still haven't located an agent, it's time to
    # start a new one
    if [ $AGENTFOUND = 0 ] ;
	echo need to start a new agent
	eval (ssh-agent -c)
    end

    # Finally, show what keys are currently in the agent
    # ssh-add -l
end

function storePathForWindowsTerminal --on-variable PWD
  if test -n "$WT_SESSION"
    printf "\e]9;9;%s\e\\" (wslpath -w "$PWD")
  end
end

ssh_agent_init

source /opt/asdf-vm/asdf.fish

# Turso
export PATH="/home/secretninjaman/.turso:$PATH"
