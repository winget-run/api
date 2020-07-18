FROM node:12-alpine

RUN echo "http://dl-cdn.alpinelinux.org/alpine/latest-stable/main" >> /etc/apk/repositories
RUN echo "http://dl-cdn.alpinelinux.org/alpine/latest-stable/community" >> /etc/apk/repositories
RUN apk update

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

EXPOSE 3000

ENTRYPOINT ["yarn", "run:prod"]
