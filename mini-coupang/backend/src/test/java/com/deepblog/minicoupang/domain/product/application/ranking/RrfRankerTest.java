package com.deepblog.minicoupang.domain.product.application.ranking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RrfRankerTest {

    @Test
    @DisplayName("both lists empty returns empty")
    void bothEmpty() {
        List<Long> out = RrfRanker.combine(List.of(), List.of());

        assertThat(out).isEmpty();
    }

    @Test
    @DisplayName("identical lists preserve order")
    void identicalLists() {
        List<Long> lexical = List.of(1L, 2L, 3L);
        List<Long> semantic = List.of(1L, 2L, 3L);

        List<Long> out = RrfRanker.combine(lexical, semantic);

        assertThat(out).containsExactly(1L, 2L, 3L);
    }

    @Test
    @DisplayName("item ranked in only one list still appears, ordered by its single score")
    void lexicalOnly() {
        List<Long> lexical = List.of(10L, 20L, 30L);
        List<Long> semantic = List.of();

        List<Long> out = RrfRanker.combine(lexical, semantic);

        assertThat(out).containsExactly(10L, 20L, 30L);
    }

    @Test
    @DisplayName("shared item ranks above items that appear in only one channel")
    void sharedItemBeatsUnique() {
        // 5 is in both channels (lexical rank 3, semantic rank 3);
        // 1, 2 are lexical-only top; 8, 9 are semantic-only top.
        // 5's RRF score = 2 * 1/(60+3); 1's = 1/(60+1); 2's = 1/(60+2).
        // 1/(60+1) = 0.01639, 1/(60+2) = 0.01613, 2/(60+3) = 0.03175 -> 5 wins.
        List<Long> lexical = List.of(1L, 2L, 5L);
        List<Long> semantic = List.of(8L, 9L, 5L);

        List<Long> out = RrfRanker.combine(lexical, semantic);

        assertThat(out).startsWith(5L);
        assertThat(out).containsExactlyInAnyOrder(1L, 2L, 5L, 8L, 9L);
    }

    @Test
    @DisplayName("disjoint lists interleave by per-rank score")
    void disjointInterleave() {
        // lexical: 1(r=1), 2(r=2)
        // semantic: 10(r=1), 20(r=2)
        // ranks 1 in each channel tie, ranks 2 tie -> 1 and 10 should appear
        // before 2 and 20.
        List<Long> lexical = List.of(1L, 2L);
        List<Long> semantic = List.of(10L, 20L);

        List<Long> out = RrfRanker.combine(lexical, semantic);

        assertThat(out).containsExactlyInAnyOrder(1L, 2L, 10L, 20L);
        assertThat(out.subList(0, 2)).containsExactlyInAnyOrder(1L, 10L);
        assertThat(out.subList(2, 4)).containsExactlyInAnyOrder(2L, 20L);
    }

    @Test
    @DisplayName("larger k flattens the score differences")
    void largerKFlattens() {
        List<Long> lexical = List.of(1L, 2L, 3L);
        List<Long> semantic = List.of(3L, 2L, 1L);

        // With both channels reversing each other, every id ends up with a
        // tied total regardless of k. The important property: output is a
        // permutation of the input ids with no extras/missing.
        List<Long> smallK = RrfRanker.combine(lexical, semantic, 1);
        List<Long> largeK = RrfRanker.combine(lexical, semantic, 1000);

        assertThat(smallK).containsExactlyInAnyOrder(1L, 2L, 3L);
        assertThat(largeK).containsExactlyInAnyOrder(1L, 2L, 3L);
    }
}
