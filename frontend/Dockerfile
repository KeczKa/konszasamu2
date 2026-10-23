FROM --platform=$BUILDPLATFORM node:24-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn config set registry https://registry.npmjs.org/ \
    && yarn install --frozen-lockfile --network-timeout 300000

COPY . .
RUN chmod +x node_modules/.bin/vite \
    && yarn build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
