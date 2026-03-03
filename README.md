This project aims to create a collection of Rancher extensions that will be
used in a production environment to help SRE operators with their tasks.


# Commands

``yarn install`` inside the root project to install dependencies

``API=<url> yarn dev`` to launch a local rancher to try your extension

``yarn build-pkg <name>`` to build the extensnion you've done

``yarn serve-pkgs`` to get url you will need to put inside the developer Load (in the extension tab)
Watch out it served a 127.0.0.1:4500 but i only manage to make it works through localhost:4500 (i know it should be the same)


# Dependencies

- node 20.17
- yarn 1.22.22

# Q&A

### a. We'll have multiple needs, do we do 1 big plugins, or small ones, what are the consequences ?
For this, smaller extensions are better since they offer good understandability
and explicit documentation for future development. So we'll need one project that will host
all of the extension.
### b. What is the possible scope for the plugins, will we be able to alter such a thing as the garbage collection, or only have extra ui parts ?
 Vue applications can suffer from memory leaks if resources are not properly managed, so memory usage needs to be watched specifically.
However, it permits the usage of APIs to display information needed by the team.

### c. What are the possibilities to interact with the kubernetes cluster ? Are there some custom rancher api ? Do we have built-in library ? Do we interact with the Kubernetes api directly ?
 It doesn't seems to be possible to directly interract with the kubernetes environment,
you can interact through rancher

### d. What are the needed permissions both for you as an integrator, and for the application to be able to achieve the needed work ? 
 Users who need to add extensions must have an account with permission to add extensions
(needs access to the upstream extension cluster).
(In Preferences -> Advanced Features -> Enable Extension Developer Features)

The application can use the same account as the user, since at the first connection
it will ask for authentication.

# Errors encountered so far

- Problem with the command `API=<url> yarn dev` which launches the app on localhost:8005
but this port seems to already be in use. 

Fixed -> change the port in package.json by adding:
`"dev": "NODE_ENV=dev ./node_modules/.bin/vue-cli-service serve --port ${PORT:-8080}",` 
in the scripts section.

- Problem with the extension menu which launches:
```
Extension support is not enabled
Automatic installation is not available - required Helm Charts could not be found
```
Fixed -> updating the package.json and reverting seemed to remove this error.
Update: Seems like it has been an rancher update since i can't reproduce this error

- Problem with the yarn dev environment which launches:
```ERROR
[object Object]
handleError@https://localhost:8080/js/chunk-vendors.js:406831:58
./node_modules/webpack-dev-server/client/overlay.js/createOverlay/<@https://localhost:8080/js/chunk-vendors.js:406854:18
```
Fixed -> ?

- Problem with the extension being removed after being installed through yarn serve-pkgs and reloading the page

fixed -> ?

- Impossibilities to used the useShell() in index.ts after being installed. But it is working on localhost

fixed -> For now I just don't use it

# Source

[Getting started with rancher extension](http://extensions.rancher.io/extensions/next/extensions-getting-started)
The official documentation will provoke a crash even when strictly following the instructions
and the version. You really should stick with Docker.

[Youtube follow along guide](https://www.youtube.com/watch?v=7xBUvNI__uc)

[Rancher ui Components](http://extensions.rancher.io/extensions/next/api/cards)

