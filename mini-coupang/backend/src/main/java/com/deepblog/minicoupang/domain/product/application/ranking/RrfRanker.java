package com.deepblog.minicoupang.domain.product.application.ranking;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reciprocal Rank Fusion for combining ranked id lists from multiple search
 * channels (keyword + semantic).
 *
 * <p>Given channel rankings, the fused score for a document is
 * {@code sum(1 / (k + rank))} across channels where it appears (rank starts
 * at 1). Items appearing in multiple channels dominate items ranked in only
 * one, which is the whole point of hybrid search.
 *
 * <p>{@code k} defaults to 60, the constant used in the original paper
 * (Cormack et al., 2009). Larger k flattens score differences between
 * adjacent ranks.
 */
public final class RrfRanker {

    public static final int DEFAULT_K = 60;

    private RrfRanker() {
    }

    public static List<Long> combine(List<Long> lexical, List<Long> semantic) {
        return combine(lexical, semantic, DEFAULT_K);
    }

    public static List<Long> combine(List<Long> lexical, List<Long> semantic, int k) {
        Map<Long, Double> scores = new HashMap<>();
        accumulate(scores, lexical, k);
        accumulate(scores, semantic, k);
        return scores.entrySet().stream()
            .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
            .map(Map.Entry::getKey)
            .toList();
    }

    private static void accumulate(Map<Long, Double> scores, List<Long> ranked, int k) {
        for (int i = 0; i < ranked.size(); i++) {
            long id = ranked.get(i);
            double contribution = 1.0 / (k + (i + 1));
            scores.merge(id, contribution, Double::sum);
        }
    }
}
