package com.deepblog.product.application;

import static java.util.Optional.of;
import static java.util.Optional.ofNullable;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.product.application.command.RegisterProductCommand;
import com.deepblog.product.application.result.ListMyProductsResult;
import com.deepblog.product.application.result.RegisterProductResult;
import com.deepblog.product.domain.OptionStock;
import com.deepblog.product.domain.Product;
import com.deepblog.product.repository.OptionStockRepository;
import com.deepblog.product.repository.ProductRepository;
import com.deepblog.product.repository.ProductStockRedisRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 판매자 상품 등록·조회. sellerId 는 인증 컨텍스트에서 주입받는다 (member-server 가 진실 출처).
 *
 * <p>등록 흐름은 단일 트랜잭션 안에서 Product/Option/Image/OptionStock 을 모두 INSERT 한 뒤
 * Redis 재고 키도 그 트랜잭션 종료 후 초기화한다 (read-after-write 단순화 목적).
 */
@Service
@RequiredArgsConstructor
public class SellerProductService {

    private final ProductRepository productRepository;
    private final OptionStockRepository optionStockRepository;
    private final ProductStockRedisRepository productStockRedisRepository;

    @Transactional
    public RegisterProductResult registerProduct(Long sellerId, RegisterProductCommand command) {
        requireSeller(sellerId);

        List<RegisterProductCommand.OptionCommand> optionCommands =
            ofNullable(command.options()).orElse(List.of());
        List<RegisterProductCommand.ImageCommand> imageCommands =
            ofNullable(command.images()).orElse(List.of());

        Product product = assembleProduct(sellerId, command, optionCommands, imageCommands);
        Product saved = productRepository.save(product);
        saveInitialStocks(saved, optionCommands);

        return RegisterProductResult.from(saved);
    }

    @Transactional(readOnly = true)
    public ListMyProductsResult listMyProducts(Long sellerId, Pageable pageable) {
        requireSeller(sellerId);
        Page<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable);
        List<ListMyProductsResult.Item> items = products.stream()
            .map(p -> new ListMyProductsResult.Item(
                p.getId(),
                p.getCategoryId(),
                p.getName(),
                p.getBasePrice(),
                p.getStatus().name(),
                p.getOptions() == null ? 0 : p.getOptions().size(),
                p.getImages() == null ? 0 : p.getImages().size(),
                p.getCreatedAt()))
            .toList();
        return new ListMyProductsResult(
            items, pageable.getPageNumber(), pageable.getPageSize(), products.getTotalElements());
    }

    private static void requireSeller(Long sellerId) {
        if (sellerId == null) {
            throw new BusinessException(ErrorCode.SELLER_NOT_REGISTERED, "판매자 등록이 필요합니다.");
        }
    }

    private Product assembleProduct(
        Long sellerId,
        RegisterProductCommand command,
        List<RegisterProductCommand.OptionCommand> optionCommands,
        List<RegisterProductCommand.ImageCommand> imageCommands
    ) {
        Product product = Product.create(
            sellerId,
            command.categoryId(),
            command.name(),
            command.description(),
            command.basePrice()
        );
        of(optionCommands)
            .filter(list -> !list.isEmpty())
            .ifPresentOrElse(
                list -> list.forEach(c -> product.addOption(c.optionName(), c.sku(), c.additionalPrice())),
                product::addDefaultOption
            );
        imageCommands.forEach(c -> product.addImage(c.url(), c.primary()));
        return product;
    }

    private void saveInitialStocks(Product saved,
        List<RegisterProductCommand.OptionCommand> optionCommands) {
        saved.getOptions().forEach(option -> {
            long initialStock = optionCommands.stream()
                .filter(c -> option.getSku().equals(c.sku()))
                .findFirst()
                .map(RegisterProductCommand.OptionCommand::resolvedInitialStock)
                .orElse(0L);
            optionStockRepository.save(OptionStock.forOption(option.getId(), initialStock));
            productStockRedisRepository.setStock(option.getId(), initialStock);
        });
    }
}
