# Get back on main with no changes
git merge --abort
git checkout main
git pull

# Checkout a new branch to merge the Dependabot branches into
git checkout -b u/sgriffin/dependabot-merge

# Fetch the latest branch information from the remote repository
git fetch

# Retrieve the list of branches starting with 'origin/dependabot'
$dependabotBranches = git branch -r --list 'origin/dependabot/*' | ForEach-Object { $_ -replace '^.*origin/', '' }

# Merge the Dependabot branches one by one
foreach ($branch in $dependabotBranches) {
    git merge --no-ff "origin/$branch" -m "Merge origin/$branch into u/sgriffin/dependabot-merge"
}

# Push the merged branch to the remote repository
git push origin u/sgriffin/dependabot-merge
