#!/bin/bash

export HOST=$(hostname)
for file in ./machines/$HOST/*; do
    echo "installing $file"

    # Check if file contains a path (starts with / or ./)
    if [[ $(head -c 1 "$file") == "/" ]] || [[ $(head -c 2 "$file") == "./" ]]; then
        # If it's a path, read the content of the file it points to
        packages=$(cat "$(cat "$file")")
    else
        # Otherwise read the content of the file directly
        packages=$(cat "$file")
    fi

    # Install packages using pacman and paru
    echo "$packages" | sudo pacman -D --asexplicit -
    echo "$packages" | paru -S --asexplicit --needed -
done
