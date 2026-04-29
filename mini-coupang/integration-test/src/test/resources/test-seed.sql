SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE product.option_stocks;
TRUNCATE TABLE product.product_options;
TRUNCATE TABLE product.product_images;
TRUNCATE TABLE product.products;
TRUNCATE TABLE product.categories;

TRUNCATE TABLE orders.order_items;
TRUNCATE TABLE orders.orders;

TRUNCATE TABLE member.members;
TRUNCATE TABLE member.sellers;
TRUNCATE TABLE member.accounts;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO product.categories
    (category_id, name, parent_id, created_at, updated_at)
VALUES
    (1, '통합테스트카테고리', NULL, NOW(6), NOW(6));

INSERT INTO product.products
    (product_id, seller_id, category_id, name, description, base_price, status, created_at, updated_at)
VALUES
    (1, 1, 1, '통합테스트상품', 'concurrency target', 10000, 'ACTIVE', NOW(6), NOW(6));

INSERT INTO product.product_options
    (product_option_id, product_id, option_name, sku, additional_price, created_at, updated_at)
VALUES
    (1, 1, '기본', 'IT-SKU-1', 0, NOW(6), NOW(6));

INSERT INTO product.option_stocks
    (option_stock_id, option_id, quantity, created_at, updated_at)
VALUES
    (1, 1, 100, NOW(6), NOW(6));
