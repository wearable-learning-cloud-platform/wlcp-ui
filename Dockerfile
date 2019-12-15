FROM node:12
COPY /dist /usr/src/app
COPY /package-lock.json /usr/src/app
EXPOSE 8081
CMD ["npm", "run serve"]
