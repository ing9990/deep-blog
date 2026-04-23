package com.deepblog.minicoupang.infrastructure.clients.embed;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductIndexCommand;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchFilter;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedAndIndexRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedAndIndexResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.EmbedServiceGrpc.EmbedServiceBlockingStub;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.FindSimilarRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.FindSimilarResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.RemoveFromIndexRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.RemoveFromIndexResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchByQueryRequest;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchByQueryResponse;
import com.deepblog.minicoupang.infrastructure.clients.embed.grpc.SearchHit;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class EmbedGrpcAdapterTest {

    private static final long DEADLINE_MS = 5000L;

    private EmbedServiceBlockingStub stub;
    private EmbedServiceBlockingStub stubWithDeadline;
    private EmbedGrpcAdapter adapter;

    @BeforeEach
    void setUp() {
        stub = mock(EmbedServiceBlockingStub.class);
        stubWithDeadline = mock(EmbedServiceBlockingStub.class);
        given(stub.withDeadlineAfter(DEADLINE_MS, MILLISECONDS)).willReturn(stubWithDeadline);

        EmbedGrpcProperties properties = new EmbedGrpcProperties(DEADLINE_MS);
        adapter = new EmbedGrpcAdapter(properties);
        ReflectionTestUtils.setField(adapter, "stub", stub);
    }

    @Test
    @DisplayName("indexProduct maps command to proto with payload and delegates")
    void indexProduct_mapsCommandAndDelegates() {
        ProductIndexCommand command = new ProductIndexCommand(
            1L, "bag", "leather bag", 10L, 50000L, "ACTIVE", 7L);
        given(stubWithDeadline.embedAndIndex(any()))
            .willReturn(EmbedAndIndexResponse.newBuilder().setSuccess(true).build());

        adapter.indexProduct(command);

        ArgumentCaptor<EmbedAndIndexRequest> captor = ArgumentCaptor.forClass(EmbedAndIndexRequest.class);
        verify(stub).withDeadlineAfter(DEADLINE_MS, MILLISECONDS);
        verify(stubWithDeadline).embedAndIndex(captor.capture());

        EmbedAndIndexRequest request = captor.getValue();
        assertThat(request.getProductId()).isEqualTo(1L);
        assertThat(request.getName()).isEqualTo("bag");
        assertThat(request.getDescription()).isEqualTo("leather bag");
        assertThat(request.getPayload().getCategoryId()).isEqualTo(10L);
        assertThat(request.getPayload().getBasePrice()).isEqualTo(50000L);
        assertThat(request.getPayload().getStatus()).isEqualTo("ACTIVE");
        assertThat(request.getPayload().getSellerId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("search with filter maps query+filter and converts hits to domain")
    void search_withFilter_mapsAndConvertsHits() {
        ProductSearchFilter filter = new ProductSearchFilter(10L, 1000L, 90000L, "ACTIVE");
        ProductSearchQuery query = new ProductSearchQuery("shoes", 20, filter);
        given(stubWithDeadline.searchByQuery(any())).willReturn(
            SearchByQueryResponse.newBuilder()
                .addHits(SearchHit.newBuilder().setProductId(100L).setScore(0.9f).build())
                .addHits(SearchHit.newBuilder().setProductId(200L).setScore(0.8f).build())
                .build());

        List<ProductSearchHit> hits = adapter.search(query);

        ArgumentCaptor<SearchByQueryRequest> captor = ArgumentCaptor.forClass(SearchByQueryRequest.class);
        verify(stub).withDeadlineAfter(DEADLINE_MS, MILLISECONDS);
        verify(stubWithDeadline).searchByQuery(captor.capture());

        SearchByQueryRequest request = captor.getValue();
        assertThat(request.getQuery()).isEqualTo("shoes");
        assertThat(request.getLimit()).isEqualTo(20);
        assertThat(request.getFilter().getCategoryId()).isEqualTo(10L);
        assertThat(request.getFilter().getMinPrice()).isEqualTo(1000L);
        assertThat(request.getFilter().getMaxPrice()).isEqualTo(90000L);
        assertThat(request.getFilter().getStatus()).isEqualTo("ACTIVE");

        assertThat(hits).containsExactly(
            new ProductSearchHit(100L, 0.9f),
            new ProductSearchHit(200L, 0.8f));
    }

    @Test
    @DisplayName("search without filter leaves proto filter unset")
    void search_withoutFilter_omitsFilter() {
        ProductSearchQuery query = new ProductSearchQuery("hat", 5, null);
        given(stubWithDeadline.searchByQuery(any()))
            .willReturn(SearchByQueryResponse.newBuilder().build());

        adapter.search(query);

        ArgumentCaptor<SearchByQueryRequest> captor = ArgumentCaptor.forClass(SearchByQueryRequest.class);
        verify(stubWithDeadline).searchByQuery(captor.capture());
        assertThat(captor.getValue().hasFilter()).isFalse();
    }

    @Test
    @DisplayName("findSimilar maps productId+limit+filter and converts hits")
    void findSimilar_mapsAndConvertsHits() {
        ProductSearchFilter filter = new ProductSearchFilter(null, null, null, "ACTIVE");
        given(stubWithDeadline.findSimilar(any())).willReturn(
            FindSimilarResponse.newBuilder()
                .addHits(SearchHit.newBuilder().setProductId(7L).setScore(0.77f).build())
                .build());

        List<ProductSearchHit> hits = adapter.findSimilar(42L, 5, filter);

        ArgumentCaptor<FindSimilarRequest> captor = ArgumentCaptor.forClass(FindSimilarRequest.class);
        verify(stub).withDeadlineAfter(DEADLINE_MS, MILLISECONDS);
        verify(stubWithDeadline).findSimilar(captor.capture());

        FindSimilarRequest request = captor.getValue();
        assertThat(request.getProductId()).isEqualTo(42L);
        assertThat(request.getLimit()).isEqualTo(5);
        assertThat(request.getFilter().hasCategoryId()).isFalse();
        assertThat(request.getFilter().hasMinPrice()).isFalse();
        assertThat(request.getFilter().hasMaxPrice()).isFalse();
        assertThat(request.getFilter().getStatus()).isEqualTo("ACTIVE");

        assertThat(hits).containsExactly(new ProductSearchHit(7L, 0.77f));
    }

    @Test
    @DisplayName("removeFromIndex sends productId and delegates")
    void removeFromIndex_sendsProductId() {
        given(stubWithDeadline.removeFromIndex(any()))
            .willReturn(RemoveFromIndexResponse.newBuilder().setSuccess(true).build());

        adapter.removeFromIndex(42L);

        ArgumentCaptor<RemoveFromIndexRequest> captor = ArgumentCaptor.forClass(RemoveFromIndexRequest.class);
        verify(stub).withDeadlineAfter(DEADLINE_MS, MILLISECONDS);
        verify(stubWithDeadline).removeFromIndex(captor.capture());
        assertThat(captor.getValue().getProductId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("indexProduct throws EmbedAdapterException when response.success is false")
    void indexProduct_responseFailure_throws() {
        ProductIndexCommand command = new ProductIndexCommand(
            1L, "bag", "leather", 10L, 50000L, "ACTIVE", 7L);
        given(stubWithDeadline.embedAndIndex(any())).willReturn(
            EmbedAndIndexResponse.newBuilder()
                .setSuccess(false)
                .setErrorMessage("qdrant unavailable")
                .build());

        assertThatThrownBy(() -> adapter.indexProduct(command))
            .isInstanceOf(EmbedAdapterException.class)
            .hasMessageContaining("1")
            .hasMessageContaining("qdrant unavailable");
    }

    @Test
    @DisplayName("removeFromIndex throws EmbedAdapterException when response.success is false")
    void removeFromIndex_responseFailure_throws() {
        given(stubWithDeadline.removeFromIndex(any()))
            .willReturn(RemoveFromIndexResponse.newBuilder().setSuccess(false).build());

        assertThatThrownBy(() -> adapter.removeFromIndex(42L))
            .isInstanceOf(EmbedAdapterException.class)
            .hasMessageContaining("42");
    }

    @Test
    @DisplayName("indexProduct wraps StatusRuntimeException into EmbedAdapterException")
    void indexProduct_transportFailure_wrapsException() {
        ProductIndexCommand command = new ProductIndexCommand(
            1L, "bag", "leather", 10L, 50000L, "ACTIVE", 7L);
        StatusRuntimeException transport = new StatusRuntimeException(Status.UNAVAILABLE);
        given(stubWithDeadline.embedAndIndex(any())).willThrow(transport);

        assertThatThrownBy(() -> adapter.indexProduct(command))
            .isInstanceOf(EmbedAdapterException.class)
            .hasCause(transport)
            .hasMessageContaining("1");
    }

    @Test
    @DisplayName("search wraps StatusRuntimeException into EmbedAdapterException")
    void search_transportFailure_wrapsException() {
        ProductSearchQuery query = new ProductSearchQuery("shoes", 10, null);
        StatusRuntimeException transport = new StatusRuntimeException(Status.DEADLINE_EXCEEDED);
        given(stubWithDeadline.searchByQuery(any())).willThrow(transport);

        assertThatThrownBy(() -> adapter.search(query))
            .isInstanceOf(EmbedAdapterException.class)
            .hasCause(transport);
    }

    @Test
    @DisplayName("findSimilar wraps StatusRuntimeException into EmbedAdapterException")
    void findSimilar_transportFailure_wrapsException() {
        StatusRuntimeException transport = new StatusRuntimeException(Status.UNAVAILABLE);
        given(stubWithDeadline.findSimilar(any())).willThrow(transport);

        assertThatThrownBy(() -> adapter.findSimilar(7L, 5, null))
            .isInstanceOf(EmbedAdapterException.class)
            .hasCause(transport)
            .hasMessageContaining("7");
    }

    @Test
    @DisplayName("removeFromIndex wraps StatusRuntimeException into EmbedAdapterException")
    void removeFromIndex_transportFailure_wrapsException() {
        StatusRuntimeException transport = new StatusRuntimeException(Status.UNAVAILABLE);
        given(stubWithDeadline.removeFromIndex(any())).willThrow(transport);

        assertThatThrownBy(() -> adapter.removeFromIndex(42L))
            .isInstanceOf(EmbedAdapterException.class)
            .hasCause(transport)
            .hasMessageContaining("42");
    }
}
