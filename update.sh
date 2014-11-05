#!/bin/bash

echo "###"
echo "### cambiando de rama"
echo "###"
git checkout gh-pages
echo "###"
echo "### actualizando enlaces..."
echo "###"
node index.js > links.html
echo "###"
echo "### ok"
echo "###"
echo "### subiendo los cambios"
echo "###"
git add links.html
git commit -m "actualizados los links el `date +'%Y/%m/%d %H:%M'`"
git push origin gh-pages
echo "###"
echo "### ok"
echo "###"
git checkout master
