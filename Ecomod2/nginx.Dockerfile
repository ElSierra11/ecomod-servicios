FROM nginx:alpine

# Copiamos la config como una plantilla
COPY Ecomod2/nginx.conf /etc/nginx/nginx.conf.template

# Al arrancar, inyectamos el puerto real en la configuración
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"
