#!/bin/bash

echo "###"
echo "### cambiando de rama -> master"
echo "###"
git checkout master
echo "###"
echo "### actualizando enlaces..."
echo "###"
node index.js > links.html
git add links.html
git commit -m "actualizados los links el `date +'%Y/%m/%d %H:%M'`"
echo "###"
echo "### subiendo los cambios"
echo "###"
git push origin master
echo "###"
echo "### ok"
echo "###"
echo "###"
echo "### cambiando de rama -> gh-pages"
echo "###"
git checkout gh-pages
git merge master
echo "###"
echo "### subiendo los cambios"
echo "###"
git push origin gh-pages
echo "###"
echo "### ok"
echo "###"
git checkout master
