package com.deepblog.minicoupang.domain.product.service;

import com.deepblog.minicoupang.domain.product.Product;
import com.deepblog.minicoupang.domain.product.api.dto.CreateProductRequest;
import com.deepblog.minicoupang.domain.product.api.dto.ProductResponse;
import com.deepblog.minicoupang.domain.product.storage.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository repository;

    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        Product product = Product.create(
                request.sellerId(),
                request.sellerName(),
                request.name(),
                request.price(),
                request.stock());
        Product saved = repository.save(product);
        return ProductResponse.from(saved);
    }

    public ProductResponse findById(Long id) {
        Product product = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
        return ProductResponse.from(product);
    }

    public List<ProductResponse> findBySellerId(Long sellerId) {
        return repository.findBySellerId(sellerId).stream()
                .map(ProductResponse::from)
                .toList();
    }
}
