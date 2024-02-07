FROM node:latest@sha256:abc4a25c8b5a2b460f3144aabfc8941ecd7e4fb721e0b14b635e70394c1899fb

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present