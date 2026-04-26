package com.deepblog.minicoupang.infrastructure.clients.embed;

import static java.util.concurrent.TimeUnit.MILLISECONDS;

import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductIndexCommand;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchFilter;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedAndIndexRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedAndIndexResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedServiceGrpc.EmbedServiceBlockingStub;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.FindSimilarRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.FindSimilarResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.ProductPayload;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.RemoveFromIndexRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.RemoveFromIndexResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchByQueryRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchByQueryResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchFilter;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchHit;
import io.grpc.StatusRuntimeException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

/**
 * gRPC adapter that fulfils {@link EmbedPort} by translating domain DTOs into
 * proto messages, applying a per-call deadline, and mapping responses back to
 * domain types. The domain layer stays free of gRPC and proto imports.
 *
 * The channel and blocking stub are provisioned by grpc-client-spring-boot-starter
 * via {@code @GrpcClient("embed")}; channel settings live under
 * {@code grpc.client.embed.*} in application.yaml.
 */
@Component
@RequiredArgsConstructor
public class EmbedGrpcAdapter implements EmbedPort {

    @GrpcClient("embed")
    private EmbedServiceBlockingStub stub;

    private final EmbedGrpcProperties properties;

    @Override
    public void indexProduct(ProductIndexCommand command) {
        EmbedAndIndexRequest request = EmbedAndIndexRequest.newBuilder()
            .setProductId(command.productId())
            .setName(command.name())
            .setDescription(command.description())
            .setPayload(ProductPayload.newBuilder()
                .setCategoryId(command.categoryId())
                .setBasePrice(command.basePrice())
                .setStatus(command.status())
                .setSellerId(command.sellerId())
                .build())
            .build();
        EmbedAndIndexResponse response;
        try {
            response = withDeadline().embedAndIndex(request);
        } catch (StatusRuntimeException e) {
            throw transportFailure("indexProduct", command.productId(), e);
        }
        if (!response.getSuccess()) {
            throw new EmbedAdapterException(
                "indexProduct failed for productId=" + command.productId()
                    + ": " + response.getErrorMessage());
        }
    }

    @Override
    public List<ProductSearchHit> search(ProductSearchQuery query) {
        SearchByQueryRequest.Builder builder = SearchByQueryRequest.newBuilder()
            .setQuery(query.query())
            .setLimit(query.limit());
        Optional.ofNullable(query.filter()).ifPresent(f -> builder.setFilter(toProto(f)));
        try {
            SearchByQueryResponse response = withDeadline().searchByQuery(builder.build());
            return toHits(response.getHitsList());
        } catch (StatusRuntimeException e) {
            throw new EmbedAdapterException(
                "search transport failure (code=" + e.getStatus().getCode() + ")", e);
        }
    }

    @Override
    public List<ProductSearchHit> findSimilar(long productId, int limit, ProductSearchFilter filter) {
        FindSimilarRequest.Builder builder = FindSimilarRequest.newBuilder()
            .setProductId(productId)
            .setLimit(limit);
        Optional.ofNullable(filter).ifPresent(f -> builder.setFilter(toProto(f)));
        try {
            FindSimilarResponse response = withDeadline().findSimilar(builder.build());
            return toHits(response.getHitsList());
        } catch (StatusRuntimeException e) {
            throw transportFailure("findSimilar", productId, e);
        }
    }

    @Override
    public void removeFromIndex(long productId) {
        RemoveFromIndexRequest request = RemoveFromIndexRequest.newBuilder()
            .setProductId(productId)
            .build();
        RemoveFromIndexResponse response;
        try {
            response = withDeadline().removeFromIndex(request);
        } catch (StatusRuntimeException e) {
            throw transportFailure("removeFromIndex", productId, e);
        }
        if (!response.getSuccess()) {
            throw new EmbedAdapterException(
                "removeFromIndex failed for productId=" + productId);
        }
    }

    private static EmbedAdapterException transportFailure(String op, long productId, StatusRuntimeException e) {
        return new EmbedAdapterException(
            op + " transport failure for productId=" + productId
                + " (code=" + e.getStatus().getCode() + ")", e);
    }

    private EmbedServiceBlockingStub withDeadline() {
        return stub.withDeadlineAfter(properties.deadlineMs(), MILLISECONDS);
    }

    private static SearchFilter toProto(ProductSearchFilter filter) {
        SearchFilter.Builder builder = SearchFilter.newBuilder();
        Optional.ofNullable(filter.categoryId()).ifPresent(builder::setCategoryId);
        Optional.ofNullable(filter.minPrice()).ifPresent(builder::setMinPrice);
        Optional.ofNullable(filter.maxPrice()).ifPresent(builder::setMaxPrice);
        Optional.ofNullable(filter.status()).ifPresent(builder::setStatus);
        return builder.build();
    }

    private static List<ProductSearchHit> toHits(List<SearchHit> protoHits) {
        return protoHits.stream()
            .map(h -> new ProductSearchHit(h.getProductId(), h.getScore()))
            .toList();
    }
}
