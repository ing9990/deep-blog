package com.deepblog.minicoupang.domain.product.seller.application;

import static java.util.Optional.of;
import static java.util.Optional.ofNullable;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
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
            .orElseThrow(() -> new BusinessException(ErrorCode.SELLER_NOT_REGISTERED));

        List<RegisterProductCommand.OptionCommand> optionCommands =
            ofNullable(command.options()).orElse(List.of());
        List<RegisterProductCommand.ImageCommand> imageCommands =
            ofNullable(command.images()).orElse(List.of());

        Product product = assembleProduct(seller, command, optionCommands, imageCommands);
        Product saved = productRepository.save(product);
        saveInitialStocks(saved, optionCommands);

        eventPublisher.publishEvent(ProductRegistered.from(saved));
        return RegisterProductResult.from(saved);
    }

    private Product assembleProduct(
        Seller seller,
        RegisterProductCommand command,
        List<RegisterProductCommand.OptionCommand> optionCommands,
        List<RegisterProductCommand.ImageCommand> imageCommands
    ) {
        Product product = Product.create(
            seller,
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
        });
    }

    @Transactional(readOnly = true)
    public ListMyProductsResult listMyProducts(Long accountId, Pageable pageable) {
        Seller seller = sellerRepository.findByAccountId(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SELLER_NOT_REGISTERED, "판매자 등록이 필요합니다."));
        Page<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(
            seller.getId(), pageable);
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
