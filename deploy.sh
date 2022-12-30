#!/usr/bin/env sh
REPO_NAME=snowglobe

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd build

# if you are deploying to a custom domain
echo "$REPO_NAME.sdavis.online" > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f "git@github.com:SamuelDavis/$REPO_NAME.git" master:gh-pages

cd -