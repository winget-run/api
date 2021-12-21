FROM node:12-alpine AS appbuild
WORKDIR /app
COPY . .
RUN yarn add tsc
RUN yarn build

FROM node:12-alpine
WORKDIR /app
COPY --from=appbuild ./app/dist ./dist
COPY package.json yarn.lock ./
RUN yarn
EXPOSE 3000

ENTRYPOINT ["yarn", "run:prod"]