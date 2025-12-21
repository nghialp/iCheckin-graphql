# Tên container
APP_NAME=icheckin-api
DB_NAME=icheckin-db

# Docker Compose file
COMPOSE_DEV=docker-compose.dev.yml
COMPOSE_PROD=docker-compose.yml

# Khởi động môi trường dev
dev-up:
	docker-compose -f $(COMPOSE_DEV) up --build

# Dừng môi trường dev
dev-down:
	docker-compose -f $(COMPOSE_DEV) down

# Khởi động môi trường production
prod-up:
	docker-compose -f $(COMPOSE_PROD) up --build

# Dừng môi trường production
prod-down:
	docker-compose -f $(COMPOSE_PROD) down

# Xem logs
logs:
	docker logs -f $(APP_NAME)

# Truy cập shell vào app container
shell:
	docker exec -it $(APP_NAME) sh

# Truy cập psql vào database
psql:
	docker exec -it $(DB_NAME) psql -U icheckin_user -d icheckin

# Xoá toàn bộ container, volume
clean:
	docker-compose -f $(COMPOSE_DEV) down -v --remove-orphans
	docker-compose -f $(COMPOSE_PROD) down -v --remove-orphans