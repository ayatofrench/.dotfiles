{ lib, fetchzip, stdenvNoCC }:

stdenvNoCC.mkDerivation rec {
  pname = "ZedMono";
  version = "1.2.0";

  src = fetchzip {
    url = "https://github.com/zed-industries/zed-fonts/releases/download/${version}/zed-mono-${version}.zip";
    sha256 = "sha256-k9N9kWK2JvdDlGWgIKbRTcRLMyDfYdf3d3QTlA1iIEQ=";
    stripRoot = false;
  };

  installPhase = ''
    install -D -t $out/share/fonts/truetype/ $(find $src -type f -name '*.ttf')
  '';


  meta = with lib; {
    homepage = "https://zed.dev/";
    description = "Costom build of Isoveka built for Zed";
    license = licenses.ofl;
    platforms = platforms.all;
  };
}
