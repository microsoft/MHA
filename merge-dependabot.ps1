# Get back on main with no changes
git merge --abort
git checkout main
git pull

# Checkout a new branch to merge the Dependabot branches into
git branch -D dependabot-merge
git push origin --delete dependabot-merge
git checkout -b dependabot-merge

# Fetch the latest branch information from the remote repository
git fetch -p

# Retrieve the list of branches starting with 'origin/dependabot'
$dependabotBranches = git branch -r --list 'origin/dependabot/*'

# Merge the Dependabot branches one by one
foreach ($branch in $dependabotBranches) {
    git merge --no-ff "$branch" -m "Merge $branch into u/sgriffin/dependabot-merge"
}

# Push the merged branch to the remote repository
git push origin dependabot-merge
