FROM node:19.4.0-bullseye

COPY . /app

WORKDIR /app

RUN /usr/local/bin/npm install

EXPOSE 3000

USER node

ENTRYPOINT ["/usr/local/bin/npm", "run", "start-local"]
