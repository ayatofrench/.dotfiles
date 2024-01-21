{pkgs, ...}: {
  pixelcode = pkgs.callPackage ./fonts/pixelcode.nix {};
  commitmono = pkgs.callPackage ./fonts/commitmono.nix {};
}

