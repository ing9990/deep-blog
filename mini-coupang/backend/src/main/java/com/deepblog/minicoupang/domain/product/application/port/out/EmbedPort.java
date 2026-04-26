package com.deepblog.minicoupang.domain.product.application.port.out;

import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductIndexCommand;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchFilter;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import java.util.List;

/**
 * Outbound port for the semantic search index. The domain depends on this
 * interface; an adapter in the infrastructure layer provides the concrete
 * transport (currently gRPC to a Python ML service).
 */
public interface EmbedPort {

    void indexProduct(ProductIndexCommand command);

    List<ProductSearchHit> search(ProductSearchQuery query);

    List<ProductSearchHit> findSimilar(long productId, int limit, ProductSearchFilter filter);

    void removeFromIndex(long productId);
}
