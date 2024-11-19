FROM node:latest@sha256:c65ab339c494443a7d2ed36140674bc8815f7100b0d4cebfe0144ce35267a693

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
