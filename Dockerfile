FROM node:latest@sha256:e6959489e7af6d1338f71cdd046ca4c9b35fdf723cf20e054f9114875e29ef40

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
