FROM node:12

WORKDIR /app

COPY . /app

RUN npm i --production

EXPOSE 9080

ENTRYPOINT [ "node", "src/index.js" ]