FROM node:latest@sha256:57391181388cd89ede79f371e09373824051eb0f708165dcd0965f18b3682f35

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present