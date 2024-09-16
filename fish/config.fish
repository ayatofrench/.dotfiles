#-------------------------------------------------------------------------------
# SSH Agent
#-------------------------------------------------------------------------------
function __ssh_agent_is_started -d "check if ssh agent is already started"
	if begin; test -f $SSH_ENV; and test -z "$SSH_AGENT_PID"; end
		source $SSH_ENV > /dev/null
	end

	if test -z "$SSH_AGENT_PID"
		return 1
	end

	ssh-add -l > /dev/null 2>&1
	if test $status -eq 2
		return 1
	end
end

function __ssh_agent_start -d "start a new ssh agent"
  ssh-agent -c | sed 's/^echo/#echo/' > $SSH_ENV
  chmod 600 $SSH_ENV
  source $SSH_ENV > /dev/null
  ssh-add
end

if not test -d $HOME/.ssh
    mkdir -p $HOME/.ssh
    chmod 0700 $HOME/.ssh
end

if test -d $HOME/.gnupg
    chmod 0700 $HOME/.gnupg
end

if test -z "$SSH_ENV"
    set -xg SSH_ENV $HOME/.ssh/environment
end

if not __ssh_agent_is_started
    __ssh_agent_start
end

#-------------------------------------------------------------------------------
# Ghostty Shell Integration
#-------------------------------------------------------------------------------
# Ghostty supports auto-injection but Nix-darwin hard overwrites XDG_DATA_DIRS
# which make it so that we can't use the auto-injection. We have to source
# manually.
if set -q GHOSTTY_RESOURCES_DIR
    source "$GHOSTTY_RESOURCES_DIR/shell-integration/fish/vendor_conf.d/ghostty-shell-integration.fish"
end

#-------------------------------------------------------------------------------
# Programs
#-------------------------------------------------------------------------------
# Homebrew
if test -d "/opt/homebrew"
    set -gx HOMEBREW_PREFIX "/opt/homebrew";
    set -gx HOMEBREW_CELLAR "/opt/homebrew/Cellar";
    set -gx HOMEBREW_REPOSITORY "/opt/homebrew";
    set -q PATH; or set PATH ''; set -gx PATH "/opt/homebrew/bin" "/opt/homebrew/sbin" $PATH;
    set -q MANPATH; or set MANPATH ''; set -gx MANPATH "/opt/homebrew/share/man" $MANPATH;
    set -q INFOPATH; or set INFOPATH ''; set -gx INFOPATH "/opt/homebrew/share/info" $INFOPATH;

    # Set Postgres 12
    set -q PATH; or set PATH ''; set -gx PATH "/opt/homebrew/opt/postgresql@12/bin" $PATH;

    source /opt/homebrew/opt/asdf/libexec/asdf.fish
end

if test -d "$HOME/.modular"
  set -gx MODULAR_HOME "$HOME/.modular"
  set -q PATH; or set PATH ''; set -gx PATH "$MODULAR_HOME/pkg/packages.modular.com_mojo/bin" $PATH;
end

# Hammerspoon
if test -d "/Applications/Hammerspoon.app"
    set -q PATH; or set PATH ''; set -gx PATH "/Applications/Hammerspoon.app/Contents/Frameworks/hs" $PATH;
end


# Google Cloud SDK
if test -d "$HOME/google-cloud-sdk"
  source ~/google-cloud-sdk/path.fish.inc
end

# turso
if test -d "$HOME/.turso"
  set -q PATH; or set PATH ''; set -gx PATH  "$HOME/.turso" $PATH;
end

# turso
# if test -d "$HOME/.local/share/fnm"
#   set -q PATH; or set PATH ''; set -gx PATH  "$HOME/.local/share/fnm" $PATH;
#   eval (fnm env)
# end

# pnpm
if test -d "$HOME/Library/pnpm"
  set -q PATH; or set PATH ''; set -gx PATH  "$HOME/Library/pnpm" $PATH;
end

# Add ~/.local/bin
if test -d "$HOME/.local/bin/scripts"
  set -q PATH; or set PATH ''; set -gx PATH  "$HOME/.local/bin/scripts" $PATH;
end

if test -d "$HOME/.asdf/asdf.fish"
  source ~/.asdf/asdf.fish
end

set -q PATH; or set PATH ''; set -gx PATH  "$HOME/.local/bin" $PATH;

# Do not show any greeting
set --universal --erase fish_greeting
function fish_greeting; end
funcsave fish_greeting

bind \cf 'tmux-sessionizer'

#
# function sshagent_findsockets
# 	find /tmp -uid (id -u) -type s -name agent.\* 2>/dev/null
# end
#
# function sshagent_testsocket
#     if [ ! -x (command which ssh-add) ] ;
#         echo "ssh-add is not available; agent testing aborted"
#         return 1
#     end
#
#     if [ X"$argv[1]" != X ] ;
#     	set -xg SSH_AUTH_SOCK $argv[1]
#     end
#
#     if [ X"$SSH_AUTH_SOCK" = X ]
#     	return 2
#     end
#
#     if [ -S $SSH_AUTH_SOCK ] ;
#         ssh-add -l > /dev/null
#         if [ $status = 2 ] ;
#             echo "Socket $SSH_AUTH_SOCK is dead!  Deleting!"
#             rm -f $SSH_AUTH_SOCK
#             return 4
#         else ;
#             echo "Found ssh-agent $SSH_AUTH_SOCK"
#             return 0
#         end
#     else ;
#         echo "$SSH_AUTH_SOCK is not a socket!"
#         return 3
#     end
# end
#
#
# function ssh_agent_init
#     # ssh agent sockets can be attached to a ssh daemon process or an
#     # ssh-agent process.
#
#     set -l AGENTFOUND 0
#
#     # Attempt to find and use the ssh-agent in the current environment
#     if sshagent_testsocket ;
#         set AGENTFOUND 1
#     end
#
#     # If there is no agent in the environment, search /tmp for
#     # possible agents to reuse before starting a fresh ssh-agent
#     # process.
#     if [ $AGENTFOUND = 0 ];
#         for agentsocket in (sshagent_findsockets)
#             if [ $AGENTFOUND != 0 ] ;
# 	            break
#             end
#             if sshagent_testsocket $agentsocket ;
# 	       set AGENTFOUND 1
# 	    end
#
#         end
#     end
#
#     # If at this point we still haven't located an agent, it's time to
#     # start a new one
#     if [ $AGENTFOUND = 0 ] ;
# 	echo need to start a new agent
# 	eval (ssh-agent -c)
#     end
#
#     # Finally, show what keys are currently in the agent
#     # ssh-add -l
# end
#
# function storePathForWindowsTerminal --on-variable PWD
#   if test -n "$WT_SESSION"
#     printf "\e]9;9;%s\e\\" (wslpath -w "$PWD")
#   end
# end
#
# ssh_agent_init

#if command -q opam
#  eval (opam env)
#end


