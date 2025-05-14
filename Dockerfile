FROM node:latest@sha256:34bb77a39088f2d52fca6b3c965269da281d3b845f5ea06851109547e488bae3

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
