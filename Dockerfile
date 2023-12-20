FROM node:latest@sha256:814a6dc5bfd4ecc5ef24652f6b4f2790e9f3552b52ee38a7b51fc4d4c0d6d7fd

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present