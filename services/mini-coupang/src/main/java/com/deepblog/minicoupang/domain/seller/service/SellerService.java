package com.deepblog.minicoupang.domain.seller.service;

import com.deepblog.minicoupang.domain.seller.Seller;
import com.deepblog.minicoupang.domain.seller.api.dto.CreateSellerRequest;
import com.deepblog.minicoupang.domain.seller.api.dto.SellerResponse;
import com.deepblog.minicoupang.domain.seller.storage.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerService {

    private final SellerRepository repository;

    @Transactional
    public SellerResponse create(CreateSellerRequest request) {
        Seller seller = Seller.create(request.name(), request.email());
        try {
            Seller saved = repository.save(seller);
            return SellerResponse.from(saved);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "이미 등록된 email: " + request.email(),
                    e);
        }
    }

    public SellerResponse findById(Long id) {
        Seller seller = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found: " + id));
        return SellerResponse.from(seller);
    }
}
