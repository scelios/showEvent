This project aims to create a collection of Rancher extensions that will be
used in a production environment to help SRE operators with their tasks.


- [Commands](#commands)
  - [Other useful commands](#other-useful-commands)
- [Dependencies](#dependencies)
- [Compatibility](#compatibility)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Source](#source)

# Commands

`npm install` at the root of the project to install dependencies

`API=<url> npm run dev` to launch a local Rancher instance for testing extensions

`npm run test` to run the test suite

`npm run lint` to check for linting errors

## Other Useful Commands
These commands are not required as they are executed in the GitLab CI pipeline, but they may be useful for local development and testing.

`npm run build-pkg <name>` to build the extension

`npm run serve-pkgs` to retrieve the URL for the Developer Extensions load dialog. Note: the server runs on 127.0.0.1:4500 but works reliably through localhost:4500

`npm run publish-pkgs <name>` to publish the extension to the Rancher catalog (requires credentials and permissions). This command is currently unavailable for private registries but may be useful for future public catalog deployments.

# Dependencies

- node 20.17
- yarn 1.22.22

# Compatibility

To support private registry deployments, the publish and helmpatch scripts were modified. The helmpatch configuration was updated to remove the `imagePrefix` variable:
  ```values.plugin.endpoint = `http://${ baseExt }-svc.cattle-ui-plugin-system:8080/plugin/${ pkgFullName }`;```
  
This ensures the Helm chart package name matches the entry in package.json since it is used to generate the extension URL. Additionally, the publish script was updated to use the private registry URL and include the namespace in the package name, with GitHub Actions disabled in favor of Kaniko for image building and registry push.

# FAQ

### Architecture: Monolithic vs. Modular Extensions
Smaller, focused extensions are recommended. They provide better maintainability, clearer documentation, and easier testing and debugging compared to a single monolithic extension. Modular extensions are also more reusable across projects and environments with fewer dependencies and less coupling. This project uses a monorepo approach to host all extensions while maintaining their modularity. 

### Scope of Extension Capabilities
Rancher extensions cannot modify core functionality such as garbage collection or Kubernetes internals. However, extensions can add custom UI components, interact with the Rancher API to perform cluster actions (such as deleting resources), and listen to and respond to events. Extensions are designed to enhance the Rancher dashboard without altering core cluster behavior.

### Kubernetes Cluster Interaction
Extensions cannot interact directly with Kubernetes. All interactions must occur through the Rancher API, which acts as an intermediary to the underlying Kubernetes cluster. The Rancher dashboard provides built-in libraries and components for these interactions. 

### Required Permissions
Users who install extensions must have an account with extension management permissions (access to the upstream extension cluster). Extension Developer Features must be enabled in Preferences → Advanced Features. Extensions authenticate using the current user's credentials; authentication is requested on first connection.

# Troubleshooting

**Port Already In Use**

If `API=<url> yarn dev` fails with a port conflict, modify the `dev` script in package.json:
```json
"dev": "NODE_ENV=dev ./node_modules/.bin/vue-cli-service serve --port ${PORT:-8080}"
```

**Extension Installation Error: Helm Charts Not Found**

This error occurs on Node 16 and earlier. Update to Node 20:
```bash
nvm use 20
```

**Webpack Dev Server Error**

If webpack throws `[object Object]` errors during `yarn dev`, try cleaning and rebuilding:
```bash
npm run clean
API=<url> yarn dev
```
If issues persist, verify package dependencies, particularly `@rancher/shell: 3.0.8-rc.13`.

**Extension Disappears After Installation**

Ensure the extension name in package.json contains only lowercase letters. Extension names with uppercase characters or special characters may not persist across page reloads.

**Dev Server Connection Failure**

If the dev server displays "Welcome to Rancher" instead of connecting to the specified instance, clean the build cache:
```bash
yarn run clean
API=<url> yarn dev
```
Verify that dependencies are compatible, particularly `@rancher/shell: 3.0.8-rc.13`. Version mismatches may cause connection issues.

**Icon Not Displaying**

Work in progress

# Source

[Getting started with rancher extension](http://extensions.rancher.io/extensions/next/extensions-getting-started)

[Youtube follow along guide](https://www.youtube.com/watch?v=7xBUvNI__uc)

[Rancher ui Components](http://extensions.rancher.io/extensions/next/api/cards)

