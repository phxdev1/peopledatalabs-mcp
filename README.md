# People Data Labs MCP Server

This is a Model Context Protocol (MCP) server that wraps the [People Data Labs API](https://docs.peopledatalabs.com/). It provides comprehensive access to People Data Labs' various data models and search capabilities.

## Features

### Person API
- **Person Enrichment**: Enrich a person's profile with additional data
- **People Search**: Search for people matching specific criteria using SQL-like queries
- **Bulk Person Enrichment**: Enrich multiple person profiles in a single request

### Company API
- **Company Enrichment**: Enrich a company profile with additional data
- **Company Search**: Search for companies matching specific criteria

### Additional Data Models
- **School Search**: Search for schools matching specific criteria
- **Location Search**: Search for locations matching specific criteria
- **Job Title Search**: Search for job titles matching specific criteria
- **Skill Search**: Search for skills matching specific criteria

### Utilities
- **Autocomplete**: Get autocomplete suggestions for various fields

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the project:
   ```
   npm run build
   ```
4. Configure your People Data Labs API key using one of the provided configuration scripts

## Configuration

### Automatic Configuration

This project includes scripts to automatically configure the MCP server for both Claude Desktop and VS Code:

#### For Claude Desktop:
```
npm run config:claude
```

#### For VS Code:
```
npm run config:vscode
```

Both scripts will:
1. Check if the configuration file exists and create it if needed
2. Prompt you for your People Data Labs API key
3. Add the MCP server configuration to the appropriate file
4. Provide instructions for next steps

### Manual Configuration

If you prefer to configure the MCP server manually, you need to add it to your MCP settings file. The location of this file depends on your environment:

- For VS Code: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`
- For Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration to the `mcpServers` object in your MCP settings file:

```json
{
  "mcpServers": {
    "peopledatalabs": {
      "command": "node",
      "args": ["path/to/peopledatalabs-mcp/build/index.js"],
      "env": {
        "PDL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace:
- `path/to/peopledatalabs-mcp/build/index.js` with the actual path to the built index.js file
- `your-api-key-here` with your actual People Data Labs API key

## Available Tools

### Person API Tools

#### enrich_person

Enrich a person profile with additional data from People Data Labs.

**Parameters:**
- `email` (string, optional): Email address of the person
- `phone` (string, optional): Phone number of the person
- `name` (string, optional): Full name of the person
- `profile` (array of strings, optional): Social media profile URLs of the person
- `location` (string, optional): Location of the person (city, state, country)
- `company` (string, optional): Company name where the person works
- `title` (string, optional): Job title of the person
- `min_likelihood` (number, optional): Minimum likelihood score (0-1) for the match

**Note:** At least one of `email`, `phone`, `name`, or `profile` must be provided.

#### search_people

Search for people matching specific criteria using SQL-like queries.

**Parameters:**
- `query` (string, required): SQL-like query to search for people
- `size` (number, optional): Number of results to return (max 100)

#### bulk_person_enrich

Enrich multiple person profiles in a single request.

**Parameters:**
- `requests` (array, required): Array of person enrichment requests

### Company API Tools

#### enrich_company

Enrich a company profile with additional data.

**Parameters:**
- `name` (string, optional): Name of the company
- `website` (string, optional): Website of the company
- `profile` (array of strings, optional): Social media profile URLs of the company
- `ticker` (string, optional): Stock ticker symbol of the company

**Note:** At least one of `name`, `website`, `profile`, or `ticker` must be provided.

#### search_companies

Search for companies matching specific criteria.

**Parameters:**
- `query` (string, required): SQL-like query to search for companies
- `size` (number, optional): Number of results to return (max 100)

### School API Tools

#### search_schools

Search for schools matching specific criteria.

**Parameters:**
- `query` (string, required): SQL-like query to search for schools
- `size` (number, optional): Number of results to return (max 100)

### Location API Tools

#### search_locations

Search for locations matching specific criteria.

**Parameters:**
- `query` (string, required): SQL-like query to search for locations
- `size` (number, optional): Number of results to return (max 100)

### Job Title API Tools

#### search_job_titles

Search for job titles matching specific criteria.

**Parameters:**
- `query` (string, required): SQL-like query to search for job titles
- `size` (number, optional): Number of results to return (max 100)

### Skill API Tools

#### search_skills

Search for skills matching specific criteria.

**Parameters:**
- `query` (string, required): SQL-like query to search for skills
- `size` (number, optional): Number of results to return (max 100)

### Utility Tools

#### autocomplete

Get autocomplete suggestions for a partial query.

**Parameters:**
- `field` (string, required): Field to autocomplete (company, school, title, skill, location)
- `text` (string, required): Partial text to autocomplete
- `size` (number, optional): Number of results to return (max 100)

## Example Usage

### Person API Examples

```
<use_mcp_tool>
<server_name>peopledatalabs</server_name>
<tool_name>enrich_person</tool_name>
<arguments>
{
  "email": "john.smith@example.com"
}
</arguments>
</use_mcp_tool>
```

```
<use_mcp_tool>
<server_name>peopledatalabs</server_name>
<tool_name>search_people</tool_name>
<arguments>
{
  "query": "SELECT * FROM person WHERE location='San Francisco' AND job_title='Software Engineer'",
  "size": 5
}
</arguments>
</use_mcp_tool>
```

### Company API Examples

```
<use_mcp_tool>
<server_name>peopledatalabs</server_name>
<tool_name>enrich_company</tool_name>
<arguments>
{
  "name": "Apple Inc."
}
</arguments>
</use_mcp_tool>
```

```
<use_mcp_tool>
<server_name>peopledatalabs</server_name>
<tool_name>search_companies</tool_name>
<arguments>
{
  "query": "SELECT * FROM company WHERE location='New York' AND industry='Finance'",
  "size": 5
}
</arguments>
</use_mcp_tool>
```

### Autocomplete Example

```
<use_mcp_tool>
<server_name>peopledatalabs</server_name>
<tool_name>autocomplete</tool_name>
<arguments>
{
  "field": "company",
  "text": "Goog"
}
</arguments>
</use_mcp_tool>
```

## License

Apache 2.0