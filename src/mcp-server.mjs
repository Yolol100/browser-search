import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { SearchService } from './service.mjs';
import { publicError } from './errors.mjs';

function createServer() {
  const service = new SearchService();
  const server = new McpServer({ name: 'browser-search', version: '0.2.0' });

  server.registerTool(
    'browser_search',
    {
      title: 'Browser Search',
      description: 'Run one bounded Google Search through Playwright. Stops on consent ambiguity, CAPTCHA, or automated-traffic blocking.',
      inputSchema: z.object({
        query: z.string().min(1).max(256),
        limit: z.number().int().min(1).max(10).optional(),
        language: z.string().regex(/^[a-z]{2}(?:-[a-z]{2})?$/).default('nl'),
        country: z.string().regex(/^[a-z]{2}$/).default('nl')
      }).strict()
    },
    async (input) => {
      try {
        const result = await service.search(input);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result
        };
      } catch (error) {
        const failure = publicError(error);
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify(failure) }],
          structuredContent: failure
        };
      }
    }
  );

  return server;
}

void serveStdio(createServer);
console.error('browser-search MCP server ready on stdio');
