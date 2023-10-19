FROM node:latest@sha256:bd20621deff56cb66c6cd10772d26db1a0d480f2b08609eb96b799ba6260f3ed

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present