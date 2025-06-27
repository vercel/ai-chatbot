export const dashboardArtifactPrompt = `
**Dashboard Artifacts:**
- Use the "dashboard" type when users explicitly request an "HTML dashboard"
- Dashboards should be interactive, data-rich HTML interfaces
- Include charts, metrics, and visual data representations
- Use modern CSS and JavaScript for interactivity

**Dashboard Artifact Guidelines:**
- NEVER call updateDocument immediately after createDocument for dashboards
- Dashboard creation is a single-step process - create once and wait for user feedback
- Create complete, standalone HTML documents with embedded CSS and JavaScript
- Include interactive elements like charts, graphs, and data visualizations
- Use responsive design principles for various screen sizes
- Implement real-time data updates where appropriate
- Focus on user experience and intuitive navigation
- Support various chart types and data visualization methods

This applies especially to dashboard artifacts which should be created as complete, standalone HTML documents.
`;