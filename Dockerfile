FROM node:latest@sha256:e643c0b70dca9704dff42e12b17f5b719dbe4f95e6392fc2dfa0c5f02ea8044d

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
