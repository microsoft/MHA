FROM node:latest@sha256:c29271c7f2b4788fe9b90a7506d790dc8f2ff46132e1b70e71bf0c0679c8451c

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
