FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npx playwright install --with-deps chromium
COPY . .
ENV BROWSER_SEARCH_HOST=0.0.0.0
EXPOSE 8787
CMD ["node", "src/server.mjs"]
