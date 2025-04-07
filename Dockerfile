FROM node:latest@sha256:047d633b358c33f900110efff70b4f1c73d066dec92dd6941c42d26889f69a0e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
