#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
// People Data Labs API configuration
const PDL_API_KEY = process.env.PDL_API_KEY;
if (!PDL_API_KEY) {
    throw new Error('PDL_API_KEY environment variable is required');
}
// Create axios instance for PDL API
const pdlApi = axios.create({
    baseURL: 'https://api.peopledatalabs.com/v5',
    headers: {
        'X-Api-Key': PDL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});
// Validation helpers
const isValidPersonEnrichArgs = (args) => {
    if (typeof args !== 'object' || args === null) {
        return false;
    }
    // Check if at least one identifier is provided
    const hasIdentifier = typeof args.email === 'string' ||
        typeof args.phone === 'string' ||
        typeof args.name === 'string' ||
        (Array.isArray(args.profile) && args.profile.length > 0);
    if (!hasIdentifier) {
        return false;
    }
    // Validate optional fields if present
    if (args.min_likelihood !== undefined && (typeof args.min_likelihood !== 'number' || args.min_likelihood < 0 || args.min_likelihood > 1)) {
        return false;
    }
    return true;
};
const isValidCompanyEnrichArgs = (args) => {
    if (typeof args !== 'object' || args === null) {
        return false;
    }
    // Check if at least one identifier is provided
    const hasIdentifier = typeof args.name === 'string' ||
        typeof args.website === 'string' ||
        (Array.isArray(args.profile) && args.profile.length > 0) ||
        typeof args.ticker === 'string';
    return hasIdentifier;
};
const isValidSearchArgs = (args) => {
    return typeof args === 'object' &&
        args !== null &&
        typeof args.query === 'string' &&
        (args.size === undefined || (typeof args.size === 'number' && args.size > 0 && args.size <= 100));
};
class PeopleDataLabsServer {
    constructor() {
        this.server = new Server({
            name: 'peopledatalabs-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                // Person API tools
                {
                    name: 'enrich_person',
                    description: 'Enrich a person profile with additional data from People Data Labs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            email: {
                                type: 'string',
                                description: 'Email address of the person',
                            },
                            phone: {
                                type: 'string',
                                description: 'Phone number of the person',
                            },
                            name: {
                                type: 'string',
                                description: 'Full name of the person',
                            },
                            profile: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Social media profile URLs of the person',
                            },
                            location: {
                                type: 'string',
                                description: 'Location of the person (city, state, country)',
                            },
                            company: {
                                type: 'string',
                                description: 'Company name where the person works',
                            },
                            title: {
                                type: 'string',
                                description: 'Job title of the person',
                            },
                            min_likelihood: {
                                type: 'number',
                                description: 'Minimum likelihood score (0-1) for the match',
                                minimum: 0,
                                maximum: 1,
                            },
                        },
                        anyOf: [
                            { required: ['email'] },
                            { required: ['phone'] },
                            { required: ['name'] },
                            { required: ['profile'] },
                        ],
                    },
                },
                {
                    name: 'search_people',
                    description: 'Search for people matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for people',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'bulk_person_enrich',
                    description: 'Enrich multiple person profiles in a single request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            requests: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        params: {
                                            type: 'object',
                                            description: 'Parameters for person enrichment',
                                        },
                                    },
                                    required: ['params'],
                                },
                                description: 'Array of person enrichment requests',
                            },
                        },
                        required: ['requests'],
                    },
                },
                // Company API tools
                {
                    name: 'enrich_company',
                    description: 'Enrich a company profile with additional data',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'Name of the company',
                            },
                            website: {
                                type: 'string',
                                description: 'Website of the company',
                            },
                            profile: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Social media profile URLs of the company',
                            },
                            ticker: {
                                type: 'string',
                                description: 'Stock ticker symbol of the company',
                            },
                        },
                        anyOf: [
                            { required: ['name'] },
                            { required: ['website'] },
                            { required: ['profile'] },
                            { required: ['ticker'] },
                        ],
                    },
                },
                {
                    name: 'search_companies',
                    description: 'Search for companies matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for companies',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                // School API tools
                {
                    name: 'search_schools',
                    description: 'Search for schools matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for schools',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                // Location API tools
                {
                    name: 'search_locations',
                    description: 'Search for locations matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for locations',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                // Job Title API tools
                {
                    name: 'search_job_titles',
                    description: 'Search for job titles matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for job titles',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                // Skill API tools
                {
                    name: 'search_skills',
                    description: 'Search for skills matching specific criteria',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'SQL-like query to search for skills',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['query'],
                    },
                },
                // Autocomplete API tools
                {
                    name: 'autocomplete',
                    description: 'Get autocomplete suggestions for a partial query',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            field: {
                                type: 'string',
                                description: 'Field to autocomplete (company, school, title, skill, location)',
                                enum: ['company', 'school', 'title', 'skill', 'location'],
                            },
                            text: {
                                type: 'string',
                                description: 'Partial text to autocomplete',
                            },
                            size: {
                                type: 'number',
                                description: 'Number of results to return (max 100)',
                                minimum: 1,
                                maximum: 100,
                            },
                        },
                        required: ['field', 'text'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    // Person API handlers
                    case 'enrich_person':
                        return await this.handleEnrichPerson(request.params.arguments);
                    case 'search_people':
                        return await this.handleSearch('person', request.params.arguments);
                    case 'bulk_person_enrich':
                        return await this.handleBulkPersonEnrich(request.params.arguments);
                    // Company API handlers
                    case 'enrich_company':
                        return await this.handleEnrichCompany(request.params.arguments);
                    case 'search_companies':
                        return await this.handleSearch('company', request.params.arguments);
                    // School API handlers
                    case 'search_schools':
                        return await this.handleSearch('school', request.params.arguments);
                    // Location API handlers
                    case 'search_locations':
                        return await this.handleSearch('location', request.params.arguments);
                    // Job Title API handlers
                    case 'search_job_titles':
                        return await this.handleSearch('job_title', request.params.arguments);
                    // Skill API handlers
                    case 'search_skills':
                        return await this.handleSearch('skill', request.params.arguments);
                    // Autocomplete API handlers
                    case 'autocomplete':
                        return await this.handleAutocomplete(request.params.arguments);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    const statusCode = error.response?.status;
                    const errorMessage = error.response?.data?.error?.message || error.message;
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `People Data Labs API error (${statusCode}): ${errorMessage}`,
                            },
                        ],
                        isError: true,
                    };
                }
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
            }
        });
    }
    async handleEnrichPerson(args) {
        if (!isValidPersonEnrichArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid person enrichment parameters. Must provide at least one identifier (email, phone, name, or profile).');
        }
        const params = {};
        // Add parameters to the request
        if (args.email)
            params.email = args.email;
        if (args.phone)
            params.phone = args.phone;
        if (args.name)
            params.name = args.name;
        if (args.profile)
            params.profile = args.profile;
        if (args.location)
            params.location = args.location;
        if (args.company)
            params.company = args.company;
        if (args.title)
            params.title = args.title;
        if (args.min_likelihood !== undefined)
            params.min_likelihood = args.min_likelihood;
        const response = await pdlApi.get('/person/enrich', { params });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }
    async handleBulkPersonEnrich(args) {
        if (!args || !Array.isArray(args.requests) || args.requests.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid bulk person enrichment parameters. Must provide an array of requests.');
        }
        const response = await pdlApi.post('/person/bulk', args);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }
    async handleEnrichCompany(args) {
        if (!isValidCompanyEnrichArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid company enrichment parameters. Must provide at least one identifier (name, website, profile, or ticker).');
        }
        const params = {};
        // Add parameters to the request
        if (args.name)
            params.name = args.name;
        if (args.website)
            params.website = args.website;
        if (args.profile)
            params.profile = args.profile;
        if (args.ticker)
            params.ticker = args.ticker;
        const response = await pdlApi.get('/company/enrich', { params });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }
    async handleSearch(dataType, args) {
        if (!isValidSearchArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid search parameters. Must provide a query string.`);
        }
        const params = {
            sql: args.query,
            size: args.size || 10,
        };
        const response = await pdlApi.get(`/${dataType}/search`, { params });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }
    async handleAutocomplete(args) {
        if (!args || typeof args !== 'object' || !args.field || !args.text) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid autocomplete parameters. Must provide field and text.');
        }
        const params = {
            field: args.field,
            text: args.text,
            size: args.size || 10,
        };
        const response = await pdlApi.get('/autocomplete', { params });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('People Data Labs MCP server running on stdio');
    }
}
const server = new PeopleDataLabsServer();
server.run().catch(console.error);
