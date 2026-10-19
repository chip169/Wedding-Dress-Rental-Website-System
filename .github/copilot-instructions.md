# GitHub Copilot Instructions

Please strictly follow the rules and architecture defined in [AGENTS.md](../AGENTS.md):
- **Architecture**: Monorepo with React 19 Frontend (Component-based) and Node.js/Express Backend (Layered Architecture: Route -> Controller -> Service -> Model).
- **Backend Rules**: Never query Mongoose Models directly from Controllers. Business logic must be placed in `src/services/`. Response format must strictly follow `{ success: boolean, message: string, data?: any }`.
- **Frontend Rules**: Use Tailwind CSS and Ant Design (antd). Never call Axios or fetch directly in UI components; define API calls in `src/services/` using `src/api/axiosClient.js`.
- **Modules**: Strictly use ES Modules (`import`/`export`), never use CommonJS (`require()`).
