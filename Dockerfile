FROM node:latest@sha256:db2672e3c200b85e0b813cdb294fac16764711d7a66b41315e6261f2231f2331

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present