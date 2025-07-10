# Multi-stage build para otimização

# Estágio base
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Estágio de desenvolvimento
FROM base AS development

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Gerar Prisma client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 8000

# Comando de desenvolvimento
CMD ["npm", "run", "dev"]

# Estágio de build
FROM base AS builder

# Instalar todas as dependências
RUN npm ci

# Gerar Prisma client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Fazer build da aplicação
RUN npm run build

# Limpar dev dependencies
RUN npm prune --production

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências de produção
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de produção com dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]