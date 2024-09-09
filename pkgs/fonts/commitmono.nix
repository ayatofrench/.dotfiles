{ lib, fetchzip, stdenvNoCC }:

stdenvNoCC.mkDerivation rec {
  pname = "CommitMono";
  version = "1.143";

  src = fetchzip {
    url = "https://github.com/eigilnikolajsen/commit-mono/releases/download/v${version}/CommitMono-${version}.zip";
    sha256 = "sha256-JTyPgWfbWq+lXQU/rgnyvPG6+V3f+FB5QUkd+I1oFKE=";
    stripRoot = false;
  };

  installPhase = ''
    install -D -t $out/share/fonts/opentype/ $(find $src -type f -name '*.otf')
  '';


  meta = with lib; {
    homepage = "https://commitmono.com/";
    description = "Commit Mono is an anonymous and neutral programming typeface focused on creating a better reading experience.";
    license = licenses.ofl;
    platforms = platforms.all;
  };
}
