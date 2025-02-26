FROM node:latest@sha256:8af12633b69f4c1f37f357dfd76e1da0663f3c41fef3152de84e33fcbfaa3e6c

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
