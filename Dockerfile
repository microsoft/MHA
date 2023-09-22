FROM node:latest@sha256:191b360003a7458df0f14bbc0aa1d298a706e32786e1830191036971eb1547a2

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present