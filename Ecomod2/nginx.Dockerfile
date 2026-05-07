FROM nginx:alpine
# Copiamos nuestra configuración optimizada
COPY Ecomod2/nginx.conf /etc/nginx/nginx.conf
EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
