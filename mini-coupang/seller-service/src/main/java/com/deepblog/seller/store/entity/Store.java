package com.deepblog.seller.store.entity;

import com.deepblog.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "stores")
public class Store extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 80, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "logo_image_url", length = 500)
    private String logoImageUrl;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private StoreStatus status;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    public static Store openNew(
        Long sellerId,
        String name,
        String slug,
        String description,
        String logoImageUrl,
        String coverImageUrl
    ) {
        validateSellerId(sellerId);
        validateName(name);
        validateSlug(slug);
        validateImageUrl(logoImageUrl);
        validateImageUrl(coverImageUrl);

        return Store.builder()
            .sellerId(sellerId)
            .name(name)
            .slug(slug)
            .description(description)
            .logoImageUrl(logoImageUrl)
            .coverImageUrl(coverImageUrl)
            .status(StoreStatus.OPEN)
            .build();
    }

    private static void validateSellerId(Long sellerId) {
        if (sellerId == null || sellerId <= 0) {
            throw new IllegalArgumentException("invalid sellerId");
        }
    }

    private static void validateName(String name) {
        if (!StringUtils.hasText(name) || name.length() > 100) {
            throw new IllegalArgumentException("invalid store name");
        }
    }

    private static void validateSlug(String slug) {
        if (!StringUtils.hasText(slug)
            || slug.length() > 80
            || !slug.matches("^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")) {
            throw new IllegalArgumentException("invalid slug");
        }
    }

    private static void validateImageUrl(String url) {
        if (url != null && url.length() > 500) {
            throw new IllegalArgumentException("invalid image url");
        }
    }

    public void update(
        String name,
        String description,
        String logoImageUrl,
        String coverImageUrl
    ) {
        requireMutable();
        if (StringUtils.hasText(name)) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (logoImageUrl != null) {
            this.logoImageUrl = logoImageUrl;
        }
        if (coverImageUrl != null) {
            this.coverImageUrl = coverImageUrl;
        }
    }

    public void close() {
        if (isClosed()) {
            return;
        }
        this.status = StoreStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
    }

    public boolean isClosed() {
        return status.isClosed();
    }

    public boolean isOwnedBy(Long sellerId) {
        return this.sellerId.equals(sellerId);
    }

    private void requireMutable() {
        if (!status.isMutable()) {
            throw new IllegalStateException(
                "store status " + status + " is not mutable"
            );
        }
    }
}
