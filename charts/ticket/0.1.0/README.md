This extension will retieve and display tickets from Jira based on a JQL query. The extension is designed to integrate seamlessly with the Rancher dashboard, providing users with quick access to relevant Jira tickets without leaving the Rancher interface.

- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Performance & Limitations](#performance--limitations)

## Installation

Install this extension from the Rancher Catalog:
1. Navigate to **Extensions** in your Rancher dashboard
2. Search for "Tickets"
3. Click **Install**

## Usage
After installation, navigate to any resource detail page (pod, deployment, secret, etc.). The extension adds a tabbed panel at the bottom of the page labeled **Extensions** containing a tab called **Tickets**. Click on the **Tickets** tab to view a list of Jira tickets that match the current resource context.


## Architecture
The extension integrates with Jira using the Jira REST API. It constructs JQL queries based on the label of the resource or its name otherwise.

## Performance & Limitations
- The extension will only work if the label on Jira tests matches the label of the resource in Rancher (meaning the Jira's label is the same as the ressource's name and is in Jira's 'MTSRE' project). If no matching tests are found, the extension will display a message indicating that no tests were found.

