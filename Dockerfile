FROM node:latest@sha256:1f937398bb207138bd26777f76d8b31b44f22d8baf6058705ad7433225c6f1aa

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present