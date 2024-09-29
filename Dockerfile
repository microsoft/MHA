FROM node:latest@sha256:e4ec3891c64348aa8358e36394fc61afae30af4e4cc00f38f84d65f72b758c59

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
