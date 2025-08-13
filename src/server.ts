import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "Test Server",
  version: "1.0.0",
  description: "This is a test server",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
