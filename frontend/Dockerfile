FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_API_TARGET=http://backend:3002

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
