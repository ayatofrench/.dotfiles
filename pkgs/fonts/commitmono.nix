{ lib, fetchzip, stdenvNoCC }:

stdenvNoCC.mkDerivation rec {
  pname = "CommitMono";
  version = "1.143";

  src = fetchzip {
    url = "https://github.com/eigilnikolajsen/commit-mono/releases/download/v${version}/CommitMono-${version}.zip";
    sha256 = "sha256-4FYCESbYQeolM+8ugEALCS24yjeMMec4tJH1OaLTmAQ=";
  };

  installPhase = ''
    install -D -t $out/share/fonts/opentype/ $(find $src -type f -name '*.otf')
    install -D -t $out/share/fonts/truetype/ $(find $src -type f -name '*.ttf')
  '';


  meta = with lib; {
    homepage = "https://commitmono.com/";
    description = "Commit Mono is an anonymous and neutral programming typeface focused on creating a better reading experience.";
    license = licenses.ofl;
    platforms = platforms.all;
  };
}
