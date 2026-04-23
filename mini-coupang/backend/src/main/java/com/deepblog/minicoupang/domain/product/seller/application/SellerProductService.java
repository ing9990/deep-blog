package com.deepblog.minicoupang.domain.product.seller.application;

import static java.util.Optional.ofNullable;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.exception.SellerNotRegisteredException;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerProductService {

    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;
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

        ofNullable(command.options()).orElse(List.of())
            .forEach(option -> product.addOption(
                option.optionName(),
                option.sku(),
                option.additionalPrice()
            ));

        ofNullable(command.images()).orElse(List.of())
            .forEach(image -> product.addImage(image.url(), image.primary()));

        Product saved = productRepository.save(product);
        eventPublisher.publishEvent(ProductRegistered.from(saved));
        return RegisterProductResult.from(saved);
    }
}
