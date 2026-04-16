FROM nginx:1.27-alpine

COPY services/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
