FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration template
COPY conf/default.conf.template /etc/nginx/templates/default.conf.template

# Default port
ARG NGINX_INTERNAL_PORT=80
ENV NGINX_INTERNAL_PORT=${NGINX_INTERNAL_PORT}

# Expose the port
EXPOSE ${NGINX_INTERNAL_PORT}