{ lib, fetchzip, stdenvNoCC }:

stdenvNoCC.mkDerivation rec {
  pname = "PixelCode";
  version = "1.1.1";

  src = fetchzip {
    url = "https://github.com/qwerasd205/PixelCode/releases/download/v${version}/Pixel_Code_v${version}.zip";
    sha256 = "sha256-4FYCESbYQeolM+8ugEALCS24yjeMMec4tJH1OaLTmAQ=";
    stripRoot = false;
  };

  installPhase = ''
    install -D -t $out/share/fonts/opentype/ $(find $src -type f -name '*.otf')
  '';


  meta = with lib; {
    homepage = "https://qwerasd205.github.io/PixelCode/examples/specimen.html";
    description = "Pixel Code is a pixel font designed to actually be good for programming.";
    license = licenses.ofl;
    platforms = platforms.all;
  };
}
