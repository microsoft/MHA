FROM node:latest@sha256:99c5f40071f14c686b62d108a440aed65b786b8c928eb885ca16ca5685e5e33a

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
