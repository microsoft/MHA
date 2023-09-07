FROM node:latest@sha256:bd8385f565bbcbf155cf9a2b8b21091a68076b11d74c3cb66e742d36834e1905

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present