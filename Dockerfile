FROM node:22-bookworm-slim

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && mkdir -p /ms-playwright \
    && npx playwright install --with-deps chromium \
    && chown -R node:node /app /ms-playwright

COPY --chown=node:node . .
USER node

ENV BROWSER_SEARCH_HOST=0.0.0.0
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.mjs"]
