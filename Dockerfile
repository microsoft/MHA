FROM node:latest@sha256:14667ba2add2a175483d6d084ac60662179c942fdf6e236f780a378818b3a7dd

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present