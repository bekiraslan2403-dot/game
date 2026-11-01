#!/usr/bin/env bash
# Bu bulut ortamında npm deposuna erişim kapalıdır; gerekli paketler /opt/npm-tools altında hazır kuruludur.
# Bu betik node_modules klasörünü o paketlere bağlar. Kendi bilgisayarında bunun yerine "npm install" çalıştır.
set -e
cd "$(dirname "$0")/.."
KAYNAK=/opt/npm-tools/node_modules
mkdir -p node_modules/@types
for p in react react-dom scheduler esbuild @esbuild typescript zod yaml tsx get-tsconfig resolve-pkg-maps playwright playwright-core; do
  [ -e "$KAYNAK/$p" ] && ln -sfn "$KAYNAK/$p" "node_modules/$p"
done
ln -sfn "$KAYNAK/@types/node" node_modules/@types/node
mkdir -p node_modules/.bin
ln -sfn ../typescript/bin/tsc node_modules/.bin/tsc
ln -sfn ../tsx/dist/cli.mjs node_modules/.bin/tsx
echo "Yerel paketler bağlandı."
