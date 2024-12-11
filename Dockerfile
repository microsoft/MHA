FROM node:latest@sha256:0b50ca11d81b5ed2622ff8770f040cdd4bd93a2561208c01c0c5db98bd65d551

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
