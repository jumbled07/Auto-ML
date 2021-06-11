FROM node:15
WORKDIR /nodejs-express-sequelize-postgresql
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
 
COPY . .
 
CMD [ "node", "server.js" ]