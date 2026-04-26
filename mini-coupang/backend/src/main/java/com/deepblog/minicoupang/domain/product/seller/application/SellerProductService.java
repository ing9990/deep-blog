package com.deepblog.minicoupang.domain.product.seller.application;

import static java.util.Optional.ofNullable;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.exception.SellerNotRegisteredException;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import com.deepblog.minicoupang.domain.stock.domain.OptionStock;
import com.deepblog.minicoupang.domain.stock.repository.OptionStockRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerProductService {

    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;
    private final OptionStockRepository optionStockRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RegisterProductResult registerProduct(Long accountId, RegisterProductCommand command) {
        Seller seller = sellerRepository.findByAccountId(accountId)
            .orElseThrow(SellerNotRegisteredException::new);

        Product product = Product.create(
            seller,
            command.categoryId(),
            command.name(),
            command.description(),
            command.basePrice()
        );

        List<RegisterProductCommand.OptionCommand> optionCommands =
            ofNullable(command.options()).orElse(List.of());

        if (optionCommands.isEmpty()) {
            product.addDefaultOption();
        } else {
            optionCommands.forEach(option -> product.addOption(
                option.optionName(),
                option.sku(),
                option.additionalPrice()
            ));
        }

        ofNullable(command.images()).orElse(List.of())
            .forEach(image -> product.addImage(image.url(), image.primary()));

        Product saved = productRepository.save(product);

        saved.getOptions().forEach(option -> {
            long initialStock = optionCommands.stream()
                .filter(c -> option.getSku().equals(c.sku()))
                .findFirst()
                .map(RegisterProductCommand.OptionCommand::resolvedInitialStock)
                .orElse(0L);
            optionStockRepository.save(OptionStock.forOption(option.getId(), initialStock));
        });

        eventPublisher.publishEvent(ProductRegistered.from(saved));
        return RegisterProductResult.from(saved);
    }

    @Transactional(readOnly = true)
    public ListMyProductsResult listMyProducts(Long accountId, Pageable pageable) {
        Seller seller = sellerRepository.findByAccountId(accountId)
            .orElseThrow(() -> new SellerNotRegisteredException("판매자 등록이 필요합니다."));
        Page<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId(), pageable);
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
        return new ListMyProductsResult(items, pageable.getPageNumber(), pageable.getPageSize(),
            products.getTotalElements());
    }
}
