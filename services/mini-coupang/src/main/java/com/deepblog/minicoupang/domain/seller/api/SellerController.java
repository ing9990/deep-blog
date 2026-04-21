package com.deepblog.minicoupang.domain.seller.api;

import com.deepblog.minicoupang.domain.seller.api.dto.CreateSellerRequest;
import com.deepblog.minicoupang.domain.seller.api.dto.SellerResponse;
import com.deepblog.minicoupang.domain.seller.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService service;

    @PostMapping
    public ResponseEntity<SellerResponse> create(@Valid @RequestBody CreateSellerRequest request) {
        SellerResponse response = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/sellers/" + response.id()))
                .body(response);
    }

    @GetMapping("/{id}")
    public SellerResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }
}
