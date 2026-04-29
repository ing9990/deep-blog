-- 서비스별 스키마 분리. 단일 MySQL 인스턴스 + 스키마 5개 (sandbox 정책).
-- mini_coupang 은 모놀리스 backend 가 계속 사용 (MSA 전환 중간 상태).

CREATE DATABASE IF NOT EXISTS member  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS product CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS `order`  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS payment CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS notification CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON member.*       TO 'mini'@'%';
GRANT ALL PRIVILEGES ON product.*      TO 'mini'@'%';
GRANT ALL PRIVILEGES ON `order`.*      TO 'mini'@'%';
GRANT ALL PRIVILEGES ON payment.*      TO 'mini'@'%';
GRANT ALL PRIVILEGES ON notification.* TO 'mini'@'%';
FLUSH PRIVILEGES;
