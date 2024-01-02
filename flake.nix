{
  description = "Home Manager configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    darwin = {
      url = "github:LnL7/nix-darwin";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, ... } @ inputs:
    # TODO: make this more modular
    let
      inherit (self) outputs;
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      # formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.alejandra);
      overlays = import ./overlays {inherit inputs;};
      homeConfigurations."aj" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;
        extraSpecialArgs = {inherit inputs outputs;};
        modules = [ 
          ./home.nix
          {
            home = {
              username = "aj";
              homeDirectory = "/home/aj";
            };
          }
        ];
      };

      darwinConfiguration."ayato.french" = darwin.lib.darwinSystem {
        #inherit system;
        #inherit pkgs;

        system = "x86_64-darwin";
        pkgs = nixpkgs.legacyPackages."x86_64-darwin";
        extraSpecialArgs = {inherit inputs outputs;};
        modules = [ 
          home-manager.darwinModules.home-manager
          ./home.nix
          # ./darwin.nix
          {
            # nixpkgs.overlays = outputs.overlays.additions
            home = {
              username = "ayato.french";
              homeDirectory = "/home/ayato.french";
            };
          }
        ];
      };
    };
}
