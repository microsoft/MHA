# CONTRIBUTING

All pull requests are welcome, there are just a few guidelines you need to follow.

When contributing to this repository, please first discuss the change by creating a new [issue](https://github.com/microsoft/MHA/issues) or by replying to an existing one.

## GETTING STARTED

* Make sure you have a [GitHub account](https://github.com/signup/free).
* Fork the repository, you can [learn about forking on Github](https://help.github.com/articles/fork-a-repo)
* [Clone the repo to your local machine](https://help.github.com/articles/cloning-a-repository/) like so:  
```git clone --recursive https://github.com/microsoft/MHA.git```

## MAKING CHANGES

* Create branch topic for the work you will do, this is where you want to base your work.
* This is usually the main branch.
* To quickly create a topic branch based on main, run  
```git checkout -b u/username/topic main```  
  * *Make sure to substitute your own name and topic in this command* *
* Once you have a branch, make your changes and commit them to the local branch.
* If your change adds or modifies major functionality, add or update automated Jest tests in the same pull request.
* All submissions require a review and pull requests are how those happen. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on pull requests.

## SUBMITTING CHANGES

* Push your changes to a topic branch in your fork of the repository.

## TEST POLICY

* Major functionality changes must include or update automated Jest tests in the same pull request.
* Test updates must meet coverage requirements.
* See [TESTING.md](./TESTING.md) for test commands, coverage thresholds, and CI details.

## BEFORE YOU OPEN A PULL REQUEST

* Install dependencies: `npm install`
* Start local development server when validating UI behavior: `npm run dev-server`
* Run lint locally and fix all issues: `npm run lint`
* Run tests locally and confirm pass: `npm test`
* Include related tests in the same PR when behavior changes and verify coverage requirements are met.

## SECURITY REPORTING

* Do not report security vulnerabilities in public issues.
* Follow the Microsoft coordinated vulnerability disclosure policy:
  * <https://github.com/microsoft/.github/blob/main/SECURITY.md>

## PUSH TO YOUR FORK AND SUBMIT A PULL REQUEST

At this point you're waiting on the code/changes to be reviewed.
