/* global process */
import { scan } from 'sonarqube-scanner';

scan(
  {
    serverUrl: 'http://localhost:9000', // Update this if using SonarCloud
    options: {
      'sonar.projectDescription': 'Analyse du code source EasyQual',
      'sonar.sources': 'src',
    },
  },
  () => process.exit()
);
