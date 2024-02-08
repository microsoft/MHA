FROM node:latest@sha256:3af9f785cb8fc1a9c60a77c7b31b1ba7f5c74a066d142c996fbce61d2420dd8c

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present