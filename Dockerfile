FROM node:latest@sha256:0bcc32c2d59aa8bf416a43be9672a59fa1b9f0f0fbdb6fe069d67e7be2f98e9e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
