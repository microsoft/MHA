FROM node:latest@sha256:e26b4e7d163a29e0d05806e167db8cc0c76f02f633006c1f5c0aeea5a8415147

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
