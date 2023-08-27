FROM node:16-alpine
RUN apk add curl jq
EXPOSE 3000
COPY /dist/webapp /usr/src/app/webapp
COPY /lib /usr/src/app/lib
COPY /package.json /usr/src/app
COPY /ui5-*.yaml /usr/src/app/
COPY /start.sh /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm install @ui5/cli --global
CMD ["sh", "start.sh"]
