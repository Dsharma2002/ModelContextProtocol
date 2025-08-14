"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const promises_1 = __importDefault(require("node:fs/promises"));
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const server = new mcp_js_1.McpServer({
    name: "Test Server",
    version: "1.0.0",
    description: "This is a test server",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
server.tool("create-user", "Create a new User in the database", {
    name: zod_1.z.string(),
    email: zod_1.z.string(),
    address: zod_1.z.string(),
    phone: zod_1.z.string(),
}, {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async (params) => {
    try {
        const id = await createUser(params);
        return {
            content: [
                {
                    type: "text",
                    text: `User created successfully with ID: ${id}`,
                },
            ],
        };
    }
    catch {
        return {
            content: [
                {
                    type: "text",
                    text: "An error occurred while creating the user.",
                },
            ],
        };
    }
});
server.tool("create-random-user", "Create a random user", {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async () => {
    const res = await server.server.request({
        method: "sampling/createMessage",
        params: {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "Create a random user with a realistic name, email, address, and phone number. Return this data as a JSON object with no other text or formatter so it can be used with JSON.parse",
                    },
                },
            ],
            maxTokens: 1000,
        },
    }, types_js_1.CreateMessageResultSchema);
    if (res.content.type !== "text") {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to generate user data",
                },
            ],
        };
    }
    try {
        const fakeUser = JSON.parse(res.content.text
            .trim()
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim());
        const id = await createUser(fakeUser);
        return {
            content: [{
                    type: "text",
                    text: `Random user created successfully with ID: ${id}`,
                }]
        };
    }
    catch {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to generate user data",
                },
            ],
        };
    }
});
server.resource("users", "users://all", {
    title: "Get all users",
    description: "Get all users data from the database",
    mimeType: "application/json",
}, async (uri) => {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(users),
                mimeType: "application/json",
            },
        ],
    };
});
server.resource("user-details", new mcp_js_1.ResourceTemplate("users://{id}/profile", {
    list: undefined,
}), {
    description: "Get a user data from the database",
    title: "Users details",
    mimeType: "application/json",
}, async (uri, { id }) => {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const user = users.find((user) => user.id === parseInt(id));
    if (user == null) {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify({ error: "User not found" }),
                    mimeType: "application/json",
                },
            ],
        };
    }
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(user),
                mimeType: "application/json",
            },
        ],
    };
});
server.prompt("generate-fake-user", "Generate a fake user based on given name", {
    name: zod_1.z.string(),
}, ({ name }) => {
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate a fake user with the name "${name}". The user should have a realistic email, address, and phone number.`,
                },
            },
        ],
    };
});
async function createUser(user) {
    // Simulate creating a new user in a database
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const id = users.length + 1;
    users.push({ id, ...user });
    await promises_1.default.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    return id;
}
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main();
