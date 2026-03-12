# Работаем с node LTS на момент марта 2026 - 24.14.0.
# alpine - мини версия. ускоряет установку и сборку на CI/CD.
FROM node:24.14.0-alpine AS builder

# Скачиваем pnpm
# Установка через корпак считается типо самой правильной.
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate

# Устанавливает рабочую директорию для всех последующих команд.
# если директория не существует — создаётся автоматически.
WORKDIR /app

# Последний аргумент в COPY - это куда копировать. Перед ним - что копировать
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

COPY apps/client/package.json ./apps/client/
COPY packages/eslint-plugin-fsd/package.json ./packages/eslint-plugin-fsd/

# frozen-lockfile запрещает обновлять локфайл, чтобы сборка всегда происходила одинаково
RUN pnpm install --frozen-lockfile

# скопировали всё остальное
COPY apps/client/ ./apps/client/

# Построили фронтенд в /dist
RUN pnpm --filter=client build

FROM nginx:alpine

# из usr/share/nginx/html nginx раздаёт всю статику (не только хтмл!!!!)
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# меняем именно дефолтный конфиг потому что так сказали в интернете делать
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# порт
EXPOSE 80

# копипаста
CMD ["nginx", "-g", "daemon off;"]
