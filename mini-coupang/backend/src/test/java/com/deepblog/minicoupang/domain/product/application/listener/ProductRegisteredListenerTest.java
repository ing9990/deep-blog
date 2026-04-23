package com.deepblog.minicoupang.domain.product.application.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductIndexCommand;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ProductRegisteredListenerTest {

    private EmbedPort embedPort;
    private MeterRegistry meterRegistry;
    private ProductRegisteredListener listener;

    @BeforeEach
    void setUp() {
        embedPort = mock(EmbedPort.class);
        meterRegistry = new SimpleMeterRegistry();
        listener = new ProductRegisteredListener(embedPort, meterRegistry);
    }

    @Test
    @DisplayName("handle forwards event to EmbedPort as ProductIndexCommand")
    void handle_forwardsAsIndexCommand() {
        ProductRegistered event = new ProductRegistered(
            1L, "bag", "leather bag", 10L, 50000L, "ACTIVE", 7L);

        listener.handle(event);

        ArgumentCaptor<ProductIndexCommand> captor = ArgumentCaptor.forClass(ProductIndexCommand.class);
        verify(embedPort).indexProduct(captor.capture());
        ProductIndexCommand command = captor.getValue();
        assertThat(command.productId()).isEqualTo(1L);
        assertThat(command.name()).isEqualTo("bag");
        assertThat(command.description()).isEqualTo("leather bag");
        assertThat(command.categoryId()).isEqualTo(10L);
        assertThat(command.basePrice()).isEqualTo(50000L);
        assertThat(command.status()).isEqualTo("ACTIVE");
        assertThat(command.sellerId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("handle swallows EmbedPort exceptions so the commit is not undone")
    void handle_swallowsPortException() {
        ProductRegistered event = new ProductRegistered(
            1L, "bag", "leather bag", 10L, 50000L, "ACTIVE", 7L);
        doThrow(new RuntimeException("grpc unavailable")).when(embedPort).indexProduct(any());

        assertThatCode(() -> listener.handle(event)).doesNotThrowAnyException();

        verify(embedPort).indexProduct(any());
    }
}
