package com.deepblog.minicoupang.domain.product.seller.application;

import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.exception.SellerNotRegisteredException;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerProductServiceImpl implements SellerProductService {

    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;

    @Override
    @Transactional
    public Product registerProduct(Long accountId, RegisterProductCommand command) {
        Seller seller = sellerRepository.findByAccountId(accountId)
            .orElseThrow(SellerNotRegisteredException::new);

        Product product = Product.create(
            seller.getId(),
            command.categoryId(),
            command.name(),
            command.description(),
            command.basePrice()
        );

        Optional.ofNullable(command.options()).orElse(List.of())
            .forEach(option -> product.addOption(
                option.optionName(),
                option.sku(),
                option.additionalPrice()
            ));

        Optional.ofNullable(command.images()).orElse(List.of())
            .forEach(image -> product.addImage(image.url(), image.primary()));

        return productRepository.save(product);
    }
}
