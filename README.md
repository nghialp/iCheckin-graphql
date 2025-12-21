# Run by docker
## Dev environment
- docker-compose -f docker-compose.dev.yml down
- docker-compose -f docker-compose.dev.yml up --build

## Prod environment
- docker-compose -f docker-compose.yml down
- docker-compose -f docker-compose.yml up --build

# Run by MakeFile

- make dev-up       # Khởi động môi trường dev
- make prod-up      # Khởi động môi trường production
- make logs         # Xem log của app
- make shell        # Truy cập shell container app
- make psql         # Truy cập PostgreSQL
- make clean        # Xoá toàn bộ container và volume
