сервер требует .env переменную DATABASE_URL. мы её указываем не в .env, а генерируем в
docker-compose

использовал tsup, т.к. я хочу авторезолвинг index.ts

# common

общие утилитарные функции, переиспользуемые во всём приложении (по большей части в
implementation)

---

# core

### Бизнес-логика: (use case ориентированная)

****commands:**** POST/PUT и прочие запросы с большими body.<br/> ****query:**** GET и
т.п.<br/>

### Ports/Adapters

****ports:**** интерфейсы для компонентов программы, реализующих непосредственную работу с
данными, где _services_ - некие "утилиты", а _repositories_ - средства работы с данными,
разделённые по т.н. бизнес-сущностям<br/> _ - underscore in repository and service ports
folders means, that underscored service/repo is used only inside the implementation layer
and is not used in business logic and business use-cases (commands and queries).<br/> For
example, \_me folder contains me.cache.repository, which is used only for caching the
reponses for GET /me http route. Core business logic shouldn't know about caching. However
for consistency and because of possibility of changement of caching mechanism, this repo
needs an interface and all interfaces are stored in ports. To distinguish such repos from
business-related ones their containing folders' names have to start with _. <br/> (idk
maybe \_me folder should be named \_cache, but never mind)

---

# implementation

Realisation of _services_ and _repositories_. And also the realisation of commands and
queries through the implementation of http layer with a kind of REST API (at the current
time it is not clear REST API, it's more like a remote procedure calls and this have to be
fixed)

# infrastructure

Connections to the different services _In perspective there also could be connections to
**micro-services**_
