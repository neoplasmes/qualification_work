## Структура Nginx

/etc/nginx/                        # главная папка конфигов
│
├── nginx.conf                     # главный конфиг, точка входа
│
├── conf.d/                        # доп. конфиги, подключаются автоматически
│   └── default.conf               # конфиг сайта по умолчанию
│
├── sites-available/               # все виртуальные хосты (не все активны)
│   ├── mysite.com
│   └── api.mysite.com
│
├── sites-enabled/                 # симлинки на активные хосты
│   └── mysite.com -> ../sites-available/mysite.com
│
├── mime.types                     # таблица расширений → Content-Type
├── fastcgi_params                 # параметры для PHP через FastCGI
├── uwsgi_params                   # параметры для Python через uWSGI
├── scgi_params                    # параметры для SCGI
│
└── modules/                       # подключаемые модули
    ├── ngx_http_gzip_module.so
    └── ngx_stream_module.so

/var/log/nginx/                    # логи
├── access.log                     # каждый запрос
└── error.log                      # ошибки

/usr/share/nginx/html/             # файлы сайта по умолчанию
├── index.html
└── 50x.html                       # страница ошибки

/var/cache/nginx/                  # кеш
/run/nginx.pid                     # ID процесса (нужен для сигналов)