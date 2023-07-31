FROM node:latest@sha256:64b71834718b859ea389790ae56e5f2f8fa9456bf3821ff75fa28a87a09cbc09

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present