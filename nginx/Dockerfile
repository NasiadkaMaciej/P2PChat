FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration template
COPY conf/default.conf.template /etc/nginx/templates/default.conf.template

ARG STUN_DOMAIN=stun
ARG STUN_INTERNAL_PORT=3478

ENV STUN_DOMAIN=${STUN_DOMAIN}
ENV STUN_INTERNAL_PORT=${STUN_INTERNAL_PORT}

ARG EXTERNAL_PORT=80
ENV EXTERNAL_PORT=${EXTERNAL_PORT}

# Expose the port
EXPOSE ${EXTERNAL_PORT}
