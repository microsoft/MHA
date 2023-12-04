FROM node:latest@sha256:04300613a87512b58a0555a122f35b2fb7a7dd528b6435e87b0d34b67f53a86a

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present