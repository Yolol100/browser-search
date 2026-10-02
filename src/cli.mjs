import { SearchService } from './service.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || !args.length) {
  console.log('Usage: npm run search -- "query" [limit] [language] [country]');
  process.exit(args.length ? 0 : 2);
}

const [query, rawLimit, language, country] = args;
const service = new SearchService();
try {
  const result = await service.search({ query, limit: rawLimit ? Number(rawLimit) : undefined, language, country });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ error: { code: error.code || 'ERROR', message: error.message, details: error.details || {} } }, null, 2));
  process.exit(1);
}
