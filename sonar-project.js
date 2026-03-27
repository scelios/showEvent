import sonarqubeScannerModule from "sonarqube-scanner";
const sonarqubeScanner = sonarqubeScannerModule.default;

let branch = process.env.CI_COMMIT_BRANCH;
if (process.env.CI_COMMIT_BRANCH === "") {
  branch = process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME;
}
if (process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME === "") {
  branch = "N/A"
}

sonarqubeScanner({
  serverUrl: 'https://sonarqube.steelhome.internal',
  options: {
    'sonar.sources': '.',
    'sonar.inclusions': 'pkg/**/*.ts, pkg/**/*.tsx', // Entry point of your code
    'sonar.exclusions': 'pkg/**/tests/**/*, jest.config.js, pkg/utils./rtl-config.tsx, pkg/utils/jestFileMock.ts, pkg/index.tsx, pkg/constants.ts, pkg/translations/en/*, pkg/App.tsx',
    'sonar.login': 'sqp_c086504417edeed859a3402a62715a2147bd4f32',
    'sonar.projectKey': 'rancher-extensions',
    'sonar.language': 'javascript',
    'sonar.qualitygate.wait': 'true',
    'sonar.qualitygate.timeout': '300',
    'sonar.branch.name': branch,
    'sonar.scanner.truststorePath': './cacerts',
    'sonar.scanner.truststorePassword':'changeit',
  }
}, () => {});
 